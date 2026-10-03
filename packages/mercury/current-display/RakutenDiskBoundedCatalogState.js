import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parseRakutenProductCatalogGzip } from "./RakutenProductCatalogParser.js";

export const RAKUTEN_DISK_CATALOG_FORMAT_VERSION = "1.0";
export const RAKUTEN_DISK_CATALOG_PROJECTION_VERSION = "RAKUTEN-CATALOG-PROJECTION-2.0";
const fail=(code,properties={})=>{throw Object.assign(new Error(code),{code,...properties});};
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`:JSON.stringify(value);
const sha=value=>crypto.createHash("sha256").update(typeof value==="string"?value:canonical(value)).digest("hex");
const validDigest=value=>typeof value==="string"&&/^[a-f0-9]{64}$/i.test(value);
const validTime=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));
const clone=value=>structuredClone(value);
const freeze=value=>Object.freeze(clone(value));
const sqlPath=value=>value.replaceAll("'","''");

const compactRecord=record=>({
  productId:record.productId,sku:record.sku,productName:record.productName??null,productUrl:record.productUrl??null,buyUrl:record.buyUrl??null,
  salePrice:record.salePrice??null,retailPrice:record.retailPrice??null,beginDate:record.beginDate??null,endDate:record.endDate??null,
  brand:record.brand??null,shipping:record.shipping??null,manufacturerPartNumber:record.manufacturerPartNumber??null,manufacturerName:record.manufacturerName??null,
  availability:record.availability??null,upc:record.upc??null,classId:record.classId??null,currency:record.currency??null,modification:record.modification??null
});

const assertRoot=root=>{const absolute=path.resolve(root),marker=`${path.sep}.forge-review${path.sep}rakuten-sftp${path.sep}`;if(!absolute.includes(marker)||absolute.includes(`${path.sep}public${path.sep}`))fail("RAKUTEN_CATALOG_STATE_PATH_INVALID");return absolute;};
const key=record=>{if(typeof record?.productId!=="string"||!record.productId.trim()||typeof record?.sku!=="string"||!record.sku.trim())fail("RAKUTEN_SOURCE_ENTRY_IDENTITY_INVALID");return [record.productId,record.sku];};
const hashFile=async filePath=>{const hash=crypto.createHash("sha256");for await(const chunk of createReadStream(filePath))hash.update(chunk);return hash.digest("hex");};
const schema=db=>db.exec(`CREATE TABLE catalog_entries(product_id TEXT NOT NULL,sku TEXT NOT NULL,record_json TEXT NOT NULL,PRIMARY KEY(product_id,sku)) WITHOUT ROWID; CREATE TABLE catalog_metadata(name TEXT PRIMARY KEY,value TEXT NOT NULL) WITHOUT ROWID;`);
const metadata=(db,name)=>JSON.parse(db.prepare("SELECT value FROM catalog_metadata WHERE name=?").get(name)?.value??"null");
const putMetadata=(db,name,value)=>db.prepare("INSERT OR REPLACE INTO catalog_metadata(name,value) VALUES (?,?)").run(name,JSON.stringify(value));
const stateDigest=db=>{const hash=crypto.createHash("sha256");for(const row of db.prepare("SELECT product_id,sku,record_json FROM catalog_entries ORDER BY product_id,sku").iterate())hash.update(canonical([row.product_id,row.sku,JSON.parse(row.record_json)]));return hash.digest("hex");};
const recordCount=db=>Number(db.prepare("SELECT COUNT(*) AS count FROM catalog_entries").get().count);
const stateMaterial=({feedFamilyKey,artifactDigest,headerTimestamp,count,catalogDigest,parentStateId=null,deltaDigest=null,deltaHeaderTimestamp=null})=>({formatVersion:RAKUTEN_DISK_CATALOG_FORMAT_VERSION,projectionVersion:RAKUTEN_DISK_CATALOG_PROJECTION_VERSION,feedFamilyKey,artifactDigest,headerTimestamp,count,catalogDigest,parentStateId,deltaDigest,deltaHeaderTimestamp});
const identify=material=>({stateDigest:sha(material),stateId:`rakuten_catalog_${sha(material).slice(0,24)}`});
const tempPath=root=>path.join(root,`.catalog-state.partial-${crypto.randomUUID()}.sqlite`);
const statePath=(root,stateId)=>path.join(root,`${stateId}.sqlite`);
const manifestPath=root=>path.join(root,"current.json");
const writeManifest=async(root,value)=>{const temporary=path.join(root,`.current.partial-${crypto.randomUUID()}.json`);await writeFile(temporary,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});await rename(temporary,manifestPath(root));};
const promoteState=async({root,temporary,final,manifest})=>{
  const temporaryManifest=path.join(root,`.catalog-state.partial-${crypto.randomUUID()}.manifest.json`);
  let databasePromoted=false,manifestPromoted=false;
  try{
    await writeFile(temporaryManifest,`${JSON.stringify(manifest,null,2)}\n`,{flag:"wx"});
    await rename(temporary,final);databasePromoted=true;
    await rename(temporaryManifest,final+".manifest.json");manifestPromoted=true;
    await writeManifest(root,manifest);
  }catch(error){
    await rm(temporaryManifest,{force:true});
    if(databasePromoted&&!manifestPromoted)await rm(final,{force:true});
    if(manifestPromoted){await rm(final,{force:true});await rm(final+".manifest.json",{force:true});}
    throw error;
  }
};

export class RakutenDiskBoundedCatalogStateProjection {
  constructor({stateRoot}={}){this.stateRoot=assertRoot(stateRoot);}

  async getCurrent(){try{return freeze(JSON.parse(await readFile(manifestPath(this.stateRoot),"utf8")));}catch(error){if(error?.code==="ENOENT")return null;throw error;}}

  async materializeFull({artifactPath,expected}={}){
    if(!expected||expected.feedFamilyKey!=="RAKUTEN_MAIN:44583:4746097"||expected.filename!=="44583_4746097_mp.txt.gz"||!validDigest(expected.artifactDigest)||!validTime(expected.headerTimestamp)||(expected.remoteModifiedAt!==undefined&&expected.remoteModifiedAt!==null&&!validTime(expected.remoteModifiedAt))||!Number.isInteger(expected.fileSize)||!Number.isInteger(expected.productRows)||expected.productRows<1||expected.trailerCount!==expected.productRows)fail("RAKUTEN_FULL_BASELINE_BINDING_INVALID");
    const absolute=path.resolve(artifactPath??"");if(path.basename(absolute)!==expected.filename||absolute.includes(".partial-"))fail("RAKUTEN_FULL_BASELINE_ARTIFACT_INELIGIBLE");
    const info=await stat(absolute);if(!info.isFile()||info.size!==expected.fileSize)fail("RAKUTEN_FULL_BASELINE_SIZE_MISMATCH");
    const artifactDigest=await hashFile(absolute);if(artifactDigest!==expected.artifactDigest.toLowerCase())fail("RAKUTEN_FULL_BASELINE_DIGEST_MISMATCH");
    await mkdir(this.stateRoot,{recursive:true});const temporary=tempPath(this.stateRoot);let db;
    const started=performance.now();let header=null,trailer=null,products=0;
    try{
      db=new DatabaseSync(temporary);db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA temp_store=FILE;");schema(db);
      const insert=db.prepare("INSERT INTO catalog_entries(product_id,sku,record_json) VALUES (?,?,?)");db.exec("BEGIN IMMEDIATE");
      try{for await(const record of parseRakutenProductCatalogGzip(createReadStream(absolute),{feedProfile:"MAIN_FULL",feedFamilyKey:expected.feedFamilyKey})){
        if(record.recordType==="HDR"){header=record;continue;}if(record.recordType==="TRL"){trailer=record;continue;}
        const [productId,sku]=key(record);try{insert.run(productId,sku,JSON.stringify(compactRecord(record)));}catch(error){if(String(error?.message).includes("UNIQUE"))fail("RAKUTEN_FULL_SOURCE_ENTRY_DUPLICATE");throw error;}products+=1;
      }db.exec("COMMIT");}catch(error){try{db.exec("ROLLBACK");}catch{}throw error;}
      if(header?.advertiserMid!=="44583"||header.feedTimestamp!==expected.headerTimestamp||products!==expected.productRows||trailer?.actualProductCount!==expected.trailerCount)fail("RAKUTEN_FULL_BASELINE_VALIDATION_MISMATCH");
      const catalogDigest=stateDigest(db),material=stateMaterial({feedFamilyKey:expected.feedFamilyKey,artifactDigest,headerTimestamp:header.feedTimestamp,count:products,catalogDigest}),identity=identify(material);
      const manifest={schemaVersion:RAKUTEN_DISK_CATALOG_FORMAT_VERSION,stateId:identity.stateId,stateDigest:identity.stateDigest,stateType:"FULL_BASELINE",parentStateId:null,feedFamilyKey:expected.feedFamilyKey,artifact:{filename:expected.filename,digest:artifactDigest,headerTimestamp:header.feedTimestamp,remoteModifiedAt:expected.remoteModifiedAt?new Date(expected.remoteModifiedAt).toISOString():null,productRows:products,trailerCount:trailer.actualProductCount},projectionVersion:RAKUTEN_DISK_CATALOG_PROJECTION_VERSION,catalogDigest,recordCount:products,historyEligibility:false,currentEvidenceAt:header.feedTimestamp};
      putMetadata(db,"manifest",manifest);db.exec("PRAGMA optimize");db.close();db=null;
      const final=statePath(this.stateRoot,identity.stateId);try{const prior=JSON.parse(await readFile(final+".manifest.json","utf8"));if(prior.stateDigest!==identity.stateDigest)fail("RAKUTEN_CATALOG_STATE_CONFLICT");await rm(temporary,{force:true});return freeze({status:"REPLAY_NO_CHANGE",manifest:prior,statePath:final,durationMs:Math.round(performance.now()-started)});}catch(error){if(error?.code!=="ENOENT")throw error;}
      await promoteState({root:this.stateRoot,temporary,final,manifest});
      return freeze({status:"MATERIALIZED",manifest,statePath:final,durationMs:Math.round(performance.now()-started)});
    }catch(error){try{db?.close();}catch{}await rm(temporary,{force:true});throw error;}
  }

  async applyDelta({parentStateId,artifactPath,artifactDigest,headerTimestamp,remoteModifiedAt=null,feedFamilyKey,filename="44583_4746097_mp_delta.txt.gz"}={}){
    if(!/^rakuten_catalog_[a-f0-9]{24}$/.test(parentStateId??"")||!validDigest(artifactDigest)||!validTime(headerTimestamp)||(remoteModifiedAt!==null&&!validTime(remoteModifiedAt))||feedFamilyKey!=="RAKUTEN_MAIN:44583:4746097"||filename!=="44583_4746097_mp_delta.txt.gz")fail("RAKUTEN_DELTA_LINEAGE_INVALID");
    const parentFile=statePath(this.stateRoot,parentStateId);const parentManifest=JSON.parse(await readFile(parentFile+".manifest.json","utf8"));
    if(parentManifest.stateId!==parentStateId||parentManifest.feedFamilyKey!==feedFamilyKey)fail("RAKUTEN_CATALOG_FAMILY_MISMATCH");
    if(Date.parse(headerTimestamp)<=Date.parse(parentManifest.artifact?.headerTimestamp??parentManifest.delta?.headerTimestamp??""))fail("RAKUTEN_DELTA_ORDER_AMBIGUOUS");
    if(parentManifest.delta?.digest===artifactDigest)return freeze({status:"REPLAY_NO_CHANGE",manifest:parentManifest,statePath:parentFile,durationMs:0});
    const absolute=path.resolve(artifactPath??"");if(path.basename(absolute)!==filename||absolute.includes(".partial-"))fail("RAKUTEN_DELTA_ARTIFACT_INELIGIBLE");if((await hashFile(absolute))!==artifactDigest.toLowerCase())fail("RAKUTEN_DELTA_DIGEST_MISMATCH");
    await mkdir(this.stateRoot,{recursive:true});const temporary=tempPath(this.stateRoot),started=performance.now();await copyFile(parentFile,temporary);let db,header=null,trailer=null,products=0;const modifications={I:0,U:0,D:0};
    try{
      db=new DatabaseSync(temporary);db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA temp_store=FILE; BEGIN IMMEDIATE");
      const upsert=db.prepare("INSERT INTO catalog_entries(product_id,sku,record_json) VALUES (?,?,?) ON CONFLICT(product_id,sku) DO UPDATE SET record_json=excluded.record_json"),remove=db.prepare("DELETE FROM catalog_entries WHERE product_id=? AND sku=?");
      try{for await(const record of parseRakutenProductCatalogGzip(createReadStream(absolute),{feedProfile:"MAIN_DELTA",feedFamilyKey})){
        if(record.recordType==="HDR"){header=record;continue;}if(record.recordType==="TRL"){trailer=record;continue;}const [productId,sku]=key(record);modifications[record.modification]+=1;if(record.modification==="D")remove.run(productId,sku);else upsert.run(productId,sku,JSON.stringify(compactRecord(record)));products+=1;
      }db.exec("COMMIT");}catch(error){try{db.exec("ROLLBACK");}catch{}throw error;}
      if(header?.advertiserMid!=="44583"||header.feedTimestamp!==headerTimestamp||trailer?.actualProductCount!==products)fail("RAKUTEN_DELTA_VALIDATION_MISMATCH");
      const count=recordCount(db),catalogDigest=stateDigest(db),material=stateMaterial({feedFamilyKey,artifactDigest:parentManifest.artifact.digest,headerTimestamp:parentManifest.artifact.headerTimestamp,count,catalogDigest,parentStateId,deltaDigest:artifactDigest,deltaHeaderTimestamp:headerTimestamp}),identity=identify(material);
      const manifest={schemaVersion:RAKUTEN_DISK_CATALOG_FORMAT_VERSION,stateId:identity.stateId,stateDigest:identity.stateDigest,stateType:"DELTA_DERIVED",parentStateId,feedFamilyKey,artifact:parentManifest.artifact,delta:{filename,digest:artifactDigest,headerTimestamp,remoteModifiedAt:remoteModifiedAt?new Date(remoteModifiedAt).toISOString():null,productRows:products,trailerCount:trailer.actualProductCount,modifications},projectionVersion:RAKUTEN_DISK_CATALOG_PROJECTION_VERSION,catalogDigest,recordCount:count,historyEligibility:false,currentEvidenceAt:headerTimestamp};
      putMetadata(db,"manifest",manifest);db.exec("PRAGMA optimize");db.close();db=null;
      const final=statePath(this.stateRoot,identity.stateId);try{const prior=JSON.parse(await readFile(final+".manifest.json","utf8"));if(prior.stateDigest!==identity.stateDigest)fail("RAKUTEN_CATALOG_STATE_CONFLICT");await rm(temporary,{force:true});return freeze({status:"REPLAY_NO_CHANGE",manifest:prior,statePath:final,durationMs:Math.round(performance.now()-started)});}catch(error){if(error?.code!=="ENOENT")throw error;}
      await promoteState({root:this.stateRoot,temporary,final,manifest});
      return freeze({status:"MATERIALIZED",manifest,statePath:final,durationMs:Math.round(performance.now()-started)});
    }catch(error){try{db?.close();}catch{}await rm(temporary,{force:true});throw error;}
  }

  async extractBySkus({stateId,skus}={}){if(!/^rakuten_catalog_[a-f0-9]{24}$/.test(stateId??"")||!Array.isArray(skus)||skus.some(value=>typeof value!=="string"||!value))fail("RAKUTEN_CATALOG_TARGET_INPUT_INVALID");const db=new DatabaseSync(statePath(this.stateRoot,stateId),{readOnly:true});try{const rows=db.prepare("SELECT product_id,sku,record_json FROM catalog_entries WHERE sku IN (SELECT value FROM json_each(?)) ORDER BY sku,product_id").all(JSON.stringify([...new Set(skus)]));return freeze(rows.map(row=>({productId:row.product_id,sku:row.sku,record:JSON.parse(row.record_json)})));}finally{db.close();}}

  async assessBaselineReadiness({feedFamilyKey}={}){const current=await this.getCurrent();if(!current)return freeze({classification:"BASELINE_MISSING"});if(current.feedFamilyKey!==feedFamilyKey)return freeze({classification:"BASELINE_UNTRUSTED"});const file=statePath(this.stateRoot,current.stateId);try{const db=new DatabaseSync(file,{readOnly:true});const count=recordCount(db),manifest=metadata(db,"manifest");db.close();return freeze({classification:count===current.recordCount&&manifest?.stateDigest===current.stateDigest?"BASELINE_READY":"LINEAGE_INCOMPLETE",stateId:current.stateId,recordCount:count});}catch{return freeze({classification:"LINEAGE_INCOMPLETE"});}}

  async prune({retainStateIds=[]}={}){const current=await this.getCurrent(),keep=new Set([current?.stateId,...retainStateIds].filter(Boolean));const {readdir}=await import("node:fs/promises");for(const name of await readdir(this.stateRoot)){const match=/^(rakuten_catalog_[a-f0-9]{24})\.sqlite(?:\.manifest\.json)?$/.exec(name);if(match&&!keep.has(match[1]))await rm(path.join(this.stateRoot,name),{force:true});}return freeze({retained:[...keep].sort()});}
}
