import {BOUNDED_FAILURE_CLASSES,BOUNDED_MEMBER_STATES,NeutralBoundedPaidActionCoordinator} from "../bounded/NeutralBoundedPaidActionCoordinator.js";
import {REPEAT_OBSERVATION_AUTHORIZE_CONFIRMATION,REPEAT_OBSERVATION_EXECUTE_CONFIRMATION} from "./RepeatObservationBoundary.js";

export const BOUNDED_REPEAT_RUN_POLICY_VERSION="MERCURY-BOUNDED-REPEAT-RUN-1.0";
export const BOUNDED_REPEAT_RUN_AUTHORIZE_CONFIRMATION="AUTHORIZE-BOUNDED-REPEAT-RUN";
export const BOUNDED_REPEAT_RUN_START_CONFIRMATION="START-BOUNDED-REPEAT-RUN";
export const BOUNDED_REPEAT_RUN_RESUME_CONFIRMATION="RESUME-BOUNDED-REPEAT-RUN";
const freeze=value=>Object.freeze(structuredClone(value));
const exact=(value,keys,code)=>{if(!value||Object.keys(value).some(key=>!keys.includes(key)))throw new Error(code);};
const reason=error=>{const text=String(error?.message??error);if(/IDENTITY.*REVIEW|NOT_REUSABLE/.test(text))return"IDENTITY_REVIEW_REQUIRED";if(/DISCOVERY|LINEAGE/.test(text))return"DISCOVERY_REQUIRED";if(/RIGHTS/.test(text))return"RIGHTS_BLOCKED";if(/SOURCE_UNSUPPORTED|RESOLVER_REQUIRED/.test(text))return"UNSUPPORTED";return"BLOCKED";};
const systemic=error=>/RIGHTS_CHANGED|DAILY_BUDGET|LEDGER|BINDING_CONFLICT|REPOSITORY|SQLITE|TASK_OWNER|TASK_PERSISTENCE|AUTHORIZATION.*INVALID|CONFLICT/.test(String(error?.message??error));

const memberToNeutral=value=>({...value,memberKey:value.memberKey??value.preparedObservationId,domainMemberId:value.domainMemberId??value.preparedObservationId});
const memberToLegacy=value=>({...value,preparedObservationId:value.preparedObservationId??value.domainMemberId});
const planToNeutral=value=>value&&freeze({...value,planId:value.planId??value.runPlanId,cycle:value.cycle??value.observationCycle,ready:(value.ready??[]).map(memberToNeutral)});
const planToLegacy=value=>freeze({...value,runPlanId:value.planId,observationCycle:value.cycle,ready:value.ready.map(memberToLegacy)});
const authorizationToNeutral=value=>value&&freeze({...value,authorizationId:value.authorizationId??value.runAuthorizationId,planId:value.planId??value.runPlanId});
const authorizationToLegacy=value=>freeze({...value,runAuthorizationId:value.authorizationId,runPlanId:value.planId});
const runToNeutral=value=>value&&freeze({...value,planId:value.planId??value.runPlanId,authorizationId:value.authorizationId??value.runAuthorizationId,cycle:value.cycle??value.observationCycle,members:(value.members??[]).map(memberToNeutral)});
const runToLegacy=value=>freeze({...value,runPlanId:value.planId,runAuthorizationId:value.authorizationId,observationCycle:value.cycle,members:value.members.map(memberToLegacy)});
const result=(record,project)=>({...record,value:project(record.value)});

class RepeatBoundedPersistenceAdapter{
  constructor(repository){this.repository=repository;}
  recordPlan(value){return result(this.repository.recordRunPlan(planToLegacy(value)),planToNeutral);}
  getPlan(id){return planToNeutral(this.repository.getRunPlan(id));}
  recordAuthorization(value){return result(this.repository.recordRunAuthorization(authorizationToLegacy(value)),authorizationToNeutral);}
  getAuthorization(id){return authorizationToNeutral(this.repository.getRunAuthorization(id));}
  findAuthorizationsByPlan(id){return (this.repository.findRunAuthorizationsByPlan?.(id)??[]).map(authorizationToNeutral);}
  startRun(value){return result(this.repository.startRun(runToLegacy(value)),runToNeutral);}
  getRun(id){return runToNeutral(this.repository.getRun(id));}
  findRunByPlan(id){return runToNeutral(this.repository.findRunByPlan?.(id));}
  updateMember(runId,value){this.repository.updateRunMember(runId,memberToLegacy(value));}
  updateRun(value){return runToNeutral(this.repository.updateRun(runToLegacy(value)));}
}

