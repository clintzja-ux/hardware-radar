import crypto from "node:crypto";
import {mkdir,readFile,readdir,rename,rm,stat,statfs,writeFile} from "node:fs/promises";
import path from "node:path";
import {FileSingleWriterRunLock,SINGLE_WRITER_LOCK_STATUSES} from "../runtime/FileSingleWriterRunLock.js";

const GIB=1024**3;
const clone=value=>structuredClone(value);
const freeze=value=>Object.freeze(clone(value));
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const validDigest=value=>/^[a-f0-9]{64}$/i.test(value??"");
const validRunId=value=>/^mer_neweggroutine(?:cmd)?_[a-f0-9]{24}$/i.test(value??"");
const validCatalogId=value=>/^rakuten_catalog_[a-f0-9]{24}$/i.test(value??"");
const healthStatuses=new Set(["SUCCESS","SUCCESS_WITH_PRODUCT_EXCEPTIONS"]);
const healthProjectionKeys=new Set(["schemaVersion","projectionType","asOf","status","lastSuccessfulRun","lastAttemptedRun","schedule","provider","source","full","catalog","coverage","current","history","qa","releaseReadiness","providerCalls","actualSpendUsd","exceptions","storage","readOnly","mutationAuthorized","networkOperation","automaticExecution","affiliateRevalidation","releaseAuthority"]);
const readJson=async file=>JSON.parse(await readFile(file,"utf8"));
const inside=(root,target)=>{const relative=path.relative(root,target);return relative===""||(!relative.startsWith("..")&&!path.isAbsolute(relative));};
const atomicWrite=async(target,value)=>{await mkdir(path.dirname(target),{recursive:true});const temporary=`${target}.tmp-${process.pid}-${crypto.randomUUID()}`;try{await writeFile(temporary,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});await rename(temporary,target);}finally{await rm(temporary,{force:true}).catch(()=>{});}};

function validateHealthProjection(projection,{legacy=false}={}){
 const semantic=legacy?Object.fromEntries(Object.entries(projection??{}).filter(([key])=>key!=="projectionDigest")):projection;
 if(!semantic||semantic.schemaVersion!=="1.0"||semantic.projectionType!=="NEWEGG_ROUTINE_OPERATIONS"||!Number.isFinite(Date.parse(semantic.asOf))||!healthStatuses.has(semantic.status)||!validRunId(semantic.lastSuccessfulRun?.runId)||!validRunId(semantic.lastAttemptedRun?.runId)||!semantic.schedule||typeof semantic.schedule!=="object"||typeof semantic.schedule.state!=="string"||typeof semantic.schedule.due!=="boolean"||typeof semantic.schedule.overlapPrevented!=="boolean"||typeof semantic.schedule.automaticExecution!=="boolean"||semantic.provider!=="RAKUTEN_ADVERTISING"||semantic.source!=="RAKUTEN_NEWEGG_PRODUCT_CATALOG"||!validDigest(semantic.full?.digest)||!Number.isFinite(Date.parse(semantic.full?.observedAt))||!validCatalogId(semantic.catalog?.stateId)||!Array.isArray(semantic.exceptions)||!Number.isFinite(semantic.providerCalls)||semantic.providerCalls<0||!Number.isFinite(semantic.actualSpendUsd)||semantic.actualSpendUsd<0||semantic.readOnly!==true||semantic.mutationAuthorized!==false||semantic.networkOperation!=="NONE"||semantic.automaticExecution!==false||semantic.affiliateRevalidation!==false||semantic.releaseAuthority!==false)throw new Error("NEWEGG_ROUTINE_HEALTH_STATE_INVALID");
 if(legacy&&(Object.keys(semantic).length!==healthProjectionKeys.size||Object.keys(semantic).some(key=>!healthProjectionKeys.has(key))))throw new Error("NEWEGG_ROUTINE_HEALTH_STATE_INVALID");
 if(legacy){if(projection.projectionDigest!==undefined&&projection.projectionDigest!==digest(semantic))throw new Error("NEWEGG_ROUTINE_HEALTH_STATE_INVALID");}
 else if(projection.projectionDigest!==digest(Object.fromEntries(Object.entries(projection).filter(([key])=>key!=="projectionDigest"))))throw new Error("NEWEGG_ROUTINE_HEALTH_STATE_INVALID");
 return projection;
}

