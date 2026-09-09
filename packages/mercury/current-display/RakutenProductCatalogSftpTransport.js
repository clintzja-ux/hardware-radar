import crypto from "node:crypto";
import { mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { collectRakutenProductCatalogFixture } from "./RakutenProductCatalogParser.js";
import { redactRakutenSftpError } from "./RakutenSftpConfig.js";
import { createRakutenSftpConnectionAccounting } from "./RakutenSftpConnectionAccounting.js";

export const RAKUTEN_SFTP_MAX_CONNECTIONS = 5;
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const error = (code, properties={}) => Object.assign(new Error(code), { code, ...properties });
const safePath = value => typeof value === "string" && value.startsWith("/") && !value.includes("..") && !/[\r\n]/.test(value);
const safeName = value => typeof value === "string" && /^[A-Za-z0-9._-]+$/.test(value);
const mainFeedPattern = /^(\d+)_(\d+)_mp(?:_(delta|deltatemplate)|_template)?\.txt\.gz$/i;
const validInstant=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));

export function classifyRakutenFeedFile({ remotePath, filename } = {}) {
    const upperPath = String(remotePath ?? "").toUpperCase(), lower = String(filename ?? "").toLowerCase();
    if (upperPath.includes("/ADDITIONAL/")) return "ADDITIONAL";
    if (upperPath.includes("/GLOBAL/")) return "GLOBAL";
    if (lower.includes("deltatemplate")) return "DELTA_TEMPLATE";
    if (lower.includes("template")) return "TEMPLATE";
    if (lower.endsWith("_mp_delta.txt.gz")) return "DELTA";
    if (lower.endsWith("_mp.txt.gz")) return "FULL";
    if (upperPath.includes("/CATEGORY/")) return "CATEGORY";
    return "UNKNOWN";
}

export function normalizeRakutenRemoteEntry(entry, directory) {
    if (!entry || !safeName(entry.filename) || !safePath(directory) || !Number.isFinite(entry.size) || entry.size < 0 || !validInstant(entry.modifiedAt)) throw error("SFTP_LIST_ENTRY_INVALID");
    const remotePath = `${directory.replace(/\/$/, "")}/${entry.filename}`;
    const identity=entry.filename.match(mainFeedPattern),mid=identity?.[1]??directory.match(/\/(\d+)(?:\/|$)/)?.[1]??null;
    const fileType=entry.isDirectory===true?"DIRECTORY":entry.isFile===true||entry.isDirectory===false?"REGULAR_FILE":"OTHER";
    return freeze({ remotePath, logicalDirectory:directory, filename: entry.filename, remoteTimestampSourceSeconds:Number.isFinite(entry.remoteTimestampSourceSeconds)?entry.remoteTimestampSourceSeconds:null,remoteTimestampUtc:new Date(entry.modifiedAt).toISOString(),modifiedAt:new Date(entry.modifiedAt).toISOString(), size: entry.size, advertiserMid: mid, publisherSid:identity?.[2]??null, feedFamily: classifyRakutenFeedFile({ remotePath, filename: entry.filename }),format:identity?"TXT":null,compression:identity?"GZIP":null,fileType, directory:fileType==="DIRECTORY" });
}

export function compareRakutenRemoteTimestamp({currentTimestamp,previousTimestamp,currentEntry,previousEntry}={}){
    currentTimestamp=currentEntry?.remoteTimestampUtc??currentTimestamp;previousTimestamp=previousEntry?.remoteTimestampUtc??previousTimestamp;
    if(!validInstant(currentTimestamp)||!validInstant(previousTimestamp))return "UNKNOWN";
    const current=Date.parse(currentTimestamp),previous=Date.parse(previousTimestamp);
    return current===previous?"UNCHANGED":current>previous?"NEWER":"OLDER_OR_REGRESSED";
}

export function selectRakutenNeweggMainDelta(entries, { advertiserMid = "44583" } = {}) {
    if(!/^\d+$/.test(advertiserMid))throw error("SFTP_FILE_SELECTION_INVALID");
    const candidates = entries.filter(item => item.logicalDirectory==="/"&&item.fileType==="REGULAR_FILE"&&item.advertiserMid===advertiserMid&&/^\d+$/.test(item.publisherSid??"")&&item.feedFamily==="DELTA"&&new RegExp(`^${advertiserMid}_\\d+_mp_delta\\.txt\\.gz$`,"i").test(item.filename));
    if (candidates.length === 0) throw error("SFTP_FILE_NOT_FOUND");
    if (candidates.length !== 1) throw error("SFTP_FILE_AMBIGUOUS");
    return candidates[0];
}

export function summarizeRakutenSftpDiscovery(entries,{advertiserMid="44583"}={}){
    if(!/^\d+$/.test(advertiserMid))throw error("SFTP_FILE_SELECTION_INVALID");
    const recognized=entries.filter(item=>item.fileType==="REGULAR_FILE"&&item.feedFamily!=="UNKNOWN");
    const candidates=recognized.filter(item=>item.logicalDirectory==="/"&&item.advertiserMid===advertiserMid&&item.feedFamily==="DELTA"&&/^\d+$/.test(item.publisherSid??""));
    return freeze({logicalDirectory:"ROOT",entriesObserved:entries.filter(item=>item.logicalDirectory==="/").length,directoriesObserved:entries.filter(item=>item.logicalDirectory==="/"&&item.fileType==="DIRECTORY").length,regularFilesObserved:entries.filter(item=>item.logicalDirectory==="/"&&item.fileType==="REGULAR_FILE").length,recognizedFeedFiles:recognized.filter(item=>item.logicalDirectory==="/").length,mainDeltaCandidates:candidates.length,targetMid:advertiserMid,recognizedEntries:entries.filter(item=>item.logicalDirectory==="/"&&((item.fileType==="DIRECTORY"&&[advertiserMid,"ADDITIONAL","GLOBAL"].includes(item.filename))||item.feedFamily!=="UNKNOWN")).map(item=>item.filename)});
}

