import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "ssh2";
import { createRakutenSftpConnectionAccounting } from "./RakutenSftpConnectionAccounting.js";

const error = code => Object.assign(new Error(code), { code });
const digest = key => crypto.createHash("sha256").update(key).digest("hex");
const hostTokens = (host, port) => port === 22 ? [host, `[${host}]:${port}`] : [`[${host}]:${port}`, host];
const S_IFMT=0o170000,S_IFDIR=0o040000,S_IFREG=0o100000;
const metadata = (filename,attrs) => {
    const attributeShapeValid=attrs==null||typeof attrs==="object";
    let isDirectory=false,isFile=false;
    if(attributeShapeValid&&attrs){try{isDirectory=attrs.isDirectory?.()===true;isFile=attrs.isFile?.()===true;}catch{isDirectory=false;isFile=false;}if(!isDirectory&&!isFile&&Number.isInteger(attrs.mode)){isDirectory=(attrs.mode&S_IFMT)===S_IFDIR;isFile=(attrs.mode&S_IFMT)===S_IFREG;}}
    const rawMtime=attrs?.mtime,sourceSeconds=rawMtime instanceof Date?rawMtime.getTime()/1000:Number(rawMtime),instant=Number.isFinite(sourceSeconds)&&sourceSeconds>=0?new Date(sourceSeconds*1000):null;
    const rawSize=attrs?.size,size=rawSize===undefined||rawSize===null?null:Number(rawSize);
    return {filename,size:Number.isFinite(size)?size:null,remoteTimestampSourceSeconds:Number.isFinite(sourceSeconds)?sourceSeconds:null,modifiedAt:instant&&!Number.isNaN(instant.valueOf())?instant.toISOString():null,isDirectory,isFile,attributeShapeValid};
};

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
    if(code.startsWith("SFTP_"))return code;
    if(level==="client-authentication"||/authentication failed|all configured authentication methods failed|permission denied/i.test(message))return "SFTP_AUTH_FAILED";
    if(code==="ETIMEDOUT"||/timed? out/i.test(message))return "SFTP_CONNECT_TIMEOUT";
    if(code==="ECONNREFUSED"||/connection refused/i.test(message))return "SFTP_CONNECT_REFUSED";
    if(["ENOTFOUND","EAI_AGAIN"].includes(code)||/getaddrinfo|could not resolve/i.test(message))return "SFTP_DNS_FAILED";
    return "SFTP_CONNECT_FAILED";
}