function decodeHealthState(state){
 if(state?.schemaVersion==="1.0"&&state?.projection){validateHealthProjection(state.projection);if(state.projectionDigest!==digest(state.projection))throw new Error("NEWEGG_ROUTINE_HEALTH_STATE_INVALID");return{format:"ENVELOPE",projection:state.projection,raw:state};}
 if(state?.schemaVersion==="1.0"&&state?.projectionType==="NEWEGG_ROUTINE_OPERATIONS"){validateHealthProjection(state,{legacy:true});return{format:"LEGACY_RAW_PROJECTION",projection:state,raw:state};}
 throw new Error("NEWEGG_ROUTINE_HEALTH_STATE_INVALID");
}

async function filesUnder(root){try{return (await readdir(root,{recursive:true,withFileTypes:true})).filter(entry=>entry.isFile()).map(entry=>path.join(entry.parentPath??entry.path,entry.name));}catch(error){if(error?.code==="ENOENT")return[];throw error;}}
async function fileEntry(file,root,kind,extra={}){const info=await stat(file);return{path:path.relative(root,file).replaceAll("\\","/"),kind,bytes:info.size,observedAt:extra.observedAt??info.mtime.toISOString(),...extra};}

export class ProductionNeweggArtifactInventoryOwner{
 constructor({root=process.cwd(),now=()=>new Date().toISOString()}={}){this.root=path.resolve(root);this.now=now;this.acquisitionRoot=path.join(this.root,".forge-review/rakuten-sftp/staging/acquisitions");this.catalogRoot=path.join(this.root,".forge-review/rakuten-sftp/catalog-state");this.qaRoot=path.join(this.root,".forge-review/mercury/rakuten-full-current-refresh/qa");this.portfolioRoot=path.join(this.root,".forge-review/publication/ram-intelligence");this.routineRoot=path.join(this.root,".forge-review/mercury/newegg-routine");}
 async inspect(){
  const entries=[],current=await readJson(path.join(this.catalogRoot,"current.json")).catch(error=>error?.code==="ENOENT"?null:Promise.reject(error)),currentCatalogId=current?.stateId??null,predecessorCatalogId=current?.parentStateId??null;
  for(const file of await filesUnder(this.acquisitionRoot)){
   const name=path.basename(file);if(name.endsWith(".gz")){let observedAt=null,artifactDigest=null,prerequisitesComplete=false;try{const receipt=await readJson(path.join(path.dirname(file),"acquisition-receipt.json"));if(receipt.filename===name&&validDigest(receipt.sha256)){observedAt=receipt.headerTimestamp;artifactDigest=receipt.sha256;prerequisitesComplete=true;}}catch{}entries.push(await fileEntry(file,this.root,"RAW_FULL",{observedAt,artifactDigest,prerequisitesComplete,hold:!prerequisitesComplete,holdReason:prerequisitesComplete?null:"CANONICAL_ACQUISITION_RECEIPT_REQUIRED"}));}
   else if(name.includes(".partial"))entries.push(await fileEntry(file,this.root,"PARTIAL_DIAGNOSTIC",{hold:true,holdReason:"INCIDENT_ARTIFACT"}));
   else entries.push(await fileEntry(file,this.root,"PROTECTED_SOURCE_RECEIPT",{prerequisitesComplete:false}));
  }
  for(const file of await filesUnder(this.catalogRoot))if(file.endsWith(".sqlite")){
   const stateId=path.basename(file,".sqlite"),manifestFile=`${file}.manifest.json`;let manifest=null;try{manifest=await readJson(manifestFile);}catch{}
   const explicitPredecessor=typeof manifest?.parentStateId==="string"&&/^rakuten_catalog_[a-f0-9]{24}$/.test(manifest.parentStateId),legacyUnverifiable=stateId!==currentCatalogId&&stateId!==predecessorCatalogId&&!explicitPredecessor;
   entries.push(await fileEntry(file,this.root,"CATALOG_STATE",{catalogStateId:stateId,observedAt:manifest?.currentEvidenceAt??manifest?.artifact?.headerTimestamp??null,artifactDigest:manifest?.artifact?.digest??null,predecessorStateId:manifest?.parentStateId??null,prerequisitesComplete:!legacyUnverifiable,hold:legacyUnverifiable,holdReason:legacyUnverifiable?"HISTORICAL_PREDECESSOR_UNVERIFIABLE":null}));
  }
  for(const file of await filesUnder(this.qaRoot))entries.push(await fileEntry(file,this.root,"QA_ARTIFACT",{prerequisitesComplete:true}));
  for(const file of await filesUnder(this.portfolioRoot)){const relative=path.relative(this.portfolioRoot,file),workspaceGroup=relative.split(path.sep)[0]||"ROOT";entries.push(await fileEntry(file,this.root,"PUBLICATION_ARTIFACT",{prerequisitesComplete:false,workspaceGroup}));}
  for(const file of await filesUnder(this.routineRoot))if(!entries.some(entry=>path.resolve(this.root,entry.path)===path.resolve(file)))entries.push(await fileEntry(file,this.root,"PROTECTED_ROUTINE_EVIDENCE",{prerequisitesComplete:false}));
  const ordered=entries.sort((a,b)=>a.path.localeCompare(b.path)),asOf=this.now(),inventoryDigest=digest({asOf,currentCatalogId,predecessorCatalogId,entries:ordered});
  return freeze({schemaVersion:"1.0",inventoryType:"NEWEGG_ROUTINE_PRODUCTION_ARTIFACT_INVENTORY",asOf,currentCatalogId,predecessorCatalogId,entries:ordered,inventoryDigest,automaticDeletion:false});
 }
}

