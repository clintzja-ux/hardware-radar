function clone(v){return v==null?v:structuredClone(v)}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v}
export class DryRunAcquisitionExecutor{
 constructor({now=()=>new Date().toISOString()}={}){this.now=now}
 async execute(plan){
  if(!plan?.planId||!Array.isArray(plan.decisions))throw new Error('INVALID_ACQUISITION_PLAN');
  const tasks=plan.decisions.filter(x=>x.decision==='APPROVED').map(x=>({candidateId:x.candidateId,outcome:'SIMULATED',estimatedCostUsd:x.estimatedCostUsd,actualCostUsd:0,execution:clone(x.execution)}));
  return freeze({schemaVersion:'1.0',mode:'DRY_RUN',planId:plan.planId,simulatedAt:this.now(),plannedTasks:tasks.length,attemptedPaidTasks:0,estimatedSpendUsd:plan.estimatedApprovedSpendUsd,actualSpendUsd:0,tasks});
 }
}
export default DryRunAcquisitionExecutor;
