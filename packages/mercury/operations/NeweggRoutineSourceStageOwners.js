import crypto from "node:crypto";
import {createReadStream} from "node:fs";
import {mkdir,readFile,rename,rm,stat,writeFile} from "node:fs/promises";
import path from "node:path";
import {validateRakutenProductCatalogGzip} from "../current-display/index.js";

const freeze=value=>Object.freeze(structuredClone(value));
const shaFile=async file=>{const hash=crypto.createHash("sha256");for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest("hex");};
const validDigest=value=>/^[a-f0-9]{64}$/i.test(value??"");
const stageError=(code,cause)=>Object.assign(new Error(code),{code,cause: cause?.code??cause?.message??null});

export class FileNeweggSourceStageReceiptRepository{
 constructor({root}={}){if(!root)throw new TypeError("NEWEGG_SOURCE_RECEIPT_ROOT_REQUIRED");this.root=path.resolve(root);}
 file(stage,digest){return path.join(this.root,`${stage.toLowerCase()}-${digest}.json`);}
 async read(stage,digest){try{const value=JSON.parse(await readFile(this.file(stage,digest),"utf8"));if(value?.schemaVersion!=="1.0"||value.stage!==stage||value.artifactDigest!==digest)throw new Error();return freeze(value);}catch(error){if(error?.code==="ENOENT")return null;throw stageError("NEWEGG_SOURCE_STAGE_RECEIPT_INVALID",error);}}
 async write(value){await mkdir(this.root,{recursive:true});const target=this.file(value.stage,value.artifactDigest),serialized=`${JSON.stringify(value,null,2)}\n`;try{const prior=await readFile(target,"utf8");if(prior!==serialized)throw stageError("NEWEGG_SOURCE_STAGE_RECEIPT_CONFLICT");return freeze(value);}catch(error){if(error?.code!=="ENOENT")throw error;}const temporary=`${target}.tmp-${process.pid}-${crypto.randomUUID()}`;try{await writeFile(temporary,serialized,{flag:"wx"});await rename(temporary,target);}finally{await rm(temporary,{force:true}).catch(()=>{});}return freeze(value);}
}

async function validateArtifact(artifact){
 if(!artifact?.path||!validDigest(artifact.digest)||!Number.isFinite(Date.parse(artifact.observedAt)))throw stageError("NEWEGG_SOURCE_ARTIFACT_INVALID");
 const file=path.resolve(artifact.path),info=await stat(file),actual=await shaFile(file);if(!info.isFile()||actual!==artifact.digest.toLowerCase())throw stageError("NEWEGG_SOURCE_DIGEST_CONFLICT");
 const validation=await validateRakutenProductCatalogGzip(createReadStream(file),{feedProfile:"MAIN_FULL",feedFamilyKey:"RAKUTEN_MAIN:44583:4746097",collectRecords:false,diagnosticInputFactory:()=>createReadStream(file)});
 if(validation.summary.header?.feedTimestamp!==new Date(artifact.observedAt).toISOString()||validation.summary.products!==validation.summary.trailer?.actualProductCount)throw stageError("NEWEGG_SOURCE_VALIDATION_CONFLICT");
 return{file,info,validation};
}

export function createRakutenAcquisitionStageOwner({transport,receipts,acquisitionAuthorityOwner=null}={}){
 if(!transport?.downloadFullAndValidate||!receipts?.read||!receipts?.write)throw new TypeError("NEWEGG_ACQUISITION_OWNER_DEPENDENCY_REQUIRED");
 const resolve=async context=>{const lineage=context.input.lineage,prior=await receipts.read("ACQUISITION",lineage.artifactDigest);if(!prior)return{state:"NOT_COMPLETED"};try{await validateArtifact(prior.outputArtifact);return{state:"COMPLETED",receipt:prior};}catch{return{state:"CONFLICT"};}};
 return{mutating:true,authorityOwner:{validate:async input=>input.context.mode!=="PRODUCTION"||typeof acquisitionAuthorityOwner?.validate==="function"&&await acquisitionAuthorityOwner.validate(input)===true},receiptOwner:{resolve},executionOwner:{execute:async context=>{let artifact;if(context.mode==="PRODUCTION"){const result=await transport.downloadFullAndValidate();artifact={path:result.localPath,digest:result.sha256,observedAt:result.headerTimestamp,bytes:result.localBytes,productRows:result.productRows,trailerCount:result.trailerRows,filename:result.selected.filename};}else artifact=context.input.retainedArtifact;await validateArtifact(artifact);const receipt={schemaVersion:"1.0",stage:"ACQUISITION",status:context.mode==="PRODUCTION"?"ACQUIRED":"RETAINED_EVIDENCE",artifactDigest:artifact.digest.toLowerCase(),sourceObservedAt:new Date(artifact.observedAt).toISOString(),canonicalReceiptReference:`rakuten-full:${artifact.digest.toLowerCase()}`,outputArtifact:{...artifact,path:path.resolve(artifact.path),digest:artifact.digest.toLowerCase(),observedAt:new Date(artifact.observedAt).toISOString()},failureClassification:null,replay:false};await receipts.write(receipt);return{status:"COMPLETED",providerCalls:context.mode==="PRODUCTION"?1:0,receipt};}}};
}

