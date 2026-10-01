import crypto from "node:crypto";

export const historicalFactReplayAuthorizationConfirmation = planId => `AUTHORIZE-HISTORICAL-FACT-REPLAY-${planId}`;
export const historicalFactReplayExecutionConfirmation = authorizationId => `EXECUTE-HISTORICAL-FACT-REPLAY-${authorizationId}`;
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const hash=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const text=(value,code)=>{if(typeof value!=="string"||!value.trim())throw new TypeError(code);return value.trim();};
const time=(value,code)=>{const result=text(value,code);if(!Number.isFinite(Date.parse(result)))throw new TypeError(code);return result;};
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};

export function createHistoricalFactReplayAuthorization({plan,operator,reason,preparedAt,expiresAt}={}){
  if(plan?.authority?.executionAuthorized!==false||plan?.counts?.newFacts<1)throw new Error("HISTORICAL_FACT_REPLAY_PLAN_NOT_AUTHORIZABLE");
  const material={schemaVersion:"1.0",authorizationType:"HISTORICAL_FACT_REPLAY",policyVersion:"MERCURY-HISTORY-058-REPLAY-EXECUTION-1.0",replayPlanId:text(plan.replayPlanId,"HISTORICAL_FACT_REPLAY_PLAN_ID_REQUIRED"),planBindingDigest:text(plan.bindingDigest,"HISTORICAL_FACT_REPLAY_PLAN_BINDING_REQUIRED"),factPolicyVersion:text(plan.factPolicyVersion,"HISTORICAL_FACT_REPLAY_FACT_POLICY_REQUIRED"),candidateCount:plan.counts.newFacts,operator:text(operator,"HISTORICAL_FACT_REPLAY_OPERATOR_REQUIRED"),reason:text(reason,"HISTORICAL_FACT_REPLAY_REASON_REQUIRED"),preparedAt:time(preparedAt,"HISTORICAL_FACT_REPLAY_AUTHORIZATION_TIME_INVALID"),expiresAt:time(expiresAt,"HISTORICAL_FACT_REPLAY_AUTHORIZATION_EXPIRY_INVALID"),scope:{historicalFactAdmissionOnly:true,providerCalls:0,paidTasks:0,providerSpendUsd:0,currentPriceEligible:false,cheapestEligible:false,pickEligible:false,publicationEligible:false}};
  if(Date.parse(material.expiresAt)<=Date.parse(material.preparedAt))throw new Error("HISTORICAL_FACT_REPLAY_AUTHORIZATION_EXPIRY_INVALID");
  const digest=hash(material);return freeze({...material,authorizationId:`mer_histfactauth_${digest.slice(0,24)}`,authorizationDigest:digest});
}

export function validateHistoricalFactReplayAuthorization(value){
  try{const {authorizationId,authorizationDigest,...material}=value??{},digest=hash(material),validTimes=Number.isFinite(Date.parse(value?.preparedAt))&&Number.isFinite(Date.parse(value?.expiresAt))&&Date.parse(value.expiresAt)>Date.parse(value.preparedAt);return freeze({valid:value?.schemaVersion==="1.0"&&value?.authorizationType==="HISTORICAL_FACT_REPLAY"&&value?.policyVersion==="MERCURY-HISTORY-058-REPLAY-EXECUTION-1.0"&&[value?.replayPlanId,value?.planBindingDigest,value?.factPolicyVersion,value?.operator,value?.reason].every(item=>typeof item==="string"&&item.trim())&&validTimes&&value?.scope?.historicalFactAdmissionOnly===true&&value?.scope?.providerCalls===0&&value?.scope?.paidTasks===0&&value?.scope?.providerSpendUsd===0&&value?.scope?.currentPriceEligible===false&&value?.scope?.cheapestEligible===false&&value?.scope?.pickEligible===false&&value?.scope?.publicationEligible===false&&Number.isInteger(value?.candidateCount)&&value.candidateCount>0&&authorizationDigest===digest&&authorizationId===`mer_histfactauth_${digest.slice(0,24)}`});}catch{return freeze({valid:false});}
}

export function assertHistoricalFactReplayAuthorization({authorization,plan,now}={}){
  if(!validateHistoricalFactReplayAuthorization(authorization).valid)throw new Error("HISTORICAL_FACT_REPLAY_AUTHORIZATION_INVALID");
  if(authorization.replayPlanId!==plan?.replayPlanId||authorization.planBindingDigest!==plan?.bindingDigest||authorization.factPolicyVersion!==plan?.factPolicyVersion||authorization.candidateCount!==plan?.counts?.newFacts)throw new Error("HISTORICAL_FACT_REPLAY_AUTHORIZATION_BINDING_MISMATCH");
  if(Date.parse(now)>Date.parse(authorization.expiresAt))throw new Error("HISTORICAL_FACT_REPLAY_AUTHORIZATION_EXPIRED");
  return true;
}
