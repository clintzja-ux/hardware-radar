import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createRecurringPublicationMandate,
  FileRecurringPublicationAuthorityRepository,
  projectUnattendedPublicationHealth,
  UnattendedLivePricePublicationCoordinator,
} from "../publication/UnattendedLivePricePublication.js";

const root = await mkdtemp(path.join(os.tmpdir(), "hr-unattended-publication-"));
const at = "2026-10-17T16:30:00.000Z";
const candidate = {
  candidateId: "candidate-1", artifactId: "artifact-1", certificationId: "cert-1",
  bindingDigest: "a".repeat(64), releaseId: "release-1",
  freshUntil: "2026-10-18T03:15:08.000Z", sentinelStatus: "CERTIFIED", sourceRightsEligible: true,
};

const createRepository = async name => {
  const repository = new FileRecurringPublicationAuthorityRepository({ statePath: path.join(root, `${name}.json`) });
  const mandate = createRecurringPublicationMandate({
    operatorId: `operator:${name}`, validFrom: "2026-10-17T00:00:00Z",
    expiresAt: "2026-11-16T00:00:00Z", createdAt: at,
  });
  await repository.record(mandate);
  return { repository, mandate };
};

const createCoordinator = ({ repository, candidateValue = candidate, overrides = {} }) => {
  let pushes = 0, preparations = 0;
  const coordinator = new UnattendedLivePricePublicationCoordinator({
    repository,
    candidateOwner: { discover: async () => candidateValue },
    preparationOwner: { prepare: async ({ child }) => { preparations += 1; return { authorizationId: child.childAuthorizationId, allowlistValid: true }; } },
    gitOwner: {
      inspectBase: async () => ({ clean: true, localCommit: "base", remoteCommit: "base" }),
      checkpoint: async () => ({ commit: "release", parentCommit: "base", unrelatedPaths: [] }),
      fastForwardMain: async () => { pushes += 1; return { commit: "release" }; },
    },
    deploymentOwner: { observe: async () => ({ status: "SUCCESS" }) },
    liveVerifier: { verify: async () => ({ status: "MATCH" }) },
    now: () => at,
    ...overrides,
  });
  return { coordinator, counts: () => ({ pushes, preparations }) };
};

