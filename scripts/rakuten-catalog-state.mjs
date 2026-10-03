import path from "node:path";
import { stat } from "node:fs/promises";
import { RakutenDiskBoundedCatalogStateProjection } from "../packages/mercury/current-display/index.js";

const entries=process.argv.slice(2).map(value=>{const [name,...rest]=value.replace(/^--/,"").split("=");return [name,rest.join("=")||true];});
const args=Object.fromEntries(entries);
const operation=String(args.operation??"");
const stateRoot=path.resolve(String(args["state-root"]??".forge-review/rakuten-sftp/catalog-state"));
const projection=new RakutenDiskBoundedCatalogStateProjection({stateRoot});
let peakRss=process.memoryUsage().rss,peakHeapUsed=process.memoryUsage().heapUsed;
const sampler=setInterval(()=>{const memory=process.memoryUsage();peakRss=Math.max(peakRss,memory.rss);peakHeapUsed=Math.max(peakHeapUsed,memory.heapUsed);},25);
const started=performance.now();
let result;
try{
  if(operation==="materialize-full"){
    const artifactPath=path.resolve(String(args.artifact??""));
    result=await projection.materializeFull({artifactPath,expected:{feedFamilyKey:"RAKUTEN_MAIN:44583:4746097",filename:"44583_4746097_mp.txt.gz",artifactDigest:String(args.digest??"").toLowerCase(),headerTimestamp:String(args.header??""),remoteModifiedAt:args["remote-mtime"]===undefined?null:String(args["remote-mtime"]),fileSize:Number(args.bytes),productRows:Number(args.rows),trailerCount:Number(args.rows)}});
  }else if(operation==="apply-delta"){
    result=await projection.applyDelta({parentStateId:String(args.parent??""),artifactPath:path.resolve(String(args.artifact??"")),artifactDigest:String(args.digest??"").toLowerCase(),headerTimestamp:String(args.header??""),remoteModifiedAt:args["remote-mtime"]===undefined?null:String(args["remote-mtime"]),feedFamilyKey:"RAKUTEN_MAIN:44583:4746097"});
  }else if(operation==="inspect"){
    result={current:await projection.getCurrent(),readiness:await projection.assessBaselineReadiness({feedFamilyKey:"RAKUTEN_MAIN:44583:4746097"})};
  }else if(operation==="extract"){
    const skus=process.argv.filter(value=>value.startsWith("--sku=")).map(value=>value.slice(6));
    result={stateId:String(args.state??""),entries:await projection.extractBySkus({stateId:String(args.state??""),skus})};
  }else throw new Error("RAKUTEN_CATALOG_STATE_OPERATION_INVALID");
}finally{clearInterval(sampler);const memory=process.memoryUsage();peakRss=Math.max(peakRss,memory.rss);peakHeapUsed=Math.max(peakHeapUsed,memory.heapUsed);}
const stateFile=result?.statePath?await stat(result.statePath):null;
console.log(JSON.stringify({operation,status:result?.status??"INSPECTED",result:{...result,statePath:result?.statePath?path.relative(process.cwd(),result.statePath):undefined},performance:{durationMs:Math.round(performance.now()-started),peakRssBytes:peakRss,peakHeapUsedBytes:peakHeapUsed,stateBytes:stateFile?.size??null}},null,2));