export class RepeatObservationBoundedDomainAdapter{
  constructor({repeatService}={}){if(!repeatService)throw new Error("REPEAT_RUN_DOMAIN_SERVICE_REQUIRED");this.repeatService=repeatService;}
  async prepareMember({request,cycle}){exact(request,["atlasProductId","source"],"REPEAT_RUN_COHORT_MEMBER_INVALID");if(typeof request.atlasProductId!=="string"||typeof request.source!=="string")throw new Error("REPEAT_RUN_COHORT_MEMBER_INVALID");const prepared=await this.repeatService.prepare({...request,observationCycle:cycle}),value=prepared.value;return freeze({atlasProductId:request.atlasProductId,source:request.source,memberKey:value.preparedObservationId,domainMemberId:value.preparedObservationId,preparedObservationId:value.preparedObservationId,operation:value.operation,taskCeilingUsd:value.taskCostUsd,identityDigest:value.reusableIdentity.identityDigest,rightsDigest:value.sourceRightsProfileDigest,paidTaskCreated:false,evidenceIds:[],historicalObservationIds:[]});}
  revalidateMember({member}){return this.repeatService.validateCurrent({preparedObservationId:member.domainMemberId});}
  classifyFailure(error){return{classification:systemic(error)?BOUNDED_FAILURE_CLASSES.SYSTEMIC:BOUNDED_FAILURE_CLASSES.MEMBER_LOCAL,state:reason(error),reason:String(error?.message??error)};}
  async recoverMember({member}){if(member.exception!=="REPEAT_OBSERVATION_PROVIDER_TASK_NOT_FOUND")return null;const task=await this.repeatService.resolveTask({preparedObservationId:member.domainMemberId,recover:true});return{state:"EXECUTED",exception:null,paidTaskCreated:true,providerTaskId:task.taskId,actualSpendUsd:task.costUsd};}
  async advanceMember({member,authorization,createChildBinding,checkpoint}){
    let current=member;
    if(current.state===BOUNDED_MEMBER_STATES.READY){
      const child=await this.repeatService.authorize({preparedObservationId:current.domainMemberId,operator:`machine:${authorization.authorizationId}`,reason:`Derived exact-task authority for ${authorization.planId}`,expiresAt:authorization.expiresAt,confirmation:REPEAT_OBSERVATION_AUTHORIZE_CONFIRMATION,parentRunAuthorizationId:authorization.authorizationId,parentRunAuthorizationDigest:authorization.bindingDigest});
      const childValue=child.value,childAuthorityBinding=createChildBinding({parentAuthorization:authorization,member:current,childAuthorizationId:childValue.authorizationId,childAuthorizationDigest:childValue.authorizationBindingDigest,expiresAt:childValue.expiresAt});
      current=checkpoint({state:BOUNDED_MEMBER_STATES.AUTHORIZED,authorizationId:childValue.authorizationId,childAuthorityBinding});
    }
    if(current.state===BOUNDED_MEMBER_STATES.AUTHORIZED){
      const executed=await this.repeatService.execute({authorizationId:current.authorizationId,executedBy:`machine:${authorization.authorizationId}`,confirmation:REPEAT_OBSERVATION_EXECUTE_CONFIRMATION});if(!["COMPLETED","LIVE_AUTHORIZATION_ALREADY_CONSUMED"].includes(executed.status))throw new Error("PRODUCT_PROVIDER_EXECUTION_FAILED");const task=await this.repeatService.resolveTask({preparedObservationId:current.domainMemberId,recover:false});current=checkpoint({state:"EXECUTED",paidTaskCreated:true,providerTaskId:task.taskId,actualSpendUsd:task.costUsd});
    }
    const retrieved=await this.repeatService.retrieve({preparedObservationId:current.domainMemberId});if(["PENDING","WAITING_FOR_PROVIDER"].includes(retrieved?.status))return{...current,state:BOUNDED_MEMBER_STATES.WAITING};if(retrieved?.status==="FAILED")throw new Error(`PRODUCT_PROVIDER_FAILED:${retrieved.reason??"UNKNOWN"}`);
    const processed=await this.repeatService.processRetain({preparedObservationId:current.domainMemberId,canonicalResultId:retrieved.canonicalResultId}),evidenceIds=processed.evidenceIds??[],history=[];
    for(const evidenceId of evidenceIds){const assessed=await this.repeatService.assessAdmitFact({evidenceId,action:"ASSESS",admittedBy:null});if(assessed.historicalEligible!==true)throw new Error(`PRODUCT_FACT_NOT_ELIGIBLE:${evidenceId}`);const admitted=await this.repeatService.assessAdmitFact({evidenceId,action:"ADMIT",admittedBy:`machine:${authorization.authorizationId}`});if(admitted.observationId)history.push(admitted.observationId);}
    return{...current,state:BOUNDED_MEMBER_STATES.COMPLETED,evidenceIds,historicalObservationIds:history,duplicates:processed.duplicates??0};
  }
  summarize(run){const members=run.members??[];return freeze({runId:run.runId,runPlanId:run.planId,observationCycle:run.cycle,state:run.state,paidTasksCreated:members.filter(value=>value.providerTaskId).length,actualSpendUsd:Number(members.reduce((sum,value)=>sum+(Number(value.actualSpendUsd)||0),0).toFixed(4)),completed:members.filter(value=>value.state===BOUNDED_MEMBER_STATES.COMPLETED).length,pending:members.filter(value=>value.state===BOUNDED_MEMBER_STATES.WAITING).length,failed:members.filter(value=>value.state===BOUNDED_MEMBER_STATES.EXCEPTION).length,evidenceRetained:members.reduce((sum,value)=>sum+(value.evidenceIds?.length??0),0),historicalFactsAdmitted:members.reduce((sum,value)=>sum+(value.historicalObservationIds?.length??0),0),duplicates:members.reduce((sum,value)=>sum+(value.duplicates??0),0),productLocalExceptions:members.filter(value=>value.exception).map(value=>({atlasProductId:value.atlasProductId,source:value.source,reason:value.exception})),systemicFailure:run.systemicFailure??null,currentPriceWrites:0,currentDisplayWrites:0,cheapestWrites:0,pickWrites:0,publicationWrites:0,downstreamAuthority:false});}
}

