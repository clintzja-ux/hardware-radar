import crypto from "node:crypto";

export const TASKLESS_CHILD_DISPOSITION_POLICY_VERSION="MERCURY-TASKLESS-CHILD-DISPOSITION-1.0";
export const TASKLESS_CHILD_DISPOSITION_STATE="EXPIRED_CONSUMED_WITHOUT_TASK";
export const TASKLESS_CHILD_DISPOSITION_CONFIRMATION="DISPOSE-EXPIRED-CONSUMED-TASKLESS-CHILD";
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));
const required=(value,code)=>{if(typeof value!=="string"||!value.trim())throw new Error(code);return value.trim();};
const exact=(rows,code)=>{if(rows.length>1)throw new Error(code);return rows[0]??null;};

export function validateTasklessChildAuthorityDisposition(value){
  const material={assessmentBindingDigest:value?.assessmentBindingDigest,dispositionState:value?.dispositionState,disposedAt:value?.disposedAt,operator:value?.operator,reason:value?.reason},bindingDigest=digest(material);
  if(value?.schemaVersion!=="1.0"||value?.policyVersion!==TASKLESS_CHILD_DISPOSITION_POLICY_VERSION||value?.state!==TASKLESS_CHILD_DISPOSITION_STATE||value?.dispositionState!==TASKLESS_CHILD_DISPOSITION_STATE||value?.bindingDigest!==bindingDigest||value?.dispositionId!==`mer_tasklessdisp_${bindingDigest.slice(0,24)}`||![value.childAuthorizationId,value.memberKey,value.domainMemberId,value.atlasProductId,value.source,value.operation,value.assessmentBindingDigest].every(item=>typeof item==="string"&&item.length>0)||![value.paidAuthority,value.providerExecutionAuthority,value.retryAuthority,value.replacementAuthority,value.sellersAuthority,value.downstreamAuthority].every(item=>item===false))throw new Error("PRODUCTS_DISCOVERY_CHILD_DISPOSITION_INVALID");return true;
}

