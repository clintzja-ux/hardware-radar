const validIso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const money=value=>Math.round((Number(value)+Number.EPSILON)*1e9)/1e9;
export function calculateGovernedSpendForUtcDay(executions,evaluationTime){
 if(!Array.isArray(executions))throw new Error('INVALID_ACQUISITION_EXECUTION_LEDGER');
 if(!validIso(evaluationTime))throw new TypeError('evaluationTime must be ISO.');
 const day=new Date(evaluationTime).toISOString().slice(0,10);let total=0;
 for(const [index,run] of executions.entries()){
  if(!run||typeof run!=='object'||!validIso(run.startedAt)||!Number.isFinite(run.actualSpendUsd)||run.actualSpendUsd<0)throw new Error(`INVALID_ACQUISITION_EXECUTION_RECORD:${index}`);
  if(run.mode==='DRY_RUN')continue;
  if(new Date(run.startedAt).toISOString().slice(0,10)===day)total=money(total+run.actualSpendUsd);
 }
 return total;
}
export async function readGovernedSpendForUtcDay({executionRepository,evaluationTime}={}){
 if(!executionRepository?.getAll)throw new TypeError('executionRepository.getAll is required.');
 return calculateGovernedSpendForUtcDay(await executionRepository.getAll(),evaluationTime);
}
