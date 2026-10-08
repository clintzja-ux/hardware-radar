import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { validateRakutenProductCatalogGzip } from "./RakutenProductCatalogParser.js";
import { redactRakutenSftpError } from "./RakutenSftpConfig.js";
import { createRakutenSftpConnectionAccounting } from "./RakutenSftpConnectionAccounting.js";
import { RAKUTEN_SFTP_DOWNLOAD_TIMEOUT_MS } from "./NativeSftpSession.js";

export { RAKUTEN_SFTP_DOWNLOAD_TIMEOUT_MS };

export const RAKUTEN_SFTP_MAX_CONNECTIONS = 5;
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const error = (code, properties={}) => Object.assign(new Error(code), { code, ...properties });
const safePath = value => typeof value === "string" && value.startsWith("/") && !value.includes("..") && !/[\r\n]/.test(value);
const safeName = value => typeof value === "string" && value.length>0&&!/[\\/\0\r\n]/.test(value);
const mainFeedPattern = /^(\d+)_(\d+)_mp(?:_(delta|deltatemplate)|_template)?\.txt\.gz$/i;
const validInstant=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));
const sha256File=async filePath=>{const hash=crypto.createHash("sha256");for await(const chunk of createReadStream(filePath))hash.update(chunk);return hash.digest("hex");};
const validateStagedFile=async(filePath,feedProfile,feedFamilyKey)=>validateRakutenProductCatalogGzip(createReadStream(filePath),{feedProfile,feedFamilyKey,collectRecords:false,diagnosticInputFactory:()=>createReadStream(filePath)});

export const RAKUTEN_SFTP_DOWNLOAD_STALL_TIMEOUT_MS=60000;
export const RAKUTEN_SFTP_LIST_TIMEOUT_MS=30000;

export async function inspectRakutenStalePartials(stagingRoot,{asOf=new Date().toISOString()}={}){
    const absolute=path.resolve(stagingRoot),marker=`${path.sep}.forge-review${path.sep}`;
    if(!absolute.includes(marker)||!validInstant(asOf))throw error("SFTP_STAGING_PATH_INVALID");
    let names;try{names=await readdir(absolute);}catch(cause){if(cause?.code==="ENOENT")return freeze([]);throw error("SFTP_STAGING_INSPECTION_FAILED");}
    const values=[];for(const filename of names.filter(value=>safeName(value)&&value.includes(".partial-"))){const metadata=await stat(path.join(absolute,filename));if(!metadata.isFile())continue;values.push({filename,size:metadata.size,modifiedAt:metadata.mtime.toISOString(),ageMs:Math.max(0,Date.parse(asOf)-metadata.mtimeMs)});}
    return freeze(values.sort((a,b)=>a.filename.localeCompare(b.filename)));
}

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
    if (!entry || !safeName(entry.filename) || !safePath(directory) || entry.attributeShapeValid===false || entry.size!==null&&entry.size!==undefined&&(!Number.isFinite(entry.size)||entry.size<0)) throw error("SFTP_LIST_ENTRY_INVALID");
    const special=entry.filename==="."||entry.filename==="..",remotePath=special?directory:`${directory.replace(/\/$/, "")}/${entry.filename}`;
    const identity=entry.filename.match(mainFeedPattern),mid=identity?.[1]??directory.match(/\/(\d+)(?:\/|$)/)?.[1]??null;
    const fileType=special?"SPECIAL_IGNORED":entry.isDirectory===true?"DIRECTORY":entry.isFile===true?"REGULAR_FILE":"OTHER",feedFamily=classifyRakutenFeedFile({remotePath,filename:entry.filename});
    const timestampValid=validInstant(entry.modifiedAt);if(fileType==="REGULAR_FILE"&&feedFamily!=="UNKNOWN"&&!timestampValid)throw error("SFTP_LIST_ENTRY_INVALID");
    const timestamp=timestampValid?new Date(entry.modifiedAt).toISOString():null;
    return freeze({ remotePath, logicalDirectory:directory, filename: entry.filename, remoteTimestampSourceSeconds:Number.isFinite(entry.remoteTimestampSourceSeconds)?entry.remoteTimestampSourceSeconds:null,remoteTimestampUtc:timestamp,modifiedAt:timestamp,size:entry.size??null,advertiserMid:mid,publisherSid:identity?.[2]??null,feedFamily,format:identity?"TXT":null,compression:identity?"GZIP":null,fileType,directory:fileType==="DIRECTORY" });
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

