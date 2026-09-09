import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import path from "node:path";
import { classifyOpenSshProcessFailure, redactRakutenSftpError } from "./RakutenSftpConfig.js";

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

export function buildOpenSshSftpInvocation({config,knownHostsPath,askpassPath,askpassMarkerPath,baseEnv=process.env}={}){
    const args=["-P",String(config.port),"-o",`UserKnownHostsFile=${knownHostsPath}`,"-o","StrictHostKeyChecking=accept-new","-o","BatchMode=no","-o","PreferredAuthentications=password,keyboard-interactive","-o","PubkeyAuthentication=no","-o","NumberOfPasswordPrompts=1",`${config.username}@${config.host}`];
    const env={...baseEnv,SSH_ASKPASS:askpassPath,SSH_ASKPASS_REQUIRE:"force",DISPLAY:"hardware-radar-sftp",RAKUTEN_SFTP_PASSWORD:config.password,RAKUTEN_SFTP_ASKPASS_MARKER:askpassMarkerPath};
    return {args,env};
}

export class OpenSshSftpSession {
    constructor({config,knownHostsPath,askpassPath,askpassMarkerPath=`${askpassPath}.invoked`,trustOnFirstUse=false,spawnImpl=spawn,sftpExecutable=process.platform==="win32"?path.join(process.env.SystemRoot??"C:\\Windows","System32","OpenSSH","sftp.exe"):"sftp",sshExecutable=process.platform==="win32"?path.join(process.env.SystemRoot??"C:\\Windows","System32","OpenSSH","ssh.exe"):"ssh",handshakeTimeoutMs=30000}={}){this.config=config;this.knownHostsPath=path.resolve(knownHostsPath);this.askpassPath=path.resolve(askpassPath);this.askpassMarkerPath=path.resolve(askpassMarkerPath);this.trustOnFirstUse=trustOnFirstUse;this.spawnImpl=spawnImpl;this.sftpExecutable=sftpExecutable;this.sshExecutable=sshExecutable;this.handshakeTimeoutMs=handshakeTimeoutMs;this.process=null;this.buffer="";this.stderr="";this.waiters=[];this.started=false;this.streamsOpened=false;this.handshakeComplete=false;this.secrets=[config?.username,config?.password];}
    async connect(){
        if(!this.config||this.config.protocol!=="SFTP"||this.config.concurrency!==1)throw new Error("SFTP_CONFIG_INVALID");
        if(!this.trustOnFirstUse)throw new Error("SFTP_HOST_VERIFICATION_REQUIRED");
        await this.requireFile(this.sshExecutable,"SFTP_SSH_EXECUTABLE_MISSING");
        await this.requireFile(this.sftpExecutable,"SFTP_SFTP_EXECUTABLE_MISSING");
        await this.requireFile(this.askpassPath,"SFTP_ASKPASS_HELPER_MISSING");
        const helperBytes=await readFile(this.askpassPath);
        if(helperBytes.length<2||helperBytes[0]!==0x4d||helperBytes[1]!==0x5a)throw new Error("SFTP_ASKPASS_HELPER_INVALID");
        if(process.platform==="win32"&&!/\.exe$/i.test(this.askpassPath))throw new Error("SFTP_ASKPASS_HELPER_INVALID");
        await mkdir(path.dirname(this.knownHostsPath),{recursive:true});
        await mkdir(path.dirname(this.askpassMarkerPath),{recursive:true});
        await rm(this.askpassMarkerPath,{force:true});
        const {args,env}=buildOpenSshSftpInvocation({config:this.config,knownHostsPath:this.knownHostsPath,askpassPath:this.askpassPath,askpassMarkerPath:this.askpassMarkerPath});
        this.process=this.spawnImpl(this.sftpExecutable,args,{stdio:["pipe","pipe","pipe"],env,windowsHide:true});
        this.started=true;this.streamsOpened=Boolean(this.process?.stdin&&this.process?.stdout&&this.process?.stderr);
        const append=chunk=>{this.buffer+=chunk.toString("utf8");this.flush();}; this.process.stdout.on("data",append);this.process.stderr.on("data",chunk=>{const text=chunk.toString("utf8");this.stderr+=text;this.buffer+=text;this.flush();});
        this.process.on("error",error=>this.rejectAll(this.failure({kind:"SPAWN",stderr:error?.message})));
        this.process.on("exit",(code,signal)=>{if(!this.handshakeComplete||code!==0||signal)this.rejectAll(this.failure({kind:"EXIT",exitCode:code,signal}));});
        await this.waitForPrompt("SFTP_CONNECT_FAILED");
    }
    async requireFile(value,code){try{await access(value,constants.F_OK);}catch{throw Object.assign(new Error(code),{code});}}
    failure({kind,stderr=this.stderr,exitCode=null,signal=null}={}){const code=classifyOpenSshProcessFailure({kind,stderr,exitCode,signal,askpassAttempted:existsSync(this.askpassMarkerPath)});return Object.assign(new Error(code),{code,stage:kind,exitCode,signal,processStarted:this.started,streamsOpened:this.streamsOpened,askpassAttempted:existsSync(this.askpassMarkerPath)});}
    flush(){if(!this.buffer.includes("sftp>"))return;this.handshakeComplete=true;const output=this.buffer;this.buffer="";const waiter=this.waiters.shift();if(waiter)waiter.resolve(output);}
    rejectAll(error){for(const waiter of this.waiters.splice(0))waiter.reject(error);}
    waitForPrompt(code){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(this.failure({kind:"TIMEOUT"})),this.handshakeTimeoutMs);this.waiters.push({resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});this.flush();});}
    async command(value,code){if(!this.process||/[\r\n]/.test(value))throw new Error("SFTP_COMMAND_INVALID");this.process.stdin.write(`${value}\n`);const output=await this.waitForPrompt(code);if(/Permission denied|Couldn't|Failure|not found/i.test(output))throw Object.assign(new Error(code),{code});return output;}
    async list(remotePath){if(!/^\/[A-Za-z0-9._/-]*$/.test(remotePath)||remotePath.includes(".."))throw new Error("SFTP_LIST_FAILED");return listing(await this.command(`ls -l ${remotePath}`,"SFTP_LIST_FAILED"));}
    async download(remotePath,localPath){if(!/^\/[A-Za-z0-9._/-]+$/.test(remotePath)||remotePath.includes("..")||/[\r\n"]/.test(localPath))throw new Error("SFTP_DOWNLOAD_FAILED");await this.command(`get ${remotePath} "${localPath}"`,"SFTP_DOWNLOAD_FAILED");}
    async close(){if(!this.process)return;try{this.process.stdin.write("bye\n");}catch{}this.process=null;}
    safeError(error){return redactRakutenSftpError(error,this.secrets);}
}
