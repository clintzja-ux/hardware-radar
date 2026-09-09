import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "ssh2";

const error = code => Object.assign(new Error(code), { code });
const digest = key => crypto.createHash("sha256").update(key).digest("hex");
const hostTokens = (host, port) => port === 22 ? [host, `[${host}]:${port}`] : [`[${host}]:${port}`, host];
const metadata = (filename,attrs) => ({filename,size:Number(attrs?.size??0),modifiedAt:new Date(Number(attrs?.mtime)*1000).toISOString(),isDirectory:attrs?.isDirectory?.()===true});

function keyType(key) {
    if (!Buffer.isBuffer(key) || key.length < 5) throw error("SFTP_HOST_TRUST_INVALID");
    const length=key.readUInt32BE(0);
    if(length<1||length>128||key.length<4+length)throw error("SFTP_HOST_TRUST_INVALID");
    const value=key.subarray(4,4+length).toString("ascii");
    if(!/^ssh-[a-z0-9@._+-]+$|^ecdsa-[a-z0-9@._+-]+$/i.test(value))throw error("SFTP_HOST_TRUST_INVALID");
    return value;
}

function tokenMatches(token, candidates) {
    if (candidates.includes(token)) return true;
    const match=token.match(/^\|1\|([^|]+)\|([^|]+)$/);
    if(!match)return false;
    try { const salt=Buffer.from(match[1],"base64"); return candidates.some(candidate=>crypto.createHmac("sha1",salt).update(candidate).digest("base64")===match[2]); }
    catch{return false;}
}

export async function readRakutenSftpHostTrust({knownHostsPath,host,port=22}={}) {
    let text;
    try{text=await readFile(knownHostsPath,"utf8");}catch(cause){if(cause?.code==="ENOENT")return Object.freeze({status:"MISSING",digests:Object.freeze([])});throw error("SFTP_HOST_TRUST_INVALID");}
    const matches=[];
    for(const raw of text.split(/\r?\n/)){
        const line=raw.trim();if(!line||line.startsWith("#"))continue;
        const fields=line.split(/\s+/);if(fields[0].startsWith("@")||fields.length<3)continue;
        if(!fields[0].split(",").some(token=>tokenMatches(token,hostTokens(host,port))))continue;
        let key;try{key=Buffer.from(fields[2],"base64");keyType(key);}catch{throw error("SFTP_HOST_TRUST_INVALID");}
        matches.push(digest(key));
    }
    if(matches.length===0)throw error("SFTP_HOST_TRUST_INVALID");
    return Object.freeze({status:"TRUSTED",digests:Object.freeze([...new Set(matches)])});
}

async function persistTrust({knownHostsPath,host,port,key}){
    const type=keyType(key),directory=path.dirname(knownHostsPath),temporary=`${knownHostsPath}.partial-${process.pid}`;
    await mkdir(directory,{recursive:true});
    const token=port===22?host:`[${host}]:${port}`;
    try{await writeFile(temporary,`${token} ${type} ${key.toString("base64")}\n`,{encoding:"utf8",mode:0o600,flag:"wx"});await rename(temporary,knownHostsPath);}
    catch{await rm(temporary,{force:true});throw error("SFTP_HOST_TRUST_WRITE_FAILED");}
}

export function classifyNativeSftpFailure(value,{hostMismatch=false}={}){
    if(hostMismatch)return "SFTP_HOST_VERIFICATION_FAILED";
    const code=String(value?.code??""),level=String(value?.level??""),message=String(value?.message??value??"");
    if(level==="client-authentication"||/authentication failed|all configured authentication methods failed|permission denied/i.test(message))return "SFTP_AUTH_FAILED";
    if(code==="ETIMEDOUT"||/timed? out/i.test(message))return "SFTP_CONNECT_TIMEOUT";
    if(code==="ECONNREFUSED"||/connection refused/i.test(message))return "SFTP_CONNECT_REFUSED";
    if(["ENOTFOUND","EAI_AGAIN"].includes(code)||/getaddrinfo|could not resolve/i.test(message))return "SFTP_DNS_FAILED";
    return "SFTP_CONNECT_FAILED";
}