export class BoundedRepeatObservationRunService{
  constructor({repeatService,repository,spendResolver=async()=>0,now=()=>new Date().toISOString(),dailySpendCeilingUsd=.025}={}){if(!repeatService||!repository)throw new Error("REPEAT_RUN_DEPENDENCIES_REQUIRED");this.repository=repository;this.adapter=new RepeatObservationBoundedDomainAdapter({repeatService});this.coordinator=new NeutralBoundedPaidActionCoordinator({repository:new RepeatBoundedPersistenceAdapter(repository),domainAdapter:this.adapter,spendResolver,now,dailySpendCeilingUsd,policyVersion:BOUNDED_REPEAT_RUN_POLICY_VERSION,idPrefixes:{plan:"mer_repeatrunplan",authorization:"mer_repeatrunauth",run:"mer_repeatrun"}});}
  async prepareRun(input={}){exact(input,["observationCycle","cohort"],"REPEAT_RUN_PREPARE_INPUT_INVALID");const record=await this.coordinator.prepare({cycle:input.observationCycle,cohort:input.cohort});return result(record,planToLegacy);}
  async authorizeRun(input={}){exact(input,["runPlanId","operator","reason","expiresAt","confirmation"],"REPEAT_RUN_AUTHORIZE_INPUT_INVALID");if(input.confirmation!==BOUNDED_REPEAT_RUN_AUTHORIZE_CONFIRMATION)throw new Error("REPEAT_RUN_AUTHORIZE_CONFIRMATION_REQUIRED");const record=await this.coordinator.authorize({planId:input.runPlanId,operator:input.operator,reason:input.reason,expiresAt:input.expiresAt});return result(record,authorizationToLegacy);}
  async startRun(input={}){exact(input,["runAuthorizationId","startedBy","confirmation"],"REPEAT_RUN_START_INPUT_INVALID");if(input.confirmation!==BOUNDED_REPEAT_RUN_START_CONFIRMATION)throw new Error("REPEAT_RUN_START_CONFIRMATION_REQUIRED");return this.coordinator.start({authorizationId:input.runAuthorizationId,startedBy:input.startedBy});}
  async resumeRun(input={}){exact(input,["runId","resumedBy","confirmation"],"REPEAT_RUN_RESUME_INPUT_INVALID");if(input.confirmation!==BOUNDED_REPEAT_RUN_RESUME_CONFIRMATION)throw new Error("REPEAT_RUN_RESUME_CONFIRMATION_REQUIRED");return this.coordinator.resume({runId:input.runId,resumedBy:input.resumedBy});}
  async inspectRun(input={}){exact(input,["runId","runPlanId"],"REPEAT_RUN_INSPECT_INPUT_INVALID");if(Boolean(input.runId)===Boolean(input.runPlanId))throw new Error("REPEAT_RUN_INSPECT_ID_REQUIRED");const value=await this.coordinator.inspect({runId:input.runId,planId:input.runPlanId});return input.runPlanId?freeze({...value,runPlanId:value.planId,observationCycle:value.cycle,downstreamAuthority:false}):value;}
}