export function selectRakutenNeweggMainFull(entries, { advertiserMid="44583", publisherSid="4746097" }={}) {
    if (!/^\d+$/.test(advertiserMid) || !/^\d+$/.test(publisherSid)) throw error("SFTP_FILE_SELECTION_INVALID");
    const filename=`${advertiserMid}_${publisherSid}_mp.txt.gz`;
    const candidates=entries.filter(item => item.logicalDirectory==="/" && item.fileType==="REGULAR_FILE" && item.filename===filename && item.advertiserMid===advertiserMid && item.publisherSid===publisherSid && item.feedFamily==="FULL");
    if (candidates.length===0) throw error("SFTP_FILE_NOT_FOUND");
    if (candidates.length!==1) throw error("SFTP_FILE_AMBIGUOUS");
    return candidates[0];
}

export function selectRakutenNeweggAuthoritativeLineage(entries,{advertiserMid="44583"}={}){
    const candidates=entries.filter(item=>item.logicalDirectory==="/"&&item.fileType==="REGULAR_FILE"&&item.advertiserMid===advertiserMid&&/^\d+$/.test(item.publisherSid??"")&&["FULL","DELTA"].includes(item.feedFamily));
    const fulls=candidates.filter(item=>item.feedFamily==="FULL"&&validInstant(item.remoteTimestampUtc)).sort((a,b)=>Date.parse(b.remoteTimestampUtc)-Date.parse(a.remoteTimestampUtc)||a.filename.localeCompare(b.filename));
    if(fulls.length===0)throw error("SFTP_AUTHORITATIVE_FULL_NOT_FOUND");
    const full=fulls[0];if(fulls.filter(item=>item.remoteTimestampUtc===full.remoteTimestampUtc).length!==1)throw error("SFTP_AUTHORITATIVE_FULL_AMBIGUOUS");
    // Rakuten exposes one mutable main FULL name and one mutable main DELTA name.
    // SFTP mtime is transport metadata, not provider feed chronology. Surface the
    // structurally matching DELTA here; validated HDR/content lineage decides
    // whether it can be applied after download.
    const deltas=candidates.filter(item=>item.feedFamily==="DELTA"&&item.publisherSid===full.publisherSid&&validInstant(item.remoteTimestampUtc));
    if(deltas.length>1)throw error("SFTP_AUTHORITATIVE_DELTA_AMBIGUOUS");
    return freeze({full,deltas,files:[full,...deltas],advertiserMid:full.advertiserMid,publisherSid:full.publisherSid,feedFamilyKey:`RAKUTEN_MAIN:${full.advertiserMid}:${full.publisherSid}`});
}

export function summarizeRakutenSftpDiscovery(entries,{advertiserMid="44583",entriesObserved,malformedEntries=0,logicalDirectory="/"}={}){
    if(!/^\d+$/.test(advertiserMid))throw error("SFTP_FILE_SELECTION_INVALID");
    const recognized=entries.filter(item=>item.fileType==="REGULAR_FILE"&&item.feedFamily!=="UNKNOWN");
    const candidates=recognized.filter(item=>item.logicalDirectory==="/"&&item.advertiserMid===advertiserMid&&item.feedFamily==="DELTA"&&/^\d+$/.test(item.publisherSid??""));
    const scoped=entries.filter(item=>item.logicalDirectory===logicalDirectory);
    return freeze({logicalDirectory:logicalDirectory==="/"?"ROOT":logicalDirectory,entriesObserved:entriesObserved??scoped.length,directoriesObserved:scoped.filter(item=>item.fileType==="DIRECTORY").length,regularFilesObserved:scoped.filter(item=>item.fileType==="REGULAR_FILE").length,otherEntries:scoped.filter(item=>item.fileType==="OTHER").length,ignoredSpecialEntries:scoped.filter(item=>item.fileType==="SPECIAL_IGNORED").length,malformedEntries,recognizedFeedFiles:recognized.filter(item=>item.logicalDirectory===logicalDirectory).length,mainDeltaCandidates:candidates.length,targetMid:advertiserMid,recognizedEntries:scoped.filter(item=>(item.fileType==="DIRECTORY"&&[advertiserMid,"ADDITIONAL","GLOBAL"].includes(item.filename))||item.feedFamily!=="UNKNOWN").map(item=>item.filename)});
}

