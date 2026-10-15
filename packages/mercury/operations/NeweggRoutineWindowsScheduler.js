import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdir,readFile,rename,rm,writeFile} from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const runFile=promisify(execFile),freeze=value=>Object.freeze(structuredClone(value));
export const NEWEGG_ROUTINE_WINDOWS_TASK_NAME="HardwareRadar-Newegg-Routine";
export const NEWEGG_ROUTINE_SCHEDULER_POLICY=Object.freeze({timeZone:"America/Jamaica",scheduledStart:"16:30",windowStart:"16:00",lateStartCutoff:"23:45",automaticRetries:0,startWhenAvailable:false,multipleInstances:"IGNORE_NEW",automaticDeletion:false});
const minutes=value=>{const [hour,minute]=value.split(":").map(Number);return hour*60+minute;};
const jamaica=value=>{const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Jamaica",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(value)).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));return{day:`${parts.year}-${parts.month}-${parts.day}`,minutes:Number(parts.hour)*60+Number(parts.minute)};};

export class FileNeweggRoutineSchedulerHealthRepository{
 constructor({statePath}={}){if(!statePath)throw new TypeError("NEWEGG_ROUTINE_SCHEDULER_HEALTH_PATH_REQUIRED");this.statePath=path.resolve(statePath);}
 async read(){try{return JSON.parse(await readFile(this.statePath,"utf8"));}catch(error){if(error?.code==="ENOENT")return null;throw error;}}
 async record(value){await mkdir(path.dirname(this.statePath),{recursive:true});const temporary=`${this.statePath}.${crypto.randomUUID()}.tmp`;try{await writeFile(temporary,`${JSON.stringify(value,null,2)}\n`,{encoding:"utf8",flag:"wx"});await rename(temporary,this.statePath);}finally{await rm(temporary,{force:true});}return freeze(value);}
}

export async function executeScheduledNeweggRoutine({authorityService,command,healthRepository,now=()=>new Date().toISOString()}={}){
 if(!authorityService?.list||!command?.execute||!healthRepository?.record||!healthRepository?.read)throw new TypeError("NEWEGG_ROUTINE_SCHEDULER_OWNERS_REQUIRED");
 const startedAt=now(),local=jamaica(startedAt),base={schemaVersion:"1.0",projectionType:"NEWEGG_ROUTINE_WINDOWS_SCHEDULER_HEALTH",taskName:NEWEGG_ROUTINE_WINDOWS_TASK_NAME,attemptedAt:startedAt,localDay:local.day,timeZone:NEWEGG_ROUTINE_SCHEDULER_POLICY.timeZone,automaticRetries:0,providerCallsBeforeCommand:0,authorityConsumedBeforeCommand:false};
 const prior=await healthRepository.read();if(prior?.localDay===local.day)return freeze({...base,status:"ALREADY_EVALUATED_TODAY",startMode:"NO_OP",routineInvoked:false,priorAttemptedAt:prior.attemptedAt??null,nextAction:"INSPECT_EXISTING_DAILY_RESULT"});
 if(local.minutes<minutes(NEWEGG_ROUTINE_SCHEDULER_POLICY.scheduledStart))return freeze({...base,status:"WAITING_FOR_NORMAL_TRIGGER",startMode:"STARTUP_SIGN_IN_EVALUATION",routineInvoked:false,nextAction:"WAIT_FOR_NORMAL_DAILY_TRIGGER"});
 if(local.minutes>=minutes(NEWEGG_ROUTINE_SCHEDULER_POLICY.lateStartCutoff))return healthRepository.record({...base,status:"MISSED_OUTSIDE_OPERATING_WINDOW",startMode:"STARTUP_SIGN_IN_EVALUATION",routineInvoked:false,nextAction:"WAIT_FOR_NEXT_DAILY_TRIGGER"});
 const startMode=local.minutes===minutes(NEWEGG_ROUTINE_SCHEDULER_POLICY.scheduledStart)?"NORMAL_SCHEDULED_START":"SAME_DAY_LATE_START",attempt={...base,startMode};
 const enabled=(await authorityService.list()).filter(value=>value.status==="ENABLED");
 if(enabled.length!==1)return healthRepository.record({...attempt,status:enabled.length?"AUTHORITY_CONFLICT":"AUTHORITY_REQUIRED",routineInvoked:false,nextAction:"REVIEW_MANDATE_IN_FORGE"});
 try{await authorityService.inspect({mandateId:enabled[0].mandateId,at:startedAt});const result=await command.execute({mode:"RUN_LIVE",mandateId:enabled[0].mandateId});return healthRepository.record({...attempt,status:"COMPLETED",routineInvoked:true,completedAt:now(),routineStatus:result?.status??"COMPLETED",nextAction:"INSPECT_ROUTINE_HEALTH"});}
 catch(error){const failure=error?.code??error?.message??"NEWEGG_ROUTINE_SCHEDULED_FAILURE",status=/OVERLAP|ACTIVE_RUN/.test(failure)?"DEFERRED_OVERLAP":/EXPIRED|PAUSED|REVOKED|AUTHORITY|MANDATE|WINDOW|DAILY_LIMIT/.test(failure)?"AUTHORITY_BLOCKED":/STORAGE/.test(failure)?"STORAGE_HOLD":"FAILED_REVIEW_REQUIRED";await healthRepository.record({...attempt,status,routineInvoked:!/[AUTHORITY|MANDATE|WINDOW]/.test(failure),completedAt:now(),failure,nextAction:"STOP_AND_REVIEW"});throw Object.assign(new Error(failure),{code:failure,schedulerStatus:status});}
}

export async function inspectNeweggRoutineWindowsTask({root=process.cwd(),runner=runFile,platform=process.platform}={}){
 if(platform!=="win32")return freeze({installed:false,enabled:false,liveObserved:false,status:"WINDOWS_REQUIRED"});
 try{const script=path.join(path.resolve(root),"scripts/windows/get-newegg-routine-task.ps1"),result=await runner("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",script],{cwd:path.resolve(root),windowsHide:true,maxBuffer:1024*1024}),value=JSON.parse(result.stdout);return freeze({...value,liveObserved:true});}
 catch(error){return freeze({installed:false,enabled:false,liveObserved:true,status:"INSPECTION_FAILED",failure:"NEWEGG_ROUTINE_TASK_INSPECTION_FAILED"});}
}
