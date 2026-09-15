import { amazonAcceptanceDigest } from "./AmazonHistoricalAcceptancePreparation.js";
import { AMAZON_ACCEPTANCE_ACTION_CONFIRMATIONS, validateAmazonAcceptanceActionAuthorization } from "./AmazonAcceptanceExecution.js";
import { selectAmazonHistoricalAcceptanceProduct, prepareAmazonHistoricalAcceptance } from "./AmazonHistoricalAcceptancePreparation.js";
import { createAmazonAcceptanceActionAuthorization } from "./AmazonAcceptanceExecution.js";
import { AmazonAcceptanceExecutionService } from "./AmazonAcceptanceExecutionService.js";
import { DataForSeoAmazonResultRetrievalService } from "./DataForSeoAmazonResults.js";
import { createProductionDataForSeoTaskOwner } from "../acquisition/operations/ProductionDataForSeoTaskOwner.js";
import { createProductionDataForSeoRetrievalOwner } from "../acquisition/operations/ProductionDataForSeoRetrievalOwner.js";
import { createNeutralParentAuthorityInput } from "../bounded/NeutralParentAuthority.js";

const requiredMethods = ["prepare", "authorize", "execute", "resolveTask", "retrieve", "finalize"];
const fail = code => { throw new Error(code); };

function exactTask(rows, authorization) {
  const execution = authorization.plan.decisions[0].execution;
  const matches = rows.filter(row => row.kind === "AMAZON_PRODUCTS" && row.checkpointId === authorization.artifactId && row.paidActionIntentId === execution.paidActionIntentId);
  if (matches.length > 1) fail("AMAZON_PRODUCTS_RECOVERY_TASK_CONFLICT");
  return matches[0] ?? null;
}

function exactRun(rows, authorization) {
  const intent = authorization.plan.decisions[0].execution.paidActionIntentId;
  const matches = rows.filter(row => row.planId === authorization.plan.planId || row.paidActionIntentId === intent);
  if (matches.length > 1) fail("AMAZON_PRODUCTS_RECOVERY_EXECUTION_CONFLICT");
  return matches[0] ?? null;
}

function validateNeutralLineage({ member, parentAuthorization, childAuthority, authorization }) {
  const neutral = authorization.neutralParentAuthority;
  const expected = {
    parentAuthorizationId: parentAuthorization.authorizationId,
    parentAuthorizationDigest: parentAuthorization.bindingDigest,
    boundedPlanId: parentAuthorization.planId,
    boundedPlanDigest: parentAuthorization.planBindingDigest,
    memberKey: member.memberKey,
    domainMemberId: member.domainMemberId,
    sourceId: member.source,
    operation: member.operation,
    maximumTaskCostUsd: member.taskCeilingUsd,
    zeroRetries: 0,
    parentExpiresAt: parentAuthorization.expiresAt,
    childExpiresAt: childAuthority.expiresAt
  };
  if (authorization.authorityOrigin !== "NEUTRAL_BOUNDED_PARENT" || !neutral || Object.entries(expected).some(([key, value]) => neutral[key] !== value)) fail("AMAZON_PRODUCTS_RECOVERY_NEUTRAL_LINEAGE_INVALID");
  if (authorization.authorizationId !== childAuthority.childAuthorizationId || amazonAcceptanceDigest(authorization) !== childAuthority.childAuthorizationDigest || authorization.artifactId !== member.sourcePayload?.acceptanceArtifactId || authorization.atlasProductId !== member.atlasProductId || authorization.operation !== "AMAZON_PRODUCTS" || authorization.sourceRightsProfileDigest !== member.rightsDigest || childAuthority.parentAuthorizationId !== expected.parentAuthorizationId || childAuthority.parentAuthorizationDigest !== expected.parentAuthorizationDigest || childAuthority.planId !== expected.boundedPlanId || childAuthority.memberKey !== expected.memberKey || childAuthority.domainMemberId !== expected.domainMemberId || childAuthority.source !== expected.sourceId || childAuthority.operation !== expected.operation || childAuthority.maximumTaskCostUsd !== expected.maximumTaskCostUsd || childAuthority.automaticPaidRetries !== 0) fail("AMAZON_PRODUCTS_RECOVERY_CHILD_LINEAGE_INVALID");
}

/**
 * Production composition seam for the already-certified Amazon Products source
 * operations. It adds recovery only; policy and durable state remain owned by
 * AmazonAcceptanceExecutionService and its canonical repositories.
 */
