import path from "node:path";
import { FileProductInfoResultRepository, renderProductInfoResultOutcome } from "../packages/mercury/index.js";
const args=new Map(process.argv.slice(2).map(value=>{const index=value.indexOf("=");return index<0?[value,true]:[value.slice(0,index),value.slice(index+1)];})),taskId=args.get("--task-id");if(typeof taskId!=="string"||!taskId.trim())throw new Error("PRODUCT_INFO_TASK_ID_REQUIRED");
const repository=new FileProductInfoResultRepository({statePath:path.resolve(String(args.get("--result-state")||".forge-review/acquisition/product-info-results.json"))}),result=await repository.getByTaskId(taskId.trim());if(!result)throw new Error("PRODUCT_INFO_RESULT_NOT_FOUND");
process.stdout.write(renderProductInfoResultOutcome({status:"DUPLICATE",result,sellersReadiness:result.sellersReadiness}));
