function clone(v){return v==null?v:structuredClone(v)}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v}
function money(v){return Math.round((Number(v)+Number.EPSILON)*1e9)/1e9}
export const ACQUISITION_MODES=Object.freeze({PLAN:'PLAN',DRY_RUN:'DRY_RUN',LIVE:'LIVE'});
export function createAcquisitionOperatorModel({mode=ACQUISITION_MODES.PLAN,policy,spentTodayUsd=0,plan=null,runs=[]}={}){
 if(!Object.values(ACQUISITION_MODES).includes(mode))throw new TypeError('invalid acquisition mode.');
 if(!policy)throw new TypeError('policy is required.'); if(!Number.isFinite(spentTodayUsd)||spentTodayUsd<0)throw new TypeError('spentTodayUsd must be non-negative.');
 const decisions=plan?.decisions??[]; const approved=decisions.filter(x=>x.decision==='APPROVED'); const skipped=decisions.filter(x=>x.decision==='SKIPPED');
 const reasons={}; for(const d of skipped)reasons[d.reason]=(reasons[d.reason]??0)+1;
 const actualSpendUsd=money(runs.reduce((s,r)=>s+Number(r.actualSpendUsd??0),0));
 return freeze({schemaVersion:'1.0',mode,paidAcquisitionEnabled:policy.enabled===true,killSwitchEngaged:policy.enabled!==true,automaticPaidRetries:policy.automaticPaidRetries,budget:{dailyLimitUsd:policy.maxSpendPerDayUsd,spentTodayUsd:money(spentTodayUsd),remainingTodayUsd:money(Math.max(0,policy.maxSpendPerDayUsd-spentTodayUsd)),perRunLimitUsd:policy.maxSpendPerRunUsd,maxPaidTasksPerRun:policy.maxPaidTasksPerRun},plan:plan?{planId:plan.planId,plannedAt:plan.plannedAt,candidates:decisions.length,approved:approved.length,skipped:skipped.length,estimatedSpendUsd:plan.estimatedApprovedSpendUsd,skipReasons:reasons,decisions:clone(decisions)}:null,audit:{runCount:runs.length,actualSpendUsd,runs:clone(runs)}});
}
