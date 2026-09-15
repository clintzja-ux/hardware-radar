import { amazonAcceptanceDigest } from "./AmazonHistoricalAcceptancePreparation.js";
import { AMAZON_ACCEPTANCE_ACTION_CONFIRMATIONS, validateAmazonAcceptanceActionAuthorization } from "./AmazonAcceptanceExecution.js";

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
export function createProductionAmazonProductsDiscoverySourceOwner({ sourceOwner, executionService, actionRepository, taskLedger, executionRepository, consumptionRepository, now = () => new Date().toISOString() } = {}) {
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
