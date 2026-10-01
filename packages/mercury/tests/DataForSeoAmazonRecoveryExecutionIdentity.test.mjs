import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { amazonAcceptanceAuthorizationRequest, createAmazonAcceptanceActionAuthorization, createProductionDataForSeoTaskOwner, defaultSourceRightsRegistry, prepareAmazonHistoricalAcceptance, selectAmazonHistoricalAcceptanceProduct } from "../index.js";

let cases = 0;
const firstAt = "2026-09-12T18:00:00.000Z", recoveryAt = "2026-09-12T18:05:00.000Z";
const product = { identity: { atlasProductId: "ram_recovery_identity_fixture", brand: "Corsair", manufacturerPartNumber: "CMH32GX5M2B6000C38" }, governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" }, extension: { data: { capacity: { capacityGb: 32, moduleCount: 2 }, classification: { memoryType: "DDR5", formFactor: "DIMM" }, performance: { dataRateMtps: 6000 }, physical: {} } } };
const selection = selectAmazonHistoricalAcceptanceProduct({ atlasProducts: [product], destinations: [{ destinationId: "fixture-destination", atlasProductId: product.identity.atlasProductId, retailerId: "RETAILER-0001", marketplace: "amazon.com", retailerListingId: "B0CQQVNCB6", status: "ACTIVE" }], historicalObservations: [] });
const artifact = prepareAmazonHistoricalAcceptance({ asOf: firstAt, selection, rightsProfile: defaultSourceRightsRegistry.require("DATAFORSEO_AMAZON"), currentUtcDaySpendUsd: 0 });
const original = createAmazonAcceptanceActionAuthorization({ artifact, operation: "AMAZON_PRODUCTS", atlasProduct: product, operator: "operator:first", reason: "initial attempt", authorizedAt: firstAt, expiresAt: "2026-09-12T18:15:00.000Z", currentUtcDaySpendUsd: 0 });
const recovery = createAmazonAcceptanceActionAuthorization({ artifact, operation: "AMAZON_PRODUCTS", atlasProduct: product, operator: "operator:reviewer", reason: "reviewed safe recovery", authorizedAt: recoveryAt, expiresAt: "2026-09-12T18:20:00.000Z", currentUtcDaySpendUsd: 0, predecessorAuthorizationId: original.authorizationId, recovery: { assessmentId: "mer_paidrecovery_fixture", classification: "SAFE_NO_PROVIDER_TASK", predecessorExecutionRunId: "run-original", reviewedBy: "operator:reviewer" } });
assert.notEqual(recovery.plan.planId, original.plan.planId);
assert.equal(recovery.plan.decisions[0].execution.paidActionIntentId, original.plan.decisions[0].execution.paidActionIntentId);
assert.deepEqual(recovery.plan.decisions[0].execution.recoveryAttempt, { predecessorAuthorizationId: original.authorizationId, predecessorExecutionRunId: "run-original", assessmentId: "mer_paidrecovery_fixture", classification: "SAFE_NO_PROVIDER_TASK" });
cases += 3;

const sellerOutcome = { state: "STRONG_UNIQUE_ASIN", artifactId: artifact.acceptanceArtifactId, governedAsin: "B0CQQVNCB6" };
const sellerOriginal = createAmazonAcceptanceActionAuthorization({ artifact, operation: "AMAZON_SELLERS", atlasProduct: product, productsOutcome: sellerOutcome, operator: "operator:first", reason: "initial sellers", authorizedAt: firstAt, expiresAt: "2026-09-12T18:15:00.000Z", currentUtcDaySpendUsd: 0 });
const sellerRecovery = createAmazonAcceptanceActionAuthorization({ artifact, operation: "AMAZON_SELLERS", atlasProduct: product, productsOutcome: sellerOutcome, operator: "operator:reviewer", reason: "reviewed sellers recovery", authorizedAt: recoveryAt, expiresAt: "2026-09-12T18:20:00.000Z", currentUtcDaySpendUsd: 0, predecessorAuthorizationId: sellerOriginal.authorizationId, recovery: { assessmentId: "mer_paidrecovery_seller_fixture", classification: "SAFE_NO_PROVIDER_TASK", predecessorExecutionRunId: "run-seller-original", reviewedBy: "operator:reviewer" } });
assert.notEqual(sellerRecovery.plan.planId, sellerOriginal.plan.planId);
assert.equal(sellerRecovery.plan.decisions[0].execution.paidActionIntentId, sellerOriginal.plan.decisions[0].execution.paidActionIntentId);
cases += 2;

const root = await mkdtemp(path.join(os.tmpdir(), "hr-h050d-"));
try {
  let calls = 0;
  const acquisitionService = { async createAmazonProductsTask() { calls++; if (calls === 1) throw new TypeError("fixture client method is not a function"); return { taskId: "provider-task-recovery", costUsd: .0015, createdStatus: 20100 }; } };
  const owner = createProductionDataForSeoTaskOwner({ operation: "AMAZON_PRODUCTS", stateRoot: root, acquisitionService, now: () => recoveryAt });
  const failed = await owner.execute({ request: amazonAcceptanceAuthorizationRequest(original), authorizedAt: firstAt });
  assert.equal(failed.status, "FAILED"); assert.equal(failed.execution.run.actualSpendUsd, 0); assert.equal(failed.execution.run.tasks[0].providerTaskId, null); cases += 3;
  const legacyReplay = await owner.execute({ request: { ...amazonAcceptanceAuthorizationRequest(original), requestId: "legacy-recovery-authorization" }, authorizedAt: recoveryAt });
  assert.equal(legacyReplay.status, "DUPLICATE"); assert.equal(legacyReplay.execution.run.runId, failed.execution.run.runId); assert.equal(calls, 1); cases += 3;
  const corrected = await owner.execute({ request: amazonAcceptanceAuthorizationRequest(recovery), authorizedAt: recoveryAt });
  assert.equal(corrected.status, "COMPLETED"); assert.notEqual(corrected.execution.run.runId, failed.execution.run.runId); assert.equal(corrected.execution.run.paidActionIntentId, failed.execution.run.paidActionIntentId); assert.equal(corrected.execution.run.tasks[0].providerTaskId, "provider-task-recovery"); assert.equal(corrected.execution.run.actualSpendUsd, .0015); assert.equal(calls, 2); cases += 6;
  assert.equal((await owner.execute({ request: amazonAcceptanceAuthorizationRequest(recovery), authorizedAt: recoveryAt })).status, "LIVE_AUTHORIZATION_ALREADY_CONSUMED"); assert.equal(calls, 2); const runs = await owner.executionRepository.getAll(); assert.equal(runs.length, 2); assert.equal(runs.flatMap(run => run.tasks).filter(task => task.providerTaskId).length, 1); cases += 4;
} finally { await rm(root, { recursive: true, force: true }); }

console.log(`DataForSEO Amazon recovery execution identity tests passed: ${cases} cases.`);