function normalizeDirectoryEntries(raw,directory,{advertiserMid}){
    const entries=[];let malformedEntries=0;
    for(const entry of raw){try{entries.push(normalizeRakutenRemoteEntry(entry,directory));}catch(cause){if(cause?.code!=="SFTP_LIST_ENTRY_INVALID")throw cause;malformedEntries+=1;}}
    const discovery=summarizeRakutenSftpDiscovery(entries,{advertiserMid,entriesObserved:raw.length,malformedEntries,logicalDirectory:directory});
    if(malformedEntries>0)throw error("SFTP_LIST_ENTRY_INVALID",{discovery});
    return {entries,discovery};
}

const listingSpecs=advertiserMid=>[
    {logicalPath:"ROOT",remotePath:"/",required:true},
    {logicalPath:"CATEGORY",remotePath:`/${advertiserMid}/`,required:false},
    {logicalPath:"ADDITIONAL",remotePath:"/ADDITIONAL/44583/",required:false},
    {logicalPath:"GLOBAL",remotePath:"/GLOBAL/",required:false}
];
const listingOutcome=(spec,discovery)=>freeze({...spec,outcome:"SUCCESS",entryCount:discovery.entriesObserved,directoryCount:discovery.directoriesObserved,regularFileCount:discovery.regularFilesObserved,otherCount:discovery.otherEntries,ignoredSpecialCount:discovery.ignoredSpecialEntries,malformedCount:discovery.malformedEntries});
const failedListingOutcome=(spec,cause)=>{
    const diagnostic=cause?.listFailure??{};
    return freeze({...spec,outcome:cause?.sftpStatusCategory??"UNKNOWN_LIST_FAILURE",stage:`${spec.logicalPath}_LIST`,classification:diagnostic.classification??(cause?.code==="SFTP_LIST_TIMEOUT"?"SFTP_LIST_TIMEOUT":cause?.code==="SFTP_LIST_CANCELLED"?"SFTP_LIST_CANCELLED":"SFTP_UNKNOWN_LIST_FAILURE"),structuredCode:diagnostic.structuredCode??null,errorName:diagnostic.errorName??null,sessionReadyBeforeFailure:diagnostic.sessionReadyBeforeFailure??null,sessionStateBeforeFailure:diagnostic.sessionStateBeforeFailure??"UNKNOWN",timedOut:diagnostic.timedOut??cause?.code==="SFTP_LIST_TIMEOUT",cancelled:diagnostic.cancelled??cause?.code==="SFTP_LIST_CANCELLED",sftpStatusCode:Number.isInteger(cause?.sftpStatusCode)?cause.sftpStatusCode:null,entryCount:0,directoryCount:0,regularFileCount:0,otherCount:0,ignoredSpecialCount:0,malformedCount:0});
};

