import crypto from "node:crypto";
import {BOUNDED_FAILURE_CLASSES,BOUNDED_MEMBER_STATES} from "./NeutralBoundedPaidActionCoordinator.js";

export const PRODUCTS_DISCOVERY_POLICY_VERSION="MERCURY-PRODUCTS-IDENTITY-DISCOVERY-1.0";
export const PRODUCTS_DISCOVERY_STATES=Object.freeze({READY:"READY_FOR_DISCOVERY",RESOLVED:"ALREADY_RESOLVED",REVIEW:"REVIEW_REQUIRED",RIGHTS:"RIGHTS_BLOCKED",UNSUPPORTED:"UNSUPPORTED"});
export const PRODUCTS_DISCOVERY_CONFIRMATIONS=Object.freeze({AUTHORIZE:"AUTHORIZE-PRODUCTS-IDENTITY-DISCOVERY",START:"START-PRODUCTS-IDENTITY-DISCOVERY",RESUME:"RESUME-PRODUCTS-IDENTITY-DISCOVERY"});
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));
const text=(value,code)=>{if(typeof value!=="string"||!value.trim())throw new Error(code);return value.trim();};
const sourceConfig=source=>source==="DATAFORSEO_GOOGLE_SHOPPING"?{operation:"PRODUCTS",ceiling:.001}:source==="DATAFORSEO_AMAZON"?{operation:"AMAZON_PRODUCTS",ceiling:.0015}:null;
const systemic=error=>/RIGHTS_CHANGED|BUDGET|PARENT|CHILD.*BINDING|TASK.*PERSISTENCE|RESULT.*CONFLICT|REPOSITORY|SQLITE|SYSTEMIC_TRANSPORT/.test(String(error?.message??error));

export function createProductsDiscoveryDomainIdentity({sourceId,atlasProductId,discoveryCycle}={}){
  const material={policyVersion:PRODUCTS_DISCOVERY_POLICY_VERSION,sourceId:text(sourceId,"PRODUCTS_DISCOVERY_SOURCE_REQUIRED"),atlasProductId:text(atlasProductId,"PRODUCTS_DISCOVERY_PRODUCT_REQUIRED"),discoveryCycle:text(discoveryCycle,"PRODUCTS_DISCOVERY_CYCLE_REQUIRED")},bindingDigest=digest(material);
  return freeze({...material,domainMemberId:`mer_productsdiscovery_${bindingDigest.slice(0,24)}`,memberKey:`${material.sourceId}:${material.atlasProductId}:${bindingDigest.slice(0,16)}`,bindingDigest});
}

