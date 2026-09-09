import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { redactRakutenSftpError } from "./RakutenSftpConfig.js";

const month={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
function listing(output){
    const entries=[];
    for(const line of output.split(/\r?\n/)){
        const match=line.trim().match(/^([dl-])[rwxstST-]{9}\s+\d+\s+\S+\s+\S+\s+(\d+)\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+([\d:]{4,5}|\d{4})\s+(.+)$/);
        if(!match)continue;
        const [,type,size,m,day,timeOrYear,filename]=match; let date;
        if(timeOrYear.includes(":")){const [hour,minute]=timeOrYear.split(":").map(Number);date=new Date(Date.UTC(new Date().getUTCFullYear(),month[m],Number(day),hour,minute));if(date>Date.now()+86400000)date.setUTCFullYear(date.getUTCFullYear()-1);}
        else date=new Date(Date.UTC(Number(timeOrYear),month[m],Number(day)));
        entries.push({filename,size:Number(size),modifiedAt:date.toISOString(),isDirectory:type==="d"});
    }
    return entries;
}

export class OpenSshSftpSession {
    constructor({config,knownHostsPath,askpassPath,trustOnFirstUse=false,spawnImpl=spawn}={}){this.config=config;this.knownHostsPath=path.resolve(knownHostsPath);this.askpassPath=path.resolve(askpassPath);this.trustOnFirstUse=trustOnFirstUse;this.spawnImpl=spawnImpl;this.process=null;this.buffer="";this.waiters=[];this.secrets=[config?.username,config?.password];}
    async connect(){
        if(!this.config||this.config.protocol!=="SFTP"||this.config.concurrency!==1)throw new Error("SFTP_CONFIG_INVALID");
        if(!this.trustOnFirstUse)throw new Error("SFTP_HOST_VERIFICATION_REQUIRED");
        await mkdir(path.dirname(this.knownHostsPath),{recursive:true});
        const args=["-P",String(this.config.port),"-o",`UserKnownHostsFile=${this.knownHostsPath}`,"-o","StrictHostKeyChecking=accept-new","-o","BatchMode=no",`${this.config.username}@${this.config.host}`];
        const env={...process.env,SSH_ASKPASS:this.askpassPath,SSH_ASKPASS_REQUIRE:"force",DISPLAY:"hardware-radar-sftp",RAKUTEN_SFTP_PASSWORD:this.config.password};
        this.process=this.spawnImpl("sftp",args,{stdio:["pipe","pipe","pipe"],env,windowsHide:true});
        const append=chunk=>{this.buffer+=chunk.toString("utf8");this.flush();}; this.process.stdout.on("data",append);this.process.stderr.on("data",append);
        this.process.on("error",error=>this.rejectAll(error));this.process.on("exit",code=>{if(code!==0)this.rejectAll(Object.assign(new Error("SFTP_CONNECT_FAILED"),{code:"SFTP_CONNECT_FAILED"}));});
        await this.waitForPrompt("SFTP_CONNECT_FAILED");
    }
    flush(){if(!this.buffer.includes("sftp>"))return;const output=this.buffer;this.buffer="";const waiter=this.waiters.shift();if(waiter)waiter.resolve(output);}
    rejectAll(error){for(const waiter of this.waiters.splice(0))waiter.reject(error);}
    waitForPrompt(code){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Object.assign(new Error(code),{code})),30000);this.waiters.push({resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});this.flush();});}
    async command(value,code){if(!this.process||/[\r\n]/.test(value))throw new Error("SFTP_COMMAND_INVALID");this.process.stdin.write(`${value}\n`);const output=await this.waitForPrompt(code);if(/Permission denied|Couldn't|Failure|not found/i.test(output))throw Object.assign(new Error(code),{code});return output;}
    async list(remotePath){if(!/^\/[A-Za-z0-9._/-]*$/.test(remotePath)||remotePath.includes(".."))throw new Error("SFTP_LIST_FAILED");return listing(await this.command(`ls -l ${remotePath}`,"SFTP_LIST_FAILED"));}
    async download(remotePath,localPath){if(!/^\/[A-Za-z0-9._/-]+$/.test(remotePath)||remotePath.includes("..")||/[\r\n"]/.test(localPath))throw new Error("SFTP_DOWNLOAD_FAILED");await this.command(`get ${remotePath} "${localPath}"`,"SFTP_DOWNLOAD_FAILED");}
    async close(){if(!this.process)return;try{this.process.stdin.write("bye\n");}catch{}this.process=null;}
    safeError(error){return redactRakutenSftpError(error,this.secrets);}
}