export function calculateNeweggRoutineRequiredSpace({entries}={}){
 if(!Array.isArray(entries))return freeze({status:"STORAGE_HOLD",reason:"STORAGE_MEASUREMENT_UNAVAILABLE"});
 const largest=kind=>Math.max(0,...entries.filter(value=>value.kind===kind&&Number.isFinite(value.bytes)&&value.bytes>0).map(value=>value.bytes));
 const publicationGroups=new Map();for(const value of entries.filter(value=>value.kind==="PUBLICATION_ARTIFACT"&&Number.isFinite(value.bytes)&&value.bytes>0)){const group=value.workspaceGroup??value.path;publicationGroups.set(group,(publicationGroups.get(group)??0)+value.bytes);}
 const compressedFullBytes=largest("RAW_FULL"),catalogReconstructionBytes=largest("CATALOG_STATE"),qaBytes=largest("QA_ARTIFACT"),publicationBytes=Math.max(0,...publicationGroups.values());
 if(!compressedFullBytes||!catalogReconstructionBytes||!qaBytes||!publicationBytes)return freeze({status:"STORAGE_HOLD",reason:"STORAGE_MEASUREMENT_UNAVAILABLE",measurements:{compressedFullBytes,catalogReconstructionBytes,qaBytes,publicationBytes}});
 const downstreamWorkspaceBytes=Math.max(qaBytes,publicationBytes),additionalWorkloadBytes=compressedFullBytes+catalogReconstructionBytes+downstreamWorkspaceBytes,safetyReserveBytes=Math.max(5*GIB,Math.ceil(additionalWorkloadBytes*.2)),requiredBytes=additionalWorkloadBytes+safetyReserveBytes;
 return freeze({status:"MEASURED",policyVersion:"NEWEGG-ROUTINE-STORAGE-P1-1.0",measurements:{compressedFullBytes,catalogReconstructionBytes,qaBytes,publicationBytes},workspace:{acquisitionBytes:compressedFullBytes,catalogReconstructionBytes,downstreamWorkspaceBytes,sharedWorkspaceDoubleCounted:false},additionalWorkloadBytes,safetyReserveBytes,requiredBytes});
}

export class ProductionNeweggStorageCapacityOwner{
 constructor({root=process.cwd(),inventoryOwner}={}){this.root=path.resolve(root);this.inventoryOwner=inventoryOwner??new ProductionNeweggArtifactInventoryOwner({root:this.root});}
 async assess(){const inventory=await this.inventoryOwner.inspect(),calculation=calculateNeweggRoutineRequiredSpace(inventory),disk=await statfs(this.root),availableBytes=Number(disk.bavail)*Number(disk.bsize);if(calculation.status!=="MEASURED")return freeze({...calculation,sufficient:false,availableBytes,inventoryDigest:inventory.inventoryDigest});return freeze({...calculation,status:availableBytes>=calculation.requiredBytes?"READY":"STORAGE_HOLD",sufficient:availableBytes>=calculation.requiredBytes,availableBytes,inventoryDigest:inventory.inventoryDigest});}
}