export class ProductsIdentityDiscoveryDomainAdapter{
  constructor({productRepository,readinessOwner,rightsRegistry,sourceOwners,boundedRepository}={}){
    if(!productRepository?.getById||!readinessOwner?.assess||!rightsRegistry?.require||!boundedRepository?.recordChildAuthority)throw new Error("PRODUCTS_DISCOVERY_DEPENDENCIES_REQUIRED");
    for(const source of["DATAFORSEO_GOOGLE_SHOPPING","DATAFORSEO_AMAZON"])for(const method of["prepare","authorize","execute","resolveTask","retrieve","finalize"])if(typeof sourceOwners?.[source]?.[method]!=="function")throw new Error("PRODUCTS_DISCOVERY_SOURCE_OWNER_REQUIRED");
    Object.assign(this,{productRepository,readinessOwner,rightsRegistry,sourceOwners,boundedRepository});
  }
  async prepareMember({request,cycle}){
    if(!request||Object.keys(request).some(key=>!["atlasProductId","sourceId"].includes(key)))throw new Error("PRODUCTS_DISCOVERY_COHORT_MEMBER_INVALID");
    const identity=createProductsDiscoveryDomainIdentity({...request,discoveryCycle:cycle}),config=sourceConfig(identity.sourceId);if(!config)throw new Error("PRODUCTS_DISCOVERY_UNSUPPORTED");
    const product=await this.productRepository.getById(identity.atlasProductId);if(!product)throw new Error("PRODUCTS_DISCOVERY_PRODUCT_NOT_FOUND");
    const readiness=await this.readinessOwner.assess({atlasProduct:product,sourceId:identity.sourceId,asOf:cycle});if(readiness?.state!==PRODUCTS_DISCOVERY_STATES.READY)throw new Error(`PRODUCTS_DISCOVERY_NOT_READY:${readiness?.state??"UNKNOWN"}`);
    const rights=this.rightsRegistry.require(identity.sourceId),prepared=await this.sourceOwners[identity.sourceId].prepare({atlasProduct:product,cycle,rightsProfile:rights,readiness});
    const material={...identity,source:identity.sourceId,operation:config.operation,taskCeilingUsd:config.ceiling,atlasProductId:identity.atlasProductId,canonicalMpn:text(product.identity?.manufacturerPartNumber,"PRODUCTS_DISCOVERY_MPN_REQUIRED"),identityStateDigest:text(readiness.bindingDigest,"PRODUCTS_DISCOVERY_IDENTITY_STATE_INVALID"),rightsDigest:text(prepared.rightsDigest,"PRODUCTS_DISCOVERY_RIGHTS_INVALID"),requestIdentity:text(prepared.requestIdentity,"PRODUCTS_DISCOVERY_REQUEST_INVALID"),sourcePayload:prepared.sourcePayload??null};
    return freeze({...material,domainBindingDigest:digest(material),outcome:null,paidTaskCreated:false,providerTaskId:null});
  }
  async revalidateMember({member,authorization}){
    const product=await this.productRepository.getById(member.atlasProductId),readiness=await this.readinessOwner.assess({atlasProduct:product,sourceId:member.source,asOf:authorization.authorizedAt});
    if(readiness?.state!==PRODUCTS_DISCOVERY_STATES.READY||readiness.bindingDigest!==member.identityStateDigest)throw new Error("PRODUCTS_DISCOVERY_IDENTITY_STATE_CHANGED");
    const rights=this.rightsRegistry.require(member.source);if((rights.bindingDigest??rights.profileDigest)!==member.rightsDigest)throw new Error("PRODUCTS_DISCOVERY_RIGHTS_CHANGED");return true;
  }
  async advanceMember({member,authorization,createChildBinding,checkpoint}){
    const owner=this.sourceOwners[member.source];let current=member;
    if(current.state===BOUNDED_MEMBER_STATES.READY){const child=await owner.authorize({member:current,parentAuthorization:authorization});const childAuthorityBinding=createChildBinding({parentAuthorization:authorization,member:current,childAuthorizationId:child.authorizationId,childAuthorizationDigest:child.authorizationDigest,expiresAt:child.expiresAt}),record={...childAuthorityBinding,childAuthorizationId:child.authorizationId};await this.boundedRepository.recordChildAuthority(record);current=checkpoint({state:BOUNDED_MEMBER_STATES.AUTHORIZED,authorizationId:child.authorizationId,childAuthorityBinding});}
    if(current.state===BOUNDED_MEMBER_STATES.AUTHORIZED){const executed=await owner.execute({member:current,authorizationId:current.authorizationId});if(!["COMPLETED","LIVE_AUTHORIZATION_ALREADY_CONSUMED"].includes(executed.status))throw new Error("PRODUCTS_DISCOVERY_PROVIDER_EXECUTION_FAILED");const task=await owner.resolveTask({member:current});current=checkpoint({state:"EXECUTED",paidTaskCreated:true,providerTaskId:text(task.providerTaskId,"PRODUCTS_DISCOVERY_TASK_PERSISTENCE_INVALID"),actualSpendUsd:task.actualSpendUsd});}
    const retrieved=await owner.retrieve({member:current,providerTaskId:current.providerTaskId});if(retrieved.status==="PENDING")return{...current,state:BOUNDED_MEMBER_STATES.WAITING};if(retrieved.status==="FAILED")throw new Error("PRODUCTS_DISCOVERY_PROVIDER_LOCAL_FAILURE");if(retrieved.status!=="AVAILABLE")throw new Error("PRODUCTS_DISCOVERY_RESULT_INVALID");
    const finalized=await owner.finalize({member:current,canonicalResult:retrieved.canonicalResult});return{...current,state:BOUNDED_MEMBER_STATES.COMPLETED,outcome:finalized.state,assessmentId:finalized.assessmentId??null,h052ReviewAvailable:finalized.h052ReviewAvailable===true,providerResultId:finalized.providerResultId??retrieved.canonicalResult?.canonicalResultId??null,publicationAuthority:false,currentPriceAuthority:false,sellersTaskCreated:false};
  }
  async recoverMember({member}){if(member.state!==BOUNDED_MEMBER_STATES.EXCEPTION)return null;const task=await this.sourceOwners[member.source].resolveTask({member,recover:true});return task?{state:"EXECUTED",exception:null,paidTaskCreated:true,providerTaskId:task.providerTaskId,actualSpendUsd:task.actualSpendUsd}:null;}
  classifyFailure(error){const message=String(error?.message??error),notReady=/PRODUCTS_DISCOVERY_NOT_READY:([^\s]+)/.exec(message);return{classification:systemic(error)?BOUNDED_FAILURE_CLASSES.SYSTEMIC:BOUNDED_FAILURE_CLASSES.MEMBER_LOCAL,state:notReady?.[1]??(/PROVIDER/.test(message)?"PROVIDER_FAILED":"REVIEW_REQUIRED"),reason:message};}
  summarize(run){const members=run.members??[],count=state=>members.filter(member=>member.outcome===state).length;return freeze({runId:run.runId,planId:run.planId,discoveryCycle:run.cycle,state:run.state,requested:members.length,identitiesResolved:count("IDENTITY_RESOLVED")+count("STRONG_UNIQUE_ASIN"),reviewRequired:count("REVIEW_REQUIRED"),insufficientEvidence:count("INSUFFICIENT_ASIN_EVIDENCE"),ambiguousOrNoUsableIdentity:members.filter(member=>["AMBIGUOUS","NO_USABLE_IDENTITY"].includes(member.outcome)).length,providerFailures:members.filter(member=>member.exception?.includes("PROVIDER")||member.outcome==="PROVIDER_FAILED").length,pending:members.filter(member=>member.state===BOUNDED_MEMBER_STATES.WAITING).length,paidTasksCreated:members.filter(member=>member.providerTaskId).length,actualSpendUsd:Number(members.reduce((sum,member)=>sum+(Number(member.actualSpendUsd)||0),0).toFixed(4)),sellersTasksCreated:0,evidenceWritten:0,historyWritten:0,publicationAuthority:false,currentPriceAuthority:false,members});}
}