export class TasklessChildAuthorityDispositionService{
  constructor({boundedRepository,consumptionRepository,lineageResolver,runLock,now=()=>new Date().toISOString()}={}){
    if(!boundedRepository?.getRun||!boundedRepository?.getPlan||!boundedRepository?.getAuthorization||!boundedRepository?.getChildAuthority||!boundedRepository?.recordChildDisposition||!consumptionRepository?.getAll||typeof lineageResolver!=="function"||!runLock?.runExclusive)throw new Error("TASKLESS_DISPOSITION_DEPENDENCIES_REQUIRED");
    Object.assign(this,{boundedRepository,consumptionRepository,lineageResolver,runLock,now});this.queue=Promise.resolve();
  }
  async assess({runId,memberKey,asOf=this.now()}={}){return this.#assess({runId,memberKey,asOf});}
  async #assess({runId,memberKey,asOf}){
    required(runId,"TASKLESS_DISPOSITION_RUN_REQUIRED");required(memberKey,"TASKLESS_DISPOSITION_MEMBER_REQUIRED");if(!Number.isFinite(Date.parse(asOf)))throw new Error("TASKLESS_DISPOSITION_AS_OF_INVALID");
    const run=this.boundedRepository.getRun(runId);if(!run)throw new Error("TASKLESS_DISPOSITION_RUN_NOT_FOUND");
    const member=exact(run.members.filter(value=>value.memberKey===memberKey),"TASKLESS_DISPOSITION_MEMBER_AMBIGUOUS");if(!member)throw new Error("TASKLESS_DISPOSITION_MEMBER_NOT_FOUND");
    const parent=this.boundedRepository.getAuthorization(run.authorizationId),plan=this.boundedRepository.getPlan(run.planId),planMember=this.boundedRepository.getPlanMember(run.planId,memberKey),child=this.boundedRepository.getChildAuthority(run.authorizationId,memberKey);
    if(!parent||!plan||!planMember||!child)throw new Error("TASKLESS_DISPOSITION_LINEAGE_NOT_FOUND");
    if(run.planId!==parent.planId||parent.planId!==plan.planId||parent.planBindingDigest!==plan.bindingDigest||member.domainMemberId!==planMember.domainMemberId||member.atlasProductId!==planMember.atlasProductId||member.source!==planMember.source||member.operation!==planMember.operation||member.taskCeilingUsd!==planMember.taskCeilingUsd||child.parentAuthorizationId!==parent.authorizationId||child.parentAuthorizationDigest!==parent.bindingDigest||child.planId!==plan.planId||child.memberKey!==member.memberKey||child.domainMemberId!==member.domainMemberId||child.source!==member.source||child.operation!==member.operation||child.maximumTaskCostUsd!==member.taskCeilingUsd||child.childAuthorizationId!==member.authorizationId)throw new Error("TASKLESS_DISPOSITION_LINEAGE_INVALID");
    if(member.state!=="EXCEPTION"||member.paidTaskCreated!==false||member.providerTaskId!==null)throw new Error("TASKLESS_DISPOSITION_MEMBER_NOT_TASKLESS_EXCEPTION");
    if(Date.parse(asOf)<Date.parse(child.expiresAt))throw new Error("TASKLESS_DISPOSITION_AUTHORIZATION_NOT_EXPIRED");
    const consumptions=(await this.consumptionRepository.getAll()).filter(value=>value.authorizationId===child.childAuthorizationId);if(consumptions.length!==1)throw new Error(consumptions.length?"TASKLESS_DISPOSITION_CONSUMPTION_AMBIGUOUS":"TASKLESS_DISPOSITION_AUTHORIZATION_NOT_CONSUMED");
    const lineage=await this.lineageResolver({run,parent,plan,planMember,member,child});
    if(!lineage||lineage.authorizationId!==child.childAuthorizationId||lineage.authorizationDigest!==child.childAuthorizationDigest||lineage.expiresAt!==child.expiresAt||consumptions[0].planId!==lineage.authorizationPlanId)throw new Error("TASKLESS_DISPOSITION_CHILD_AUTHORIZATION_INVALID");
    if(lineage.tasks.length>1||lineage.executions.length>1||lineage.results.length>1)throw new Error("TASKLESS_DISPOSITION_LINEAGE_AMBIGUOUS");
    if(lineage.tasks.length)throw new Error("TASKLESS_DISPOSITION_TASK_EXISTS");
    if(lineage.executions.length){const execution=lineage.executions[0],recoverable=(execution.tasks??[]).some(value=>value.outcome==="COMPLETED"&&value.providerTaskId);if(recoverable)throw new Error("TASKLESS_DISPOSITION_RECOVERABLE_EXECUTION_EXISTS");throw new Error("TASKLESS_DISPOSITION_EXECUTION_EXISTS");}
    if(lineage.results.length)throw new Error("TASKLESS_DISPOSITION_RESULT_EXISTS");
    const material={policyVersion:TASKLESS_CHILD_DISPOSITION_POLICY_VERSION,state:TASKLESS_CHILD_DISPOSITION_STATE,parentAuthorizationId:parent.authorizationId,parentAuthorizationDigest:parent.bindingDigest,planId:plan.planId,planDigest:plan.bindingDigest,runId:run.runId,memberKey:member.memberKey,domainMemberId:member.domainMemberId,atlasProductId:member.atlasProductId,source:member.source,operation:member.operation,childAuthorizationId:child.childAuthorizationId,childAuthorizationDigest:child.childAuthorizationDigest,authorizationArtifactId:lineage.authorizationArtifactId??null,authorizationArtifactDigest:lineage.authorizationArtifactDigest??null,originalAuthorizedCeilingUsd:child.maximumTaskCostUsd,originalExpiresAt:child.expiresAt,consumptionReference:freeze(consumptions[0]),taskLookup:"NONE",executionLookup:"NONE",resultLookup:"NONE",originalException:member.exception};
    return freeze({schemaVersion:"1.0",assessmentId:`mer_tasklessassess_${digest(material).slice(0,24)}`,eligible:true,...material,bindingDigest:digest(material),paidAuthority:false,providerExecutionAuthority:false,retryAuthority:false,replacementAuthority:false,sellersAuthority:false,downstreamAuthority:false});
  }
  async dispose({runId,memberKey,operator,reason,confirmation}={}){
    if(confirmation!==TASKLESS_CHILD_DISPOSITION_CONFIRMATION)throw new Error("TASKLESS_DISPOSITION_CONFIRMATION_REQUIRED");
    operator=required(operator,"TASKLESS_DISPOSITION_OPERATOR_REQUIRED");reason=required(reason,"TASKLESS_DISPOSITION_REASON_REQUIRED");
    const operation=async()=>{const locked=await this.runLock.runExclusive(async()=>{const asOf=this.now(),assessment=await this.#assess({runId,memberKey,asOf}),prior=this.boundedRepository.getChildDisposition(assessment.childAuthorizationId);if(prior){if(prior.assessmentBindingDigest!==assessment.bindingDigest||prior.operator!==operator||prior.reason!==reason)throw new Error("BOUNDED_CHILD_DISPOSITION_CONFLICT");return this.boundedRepository.recordChildDisposition(prior);}const material={assessmentBindingDigest:assessment.bindingDigest,dispositionState:TASKLESS_CHILD_DISPOSITION_STATE,disposedAt:asOf,operator,reason},bindingDigest=digest(material),record=freeze({schemaVersion:"1.0",policyVersion:TASKLESS_CHILD_DISPOSITION_POLICY_VERSION,dispositionId:`mer_tasklessdisp_${bindingDigest.slice(0,24)}`,...assessment,assessmentId:assessment.assessmentId,assessmentBindingDigest:assessment.bindingDigest,dispositionState:TASKLESS_CHILD_DISPOSITION_STATE,disposedAt:asOf,operator,reason,bindingDigest});return this.boundedRepository.recordChildDisposition(record);});if(locked.status!=="COMPLETED")throw new Error("TASKLESS_DISPOSITION_CONCURRENT_OPERATION");validateTasklessChildAuthorityDisposition(locked.result.value);return locked.result;};const result=this.queue.then(operation,operation);this.queue=result.catch(()=>{});return result;
  }
}
