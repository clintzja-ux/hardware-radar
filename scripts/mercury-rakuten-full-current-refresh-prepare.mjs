import {createProductionRakutenFullCurrentPreparationService,toRakutenFullCurrentPreparationCliOutput} from "../packages/mercury/current-refresh/index.js";
const args=new Map(process.argv.slice(2).map(value=>{const at=value.indexOf("=");return at<0?[value,true]:[value.slice(0,at),value.slice(at+1)];}));
const result=await createProductionRakutenFullCurrentPreparationService().prepare({stateId:String(args.get("--catalog-state-id")??""),preparedAt:String(args.get("--prepared-at")??"")});
console.log(JSON.stringify(toRakutenFullCurrentPreparationCliOutput(result),null,2));