export class RakutenProductCatalogSftpTransport {
    constructor({ sessionFactory, stagingRoot, connectionConcurrency = 1, maxAttempts = 1, connectionAccountingFactory=()=>createRakutenSftpConnectionAccounting(),acquisitionLeaseFactory=null } = {}) {
        if (typeof sessionFactory !== "function" || typeof connectionAccountingFactory!=="function" || !stagingRoot || connectionConcurrency!==1 || maxAttempts!==1) throw new Error(connectionConcurrency > RAKUTEN_SFTP_MAX_CONNECTIONS ? "SFTP_CONNECTION_LIMIT_INVALID" : "SFTP_TRANSPORT_CONFIG_INVALID");
        const absolute = path.resolve(stagingRoot), marker = `${path.sep}.forge-review${path.sep}`;
        if (!absolute.includes(marker) || absolute.includes(`${path.sep}public${path.sep}`)) throw new Error("SFTP_STAGING_PATH_INVALID");
        if(acquisitionLeaseFactory!==null&&typeof acquisitionLeaseFactory!=="function")throw new Error("SFTP_TRANSPORT_CONFIG_INVALID");
        this.sessionFactory=sessionFactory; this.stagingRoot=absolute; this.connectionConcurrency=connectionConcurrency; this.maxAttempts=maxAttempts;this.connectionAccountingFactory=connectionAccountingFactory;this.acquisitionLeaseFactory=acquisitionLeaseFactory;this.lastConnectionAccounting=null;
    }
    async withSession(operation) {
        let last;const accounting=this.connectionAccountingFactory(),lease=this.acquisitionLeaseFactory?.(),leaseState=lease?await lease.acquire():{leaseAcquired:false,leaseContention:false,staleLeaseRecovered:false};let leaseReleased=false;const releaseLease=async()=>{if(lease&&!leaseReleased){await lease.release();leaseReleased=true;}};
        for (let attempt=1;attempt<=this.maxAttempts;attempt+=1) {
            const session=this.sessionFactory({connectionAccounting:accounting});let result,primary;
            try { await session.connect(); result=await operation(session,{releaseLease}); }
            catch(error){ last=error;primary=error; }
            finally { await session.close().catch(()=>{});this.lastConnectionAccounting=session.connectionAccounting?.()??accounting.snapshot();await releaseLease(); }
            if(primary){const safe=redactRakutenSftpError(primary,session.secrets??[]);safe.connectionAccounting=this.lastConnectionAccounting;safe.lease={...leaseState,leaseReleased:true};if(primary.discovery)safe.discovery=primary.discovery;if(primary.directoryListings)safe.directoryListings=primary.directoryListings;if(primary.transfer)safe.transfer=primary.transfer;if(primary.integrity)safe.integrity=primary.integrity;if(primary.lineage)safe.lineage=primary.lineage;if(primary.attemptedFile)safe.attemptedFile=primary.attemptedFile;if(primary.authoritativeSequenceComplete===false)safe.authoritativeSequenceComplete=false;throw safe;}
            return freeze({...result,connectionAccounting:this.lastConnectionAccounting,connectionsUsed:this.lastConnectionAccounting.connectionsOpened,lease:{...leaseState,leaseReleased:true}});
        }
        throw redactRakutenSftpError(last);
    }
    async discoverAvailable(session,{advertiserMid="44583",signal,listTimeoutMs=RAKUTEN_SFTP_LIST_TIMEOUT_MS}={}){
        const listings=[],directoryListings=[];let rootDiscovery;
        for(const spec of listingSpecs(advertiserMid)){
            try{const raw=await session.list(spec.remotePath,{signal,timeoutMs:listTimeoutMs}),normalized=normalizeDirectoryEntries(raw,spec.remotePath,{advertiserMid});listings.push(...normalized.entries);directoryListings.push(listingOutcome(spec,normalized.discovery));if(spec.required)rootDiscovery=normalized.discovery;}
            catch(cause){if(cause?.code==="SFTP_LIST_ENTRY_INVALID"){const outcome=freeze({...failedListingOutcome(spec,cause),outcome:"LIST_FAILED",malformedCount:cause.discovery?.malformedEntries??1});directoryListings.push(outcome);if(spec.required){cause.directoryListings=freeze(directoryListings);throw cause;}continue;}const outcome=failedListingOutcome(spec,cause);directoryListings.push(outcome);if(spec.required)throw error("SFTP_ROOT_LIST_FAILED",{directoryListings:freeze(directoryListings)});}
        }
        return freeze({listings,directoryListings:freeze(directoryListings),discovery:rootDiscovery,status:directoryListings.some(item=>item.outcome!=="SUCCESS")?"SFTP_INSPECTION_PARTIAL":"INSPECTED"});
    }
    async discover(session,options={}){
        const available=await this.discoverAvailable(session,options);let selected;try{selected=selectRakutenNeweggMainDelta(available.listings.filter(item=>item.logicalDirectory==="/"),options);}catch(cause){cause.discovery=available.discovery;cause.directoryListings=available.directoryListings;throw cause;}return freeze({...available,selected});
    }
    async inspect({ advertiserMid="44583" }={}) {
        return this.withSession(async session=>{
            const result=await this.discover(session,{advertiserMid});
            return freeze({...result,directories:listingSpecs(advertiserMid).map(item=>item.remotePath),downloaded:false,connectionsUsed:1,externalOperations:1,actualSpendUsd:0});
        });
    }
    async downloadAndValidate({ advertiserMid="44583",signal,stallTimeoutMs=RAKUTEN_SFTP_DOWNLOAD_STALL_TIMEOUT_MS,downloadTimeoutMs=RAKUTEN_SFTP_DOWNLOAD_TIMEOUT_MS,onProgress }={}) {
        return this.withSession(async (session,{releaseLease})=>{
            const discovery=await this.discover(session,{advertiserMid}),selected=discovery.selected;
            await mkdir(this.stagingRoot,{recursive:true});
            const finalPath=path.join(this.stagingRoot,selected.filename), temporaryPath=`${finalPath}.partial-${crypto.randomUUID()}`;
            try {
                const transfer=await session.download(selected.remotePath,temporaryPath,{signal,stallTimeoutMs,downloadTimeoutMs,reportedRemoteBytes:selected.size,onProgress});
                await session.close();await releaseLease();
                const local=await stat(temporaryPath); if(local.size<=0)throw new Error("SFTP_DOWNLOAD_FAILED");
                const validation=await validateStagedFile(temporaryPath,selected.feedFamily==="DELTA"?"MAIN_DELTA":"MAIN_FULL",`RAKUTEN_MAIN:${selected.advertiserMid}:${selected.publisherSid}`),{header,trailer,products,modifications,fieldCounts}=validation.summary;
                if(!header||!trailer||trailer.actualProductCount!==products)throw new Error("SFTP_INTEGRITY_FAILED");
                await rename(temporaryPath,finalPath);
                return freeze({status:"DOWNLOADED_AND_VALIDATED",selected,directoryListings:discovery.directoryListings,discovery:discovery.discovery,transfer,integrity:validation.integrity,localPath:finalPath,localBytes:local.size,sha256:await sha256File(finalPath),headerTimestamp:header.feedTimestamp,productRows:products,trailerRows:trailer.productCount,modifications,fieldCounts,connectionsUsed:1,externalOperations:1,actualSpendUsd:0});
            } catch(error){await rm(temporaryPath,{force:true});if(String(error?.message??"").startsWith("SFTP_"))throw error;if(["EACCES","ENOSPC","EROFS","EMFILE","ENFILE","ENOENT"].includes(error?.code))throw new Error("SFTP_LOCAL_WRITE_FAILED");throw new Error("SFTP_INTEGRITY_FAILED");}
        });
    }
    async downloadFullAndValidate({ advertiserMid="44583", publisherSid="4746097", signal, listTimeoutMs=RAKUTEN_SFTP_LIST_TIMEOUT_MS, stallTimeoutMs=RAKUTEN_SFTP_DOWNLOAD_STALL_TIMEOUT_MS, downloadTimeoutMs=RAKUTEN_SFTP_DOWNLOAD_TIMEOUT_MS, onProgress=()=>{} }={}) {
        return this.withSession(async (session,{releaseLease}) => {
            const discovery=await this.discoverAvailable(session,{advertiserMid,signal,listTimeoutMs});
            let selected;
            try { selected=selectRakutenNeweggMainFull(discovery.listings,{advertiserMid,publisherSid}); }
            catch(cause) { cause.discovery=discovery.discovery; cause.directoryListings=discovery.directoryListings; throw cause; }
            const acquisitionRoot=path.join(this.stagingRoot,"acquisitions",crypto.randomUUID());
            await mkdir(acquisitionRoot,{recursive:true});
            const finalPath=path.join(acquisitionRoot,selected.filename),temporaryPath=`${finalPath}.partial`;
            try {
                const transfer=await session.download(selected.remotePath,temporaryPath,{signal,stallTimeoutMs,downloadTimeoutMs,reportedRemoteBytes:selected.size,onProgress});
                await session.close(); await releaseLease();
                const local=await stat(temporaryPath); if (local.size<=0) throw error("SFTP_DOWNLOAD_FAILED");
                const validation=await validateStagedFile(temporaryPath,"MAIN_FULL",`RAKUTEN_MAIN:${advertiserMid}:${publisherSid}`),{header,trailer,products,modifications,fieldCounts}=validation.summary;
                if (!header || !trailer || trailer.actualProductCount!==products) throw error("SFTP_INTEGRITY_FAILED");
                await rename(temporaryPath,finalPath);
                return freeze({status:"FULL_DOWNLOADED_AND_VALIDATED",selected,directoryListings:discovery.directoryListings,discovery:discovery.discovery,transfer,integrity:validation.integrity,localPath:finalPath,localBytes:local.size,sha256:await sha256File(finalPath),headerTimestamp:header.feedTimestamp,productRows:products,trailerRows:trailer.productCount,modifications,fieldCounts,filesDownloaded:1,downloadsSequential:true,localProcessingStartedAfterNetworkClose:true,externalOperations:1,actualSpendUsd:0});
            } catch(cause) { await rm(temporaryPath,{force:true}); throw cause; }
        });
    }
    async downloadAuthoritativeSequence({advertiserMid="44583",signal,listTimeoutMs=RAKUTEN_SFTP_LIST_TIMEOUT_MS,stallTimeoutMs=RAKUTEN_SFTP_DOWNLOAD_STALL_TIMEOUT_MS,downloadTimeoutMs=RAKUTEN_SFTP_DOWNLOAD_TIMEOUT_MS,onProgress=()=>{}}={}){
        return this.withSession(async (session,{releaseLease})=>{
            const discovery=await this.discoverAvailable(session,{advertiserMid,signal,listTimeoutMs});let lineage;try{lineage=selectRakutenNeweggAuthoritativeLineage(discovery.listings,{advertiserMid});}catch(cause){cause.discovery=discovery.discovery;cause.directoryListings=discovery.directoryListings;throw cause;}
            const failureLineage=freeze({full:lineage.full.filename,deltas:lineage.deltas.map(item=>item.filename),orderedFiles:lineage.files.map(item=>item.filename),sequenceLength:lineage.files.length});
            await mkdir(this.stagingRoot,{recursive:true});const staged=[];
            try{
                for(let index=0;index<lineage.files.length;index+=1){const selected=lineage.files[index],finalPath=path.join(this.stagingRoot,selected.filename),temporaryPath=`${finalPath}.partial-${crypto.randomUUID()}`;try{const transfer=await session.download(selected.remotePath,temporaryPath,{signal,stallTimeoutMs,downloadTimeoutMs,reportedRemoteBytes:selected.size,onProgress:value=>onProgress({index,filename:selected.filename,...value})});staged.push({selected,finalPath,temporaryPath,transfer});}catch(cause){await rm(temporaryPath,{force:true});cause.lineage=failureLineage;cause.attemptedFile=freeze({index,filename:selected.filename,classification:selected.feedFamily,reportedRemoteBytes:selected.size??null});throw cause;}}
                await session.close();await releaseLease();const validated=[];
                for(let index=0;index<staged.length;index+=1){const item=staged[index];try{const validation=await validateStagedFile(item.temporaryPath,item.selected.feedFamily==="DELTA"?"MAIN_DELTA":"MAIN_FULL",lineage.feedFamilyKey);validated.push({...item,validation,localBytes:(await stat(item.temporaryPath)).size,sha256:await sha256File(item.temporaryPath)});}catch(cause){cause.attemptedFile=freeze({index,filename:item.selected.filename,classification:item.selected.feedFamily,reportedRemoteBytes:item.selected.size??null});cause.transfer=item.transfer;throw cause;}}
                const files=[];for(const item of validated){await rename(item.temporaryPath,item.finalPath);files.push({filename:item.selected.filename,feedFamily:item.selected.feedFamily,feedFamilyKey:lineage.feedFamilyKey,remoteModifiedAt:item.selected.remoteTimestampUtc,headerTimestamp:item.validation.summary.header.feedTimestamp,localPath:item.finalPath,localBytes:item.localBytes,sha256:item.sha256,transfer:item.transfer,integrity:item.validation.integrity});}
                return freeze({status:"AUTHORITATIVE_SEQUENCE_DOWNLOADED_AND_VALIDATED",lineage:{full:lineage.full.filename,deltas:lineage.deltas.map(item=>item.filename),orderedFiles:lineage.files.map(item=>item.filename),feedFamilyKey:lineage.feedFamilyKey},files,filesDownloaded:files.length,downloadsSequential:true,directoryListings:discovery.directoryListings,discovery:discovery.discovery,localProcessingStartedAfterNetworkClose:true,actualSpendUsd:0});
            }catch(cause){for(const item of staged)await rm(item.temporaryPath,{force:true});const failure=String(cause?.code??cause?.message??"").startsWith("SFTP_")?cause:error("SFTP_SEQUENCE_INCOMPLETE");failure.lineage??=failureLineage;failure.authoritativeSequenceComplete=false;throw failure;}
        });
    }
}
