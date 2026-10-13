import crypto from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {createProductionRetainedCommerceHistoryPreparationService,toRetainedCommerceHistoryPreparationCliOutput,retainedCommerceDigest,FileHistoricalObservationRepository,RetainedCommerceHistoryExecutionService} from "../packages/mercury/historical-admission/index.js";
import {defaultSourceRightsRegistry} from "../packages/mercury/rights/SourceRightsRegistry.js";

const args=Object.fromEntries(process.argv.slice(2).map(value=>{const at=value.indexOf("=");return at<0?[value,true]:[value.slice(0,at),value.slice(at+1)];})),action=String(args["--action"]??"");
const root=process.cwd(),artifact=path.resolve(String(args["--artifact"]??".forge-review/rakuten-sftp/staging/44583_4746097_mp.txt.gz")),expectedDigest=String(args["--digest"]??"").toLowerCase(),expectedObservedAt=new Date(String(args["--observed-at"]??"")).toISOString(),historyPath=path.resolve(".forge-review/mercury/historical-observations.json"),outputRoot=path.resolve(".forge-review/mercury/newegg-routine");
const readJson=async file=>JSON.parse(await readFile(file,"utf8")),hashBytes=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const rights=defaultSourceRightsRegistry.require("RAKUTEN_NEWEGG_PRODUCT_CATALOG"),rightsDigest=retainedCommerceDigest(rights);if(rights.retention.historical!=="ALLOWED"||rights.derivation.historicalAnalytics!=="ALLOWED")throw new Error("RETAINED_COMMERCE_HISTORY_RIGHTS_NOT_ALLOWED");
if(action==="prepare"){
 const result=await createProductionRetainedCommerceHistoryPreparationService().prepare({artifactPath:artifact,expectedDigest,expectedObservedAt});console.log(JSON.stringify(toRetainedCommerceHistoryPreparationCliOutput(result),null,2));
}else if(action==="execute"){
 const plan=await readJson(path.join(outputRoot,`${args["--plan-id"]}.json`)),preparation=await readJson(path.join(outputRoot,`${args["--preparation-id"]}.json`)),historyStateReader=async()=>{const bytes=await readFile(historyPath),state=JSON.parse(bytes);return{hash:hashBytes(bytes),sequence:state.sequence,count:Object.keys(state.records).length};},repository=new FileHistoricalObservationRepository({statePath:historyPath}),service=new RetainedCommerceHistoryExecutionService({historicalRepository:repository,historyStateReader});
 const result=await service.execute({plan,preparation,confirmation:String(args["--confirm"]??""),executedBy:String(args["--executed-by"]??"operator:Clinton"),currentRightsProfileDigest:rightsDigest,candidates:plan.candidates});console.log(JSON.stringify(result,null,2));
}else throw new Error("NEWEGG_ROUTINE_HISTORY_ACTION_INVALID");
