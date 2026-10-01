import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { AMAZON_ACCEPTANCE_ACTION_CONFIRMATIONS, AmazonAcceptanceExecutionService, FileAmazonAcceptanceActionRepository, createAmazonAcceptanceActionAuthorization, defaultSourceRightsRegistry, prepareAmazonHistoricalAcceptance, selectAmazonHistoricalAcceptanceProduct } from "../index.js";

let cases = 0;
const now = "2026-09-12T18:10:00.000Z";
const product = { identity: { atlasProductId: "ram_recovery_state_fixture", brand: "Corsair", manufacturerPartNumber: "CMH32GX5M2B6000C38" }, governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" }, extension: { data: { capacity: { capacityGb: 32, moduleCount: 2 }, classification: { memoryType: "DDR5", formFactor: "DIMM" }, performance: { dataRateMtps: 6000 }, physical: {} } } };
const selection = selectAmazonHistoricalAcceptanceProduct({ atlasProducts: [product], destinations: [{ destinationId: "fixture-destination", atlasProductId: product.identity.atlasProductId, retailerId: "RETAILER-0001", marketplace: "amazon.com", retailerListingId: "B0CQQVNCB6", status: "ACTIVE" }], historicalObservations: [] });
const artifact = prepareAmazonHistoricalAcceptance({ asOf: "2026-09-12T18:00:00.000Z", selection, rightsProfile: defaultSourceRightsRegistry.require("DATAFORSEO_AMAZON"), currentUtcDaySpendUsd: 0 });
const auth1 = createAmazonAcceptanceActionAuthorization({ artifact, operation: "AMAZON_PRODUCTS", atlasProduct: product, operator: "operator:first", reason: "initial", authorizedAt: "2026-09-12T18:00:00.000Z", expiresAt: "2026-09-12T18:30:00.000Z", currentUtcDaySpendUsd: 0 });
const auth2 = { ...auth1, authorizationId: "legacy-recovery-auth-2", predecessorAuthorizationId: auth1.authorizationId, operator: "operator:recovery", reason: "legacy reviewed recovery", authorizedAt: "2026-09-12T18:05:00.000Z", expiresAt: "2026-09-12T18:35:00.000Z", recovery: { assessmentId: "legacy-assessment", classification: "SAFE_NO_PROVIDER_TASK", predecessorExecutionRunId: "run-1", reviewedBy: "operator:recovery" } };
const run = { runId: "run-1", planId: auth1.plan.planId, status: "FAILED", actualSpendUsd: 0, tasks: [{ paidActionIntentId: auth1.plan.decisions[0].execution.paidActionIntentId, providerTaskId: null, actualCostUsd: 0, failure: { failureStage: "DURING_PROVIDER_REQUEST", causeChain: [{ name: "TypeError", message: "fixture method is not a function" }] } }] };

const root = await mkdtemp(path.join(os.tmpdir(), "hr-h050e-"));
try {
  const repository = new FileAmazonAcceptanceActionRepository({ statePath: path.join(root, "actions.json") });
  await repository.recordAuthorization(auth1);
  await assert.rejects(() => repository.recordAuthorization(auth2, { asOf: "2026-09-12T18:05:00.000Z", expectedPredecessorIds: [auth1.authorizationId] }), /AUTHORIZATION_ACTIVE/);
  cases++;
  assert.equal((await repository.recordAuthorization(auth2, { asOf: "2026-09-12T18:05:00.000Z", expectedPredecessorIds: [auth1.authorizationId], consumedAuthorizationIds: [auth1.authorizationId] })).status, "RECORDED");
  cases++;

  const consumptions = [{ authorizationId: auth1.authorizationId, planId: auth1.plan.planId }, { authorizationId: auth2.authorizationId, planId: auth2.plan.planId }];
  const service = new AmazonAcceptanceExecutionService({ artifactRepository: { getById: async () => artifact }, actionRepository: repository, productRepository: { getById: async () => product }, rightsRegistry: defaultSourceRightsRegistry, spendResolver: async () => 0, taskOwners: {}, retrievalServices: {}, resultRepository: { findByTask: async () => null }, taskLedger: { getAll: async () => [] }, consumptionRepository: { getAll: async () => structuredClone(consumptions) }, executionRepository: { getAll: async () => [structuredClone(run)] }, now: () => now });
  const input = { artifactId: artifact.acceptanceArtifactId, operation: "AMAZON_PRODUCTS", predecessorAuthorizationId: auth2.authorizationId, predecessorExecutionRunId: run.runId, operator: "operator:second-review", reason: "reviewed consumed legacy recovery", expiresAt: "2026-09-12T18:40:00.000Z", confirmation: AMAZON_ACCEPTANCE_ACTION_CONFIRMATIONS.RECOVER_PRODUCTS };
  const auth3Result = await service.authorizeRecovery(input), auth3 = auth3Result.value;
  assert.equal(auth3Result.status, "RECORDED"); assert.equal(auth3.predecessorAuthorizationId, auth2.authorizationId); assert.notEqual(auth3.plan.planId, auth2.plan.planId); assert.equal(auth3.plan.decisions[0].execution.paidActionIntentId, auth2.plan.decisions[0].execution.paidActionIntentId); cases += 4;
  assert.equal((await service.authorizeRecovery(input)).status, "DUPLICATE"); cases++;
  await assert.rejects(() => service.authorizeRecovery({ ...input, reason: "conflicting review" }), /AUTHORIZATION_ACTIVE/); cases++;

  const raceRepository = new FileAmazonAcceptanceActionRepository({ statePath: path.join(root, "race.json") }); await raceRepository.recordAuthorization(auth1); await raceRepository.recordAuthorization(auth2, { asOf: "2026-09-12T18:05:00.000Z", expectedPredecessorIds: [auth1.authorizationId], consumedAuthorizationIds: [auth1.authorizationId] });
  const candidates = [{ ...auth3, authorizationId: "race-auth-a" }, { ...auth3, authorizationId: "race-auth-b", operator: "operator:b" }];
  const settled = await Promise.allSettled(candidates.map(value => raceRepository.recordAuthorization(value, { asOf: now, expectedPredecessorIds: [auth1.authorizationId, auth2.authorizationId], consumedAuthorizationIds: [auth1.authorizationId, auth2.authorizationId] })));
  assert.equal(settled.filter(result => result.status === "fulfilled").length, 1); assert.equal((await raceRepository.getAuthorizationsForAction(artifact.acceptanceArtifactId, "AMAZON_PRODUCTS")).length, 3); cases += 2;
  await assert.rejects(() => raceRepository.recordAuthorization({ ...auth3, authorizationId: "bad-consumption" }, { asOf: now, expectedPredecessorIds: [auth1.authorizationId, auth2.authorizationId, "race-auth-a"], consumedAuthorizationIds: ["not-in-lineage"] }), /CONSUMPTION_LINEAGE_INVALID/); cases++;
} finally { await rm(root, { recursive: true, force: true }); }

console.log(`DataForSEO Amazon recovery authorization-state tests passed: ${cases} cases.`);
