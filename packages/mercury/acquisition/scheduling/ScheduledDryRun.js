import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import crypto from 'node:crypto';
import { createAcquisitionPlan } from '../planning/AcquisitionPlan.js';
import { DryRunAcquisitionExecutor } from '../operator/DryRunAcquisitionExecutor.js';
import { SINGLE_WRITER_LOCK_STATUSES } from '../../runtime/FileSingleWriterRunLock.js';

function validIso(v){return typeof v==='string'&&Number.isFinite(Date.parse(v))}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v}
function clone(v){return v==null?v:structuredClone(v)}
export function createScheduledDryRunConfig({timeZone='UTC',intervalMinutes=60}={}){
 try{new Intl.DateTimeFormat('en-US',{timeZone}).format(new Date())}catch{throw new TypeError('timeZone must be a valid IANA time zone.')}
 if(!Number.isInteger(intervalMinutes)||intervalMinutes<60)throw new TypeError('intervalMinutes must be an integer of at least 60.');
 return freeze({schemaVersion:'1.0',mode:'DRY_RUN',timeZone,intervalMinutes,paidTransportReachable:false});
}
export function isScheduledDryRunDue({lastRunAt=null,now,config}){
 if(!config||config.mode!=='DRY_RUN'||config.paidTransportReachable!==false)throw new Error('INVALID_SCHEDULED_DRY_RUN_CONFIG');
 if(!validIso(now))throw new TypeError('now must be ISO.');
 if(lastRunAt==null)return true;if(!validIso(lastRunAt))throw new TypeError('lastRunAt must be ISO or null.');
 return Date.parse(now)-Date.parse(lastRunAt)>=config.intervalMinutes*60000;
}
export class FileScheduledDryRunAuditRepository{
 constructor({filePath}={}){if(!filePath)throw new TypeError('filePath is required.');this.filePath=resolve(filePath);this.queue=Promise.resolve()}
 async read(){try{return JSON.parse(await readFile(this.filePath,'utf8'))}catch(e){if(e?.code==='ENOENT')return {schemaVersion:'1.0',runs:[]};throw e}}
 async append(run){const op=this.queue.then(async()=>{const state=await this.read();if(state.runs.some(x=>x.runId===run.runId))return false;const next={schemaVersion:'1.0',runs:[...state.runs,clone(run)]};await mkdir(dirname(this.filePath),{recursive:true});const tmp=`${this.filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;await writeFile(tmp,`${JSON.stringify(next,null,2)}\n`,'utf8');await rename(tmp,this.filePath);return true});this.queue=op.catch(()=>{});return op}
}
export class ScheduledDryRunRunner{
 constructor({lock,auditRepository,config,now=()=>new Date().toISOString()}={}){if(!lock)throw new TypeError('lock is required.');if(!auditRepository)throw new TypeError('auditRepository is required.');if(!config||config.mode!=='DRY_RUN'||config.paidTransportReachable!==false)throw new Error('SCHEDULED_RUNNER_MUST_BE_STRUCTURALLY_DRY_RUN');this.lock=lock;this.auditRepository=auditRepository;this.config=config;this.now=now;this.executor=new DryRunAcquisitionExecutor({now})}
 async run({candidates=[],policy,spentTodayUsd=0}={}){
  const startedAt=this.now();const prior=await this.auditRepository.read();const last=prior.runs.at(-1)?.startedAt??null;
  if(!isScheduledDryRunDue({lastRunAt:last,now:startedAt,config:this.config}))return freeze({status:'SKIPPED_NOT_DUE',mode:'DRY_RUN',paidCalls:0,actualSpendUsd:0});
  const locked=await this.lock.runExclusive(async()=>{const plan=createAcquisitionPlan({candidates,policy,spentTodayUsd,plannedAt:startedAt});const simulation=await this.executor.execute(plan);const run=freeze({schemaVersion:'1.0',runId:`sched_dry_${crypto.createHash('sha256').update(`${plan.planId}|${startedAt}`).digest('hex').slice(0,24)}`,mode:'DRY_RUN',timeZone:this.config.timeZone,startedAt,finishedAt:this.now(),planId:plan.planId,plan:clone(plan),simulation:clone(simulation),attemptedPaidTasks:0,actualSpendUsd:0});await this.auditRepository.append(run);return run});
  if(locked.status===SINGLE_WRITER_LOCK_STATUSES.SKIPPED_LOCKED)return freeze({status:'SKIPPED_LOCKED',mode:'DRY_RUN',paidCalls:0,actualSpendUsd:0});
  return freeze({status:'COMPLETED',...clone(locked.result)});
 }
}