export function createProductionAmazonProductsDiscoverySourceOwner({ sourceOwner=null, atlas=null, destinationRepository=null, historicalRepository=null, boundedRepository=null, artifactRepository=null, actionRepository, taskLedger, executionRepository, consumptionRepository, resultRepository=null, rightsRegistry=null, spendResolver=null, credentialLoader, httpTransport, acquisitionService, runLock, stateRoot, executionService=null, now = () => new Date().toISOString() } = {}) {
  if(!sourceOwner){
    if(!atlas?.products?.getById||!destinationRepository?.getAll||!historicalRepository?.getAll||!boundedRepository?.getPlan||!artifactRepository?.record||!actionRepository?.recordAuthorization||!resultRepository?.record||!rightsRegistry?.require||typeof spendResolver!=="function")fail("AMAZON_PRODUCTS_DISCOVERY_DEPENDENCIES_REQUIRED");
    const taskOwner=createProductionDataForSeoTaskOwner({operation:"AMAZON_PRODUCTS",stateRoot,credentialLoader,httpTransport,acquisitionService,executionRepository,consumptionRepository,runLock,now});
    const providerRetrieval=createProductionDataForSeoRetrievalOwner({operation:"AMAZON_PRODUCTS",credentialLoader,httpTransport,acquisitionService}),retrievalAcquisition=acquisitionService??{getAmazonProductsResult:providerTaskId=>providerRetrieval.retrieve({providerTaskId})};
    const retrievalService=new DataForSeoAmazonResultRetrievalService({taskLedger,acquisitionService:retrievalAcquisition,resultRepository,now});
    executionService=new AmazonAcceptanceExecutionService({artifactRepository,actionRepository,productRepository:atlas.products,rightsRegistry,spendResolver,taskOwners:{AMAZON_PRODUCTS:taskOwner},retrievalServices:{AMAZON_PRODUCTS:retrievalService},resultRepository,taskLedger,consumptionRepository,executionRepository,now});
    sourceOwner={
      async prepare({atlasProduct,cycle,rightsProfile}={}){const selection=selectAmazonHistoricalAcceptanceProduct({atlasProducts:[atlasProduct],destinations:await destinationRepository.getAll(),historicalObservations:await historicalRepository.getAll()}),artifact=prepareAmazonHistoricalAcceptance({asOf:cycle,selection,rightsProfile,currentUtcDaySpendUsd:await spendResolver(cycle)});await artifactRepository.record(artifact);return{rightsDigest:artifact.sourceRightsProfileDigest,requestIdentity:artifact.acceptanceArtifactId,sourcePayload:{acceptanceArtifactId:artifact.acceptanceArtifactId}};},
      async authorize({member,parentAuthorization}={}){const artifact=await artifactRepository.getById(member.sourcePayload?.acceptanceArtifactId),product=await atlas.products.getById(member.atlasProductId),plan=boundedRepository.getPlan(parentAuthorization.planId),neutralParentAuthority=createNeutralParentAuthorityInput({parentAuthorization,plan,member}),authorization=createAmazonAcceptanceActionAuthorization({artifact,operation:"AMAZON_PRODUCTS",atlasProduct:product,operator:"machine:bounded-products-discovery",reason:"Neutral bounded Products identity discovery",authorizedAt:parentAuthorization.authorizedAt,expiresAt:parentAuthorization.expiresAt,currentUtcDaySpendUsd:await spendResolver(parentAuthorization.authorizedAt),neutralParentAuthority,boundedRepository});await actionRepository.recordAuthorization(authorization,{asOf:authorization.authorizedAt,expectedPredecessorIds:[]});return{authorizationId:authorization.authorizationId,authorizationDigest:amazonAcceptanceDigest(authorization),expiresAt:authorization.expiresAt,durableAuthority:true};},
      async execute({member,authorizationId}={}){return executionService.execute({artifactId:member.sourcePayload?.acceptanceArtifactId,authorizationId,operation:"AMAZON_PRODUCTS",confirmation:AMAZON_ACCEPTANCE_ACTION_CONFIRMATIONS.EXECUTE_PRODUCTS});},
      async resolveTask({member}={}){const rows=(await taskLedger.getAll()).filter(row=>row.kind==="AMAZON_PRODUCTS"&&row.checkpointId===member.sourcePayload?.acceptanceArtifactId);if(rows.length>1)fail("AMAZON_PRODUCTS_TASK_LINEAGE_CONFLICT");if(!rows.length)return null;const runs=await executionRepository.getAll(),matches=runs.flatMap(run=>(run.tasks??[]).filter(task=>task.providerTaskId===rows[0].taskId));if(matches.length!==1)fail("AMAZON_PRODUCTS_TASK_EXECUTION_CONFLICT");return{providerTaskId:rows[0].taskId,actualSpendUsd:matches[0].actualCostUsd??rows[0].costUsd};},
      async retrieve({member}={}){return executionService.retrieve({artifactId:member.sourcePayload?.acceptanceArtifactId,operation:"AMAZON_PRODUCTS"});},
      async finalize({member}={}){const outcome=await executionService.processProducts({artifactId:member.sourcePayload?.acceptanceArtifactId,authorizationId:member.authorizationId}),effective=actionRepository.getEffectiveOutcomeForArtifact?await actionRepository.getEffectiveOutcomeForArtifact(outcome.artifactId):outcome;return{state:effective.state,assessmentId:effective.assessmentId,providerResultId:effective.canonicalResultId,h052ReviewAvailable:effective.state==="INSUFFICIENT_ASIN_EVIDENCE"};}
    };
  }
  for (const method of requiredMethods) if (typeof sourceOwner?.[method] !== "function") fail("AMAZON_PRODUCTS_DISCOVERY_SOURCE_OWNER_REQUIRED");
  if (!executionService?.artifact || !executionService?.execute || !actionRepository?.getAuthorization || !taskLedger?.getAll || !executionRepository?.getAll || !consumptionRepository?.getAll) fail("AMAZON_PRODUCTS_RECOVERY_DEPENDENCIES_REQUIRED");

  async function resolve({ authorization, permitExecutionTask = true }) {
    const tasks = await taskLedger.getAll(), task = exactTask(tasks, authorization);
    const runs = await executionRepository.getAll(), run = exactRun(runs, authorization);
    if (task) {
      const runTask = run?.tasks?.find(value => value.providerTaskId === task.taskId);
      if (run && (!runTask || runTask.paidActionIntentId !== task.paidActionIntentId)) fail("AMAZON_PRODUCTS_RECOVERY_TASK_EXECUTION_CONFLICT");
      return { providerTaskId: task.taskId, actualSpendUsd: runTask?.actualCostUsd ?? task.costUsd };
    }
    const completed = run?.tasks?.filter(value => value.outcome === "COMPLETED" && value.providerTaskId) ?? [];
    if (completed.length > 1) fail("AMAZON_PRODUCTS_RECOVERY_EXECUTION_TASK_CONFLICT");
    if (completed.length === 1 && permitExecutionTask) return { providerTaskId: completed[0].providerTaskId, actualSpendUsd: completed[0].actualCostUsd };
    if (run && (run.actualSpendUsd !== 0 || completed.length)) fail("AMAZON_PRODUCTS_RECOVERY_EXECUTION_LINEAGE_INVALID");
    return null;
  }

  let recoveryQueue = Promise.resolve();
  const recover = async ({ member, parentAuthorization, childAuthority } = {}) => {
      if (member?.source !== "DATAFORSEO_AMAZON" || member?.operation !== "AMAZON_PRODUCTS") fail("AMAZON_PRODUCTS_RECOVERY_SCOPE_INVALID");
      const authorization = await actionRepository.getAuthorization(childAuthority?.childAuthorizationId);
      if (!authorization) fail("AMAZON_PRODUCTS_RECOVERY_AUTHORIZATION_NOT_FOUND");
      const artifact = await executionService.artifact(authorization.artifactId);
      validateAmazonAcceptanceActionAuthorization(authorization, artifact);
      validateNeutralLineage({ member, parentAuthorization, childAuthority, authorization });
      if (Date.parse(now()) >= Date.parse(authorization.expiresAt)) fail("AMAZON_PRODUCTS_RECOVERY_AUTHORIZATION_EXPIRED");

      const existing = await resolve({ authorization });
      if (existing) return existing;
      const consumed = (await consumptionRepository.getAll()).some(value => value.authorizationId === authorization.authorizationId);
      if (consumed) fail("AMAZON_PRODUCTS_RECOVERY_AUTHORIZATION_CONSUMED");

      const outcome = await executionService.execute({ artifactId: authorization.artifactId, authorizationId: authorization.authorizationId, operation: "AMAZON_PRODUCTS", confirmation: AMAZON_ACCEPTANCE_ACTION_CONFIRMATIONS.EXECUTE_PRODUCTS });
      if (!["COMPLETED", "LIVE_AUTHORIZATION_ALREADY_CONSUMED"].includes(outcome.status)) fail("AMAZON_PRODUCTS_RECOVERY_EXECUTION_FAILED");
      const recovered = await resolve({ authorization });
      if (!recovered) fail("AMAZON_PRODUCTS_RECOVERY_TASK_NOT_FOUND");
      return recovered;
  };

  const delegated = Object.fromEntries(requiredMethods.map(method => [method, (...args) => sourceOwner[method](...args)]));
  return Object.freeze({
    ...delegated,
    recoverPreExecution(input) {
      const result = recoveryQueue.then(() => recover(input), () => recover(input));
      recoveryQueue = result.catch(() => {});
      return result;
    }
  });
}
