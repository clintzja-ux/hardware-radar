const freeze=(v)=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const validIso=(v)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const money=(v)=>Math.round((Number(v)+Number.EPSILON)*1e9)/1e9;

export const LIVE_AUTHORIZATION_STATUSES=Object.freeze({
  LIVE_NOT_AUTHORIZED:'LIVE_NOT_AUTHORIZED',
  LIVE_AUTHORIZED:'LIVE_AUTHORIZED',
  LIVE_BLOCKED_KILL_SWITCH:'LIVE_BLOCKED_KILL_SWITCH',
  LIVE_BLOCKED_BUDGET:'LIVE_BLOCKED_BUDGET',
  LIVE_BLOCKED_RETRIES:'LIVE_BLOCKED_RETRIES',
  LIVE_BLOCKED_EXPIRED:'LIVE_BLOCKED_EXPIRED',
  LIVE_BLOCKED_PLAN_MISMATCH:'LIVE_BLOCKED_PLAN_MISMATCH'
});

export function createLiveAcquisitionAuthorization({authorizationId,authorized=false,planId,authorizedAt,expiresAt,maxSpendUsd=.001,maxPaidTasks=1}={}){
  if(typeof authorizationId!=='string'||!authorizationId.trim())throw new TypeError('authorizationId is required.');
  if(authorized!==true)throw new Error('LIVE_AUTHORIZATION_REQUIRES_EXPLICIT_OPT_IN');
  if(typeof planId!=='string'||!planId.trim())throw new TypeError('planId is required.');
  if(!validIso(authorizedAt)||!validIso(expiresAt)||Date.parse(expiresAt)<=Date.parse(authorizedAt))throw new TypeError('authorization timestamps are invalid.');
  if(!Number.isFinite(maxSpendUsd)||maxSpendUsd<0)throw new TypeError('maxSpendUsd must be non-negative.');
  if(!Number.isInteger(maxPaidTasks)||maxPaidTasks<=0)throw new TypeError('maxPaidTasks must be positive.');
  return freeze({schemaVersion:'1.0',authorizationId,authorized:true,mode:'LIVE',planId,authorizedAt,expiresAt,maxSpendUsd:money(maxSpendUsd),maxPaidTasks});
}

export function evaluateLiveAcquisitionAuthorization({plan,authorization=null,now=new Date().toISOString()}={}){
  if(!plan?.planId||!plan?.policy)throw new TypeError('plan is required.');
  if(!validIso(now))throw new TypeError('now must be ISO.');
  const deny=(status,reason)=>freeze({status,authorized:false,reason,authorizationId:authorization?.authorizationId??null,planId:plan.planId});
  if(!plan.policy.enabled)return deny(LIVE_AUTHORIZATION_STATUSES.LIVE_BLOCKED_KILL_SWITCH,'ACQUISITION_POLICY_DISABLED');
  if(plan.policy.automaticPaidRetries!==0)return deny(LIVE_AUTHORIZATION_STATUSES.LIVE_BLOCKED_RETRIES,'PAID_RETRIES_NOT_ALLOWED');
  if(!authorization?.authorized)return deny(LIVE_AUTHORIZATION_STATUSES.LIVE_NOT_AUTHORIZED,'EXPLICIT_LIVE_AUTHORIZATION_REQUIRED');
  if(authorization.mode!=='LIVE'||authorization.planId!==plan.planId)return deny(LIVE_AUTHORIZATION_STATUSES.LIVE_BLOCKED_PLAN_MISMATCH,'AUTHORIZATION_NOT_BOUND_TO_PLAN');
  if(!validIso(authorization.expiresAt)||Date.parse(now)>=Date.parse(authorization.expiresAt))return deny(LIVE_AUTHORIZATION_STATUSES.LIVE_BLOCKED_EXPIRED,'AUTHORIZATION_EXPIRED');
  if(plan.approvedTaskCount>authorization.maxPaidTasks||money(plan.estimatedApprovedSpendUsd)>money(authorization.maxSpendUsd))return deny(LIVE_AUTHORIZATION_STATUSES.LIVE_BLOCKED_BUDGET,'AUTHORIZATION_LIMIT_EXCEEDED');
  if(plan.approvedTaskCount>plan.policy.maxPaidTasksPerRun||money(plan.estimatedApprovedSpendUsd)>money(plan.policy.maxSpendPerRunUsd)||money(plan.spentTodayUsd+plan.estimatedApprovedSpendUsd)>money(plan.policy.maxSpendPerDayUsd))return deny(LIVE_AUTHORIZATION_STATUSES.LIVE_BLOCKED_BUDGET,'POLICY_BUDGET_EXCEEDED');
  return freeze({status:LIVE_AUTHORIZATION_STATUSES.LIVE_AUTHORIZED,authorized:true,reason:null,authorizationId:authorization.authorizationId,planId:plan.planId,expiresAt:authorization.expiresAt,maxSpendUsd:authorization.maxSpendUsd,maxPaidTasks:authorization.maxPaidTasks});
}