export class NativeSftpSession {
    constructor({config,knownHostsPath,trustOnFirstUse=false,clientFactory=()=>new Client(),readyTimeout=30000,cleanupTimeoutMs=2000,connectionAccounting=createRakutenSftpConnectionAccounting()}={}){this.config=config;this.knownHostsPath=path.resolve(knownHostsPath);this.trustOnFirstUse=trustOnFirstUse;this.clientFactory=clientFactory;this.readyTimeout=readyTimeout;this.cleanupTimeoutMs=cleanupTimeoutMs;this.accounting=connectionAccounting;this.client=null;this.sftp=null;this.clientClosed=false;this.hostMismatch=false;this.presentedKey=null;this.connectionsUsed=0;this.closePromise=null;this.secrets=[config?.username,config?.password];}
    async connect(){
        if(!this.config||this.config.protocol!=="SFTP"||this.config.concurrency!==1)throw error("SFTP_CONFIG_INVALID");
        const trust=await readRakutenSftpHostTrust({knownHostsPath:this.knownHostsPath,host:this.config.host,port:this.config.port});
        if(trust.status==="MISSING"&&!this.trustOnFirstUse)throw error("SFTP_HOST_VERIFICATION_REQUIRED");
        this.client=this.clientFactory();if(!(this.client instanceof EventEmitter)&&typeof this.client?.on!=="function")throw error("SFTP_CONNECT_FAILED");this.client.once?.("close",()=>{this.clientClosed=true;});this.client.once?.("end",()=>{this.clientClosed=true;});
        try{
            await new Promise((resolve,reject)=>{
                let settled=false;const done=(fn,value)=>{if(settled)return;settled=true;fn(value);};
                this.client.once("ready",()=>done(resolve));
                this.client.once("error",cause=>done(reject,error(classifyNativeSftpFailure(cause,{hostMismatch:this.hostMismatch}))));
                try{this.accounting.reserve();this.connectionsUsed+=1;this.client.connect({host:this.config.host,port:this.config.port,username:this.config.username,password:this.config.password,readyTimeout:this.readyTimeout,hostVerifier:key=>{const actual=digest(key);if(trust.status==="TRUSTED"){const accepted=trust.digests.includes(actual);this.hostMismatch=!accepted;return accepted;}this.presentedKey=Buffer.from(key);return this.trustOnFirstUse;}});}catch(cause){done(reject,error(classifyNativeSftpFailure(cause,{hostMismatch:this.hostMismatch})));}
            });
            this.accounting.markReady();
            if(trust.status==="MISSING")await persistTrust({knownHostsPath:this.knownHostsPath,host:this.config.host,port:this.config.port,key:this.presentedKey});
            this.sftp=await new Promise((resolve,reject)=>this.client.sftp((cause,value)=>cause?reject(error("SFTP_CONNECT_FAILED")):resolve(value)));
        }catch(cause){await this.close();throw cause;}
    }
    async list(remotePath){
        try{const entries=await new Promise((resolve,reject)=>this.sftp.readdir(remotePath,(cause,value)=>cause?reject(cause):resolve(value)));return entries.map(item=>metadata(item.filename,item.attrs));}
        catch(cause){const failure=error("SFTP_LIST_FAILED"),status=Number(cause?.code);if(Number.isInteger(status)){failure.sftpStatusCode=status;failure.sftpStatusCategory=status===2?"PATH_NOT_FOUND":status===3?"PERMISSION_DENIED":status===4?"SERVER_FAILURE":"UNKNOWN_LIST_FAILURE";}else failure.sftpStatusCategory=cause?.code==="ENOENT"?"PATH_NOT_FOUND":cause?.code==="EACCES"?"PERMISSION_DENIED":"UNKNOWN_LIST_FAILURE";throw failure;}
    }
    async stat(remotePath){try{const attrs=await new Promise((resolve,reject)=>this.sftp.stat(remotePath,(cause,value)=>cause?reject(cause):resolve(value)));return metadata(path.posix.basename(remotePath),attrs);}catch{throw error("SFTP_LIST_FAILED");}}
    async download(remotePath,localPath,{signal,stallTimeoutMs=60000,downloadTimeoutMs=900000,reportedRemoteBytes=null,onProgress=()=>{},now=()=>Date.now()}={}){
        if(!Number.isFinite(stallTimeoutMs)||stallTimeoutMs<=0||!Number.isFinite(downloadTimeoutMs)||downloadTimeoutMs<=stallTimeoutMs||typeof onProgress!=="function")throw error("SFTP_DOWNLOAD_CONFIG_INVALID");
        const startedMs=now(),progress={bytesTransferred:0,reportedRemoteBytes:Number.isFinite(reportedRemoteBytes)&&reportedRemoteBytes>=0?reportedRemoteBytes:null,transferStartedAt:new Date(startedMs).toISOString(),lastProgressAt:new Date(startedMs).toISOString(),progressEvents:0,completionObserved:false};
        const snapshot=()=>Object.freeze({...progress,percentCompleteEstimate:progress.reportedRemoteBytes>0?Math.min(100,Number(((progress.bytesTransferred/progress.reportedRemoteBytes)*100).toFixed(2))):null});
        try{
            await new Promise((resolve,reject)=>{
                let settled=false,stallTimer,absoluteTimer;
                const cleanup=()=>{clearTimeout(stallTimer);clearTimeout(absoluteTimer);signal?.removeEventListener?.("abort",cancel);this.client?.removeListener?.("close",closed);this.client?.removeListener?.("end",closed);this.client?.removeListener?.("error",sessionFailed);this.sftp?.removeListener?.("close",closed);this.sftp?.removeListener?.("end",closed);this.sftp?.removeListener?.("error",sessionFailed);};
                const finish=(fn,value)=>{if(settled)return;settled=true;cleanup();fn(value);};
                const fail=code=>{const cause=error(code);cause.transfer=snapshot();finish(reject,cause);void this.close();};
                const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>fail("SFTP_DOWNLOAD_STALLED"),stallTimeoutMs);};
                const cancel=()=>fail("SFTP_DOWNLOAD_CANCELLED"),closed=()=>fail("SFTP_DOWNLOAD_SESSION_CLOSED"),sessionFailed=()=>fail("SFTP_DOWNLOAD_FAILED");
                if(signal?.aborted)return cancel();
                signal?.addEventListener?.("abort",cancel,{once:true});this.client?.once?.("close",closed);this.client?.once?.("end",closed);this.client?.once?.("error",sessionFailed);this.sftp?.once?.("close",closed);this.sftp?.once?.("end",closed);this.sftp?.once?.("error",sessionFailed);
                armStall();absoluteTimer=setTimeout(()=>fail("SFTP_DOWNLOAD_TIMEOUT"),downloadTimeoutMs);
                const step=(total)=>{if(settled||!Number.isFinite(total)||total<=progress.bytesTransferred)return;progress.bytesTransferred=total;progress.progressEvents+=1;progress.lastProgressAt=new Date(now()).toISOString();armStall();try{onProgress(snapshot());}catch{}}
                try{this.sftp.fastGet(remotePath,localPath,{step},cause=>{if(cause){const code=["EACCES","ENOSPC","EROFS","EMFILE","ENFILE"].includes(cause?.code)?"SFTP_LOCAL_WRITE_FAILED":"SFTP_DOWNLOAD_FAILED";const failure=error(code);failure.transfer=snapshot();return finish(reject,failure);}progress.completionObserved=true;finish(resolve);});}
                catch(cause){const code=["EACCES","ENOSPC","EROFS","EMFILE","ENFILE"].includes(cause?.code)?"SFTP_LOCAL_WRITE_FAILED":"SFTP_DOWNLOAD_FAILED";const failure=error(code);failure.transfer=snapshot();finish(reject,failure);}
            });
            return snapshot();
        }catch(cause){if(cause?.code?.startsWith("SFTP_"))throw cause;const failure=error("SFTP_DOWNLOAD_FAILED");failure.transfer=snapshot();throw failure;}
    }
    async close(){if(this.closePromise)return this.closePromise;this.closePromise=this.cleanup();return this.closePromise;}
    async cleanup(){const client=this.client,sftp=this.sftp,alreadyClosed=this.clientClosed;this.sftp=null;this.client=null;if(!client||!this.accounting.beginCleanup())return this.accounting.snapshot();if(alreadyClosed){try{sftp?.end?.();}catch{}this.accounting.release();return this.accounting.snapshot();}let completed=false;const closed=new Promise(resolve=>{const done=()=>{if(completed)return;completed=true;resolve(true);};client.once?.("close",done);client.once?.("end",done);});const force=()=>{try{if(typeof client.destroy!=="function")throw new Error("DESTROY_UNAVAILABLE");client.destroy();this.accounting.release({fallback:true});}catch{this.accounting.release({fallback:true,cleanupFailed:true});}};try{sftp?.end?.();client.end();}catch{completed=true;force();return this.accounting.snapshot();}let timeout;const graceful=await Promise.race([closed,new Promise(resolve=>{timeout=setTimeout(()=>resolve(false),this.cleanupTimeoutMs);})]);clearTimeout(timeout);if(graceful)this.accounting.release();else force();return this.accounting.snapshot();}
    connectionAccounting(){return this.accounting.snapshot();}
}