export class RakutenProductCatalogSftpTransport {
    constructor({ sessionFactory, stagingRoot, connectionConcurrency = 1, maxAttempts = 1, connectionAccountingFactory=()=>createRakutenSftpConnectionAccounting() } = {}) {
        if (typeof sessionFactory !== "function" || typeof connectionAccountingFactory!=="function" || !stagingRoot || connectionConcurrency!==1 || maxAttempts!==1) throw new Error(connectionConcurrency > RAKUTEN_SFTP_MAX_CONNECTIONS ? "SFTP_CONNECTION_LIMIT_INVALID" : "SFTP_TRANSPORT_CONFIG_INVALID");
        const absolute = path.resolve(stagingRoot), marker = `${path.sep}.forge-review${path.sep}`;
        if (!absolute.includes(marker) || absolute.includes(`${path.sep}public${path.sep}`)) throw new Error("SFTP_STAGING_PATH_INVALID");
        this.sessionFactory=sessionFactory; this.stagingRoot=absolute; this.connectionConcurrency=connectionConcurrency; this.maxAttempts=maxAttempts;this.connectionAccountingFactory=connectionAccountingFactory;this.lastConnectionAccounting=null;
    }
    async withSession(operation) {
        let last;const accounting=this.connectionAccountingFactory();
        for (let attempt=1;attempt<=this.maxAttempts;attempt+=1) {
            const session=this.sessionFactory({connectionAccounting:accounting});let result,primary;
            try { await session.connect(); result=await operation(session); }
            catch(error){ last=error;primary=error; }
            finally { await session.close().catch(()=>{});this.lastConnectionAccounting=session.connectionAccounting?.()??accounting.snapshot(); }
            if(primary){const safe=redactRakutenSftpError(primary,session.secrets??[]);safe.connectionAccounting=this.lastConnectionAccounting;if(primary.discovery)safe.discovery=primary.discovery;throw safe;}
            return freeze({...result,connectionAccounting:this.lastConnectionAccounting,connectionsUsed:this.lastConnectionAccounting.connectionsOpened});
        }
        throw redactRakutenSftpError(last);
    }
    async inspect({ advertiserMid="44583" }={}) {
        return this.withSession(async session=>{
            const directories=["/",`/${advertiserMid}/`,"/ADDITIONAL/44583/","/GLOBAL/"];
            const listings=[];
            for(const directory of directories){const raw=await session.list(directory);for(const entry of raw)listings.push(normalizeRakutenRemoteEntry(entry,directory));}
            const discovery=summarizeRakutenSftpDiscovery(listings,{advertiserMid});
            let selected;try{selected=selectRakutenNeweggMainDelta(listings,{advertiserMid});}catch(cause){cause.discovery=discovery;throw cause;}
            return freeze({status:"INSPECTED",directories,listings,discovery,selected,downloaded:false,connectionsUsed:1,externalOperations:1,actualSpendUsd:0});
        });
    }
    async downloadAndValidate({ advertiserMid="44583" }={}) {
        return this.withSession(async session=>{
            const raw=[];
            for(const directory of ["/",`/${advertiserMid}/`,"/ADDITIONAL/44583/","/GLOBAL/"])for(const entry of await session.list(directory))raw.push(normalizeRakutenRemoteEntry(entry,directory));
            const selected=selectRakutenNeweggMainDelta(raw,{advertiserMid});
            await mkdir(this.stagingRoot,{recursive:true});
            const finalPath=path.join(this.stagingRoot,selected.filename), temporaryPath=`${finalPath}.partial-${process.pid}`;
            try {
                await session.download(selected.remotePath,temporaryPath);
                await session.close();
                const local=await stat(temporaryPath); if(local.size<=0)throw new Error("SFTP_DOWNLOAD_FAILED");
                const bytes=await readFile(temporaryPath), records=await collectRakutenProductCatalogFixture(bytes);
                const header=records.find(item=>item.recordType==="HDR"),trailer=records.find(item=>item.recordType==="TRL"),products=records.filter(item=>item.recordType==="PRODUCT");
                if(!header||!trailer||trailer.actualProductCount!==products.length)throw new Error("SFTP_INTEGRITY_FAILED");
                await rename(temporaryPath,finalPath);
                const count=value=>products.filter(item=>item.modification===value).length;
                return freeze({status:"DOWNLOADED_AND_VALIDATED",selected,localPath:finalPath,localBytes:local.size,sha256:crypto.createHash("sha256").update(bytes).digest("hex"),headerTimestamp:header.feedTimestamp,productRows:products.length,trailerRows:trailer.productCount,modifications:{I:count("I"),U:count("U"),D:count("D")},fieldCounts:[...new Set(products.map(item=>item.fieldCount))].sort(),connectionsUsed:1,externalOperations:1,actualSpendUsd:0});
            } catch(error){await rm(temporaryPath,{force:true});if(String(error?.message??"").startsWith("SFTP_"))throw error;if(["EACCES","ENOSPC","EROFS","EMFILE","ENFILE","ENOENT"].includes(error?.code))throw new Error("SFTP_LOCAL_WRITE_FAILED");throw new Error("SFTP_INTEGRITY_FAILED");}
        });
    }
}
