import path from "node:path";
import {executeScheduledNeweggRoutine,FileNeweggRoutineSchedulerHealthRepository,FileNeweggRoutineRecurringAuthorityRepository,NeweggRoutineRecurringAuthorityService,ProductionNeweggRoutineOperatorCommand} from "../packages/mercury/operations/index.js";
import {classifyIntegratedPublicationOutcome,createNeweggRoutinePublicationExecution} from "./lib/newegg-routine-publication-handoff.mjs";
import {finalizeScheduledProcess} from "./lib/scheduled-process-lifecycle.mjs";

const argument=name=>{const prefix=`--${name}=`;return process.argv.slice(2).find(value=>value.startsWith(prefix))?.slice(prefix.length)??null;};
const operationalRoot=path.resolve(argument("operational-root")??process.cwd()),runtimeRoot=path.resolve(argument("runtime-root")??path.join(import.meta.dirname,".."));
if(process.argv.includes("--validate-only")){console.log(JSON.stringify({status:"READY",runtimeRoot,operationalRoot,providerCalls:0,canonicalMutation:false}));process.exit(0);}
const root=operationalRoot,stateRoot=path.join(root,".forge-review/mercury/newegg-routine"),authorityService=new NeweggRoutineRecurringAuthorityService({repository:new FileNeweggRoutineRecurringAuthorityRepository({statePath:path.join(stateRoot,"recurring-authority.json")})}),command=new ProductionNeweggRoutineOperatorCommand({root,runtimeRoot}),healthRepository=new FileNeweggRoutineSchedulerHealthRepository({statePath:path.join(stateRoot,"scheduler-health.json")});
let exitCode=0,terminalOutput;
try{const result=await executeScheduledNeweggRoutine({authorityService,command,healthRepository}),routineResult={outcome:result.routineStatus,runId:result.routineRunId},publication=result.routineInvoked?await createNeweggRoutinePublicationExecution({runtimeRoot,operationalRoot:root}).execute({routineResult}):null;terminalOutput=JSON.stringify(publication?{...result,status:classifyIntegratedPublicationOutcome({routineResult,publication}),publication}:result,null,2);}catch(error){exitCode=2;terminalOutput=JSON.stringify({status:error.operatorOutcome??error.schedulerStatus??"FAILED_REVIEW_REQUIRED",failure:error.code??error.message,automaticRetries:0,nextAction:"STOP_AND_REVIEW"},null,2);}
await finalizeScheduledProcess({exitCode,terminalOutput});
