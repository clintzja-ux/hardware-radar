import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {validateOperatorVerifiedLegacyOfferBinding,validateRakutenLegacyOfferRecoveryPlan} from "./RakutenLegacyOfferRecovery.js";
const read=async file=>{try{return JSON.parse(await readFile(file,"utf8"));}catch(error){if(error?.code==="ENOENT")return null;throw error;}};
const record=async(file,value,validator)=>{validator(value);const prior=await read(file);if(prior){if(JSON.stringify(prior)!==JSON.stringify(value))throw new Error("CURRENT_RECOVERY_IMMUTABLE_CONFLICT");return prior;}await mkdir(path.dirname(file),{recursive:true});await writeFile(file,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});return value;};
export class FileRakutenLegacyOfferRecoveryRepository{
  constructor({rootPath=path.resolve(".forge-review/mercury/current-refresh/legacy-offer-recovery")}={}){this.rootPath=path.resolve(rootPath);}
  file(kind,id){return path.join(this.rootPath,kind,`${id}.json`);}
  recordBinding(value){return record(this.file("bindings",value.bindingId),value,validateOperatorVerifiedLegacyOfferBinding);}
  recordPlan(value){return record(this.file("plans",value.planId),value,plan=>validateRakutenLegacyOfferRecoveryPlan(plan));}
  recordPreparation(value){return record(this.file("preparations",value.preparationId),value,prep=>{if(prep?.preparationType!=="RAKUTEN_NEWEGG_CURRENT_RECOVERY_PREPARATION"||prep?.authority!=="NONE"||prep?.currentMutationAuthorized!==false)throw new Error("CURRENT_RECOVERY_PREPARATION_INVALID");});}
  getPlan(id){return read(this.file("plans",id));}
  getPreparation(id){return read(this.file("preparations",id));}
}
