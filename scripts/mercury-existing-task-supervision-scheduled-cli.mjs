import path from "node:path";
import {readFile} from "node:fs/promises";
import {createProductionProductsIdentityDiscoveryService} from "../packages/mercury/bounded/ProductionProductsIdentityDiscovery.js";
import {ExistingTaskSupervisionScheduler,FileExistingTaskSupervisionSchedulerReceiptRepository} from "../packages/mercury/bounded/ExistingTaskSupervisionScheduler.js";

export async function runScheduledExistingTaskSupervision({values=process.argv.slice(2),runtimeFactory=createProductionProductsIdentityDiscoveryService,write=console.log}={}){
 const policy=JSON.parse(await readFile(new URL("../packages/mercury/bounded/policies/existing-task-supervision-scheduler.json",import.meta.url),"utf8"));
 const option=values.find(value=>value.startsWith("--max-checks=")),maxChecks=option?Number(option.split("=")[1]):policy.maximumChecksPerInvocation;
 if(!Number.isInteger(maxChecks)||maxChecks<1||maxChecks>policy.maximumChecksPerInvocation)throw new Error("EXISTING_TASK_SUPERVISION_SCHEDULER_BOUND_INVALID");
 const runtime=runtimeFactory(),repository=runtime.repositories.boundedRepository,receiptRepository=new FileExistingTaskSupervisionSchedulerReceiptRepository({statePath:path.resolve(".forge-review/mercury/existing-task-supervision/scheduler-health.json")});
 try{const scheduler=new ExistingTaskSupervisionScheduler({repository,superviseRun:input=>runtime.superviseExistingTasks(input),receiptRepository,maximumChecksPerInvocation:policy.maximumChecksPerInvocation});const result=await scheduler.run({maxChecks,scheduled:true});write(JSON.stringify(result,null,2));return result;}finally{repository.close?.();}
}
