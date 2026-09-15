import path from "node:path";
import { readFile } from "node:fs/promises";
import { createProductionProductsIdentityDiscoveryService } from "../packages/mercury/bounded/ProductionProductsIdentityDiscovery.js";

const specifications=Object.freeze({
  prepare:{allowed:["--cohort-file","--discovery-cycle"],required:["--cohort-file","--discovery-cycle"]},
  inspect:{allowed:["--discovery-plan-id"],required:["--discovery-plan-id"]},
  authorize:{allowed:["--discovery-plan-id","--operator","--reason","--expires-at","--confirm"],required:["--discovery-plan-id","--operator","--reason","--expires-at","--confirm"]},
  start:{allowed:["--authorization-id","--executed-by","--confirm"],required:["--authorization-id","--executed-by","--confirm"]},
  resume:{allowed:["--run-id","--resumed-by","--confirm"],required:["--run-id","--resumed-by","--confirm"]},
  "assess-taskless-disposition":{allowed:["--run-id","--member-key","--as-of"],required:["--run-id","--member-key"]},
  "dispose-taskless":{allowed:["--run-id","--member-key","--operator","--reason","--confirm"],required:["--run-id","--member-key","--operator","--reason","--confirm"]}
});
export function parseIdentityDiscoveryArgs(action,values){const spec=specifications[action];if(!spec)throw new Error("IDENTITY_DISCOVERY_ACTION_INVALID");const args=new Map();for(const entry of values){const index=entry.indexOf("=");if(index<3)throw new Error(`IDENTITY_DISCOVERY_ARGUMENT_INVALID:${entry}`);const key=entry.slice(0,index),value=entry.slice(index+1);if(!spec.allowed.includes(key))throw new Error(`IDENTITY_DISCOVERY_ARGUMENT_NOT_ALLOWED:${key}`);if(args.has(key)||!value.trim())throw new Error(`IDENTITY_DISCOVERY_ARGUMENT_INVALID:${key}`);args.set(key,value.trim());}for(const key of spec.required)if(!args.has(key))throw new Error(`IDENTITY_DISCOVERY_ARGUMENT_REQUIRED:${key}`);return args;}
export async function runIdentityDiscoveryCommand(action,values,{runtime,readJson=async file=>JSON.parse(await readFile(file,"utf8"))}={}){const args=parseIdentityDiscoveryArgs(action,values),owner=runtime??createProductionProductsIdentityDiscoveryService(),service=owner.service;let result;
  if(action==="prepare"){const cohort=await readJson(path.resolve(args.get("--cohort-file")));if(!Array.isArray(cohort)||cohort.some(row=>!row||Object.keys(row).some(key=>!["atlasProductId","sourceId"].includes(key))||typeof row.atlasProductId!=="string"||typeof row.sourceId!=="string"))throw new Error("IDENTITY_DISCOVERY_COHORT_INVALID");result=await service.prepare({cycle:args.get("--discovery-cycle"),cohort});}
  else if(action==="inspect")result=await service.inspect({planId:args.get("--discovery-plan-id")});
  else if(action==="authorize")result=await service.authorize({planId:args.get("--discovery-plan-id"),operator:args.get("--operator"),reason:args.get("--reason"),expiresAt:args.get("--expires-at"),confirmation:args.get("--confirm")});
  else if(action==="start")result=await service.start({authorizationId:args.get("--authorization-id"),startedBy:args.get("--executed-by"),confirmation:args.get("--confirm")});
  else if(action==="resume")result=await service.resume({runId:args.get("--run-id"),resumedBy:args.get("--resumed-by"),confirmation:args.get("--confirm")});
  else if(action==="assess-taskless-disposition")result=await owner.assessTasklessDisposition({runId:args.get("--run-id"),memberKey:args.get("--member-key"),...(args.has("--as-of")?{asOf:args.get("--as-of")}:{})});
  else result=await owner.disposeTasklessChild({runId:args.get("--run-id"),memberKey:args.get("--member-key"),operator:args.get("--operator"),reason:args.get("--reason"),confirmation:args.get("--confirm")});
  return result;
}
export async function mainIdentityDiscoveryCommand(action,values=process.argv.slice(2)){const result=await runIdentityDiscoveryCommand(action,values);process.stdout.write(`${JSON.stringify(result,null,2)}\n`);}