export class ProductsIdentityDiscoveryService{
  constructor({coordinator}={}){if(!coordinator?.prepare||!coordinator?.inspect||!coordinator?.authorize||!coordinator?.start||!coordinator?.resume)throw new Error("PRODUCTS_DISCOVERY_COORDINATOR_REQUIRED");this.coordinator=coordinator;}
  prepare(input={}){if(!Array.isArray(input.cohort)||Object.keys(input).some(key=>!["cycle","cohort"].includes(key)))throw new Error("PRODUCTS_DISCOVERY_PREPARE_INPUT_INVALID");return this.coordinator.prepare(input);}
  inspect(input={}){if(Object.keys(input).some(key=>!["planId","runId"].includes(key)))throw new Error("PRODUCTS_DISCOVERY_INSPECT_INPUT_INVALID");return this.coordinator.inspect(input);}
  authorize({planId,operator,reason,expiresAt,confirmation}={}){if(confirmation!==PRODUCTS_DISCOVERY_CONFIRMATIONS.AUTHORIZE)throw new Error("PRODUCTS_DISCOVERY_AUTHORIZE_CONFIRMATION_REQUIRED");return this.coordinator.authorize({planId,operator,reason,expiresAt});}
  start({authorizationId,startedBy,confirmation}={}){if(confirmation!==PRODUCTS_DISCOVERY_CONFIRMATIONS.START)throw new Error("PRODUCTS_DISCOVERY_START_CONFIRMATION_REQUIRED");return this.coordinator.start({authorizationId,startedBy});}
  resume({runId,resumedBy,confirmation}={}){if(confirmation!==PRODUCTS_DISCOVERY_CONFIRMATIONS.RESUME)throw new Error("PRODUCTS_DISCOVERY_RESUME_CONFIRMATION_REQUIRED");return this.coordinator.resume({runId,resumedBy});}
}