try {
  const primary = await createRepository("fixture");
  const primaryRun = createCoordinator({ repository: primary.repository });
  const success = await primaryRun.coordinator.run({ mandateId: primary.mandate.mandateId });
  assert.equal(success.status, "LIVE_ACCEPTED");
  assert.deepEqual(primaryRun.counts(), { pushes: 1, preparations: 1 });
  assert.equal((await primaryRun.coordinator.run({ mandateId: primary.mandate.mandateId })).replay, true);
  assert.deepEqual(primaryRun.counts(), { pushes: 1, preparations: 1 });
  assert.equal(projectUnattendedPublicationHealth({ mandate: primary.mandate, operation: success, asOf: at }).liveAcceptance, true);

  const concurrent = await createRepository("concurrent");
  const concurrentRun = createCoordinator({ repository: concurrent.repository, candidateValue: { ...candidate, candidateId: "concurrent" } });
  const concurrentResults = await Promise.allSettled([
    concurrentRun.coordinator.run({ mandateId: concurrent.mandate.mandateId }),
    concurrentRun.coordinator.run({ mandateId: concurrent.mandate.mandateId }),
  ]);
  assert.equal(concurrentResults.filter(result => result.status === "fulfilled").length, 1);
  assert.match(concurrentResults.find(result => result.status === "rejected").reason.message, /OPERATION_BUSY/);
  assert.equal(concurrentRun.counts().preparations, 1);
  assert.equal(concurrentRun.counts().pushes, 1);

  assert.equal((await createCoordinator({ repository: primary.repository, candidateValue: null }).coordinator.run({ mandateId: primary.mandate.mandateId })).status, "NO_ELIGIBLE_CANDIDATE");
  await assert.rejects(() => createCoordinator({ repository: primary.repository, candidateValue: { ...candidate, candidateId: "expired", freshUntil: at } }).coordinator.run({ mandateId: primary.mandate.mandateId }), /EXPIRED/);
  await assert.rejects(() => createCoordinator({ repository: primary.repository, candidateValue: { ...candidate, candidateId: "conflict", sentinelStatus: "CONFLICT" } }).coordinator.run({ mandateId: primary.mandate.mandateId }), /CERTIFICATION/);

  const transitions = await createRepository("transitions");
  await transitions.repository.transition({ mandateId: transitions.mandate.mandateId, status: "PAUSED", operatorId: "operator:transitions", at });
  await assert.rejects(() => transitions.repository.authorizeChild({ mandateId: transitions.mandate.mandateId, candidate, predecessorCommit: "base", at }), /PAUSED/);
  await transitions.repository.transition({ mandateId: transitions.mandate.mandateId, status: "ENABLED", operatorId: "operator:transitions", at });
  await transitions.repository.transition({ mandateId: transitions.mandate.mandateId, status: "REVOKED", operatorId: "operator:transitions", at });
  await assert.rejects(() => transitions.repository.authorizeChild({ mandateId: transitions.mandate.mandateId, candidate, predecessorCommit: "base", at }), /REVOKED/);

  const pending = await createRepository("pending");
  let deploymentStatus = "PENDING";
  const pendingRun = createCoordinator({ repository: pending.repository, candidateValue: { ...candidate, candidateId: "pending" }, overrides: { deploymentOwner: { observe: async () => ({ status: deploymentStatus }) } } });
  await assert.rejects(() => pendingRun.coordinator.run({ mandateId: pending.mandate.mandateId }), /PENDING/);
  deploymentStatus = "SUCCESS";
  assert.equal((await pendingRun.coordinator.run({ mandateId: pending.mandate.mandateId })).status, "LIVE_ACCEPTED");
  assert.equal(pendingRun.counts().preparations, 1);

  const daily = await createRepository("daily");
  await createCoordinator({ repository: daily.repository }).coordinator.run({ mandateId: daily.mandate.mandateId });
  await assert.rejects(() => createCoordinator({ repository: daily.repository, candidateValue: { ...candidate, candidateId: "candidate-2" } }).coordinator.run({ mandateId: daily.mandate.mandateId }), /DAILY_LIMIT/);

  const staleBase = await createRepository("stale-base");
  await assert.rejects(() => createCoordinator({ repository: staleBase.repository, overrides: { gitOwner: { inspectBase: async () => ({ clean: true, localCommit: "old", remoteCommit: "new" }) } } }).coordinator.run({ mandateId: staleBase.mandate.mandateId }), /PREDECESSOR_CONFLICT/);

  const unrelated = await createRepository("unrelated");
  const unrelatedRun = createCoordinator({ repository: unrelated.repository, overrides: { gitOwner: {
    inspectBase: async () => ({ clean: true, localCommit: "base", remoteCommit: "base" }),
    checkpoint: async () => ({ commit: "release", parentCommit: "base", unrelatedPaths: ["packages/mercury/index.js"] }),
  } } });
  await assert.rejects(() => unrelatedRun.coordinator.run({ mandateId: unrelated.mandate.mandateId }), /RELEASE_ONLY_CHECKPOINT_INVALID/);

  const deploymentFailure = await createRepository("deployment-failure");
  const failedRun = createCoordinator({ repository: deploymentFailure.repository, overrides: { deploymentOwner: { observe: async () => ({ status: "FAILED" }) } } });
  await assert.rejects(() => failedRun.coordinator.run({ mandateId: deploymentFailure.mandate.mandateId }), /DEPLOYMENT_FAILED/);
  await assert.rejects(() => failedRun.coordinator.run({ mandateId: deploymentFailure.mandate.mandateId }), /AUTOMATIC_RETRY_PROHIBITED/);

  const liveMismatch = await createRepository("live-mismatch");
  await assert.rejects(() => createCoordinator({ repository: liveMismatch.repository, overrides: { liveVerifier: { verify: async () => ({ status: "MISMATCH" }) } } }).coordinator.run({ mandateId: liveMismatch.mandate.mandateId }), /LIVE_ACCEPTANCE_INVALID/);

  assert.equal(primary.mandate.automaticRetries, 0);
  assert.equal(primary.mandate.automaticRollback, false);
  assert.equal(primary.mandate.sourceCodeChanges, false);
  console.log("Unattended live-price publication tests passed: success, replay, authority, Git, deployment, and live-acceptance controls.");
} finally {
  await rm(root, { recursive: true, force: true });
}
