import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ProductRepository } from '../packages/atlas/ProductRepository.js';
import {
  buildOperationalAcquisitionCandidates, createAcquisitionBudgetPolicy, createAcquisitionOperatorModel,
  createScheduledDryRunConfig, FileScheduledDryRunAuditRepository, ScheduledDryRunRunner,
  FileSingleWriterRunLock, FileObservationAcceptanceRepository, FileDataForSeoMarketEvidenceRepository
} from '../packages/mercury/index.js';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/,'$1')),'..');
const stateRoot=path.resolve(root,'.forge-review','acquisition');
const readJsonFile=async resource=>JSON.parse(await readFile(resource,'utf8'));
const productRepository=new ProductRepository({readJson:readJsonFile});
const operationalAtlas={products:productRepository};
const auditPath=path.join(stateRoot,'scheduled-dry-runs.json');
const operatorPath=path.join(stateRoot,'operator-latest.json');
const lockPath=path.join(stateRoot,'mercury-acquisition.lock');
const evidencePath=process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE?path.resolve(process.env.HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE):null;
const acceptancePath=process.env.HARDWARE_RADAR_ACCEPTANCE_STATE?path.resolve(process.env.HARDWARE_RADAR_ACCEPTANCE_STATE):null;
const timeZone=process.env.HARDWARE_RADAR_ACQUISITION_TIME_ZONE||'America/Jamaica';
const intervalMinutes=Number(process.env.HARDWARE_RADAR_ACQUISITION_INTERVAL_MINUTES||360);

async function jsonOr(pathname,fallback){try{return JSON.parse(await readFile(pathname,'utf8'))}catch(e){if(e?.code==='ENOENT')return fallback;throw e}}
const acceptanceRepository=acceptancePath?new FileObservationAcceptanceRepository({statePath:acceptancePath,environment:'production'}):null;
const evidenceRepository=evidencePath?new FileDataForSeoMarketEvidenceRepository({statePath:evidencePath}):null;
const candidates=await buildOperationalAcquisitionCandidates({atlas:operationalAtlas,acceptanceRepository,evidenceRepository});
const executionLedger=await jsonOr(path.join(stateRoot,'execution-ledger.json'),{runs:[]});
const today=new Date().toISOString().slice(0,10);
const spentTodayUsd=(executionLedger.runs??[]).filter(r=>String(r.startedAt??'').slice(0,10)===today).reduce((s,r)=>s+Number(r.actualSpendUsd??0),0);
const policy=createAcquisitionBudgetPolicy({enabled:true,maxPaidTasksPerRun:1,maxSpendPerRunUsd:.001,maxSpendPerDayUsd:.01,automaticPaidRetries:0,defaultRefreshCooldownMs:6*60*60*1000});
const config=createScheduledDryRunConfig({timeZone,intervalMinutes});
const auditRepository=new FileScheduledDryRunAuditRepository({filePath:auditPath});
const lock=new FileSingleWriterRunLock({lockPath});
const runner=new ScheduledDryRunRunner({lock,auditRepository,config});
const result=await runner.run({candidates,policy,spentTodayUsd});
const audit=await auditRepository.read();
const latestRun=result.status==='COMPLETED'?result:audit.runs.at(-1)??null;
const plan=latestRun?.plan??null;
const operator=createAcquisitionOperatorModel({mode:'DRY_RUN',policy,spentTodayUsd,plan,runs:audit.runs.map(r=>r.simulation).filter(Boolean)});
await mkdir(stateRoot,{recursive:true});await writeFile(operatorPath,`${JSON.stringify(operator,null,2)}\n`,'utf8');
console.log('MERCURY SCHEDULED DRY RUN');
console.log('Mode:               DRY_RUN');
console.log('Paid transport:     UNREACHABLE');
console.log('Actual spend:       $0.000');
console.log('Candidates:         ',candidates.length);
console.log('Approved:           ',plan?.approvedTaskCount??0);
console.log('Skipped:            ',plan?.decisions?.filter(x=>x.decision==='SKIPPED').length??0);
console.log('Estimated live cost:',`$${Number(plan?.estimatedApprovedSpendUsd??0).toFixed(3)}`);
console.log('Run outcome:        ',result.status);
console.log('Audit persisted:    ',result.status==='COMPLETED'?'YES':'NO');
console.log('Operator export:    ',path.relative(root,operatorPath));
