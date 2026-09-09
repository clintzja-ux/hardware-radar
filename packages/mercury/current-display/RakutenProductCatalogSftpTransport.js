import crypto from "node:crypto";
import { mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { collectRakutenProductCatalogFixture } from "./RakutenProductCatalogParser.js";
import { redactRakutenSftpError } from "./RakutenSftpConfig.js";

export const RAKUTEN_SFTP_MAX_CONNECTIONS = 5;
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const safePath = value => typeof value === "string" && value.startsWith("/") && !value.includes("..") && !/[\r\n]/.test(value);
const safeName = value => typeof value === "string" && /^[A-Za-z0-9._-]+$/.test(value);

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
    if (!entry || !safeName(entry.filename) || !safePath(directory) || !Number.isFinite(entry.size) || entry.size < 0 || !Number.isFinite(Date.parse(entry.modifiedAt))) throw new Error("SFTP_LIST_ENTRY_INVALID");
    const remotePath = `${directory.replace(/\/$/, "")}/${entry.filename}`;
    const mid = entry.filename.match(/^(\d+)_/)?.[1] ?? directory.match(/\/(\d+)(?:\/|$)/)?.[1] ?? null;
    return freeze({ remotePath, filename: entry.filename, modifiedAt: new Date(entry.modifiedAt).toISOString(), size: entry.size, advertiserMid: mid, feedFamily: classifyRakutenFeedFile({ remotePath, filename: entry.filename }), directory: entry.isDirectory === true });
}

export function selectRakutenNeweggMainDelta(entries, { advertiserMid = "44583" } = {}) {
    const candidates = entries.filter(item => item.advertiserMid === advertiserMid && item.feedFamily === "DELTA" && item.remotePath.startsWith(`/${advertiserMid}/`) && !item.directory);
    if (candidates.length === 0) throw new Error("SFTP_FILE_NOT_FOUND");
    if (candidates.length !== 1) throw new Error("SFTP_FILE_AMBIGUOUS");
    return candidates[0];
}

export class RakutenProductCatalogSftpTransport {
    constructor({ sessionFactory, stagingRoot, connectionConcurrency = 1, maxAttempts = 1 } = {}) {
        if (typeof sessionFactory !== "function" || !stagingRoot || !Number.isInteger(connectionConcurrency) || connectionConcurrency < 1 || connectionConcurrency > RAKUTEN_SFTP_MAX_CONNECTIONS || !Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 2) throw new Error(connectionConcurrency > RAKUTEN_SFTP_MAX_CONNECTIONS ? "SFTP_CONNECTION_LIMIT_INVALID" : "SFTP_TRANSPORT_CONFIG_INVALID");
        const absolute = path.resolve(stagingRoot), marker = `${path.sep}.forge-review${path.sep}`;
        if (!absolute.includes(marker) || absolute.includes(`${path.sep}public${path.sep}`)) throw new Error("SFTP_STAGING_PATH_INVALID");
        this.sessionFactory=sessionFactory; this.stagingRoot=absolute; this.connectionConcurrency=connectionConcurrency; this.maxAttempts=maxAttempts;
    }
    async withSession(operation) {
        let last;
        for (let attempt=1;attempt<=this.maxAttempts;attempt+=1) {
            const session=this.sessionFactory();
            try { await session.connect(); return await operation(session); }
            catch(error){ last=error; if(attempt===this.maxAttempts) throw redactRakutenSftpError(error,session.secrets??[]); }
            finally { await session.close().catch(()=>{}); }
        }
        throw redactRakutenSftpError(last);
    }
    async inspect({ advertiserMid="44583" }={}) {
        return this.withSession(async session=>{
            const directories=["/",`/${advertiserMid}/`,"/ADDITIONAL/44583/","/GLOBAL/"];
            const listings=[];
            for(const directory of directories){const raw=await session.list(directory);for(const entry of raw)if(!entry.isDirectory)listings.push(normalizeRakutenRemoteEntry(entry,directory));}
            const selected=selectRakutenNeweggMainDelta(listings,{advertiserMid});
            return freeze({status:"INSPECTED",directories,listings,selected,downloaded:false,connectionsUsed:1,externalOperations:1,actualSpendUsd:0});
        });
    }
    async downloadAndValidate({ advertiserMid="44583" }={}) {
        return this.withSession(async session=>{
            const raw=[];
            for(const directory of ["/",`/${advertiserMid}/`,"/ADDITIONAL/44583/","/GLOBAL/"])for(const entry of await session.list(directory))if(!entry.isDirectory)raw.push(normalizeRakutenRemoteEntry(entry,directory));
            const selected=selectRakutenNeweggMainDelta(raw,{advertiserMid});
            await mkdir(this.stagingRoot,{recursive:true});
            const finalPath=path.join(this.stagingRoot,selected.filename), temporaryPath=`${finalPath}.partial-${process.pid}`;
            try {
                await session.download(selected.remotePath,temporaryPath);
                const local=await stat(temporaryPath); if(local.size<=0)throw new Error("SFTP_DOWNLOAD_FAILED");
                const bytes=await readFile(temporaryPath), records=await collectRakutenProductCatalogFixture(bytes);
                const header=records.find(item=>item.recordType==="HDR"),trailer=records.find(item=>item.recordType==="TRL"),products=records.filter(item=>item.recordType==="PRODUCT");
                if(!header||!trailer||trailer.actualProductCount!==products.length)throw new Error("SFTP_INTEGRITY_FAILED");
                await rename(temporaryPath,finalPath);
                const count=value=>products.filter(item=>item.modification===value).length;
                return freeze({status:"DOWNLOADED_AND_VALIDATED",selected,localPath:finalPath,localBytes:local.size,sha256:crypto.createHash("sha256").update(bytes).digest("hex"),headerTimestamp:header.feedTimestamp,productRows:products.length,trailerRows:trailer.productCount,modifications:{I:count("I"),U:count("U"),D:count("D")},fieldCounts:[...new Set(products.map(item=>item.fieldCount))].sort(),connectionsUsed:1,externalOperations:1,actualSpendUsd:0});
            } catch(error){await rm(temporaryPath,{force:true});throw error;}
        });
    }
}