export class FileProductionNeweggRoutineHealthRepository{
 constructor({statePath,lock,legacyBackupPath}={}){if(!statePath)throw new TypeError("NEWEGG_ROUTINE_HEALTH_PATH_REQUIRED");this.path=path.resolve(statePath);this.legacyBackupPath=path.resolve(legacyBackupPath??`${this.path}.legacy-backup.json`);this.lock=lock??new FileSingleWriterRunLock({lockPath:`${this.path}.lock`});}
 async readState(){try{return decodeHealthState(await readJson(this.path));}catch(error){if(error?.code==="ENOENT")return null;if(error?.message==="NEWEGG_ROUTINE_HEALTH_STATE_INVALID")throw error;throw new Error("NEWEGG_ROUTINE_HEALTH_STATE_INVALID");}}
 async get(){const state=await this.readState();return state?freeze(state.projection):null;}
 async preserveLegacy(state){const evidence={schemaVersion:"1.0",evidenceType:"NEWEGG_ROUTINE_HEALTH_LEGACY_BACKUP",sourcePath:this.path,projectionDigest:digest(state.raw),projection:clone(state.raw)};try{const prior=await readJson(this.legacyBackupPath);if(prior?.schemaVersion!=="1.0"||prior?.evidenceType!==evidence.evidenceType||prior.projectionDigest!==digest(prior.projection)||prior.projectionDigest!==evidence.projectionDigest)throw new Error("NEWEGG_ROUTINE_HEALTH_LEGACY_BACKUP_CONFLICT");}catch(error){if(error?.code!=="ENOENT")throw error;await atomicWrite(this.legacyBackupPath,evidence);}}
 async put(projection){try{validateHealthProjection(projection);}catch{throw new Error("NEWEGG_ROUTINE_HEALTH_PROJECTION_INVALID");}const outcome=await this.lock.runExclusive(async()=>{const state=await this.readState(),prior=state?.projection??null,priorDigest=prior?.projectionDigest??(prior?digest(prior):null);if(prior){if(priorDigest===projection.projectionDigest&&state.format==="ENVELOPE")return prior;if(Date.parse(projection.asOf)<Date.parse(prior.asOf))throw new Error("NEWEGG_ROUTINE_HEALTH_STALE");if(projection.asOf===prior.asOf&&priorDigest!==projection.projectionDigest)throw new Error("NEWEGG_ROUTINE_HEALTH_CONFLICT");}if(state?.format==="LEGACY_RAW_PROJECTION")await this.preserveLegacy(state);await atomicWrite(this.path,{schemaVersion:"1.0",projectionDigest:digest(projection),projection:clone(projection)});const committed=await this.readState();if(committed?.format!=="ENVELOPE"||committed.projection.projectionDigest!==projection.projectionDigest)throw new Error("NEWEGG_ROUTINE_HEALTH_COMMIT_INVALID");return committed.projection;});if(outcome.status!==SINGLE_WRITER_LOCK_STATUSES.COMPLETED)throw new Error("NEWEGG_ROUTINE_HEALTH_BUSY");return freeze(outcome.result);}
}

export class FilePrivateForgeOperationsStore{
 constructor({statePath,lock}={}){if(!statePath)throw new TypeError("PRIVATE_FORGE_STORE_PATH_REQUIRED");this.path=path.resolve(statePath);this.lock=lock??new FileSingleWriterRunLock({lockPath:`${this.path}.lock`});}
 async get(){try{const state=await readJson(this.path);if(state?.schemaVersion!=="1.0"||state.identity!==state.envelope?.projectionDigest)throw new Error();return freeze(state.envelope);}catch(error){if(error?.code==="ENOENT")return null;throw new Error("PRIVATE_FORGE_STORE_INVALID");}}
 async put(identity,envelope){if(!validDigest(identity)||identity!==envelope?.projectionDigest)throw new Error("PRIVATE_FORGE_STORE_IDENTITY_INVALID");const outcome=await this.lock.runExclusive(async()=>{const prior=await this.get();if(prior){if(prior.envelopeDigest===envelope.envelopeDigest)return prior;if(Date.parse(envelope.createdAt)<Date.parse(prior.createdAt))throw new Error("PRIVATE_FORGE_STORE_STALE");if(envelope.createdAt===prior.createdAt)throw new Error("PRIVATE_FORGE_STORE_CONFLICT");}await atomicWrite(this.path,{schemaVersion:"1.0",identity,envelope:clone(envelope)});return envelope;});if(outcome.status!==SINGLE_WRITER_LOCK_STATUSES.COMPLETED)throw new Error("PRIVATE_FORGE_STORE_BUSY");return freeze(outcome.result);}
}

export function loadPrivateForgeOperationsConfig(env=process.env){const bearer=typeof env.FORGE_PRIVATE_OPERATIONS_BEARER==="string"?env.FORGE_PRIVATE_OPERATIONS_BEARER:"";if(Buffer.byteLength(bearer,"utf8")<32)throw new Error("FORGE_PRIVATE_OPERATIONS_BEARER_REQUIRED");return Object.freeze({bearer,toJSON:()=>({bearer:"REDACTED",loopbackOnly:true})});}