export function createRakutenValidationStageOwner({receipts}={}){
 const resolve=async context=>{const prior=await receipts.read("VALIDATION",context.input.lineage.artifactDigest);if(!prior)return{state:"NOT_COMPLETED"};try{await validateArtifact(context.input.retainedArtifact??context.priorResults?.ACQUISITION?.canonicalReceipt?.outputArtifact);return{state:"COMPLETED",receipt:prior};}catch{return{state:"CONFLICT"};}};
 return{mutating:false,receiptOwner:{resolve},executionOwner:{execute:async context=>{try{const {validation}=await validateArtifact(context.input.retainedArtifact??context.priorResults.ACQUISITION.canonicalReceipt.outputArtifact),summary=validation.summary,receipt={schemaVersion:"1.0",stage:"VALIDATION",status:"VALIDATED",artifactDigest:context.input.lineage.artifactDigest,sourceObservedAt:context.input.lineage.sourceObservedAt,canonicalReceiptReference:`rakuten-validation:${context.input.lineage.artifactDigest}`,outputArtifact:{productRows:summary.products,trailerCount:summary.trailer.actualProductCount,feedFamily:"MAIN_FULL"},failureClassification:null,replay:false};await receipts.write(receipt);return{status:"COMPLETED",receipt};}catch(error){throw stageError("NEWEGG_FEED_INTEGRITY_FAILED",error);}}}};
}

export function createRakutenCatalogStageOwner({projection,receipts}={}){
 const resolve=async context=>{const prior=await receipts.read("CATALOG",context.input.lineage.artifactDigest);if(!prior)return{state:"NOT_COMPLETED"};const current=await projection.getCurrent();return current?.stateId===prior.outputArtifact.stateId&&current?.stateDigest===prior.outputArtifact.stateDigest&&current?.artifact?.digest===context.input.lineage.artifactDigest?{state:"COMPLETED",receipt:prior}:{state:"CONFLICT"};};
 return{mutating:true,authorityRequired:false,receiptOwner:{resolve},executionOwner:{execute:async context=>{const completed=await resolve(context);if(completed.state==="COMPLETED")return{status:"REPLAY",receipt:completed.receipt};if(completed.state==="CONFLICT")throw stageError("NEWEGG_CATALOG_RECEIPT_CONFLICT");const source=context.input.retainedArtifact??context.priorResults.ACQUISITION.canonicalReceipt.outputArtifact,validation=context.priorResults.VALIDATION.canonicalReceipt.outputArtifact,result=await projection.materializeFull({artifactPath:source.path,expected:{feedFamilyKey:"RAKUTEN_MAIN:44583:4746097",filename:"44583_4746097_mp.txt.gz",artifactDigest:source.digest,headerTimestamp:source.observedAt,remoteModifiedAt:null,fileSize:source.bytes,productRows:validation.productRows,trailerCount:validation.trailerCount}}),receipt={schemaVersion:"1.0",stage:"CATALOG",status:result.status,artifactDigest:source.digest,sourceObservedAt:source.observedAt,canonicalReceiptReference:`rakuten-catalog:${result.manifest.stateId}`,outputArtifact:{stateId:result.manifest.stateId,stateDigest:result.manifest.stateDigest,catalogDigest:result.manifest.catalogDigest,recordCount:result.manifest.recordCount},failureClassification:null,replay:result.status==="REPLAY_NO_CHANGE"};await receipts.write(receipt);return{status:result.status==="REPLAY_NO_CHANGE"?"REPLAY":"COMPLETED",receipt};}}};
}

export function bindProductionNeweggRoutineSourceOwners({owners,transport,projection,receiptRoot,acquisitionAuthorityOwner}={}){const receipts=new FileNeweggSourceStageReceiptRepository({root:receiptRoot});return Object.freeze({...owners,ACQUISITION:createRakutenAcquisitionStageOwner({transport,receipts,acquisitionAuthorityOwner}),VALIDATION:createRakutenValidationStageOwner({receipts}),CATALOG:createRakutenCatalogStageOwner({projection,receipts})});}
