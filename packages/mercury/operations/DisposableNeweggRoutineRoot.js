import crypto from "node:crypto";
import {cp,mkdir,readFile,realpath,rename,rm,stat,writeFile} from "node:fs/promises";
import path from "node:path";

const freeze=value=>Object.freeze(structuredClone(value));
const shaFile=async file=>{const hash=crypto.createHash("sha256");const bytes=await readFile(file);hash.update(bytes);return hash.digest("hex");};
const inside=(root,target)=>{const relative=path.relative(root,target);return relative!==""&&!relative.startsWith("..")&&!path.isAbsolute(relative);};
const copyFile=async(source,target)=>{await mkdir(path.dirname(target),{recursive:true});await cp(source,target,{force:true});};

export const DISPOSABLE_NEWEGG_ROOT_SCHEMA_VERSION="1.0";

/**
 * Test/certification-only canonical root. It deliberately exposes paths rather
 * than repositories so every production owner is constructed with an explicit
 * disposable dependency. The retained provider artifact is the only external
 * path and is read-only evidence, never a writer target.
 */
export class DisposableNeweggRoutineRoot{
 constructor({root,sourceRoot=process.cwd()}={}){
  if(!root)throw new TypeError("DISPOSABLE_NEWEGG_ROOT_REQUIRED");
  this.root=path.resolve(root);this.sourceRoot=path.resolve(sourceRoot);
  if(this.root===this.sourceRoot||inside(this.root,this.sourceRoot)||inside(this.sourceRoot,this.root))throw new Error("DISPOSABLE_NEWEGG_ROOT_MUST_BE_ISOLATED");
  this.paths=Object.freeze({
   atlasRoot:path.join(this.root,"packages/atlas"),
   destinationPath:path.join(this.root,"packages/mercury/destinations/production-destinations.json"),
   stateRoot:path.join(this.root,".forge-review"),
   currentPath:path.join(this.root,".forge-review/retail-display/current-display-snapshots.json"),
   workbookPath:path.join(this.root,".forge-review/retail-display/hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx"),
   historyPath:path.join(this.root,".forge-review/mercury/historical-observations.json"),
   reassessmentPath:path.join(this.root,".forge-review/mercury/historical-comparability-reassessments.json"),
   catalogRoot:path.join(this.root,".forge-review/rakuten-sftp/catalog-state"),
   sourceReceiptRoot:path.join(this.root,".forge-review/mercury/newegg-routine/source-receipts"),
   assessmentReceiptRoot:path.join(this.root,".forge-review/mercury/newegg-routine/assessment-receipts"),
   downstreamReceiptRoot:path.join(this.root,".forge-review/mercury/newegg-routine/downstream-receipts"),
   currentPreparationRoot:path.join(this.root,".forge-review/mercury/rakuten-full-current-refresh"),
   historyPreparationRoot:path.join(this.root,".forge-review/mercury/newegg-routine/history"),
   qaRoot:path.join(this.root,".forge-review/mercury/rakuten-full-current-refresh/qa"),
   portfolioRoot:path.join(this.root,".forge-review/publication/ram-intelligence"),
   runStatePath:path.join(this.root,".forge-review/mercury/newegg-routine/runs.json"),
   healthPath:path.join(this.root,".forge-review/forge/newegg-routine-health.json"),
   transportPath:path.join(this.root,".forge-review/forge/newegg-routine-private-envelope.json"),
   retentionPath:path.join(this.root,".forge-review/mercury/newegg-routine/retention.json")
  });
 }
 assertWritablePath(target){const absolute=path.resolve(target);if(!inside(this.root,absolute))throw new Error(`DISPOSABLE_NEWEGG_PRODUCTION_WRITER_REJECTED:${absolute}`);return absolute;}
 async initialize(){
  await mkdir(this.root,{recursive:true});
  await cp(path.join(this.sourceRoot,"packages/atlas"),this.paths.atlasRoot,{recursive:true,filter:source=>!source.includes(`${path.sep}tests${path.sep}`)});
  await copyFile(path.join(this.sourceRoot,"packages/mercury/destinations/production-destinations.json"),this.paths.destinationPath);
  await copyFile(path.join(this.sourceRoot,".forge-review/retail-display/current-display-snapshots.json"),this.paths.currentPath);
  await copyFile(path.join(this.sourceRoot,".forge-review/retail-display/hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx"),this.paths.workbookPath);
  await copyFile(path.join(this.sourceRoot,".forge-review/mercury/historical-observations.json"),this.paths.historyPath);
  await copyFile(path.join(this.sourceRoot,".forge-review/mercury/historical-comparability-reassessments.json"),this.paths.reassessmentPath);
  for(const target of Object.values(this.paths))if(target!==this.paths.atlasRoot&&path.extname(target)==="")await mkdir(target,{recursive:true});else await mkdir(path.dirname(target),{recursive:true});
  const manifest={schemaVersion:DISPOSABLE_NEWEGG_ROOT_SCHEMA_VERSION,root:this.root,sourceRoot:this.sourceRoot,seedDigests:{atlasManifest:await shaFile(path.join(this.paths.atlasRoot,"atlas-manifest.json")),destinations:await shaFile(this.paths.destinationPath),current:await shaFile(this.paths.currentPath),history:await shaFile(this.paths.historyPath),workbook:await shaFile(this.paths.workbookPath)},productionWritersReachable:false};
  await this.writeJson(path.join(this.root,"disposable-root.json"),manifest);return freeze(manifest);
 }
 async writeJson(target,value){target=this.assertWritablePath(target);await mkdir(path.dirname(target),{recursive:true});const temporary=`${target}.tmp-${process.pid}-${crypto.randomUUID()}`;try{await writeFile(temporary,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});await rename(temporary,target);}finally{await rm(temporary,{force:true}).catch(()=>{});}return freeze(value);}
 async verifyRetainedArtifact({artifactPath,expectedDigest}={}){const resolved=await realpath(path.resolve(artifactPath)),info=await stat(resolved),digest=await shaFile(resolved);if(!info.isFile()||digest!==String(expectedDigest??"").toLowerCase())throw new Error("DISPOSABLE_NEWEGG_RETAINED_FULL_DIGEST_MISMATCH");if(inside(this.root,resolved))throw new Error("DISPOSABLE_NEWEGG_RETAINED_FULL_MUST_BE_IMMUTABLE_EXTERNAL_EVIDENCE");return freeze({path:resolved,digest,bytes:info.size,readOnlyEvidence:true});}
 async seedRetainedCatalog({sourceCatalogRoot,stateId}={}){if(!/^rakuten_catalog_[a-f0-9]{24}$/.test(stateId??""))throw new TypeError("DISPOSABLE_NEWEGG_CATALOG_STATE_ID_INVALID");const source=path.resolve(sourceCatalogRoot),files=["current.json",`${stateId}.sqlite`,`${stateId}.sqlite.manifest.json`];for(const file of files)await copyFile(path.join(source,file),path.join(this.paths.catalogRoot,file));const current=JSON.parse(await readFile(path.join(this.paths.catalogRoot,"current.json"),"utf8"));if(current.stateId!==stateId)throw new Error("DISPOSABLE_NEWEGG_CATALOG_CURRENT_MISMATCH");return freeze({stateId,stateDigest:current.stateDigest,recordCount:current.recordCount,artifact:current.artifact});}
}

export class FileDisposableNeweggValueRepository{
 constructor({root,fileName}={}){if(!root||!fileName)throw new TypeError("DISPOSABLE_NEWEGG_VALUE_REPOSITORY_INVALID");this.root=path.resolve(root);this.path=path.resolve(root,fileName);if(!inside(this.root,this.path))throw new Error("DISPOSABLE_NEWEGG_VALUE_PATH_INVALID");}
 async put(identity,value){value=arguments.length===1?identity:value;if(value===undefined)throw new TypeError("DISPOSABLE_NEWEGG_VALUE_REQUIRED");await mkdir(path.dirname(this.path),{recursive:true});const temporary=`${this.path}.tmp-${process.pid}-${crypto.randomUUID()}`;try{await writeFile(temporary,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});await rename(temporary,this.path);}finally{await rm(temporary,{force:true}).catch(()=>{});}return freeze(value);}
 async get(){try{return freeze(JSON.parse(await readFile(this.path,"utf8")));}catch(error){if(error?.code==="ENOENT")return null;throw error;}}
}
