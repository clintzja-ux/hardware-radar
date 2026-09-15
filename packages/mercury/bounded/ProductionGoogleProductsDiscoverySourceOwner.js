import crypto from "node:crypto";
import { createProductionProductsPrepareOwner } from "../acquisition/operations/ProductionDataForSeoPrepareOwners.js";
import { createProductionDataForSeoTaskOwner } from "../acquisition/operations/ProductionDataForSeoTaskOwner.js";
import { createProductionDataForSeoRetrievalOwner } from "../acquisition/operations/ProductionDataForSeoRetrievalOwner.js";
import { createNeutralDerivedProductsAuthorizationRequest } from "../acquisition/authorization/ManualLiveAuthorizationRequest.js";
import { createNeutralParentAuthorityInput } from "./NeutralParentAuthority.js";
import { createHistoricalBootstrapProviderResult } from "../portfolio/FileHistoricalBootstrapProviderResultRepository.js";
import { createProductsIdentityProgressionOwner } from "../portfolio/ProductionHistoricalBootstrapLocalOwners.js";
import { NeutralGoogleProductsFinalizationService } from "./NeutralGoogleProductsFinalization.js";

const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));
const fail=code=>{throw new Error(code)};

/** Complete production composition for the Google Products discovery source. */
export function createProductionGoogleProductsDiscoverySourceOwner({
  atlas, boundedRepository, childArtifactRepository, taskLedger, executionRepository,
  consumptionRepository, resultRepository, rightsRegistry, acceptanceRepository=null,
  evidenceRepository=null, credentialLoader, httpTransport, acquisitionService,
  runLock, stateRoot, progressionOwner=createProductsIdentityProgressionOwner(), now=()=>new Date().toISOString()
}={}){
  if(!atlas?.products?.getById||!boundedRepository?.getPlan||!childArtifactRepository?.getById||!taskLedger?.getAll||!executionRepository?.getAll||!resultRepository?.record||!resultRepository?.findByTask||!rightsRegistry?.require)fail("GOOGLE_PRODUCTS_DISCOVERY_DEPENDENCIES_REQUIRED");
  const prepareOwner=createProductionProductsPrepareOwner({atlas,acceptanceRepository,evidenceRepository,executionRepository,now});
  const taskOwner=createProductionDataForSeoTaskOwner({operation:"PRODUCTS",stateRoot,credentialLoader,httpTransport,acquisitionService,executionRepository,consumptionRepository,runLock,now});
  const retrievalOwner=createProductionDataForSeoRetrievalOwner({operation:"PRODUCTS",credentialLoader,httpTransport,acquisitionService});
  const finalization=new NeutralGoogleProductsFinalizationService({boundedRepository,childArtifactRepository,taskLedger,resultRepository,productRepository:atlas.products,progressionOwner,rightsRegistry,now});

  const exactExecution=async member=>{
    const planId=member.sourcePayload?.googlePlanId;
    const rows=(await executionRepository.getAll()).filter(row=>row.planId===planId);
    if(rows.length>1)fail("GOOGLE_PRODUCTS_TASK_EXECUTION_CONFLICT");
    return rows[0]??null;
  };
  const resolveTask=async({member}={})=>{
    const run=await exactExecution(member), completed=run?.tasks?.filter(task=>task.outcome==="COMPLETED"&&task.providerTaskId)??[];
    if(completed.length>1)fail("GOOGLE_PRODUCTS_TASK_LINEAGE_CONFLICT");
    if(!completed.length)return null;
    const matches=(await taskLedger.getAll()).filter(task=>task.taskId===completed[0].providerTaskId&&task.kind==="PRODUCTS"&&task.sourceId==="DATAFORSEO_GOOGLE_SHOPPING");
    if(matches.length!==1)fail("GOOGLE_PRODUCTS_TASK_LINEAGE_CONFLICT");
    return freeze({providerTaskId:matches[0].taskId,actualSpendUsd:completed[0].actualCostUsd??matches[0].costUsd});
  };

  return Object.freeze({
    async prepare({atlasProduct,cycle,rightsProfile}={}){
      const prepared=await prepareOwner.prepare({atlasProductId:atlasProduct?.identity?.atlasProductId});
      const plan=prepared.authorizationRequest?.plan;
      if(plan?.approvedTaskCount!==1||plan.decisions?.[0]?.execution?.kind!=="PRODUCTS")fail("GOOGLE_PRODUCTS_PREPARE_INVALID");
      return freeze({rightsDigest:digest(rightsProfile),requestIdentity:plan.planId,sourcePayload:{googlePlanId:plan.planId,googlePlan:plan}});
    },
    async authorize({member,parentAuthorization}={}){
      const plan=boundedRepository.getPlan(parentAuthorization?.planId),neutralParentAuthority=createNeutralParentAuthorityInput({parentAuthorization,plan,member});
      const authorizationRequest=createNeutralDerivedProductsAuthorizationRequest({plan:member.sourcePayload?.googlePlan,neutralParentAuthority,boundedRepository,createdAt:parentAuthorization.authorizedAt});
      return freeze({authorizationId:authorizationRequest.requestId,authorizationDigest:digest(authorizationRequest),expiresAt:authorizationRequest.expiresAt,authorizationRequest});
    },
    async execute({authorizationRequest}={}){return taskOwner.execute({request:authorizationRequest,authorizedAt:authorizationRequest?.createdAt});},
    resolveTask,
    async retrieve({member,providerTaskId}={}){
      const prior=await resultRepository.findByTask(providerTaskId);if(prior)return freeze({status:"AVAILABLE",canonicalResult:prior});
      let outcome;try{outcome=await retrievalOwner.retrieve({providerTaskId});}catch(error){if(/^DATAFORSEO_TASK_ERROR:40/.test(String(error?.message)))return freeze({status:"PENDING"});throw error;}
      if(outcome?.status==="PROVIDER_FAILED")return freeze({status:"FAILED"});if(!Array.isArray(outcome?.result)||outcome.result.length===0)return freeze({status:"PENDING"});
      const task=(await taskLedger.getAll()).find(row=>row.taskId===providerTaskId),record=createHistoricalBootstrapProviderResult({operation:"PRODUCTS",sourceId:"DATAFORSEO_GOOGLE_SHOPPING",providerTaskId,paidActionIntentId:task?.paidActionIntentId??member.authorizationId,acquisitionReferenceId:member.domainMemberId,atlasProductId:member.atlasProductId,sourceRightsProfileDigest:member.rightsDigest,operationResult:outcome,retrievedAt:now()});
      return freeze({status:"AVAILABLE",canonicalResult:await resultRepository.record(record)});
    },
    async finalize({member}={}){
      const child=boundedRepository.getChildAuthority(member.childAuthorityBinding?.parentAuthorizationId,member.memberKey),parent=boundedRepository.getAuthorization(child?.parentAuthorizationId),run=parent&&boundedRepository.findRunByPlan(parent.planId);
      const value=await finalization.finalize({planId:parent?.planId,runId:run?.runId,memberKey:member.memberKey});
      const result=value.finalization;return freeze({state:result.state,assessmentId:result.finalizationId,providerResultId:result.canonicalResultId});
    },
    async recoverPreExecution({member,authorizationRequest}={}){const existing=await resolveTask({member});if(existing)return existing;const outcome=await taskOwner.execute({request:authorizationRequest,authorizedAt:authorizationRequest?.createdAt});if(!["COMPLETED","LIVE_AUTHORIZATION_ALREADY_CONSUMED"].includes(outcome.status))fail("GOOGLE_PRODUCTS_RECOVERY_EXECUTION_FAILED");const task=await resolveTask({member});if(!task)fail("GOOGLE_PRODUCTS_RECOVERY_TASK_NOT_FOUND");return task;}
  });
}
