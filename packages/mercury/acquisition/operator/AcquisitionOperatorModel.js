function clone(v){return v==null?v:structuredClone(v)}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v}
function money(v){return Math.round((Number(v)+Number.EPSILON)*1e9)/1e9}
export const ACQUISITION_MODES=Object.freeze({PLAN:'PLAN',DRY_RUN:'DRY_RUN',LIVE:'LIVE'});
export function createAcquisitionOperatorModel({mode=ACQUISITION_MODES.PLAN,policy,spentTodayUsd=0,plan=null,runs=[],paidTransportReachable=false,liveAuthorizationStatus=null}={}){
 if(!Object.values(ACQUISITION_MODES).includes(mode))throw new TypeError('invalid acquisition mode.');
 if(!policy)throw new TypeError('policy is required.'); if(!Number.isFinite(spentTodayUsd)||spentTodayUsd<0)throw new TypeError('spentTodayUsd must be non-negative.');
 if(typeof paidTransportReachable!=='boolean')throw new TypeError('paidTransportReachable must be boolean.');
 if(mode!==ACQUISITION_MODES.LIVE&&paidTransportReachable)throw new Error('PAID_TRANSPORT_NOT_ALLOWED_OUTSIDE_LIVE_MODE');
 const decisions=plan?.decisions??[]; const approved=decisions.filter(x=>x.decision==='APPROVED'); const skipped=decisions.filter(x=>x.decision==='SKIPPED');
 const reasons={}; for(const d of skipped)reasons[d.reason]=(reasons[d.reason]??0)+1;
 const actualSpendUsd=money(runs.reduce((s,r)=>s+Number(r.actualSpendUsd??0),0));
 const paidAcquisitionPolicyEnabled=policy.enabled===true;
 const killSwitchEngaged=!paidAcquisitionPolicyEnabled;
 const authorizationState=mode!==ACQUISITION_MODES.LIVE?'NOT_APPLICABLE':killSwitchEngaged?'LIVE_BLOCKED_KILL_SWITCH':(liveAuthorizationStatus??'LIVE_NOT_AUTHORIZED');
 const paidExecutionPossible=mode===ACQUISITION_MODES.LIVE&&paidAcquisitionPolicyEnabled&&paidTransportReachable&&!killSwitchEngaged&&authorizationState==='LIVE_AUTHORIZED';
 return freeze({schemaVersion:'1.0',mode,authorizationState,paidAcquisitionPolicyEnabled,paidTransportReachable,paidExecutionPossible,killSwitchEngaged,automaticPaidRetries:policy.automaticPaidRetries,budget:{dailyLimitUsd:policy.maxSpendPerDayUsd,spentTodayUsd:money(spentTodayUsd),remainingTodayUsd:money(Math.max(0,policy.maxSpendPerDayUsd-spentTodayUsd)),perRunLimitUsd:policy.maxSpendPerRunUsd,maxPaidTasksPerRun:policy.maxPaidTasksPerRun},plan:plan?{planId:plan.planId,plannedAt:plan.plannedAt,candidates:decisions.length,approved:approved.length,skipped:skipped.length,estimatedSpendUsd:plan.estimatedApprovedSpendUsd,skipReasons:reasons,decisions:clone(decisions)}:null,audit:{runCount:runs.length,actualSpendUsd,runs:clone(runs)}});
}
