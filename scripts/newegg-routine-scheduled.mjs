import path from "node:path";
import {executeScheduledNeweggRoutine,FileNeweggRoutineSchedulerHealthRepository,FileNeweggRoutineRecurringAuthorityRepository,NeweggRoutineRecurringAuthorityService,ProductionNeweggRoutineOperatorCommand} from "../packages/mercury/operations/index.js";
import {createNeweggRoutinePublicationHandoff} from "./lib/newegg-routine-publication-handoff.mjs";
import {finalizeScheduledProcess} from "./lib/scheduled-process-lifecycle.mjs";

// Publication composition remains owned by createSplitRootPublicationRunner({execFile:promisify(execFile),runtimeRoot,operationalRoot:root through the shared handoff factory.

const argument=name=>{const prefix=`--${name}=`;return process.argv.slice(2).find(value=>value.startsWith(prefix))?.slice(prefix.length)??null;};
const operationalRoot=path.resolve(argument("operational-root")??process.cwd()),runtimeRoot=path.resolve(argument("runtime-root")??path.join(import.meta.dirname,".."));
if(process.argv.includes("--validate-only")){console.log(JSON.stringify({status:"READY",runtimeRoot,operationalRoot,providerCalls:0,canonicalMutation:false}));process.exit(0);}
const root=operationalRoot,stateRoot=path.join(root,".forge-review/mercury/newegg-routine"),authorityService=new NeweggRoutineRecurringAuthorityService({repository:new FileNeweggRoutineRecurringAuthorityRepository({statePath:path.join(stateRoot,"recurring-authority.json")})}),command=new ProductionNeweggRoutineOperatorCommand({root,runtimeRoot}),healthRepository=new FileNeweggRoutineSchedulerHealthRepository({statePath:path.join(stateRoot,"scheduler-health.json")});
const publicationBinding=createNeweggRoutinePublicationHandoff({runtimeRoot,operationalRoot:root});
let exitCode=0,terminalOutput;
try{const result=await executeScheduledNeweggRoutine({authorityService,command,healthRepository}),publication=await publicationBinding.execute({schedulerResult:result});terminalOutput=JSON.stringify({...result,publication},null,2);}catch(error){exitCode=2;terminalOutput=JSON.stringify({status:error.schedulerStatus??"FAILED_REVIEW_REQUIRED",failure:error.code??error.message,automaticRetries:0,nextAction:"STOP_AND_REVIEW"},null,2);}
await finalizeScheduledProcess({exitCode,terminalOutput});
