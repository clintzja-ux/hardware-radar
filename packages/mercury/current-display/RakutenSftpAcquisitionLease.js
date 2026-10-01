import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";

const freeze=value=>Object.freeze({...value});
const fail=code=>Object.assign(new Error(code),{code});
const livePid=pid=>{try{process.kill(pid,0);return true;}catch(cause){return cause?.code==="EPERM";}};

export class RakutenSftpAcquisitionLease {
    constructor({leasePath,operationId=crypto.randomUUID(),pid=process.pid,hostname=os.hostname(),isProcessAlive=livePid}={}){
        const absolute=path.resolve(String(leasePath??"")),marker=`${path.sep}.forge-review${path.sep}`;
        if(!absolute.includes(marker)||typeof operationId!=="string"||!operationId||!Number.isInteger(pid)||pid<1||typeof hostname!=="string"||!hostname||typeof isProcessAlive!=="function")throw fail("RAKUTEN_SFTP_LEASE_CONFIG_INVALID");
        this.leasePath=absolute;this.ownerPath=path.join(absolute,"owner.json");this.operationId=operationId;this.pid=pid;this.hostname=hostname;this.isProcessAlive=isProcessAlive;this.token=crypto.randomUUID();this.held=false;this.staleRecovered=false;
    }
    async acquire(){
        await mkdir(path.dirname(this.leasePath),{recursive:true});
        for(let attempt=0;attempt<2;attempt+=1){
            try{await mkdir(this.leasePath,{recursive:false});const owner={schemaVersion:"1.0",pid:this.pid,hostname:this.hostname,operationId:this.operationId,acquiredAt:new Date().toISOString(),token:this.token};await writeFile(this.ownerPath,`${JSON.stringify(owner)}\n`,{encoding:"utf8",flag:"wx",mode:0o600});this.held=true;return freeze({leaseAcquired:true,leaseContention:false,staleLeaseRecovered:this.staleRecovered});}
            catch(cause){
                if(cause?.code!=="EEXIST"){await rm(this.leasePath,{recursive:true,force:true});throw fail("RAKUTEN_SFTP_LEASE_ACQUIRE_FAILED");}
                let owner;try{owner=JSON.parse(await readFile(this.ownerPath,"utf8"));}catch{throw fail("RAKUTEN_SFTP_LEASE_OWNERSHIP_UNRESOLVED");}
                if(owner?.hostname!==this.hostname||!Number.isInteger(owner?.pid)||owner.pid<1)throw fail("RAKUTEN_SFTP_LEASE_OWNERSHIP_UNRESOLVED");
                if(this.isProcessAlive(owner.pid))throw fail("RAKUTEN_SFTP_ACQUISITION_ALREADY_ACTIVE");
                const stalePath=`${this.leasePath}.stale-${crypto.randomUUID()}`;try{await rename(this.leasePath,stalePath);}catch(renameCause){if(renameCause?.code==="ENOENT")continue;throw fail("RAKUTEN_SFTP_LEASE_OWNERSHIP_UNRESOLVED");}await rm(stalePath,{recursive:true,force:true});this.staleRecovered=true;
            }
        }
        throw fail("RAKUTEN_SFTP_LEASE_ACQUIRE_FAILED");
    }
    async release(){
        if(!this.held)return freeze({leaseReleased:false});
        let owner;try{owner=JSON.parse(await readFile(this.ownerPath,"utf8"));}catch{throw fail("RAKUTEN_SFTP_LEASE_RELEASE_FAILED");}
        if(owner?.token!==this.token||owner?.pid!==this.pid||owner?.hostname!==this.hostname)throw fail("RAKUTEN_SFTP_LEASE_RELEASE_FAILED");
        await rm(this.leasePath,{recursive:true,force:false});this.held=false;return freeze({leaseReleased:true});
    }
}

export function createRakutenSftpAcquisitionLease(options){return new RakutenSftpAcquisitionLease(options);}