export class NativeSftpSession {
    constructor({config,knownHostsPath,trustOnFirstUse=false,clientFactory=()=>new Client(),readyTimeout=30000}={}){this.config=config;this.knownHostsPath=path.resolve(knownHostsPath);this.trustOnFirstUse=trustOnFirstUse;this.clientFactory=clientFactory;this.readyTimeout=readyTimeout;this.client=null;this.sftp=null;this.hostMismatch=false;this.presentedKey=null;this.connectionsUsed=0;this.secrets=[config?.username,config?.password];}
    async connect(){
        if(!this.config||this.config.protocol!=="SFTP"||this.config.concurrency!==1)throw error("SFTP_CONFIG_INVALID");
        const trust=await readRakutenSftpHostTrust({knownHostsPath:this.knownHostsPath,host:this.config.host,port:this.config.port});
        if(trust.status==="MISSING"&&!this.trustOnFirstUse)throw error("SFTP_HOST_VERIFICATION_REQUIRED");
        this.client=this.clientFactory();if(!(this.client instanceof EventEmitter)&&typeof this.client?.on!=="function")throw error("SFTP_CONNECT_FAILED");
        try{
            await new Promise((resolve,reject)=>{
                let settled=false;const done=(fn,value)=>{if(settled)return;settled=true;fn(value);};
                this.client.once("ready",()=>done(resolve));
                this.client.once("error",cause=>done(reject,error(classifyNativeSftpFailure(cause,{hostMismatch:this.hostMismatch}))));
                try{this.connectionsUsed+=1;this.client.connect({host:this.config.host,port:this.config.port,username:this.config.username,password:this.config.password,readyTimeout:this.readyTimeout,hostVerifier:key=>{const actual=digest(key);if(trust.status==="TRUSTED"){const accepted=trust.digests.includes(actual);this.hostMismatch=!accepted;return accepted;}this.presentedKey=Buffer.from(key);return this.trustOnFirstUse;}});}catch(cause){done(reject,error(classifyNativeSftpFailure(cause,{hostMismatch:this.hostMismatch})));}
            });
            if(trust.status==="MISSING")await persistTrust({knownHostsPath:this.knownHostsPath,host:this.config.host,port:this.config.port,key:this.presentedKey});
            this.sftp=await new Promise((resolve,reject)=>this.client.sftp((cause,value)=>cause?reject(error("SFTP_CONNECT_FAILED")):resolve(value)));
        }catch(cause){await this.close();throw cause;}
    }
    async list(remotePath){
        try{const entries=await new Promise((resolve,reject)=>this.sftp.readdir(remotePath,(cause,value)=>cause?reject(cause):resolve(value)));return entries.map(item=>metadata(item.filename,item.attrs));}
        catch{throw error("SFTP_LIST_FAILED");}
    }
    async stat(remotePath){try{const attrs=await new Promise((resolve,reject)=>this.sftp.stat(remotePath,(cause,value)=>cause?reject(cause):resolve(value)));return metadata(path.posix.basename(remotePath),attrs);}catch{throw error("SFTP_LIST_FAILED");}}
    async download(remotePath,localPath){try{await new Promise((resolve,reject)=>this.sftp.fastGet(remotePath,localPath,cause=>cause?reject(cause):resolve()));}catch(cause){if(["EACCES","ENOSPC","EROFS","EMFILE","ENFILE"].includes(cause?.code))throw error("SFTP_LOCAL_WRITE_FAILED");throw error("SFTP_DOWNLOAD_FAILED");}}
    async close(){const client=this.client;this.sftp=null;this.client=null;if(!client)return;try{client.end();}catch{} }
}
