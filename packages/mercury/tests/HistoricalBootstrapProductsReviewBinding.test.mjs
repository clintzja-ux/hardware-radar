import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  createDurableProductsReview,
  createHistoricalBootstrapCheckpoint,
  STAGE_A_BOOTSTRAP_ARTIFACT_ID
} from "../index.js";

const stable = value => Array.isArray(value)
  ? `[${value.map(stable).join(",")}]`
  : value && typeof value === "object"
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`
    : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const at = "2026-09-11T12:00:00.000Z";
const selected = ["fixture-ddr5", "fixture-ddr4", "fixture-sodimm"].map(atlasProductId => ({
  atlasProductId,
  providerWorkPlan: [
    { operation: "PRODUCTS", paid: true, required: true, conditional: false },
    { operation: "PRODUCT_INFO", paid: true, required: false, conditional: true },
    { operation: "SELLERS", paid: true, required: true, conditional: false }
  ],
  maximumPaidTasks: 3,
  maximumSpendUsd: 0.003
}));
const material = {
  policyVersion: "MERCURY-HISTORY-019-1.0",
  asOf: at,
  sourceId: "DATAFORSEO_GOOGLE_SHOPPING",
  acquisitionPortfolioCycleId: "mer_acqportfolio_" + "a".repeat(24),
  acquisitionPortfolioBindingDigest: "b".repeat(64),
  selected,
  stopConditions: [],
  costEnvelope: {
    perTaskCostCeilingUsd: 0.001,
    maximumPaidTasks: 9,
    maximumProviderSpendUsd: 0.009,
    utcDaySpendCeilingUsd: 0.01
  },
  rightsStatus: "ALLOWED"
};
const bindingDigest = digest(material);
const artifact = {
  schemaVersion: "1.0",
  preparationType: "ATLAS_HISTORICAL_BOOTSTRAP",
  bootstrapPreparationId: `mer_histbootstrap_${digest({ bindingDigest }).slice(0, 24)}`,
  preparedAt: at,
  ...material,
  bindingDigest,
  authorizationState: "NOT_AUTHORIZED",
  executionAuthorized: false,
  providerSpendAuthorized: false,
  networkOperation: "NONE",
  paidTaskCreated: false,
  actualSpendUsd: 0
};

// The certified Stage-A identity is fixed; use its shape without mutating the real artifact.
artifact.bootstrapPreparationId = STAGE_A_BOOTSTRAP_ARTIFACT_ID;
assert.equal(artifact.sourceRightsProfileDigest, undefined);
assert.equal(artifact.sourceRightsDigest, undefined);
assert.equal(selected.every(row => row.sourceRightsDigest === undefined), true);

// H022 cannot preserve a value that H019 did not bind.
assert.throws(() => createHistoricalBootstrapCheckpoint({ artifact, createdAt: at }), /ARTIFACT_INVALID/);

const result = { id: "products-task", result: [{ items: [] }] };
const assessment = {
  providerTaskId: "products-task",
  identityState: "EXACT_OR_GOVERNED_MATCH",
  resultIdentity: { recommendationStatus: "RECOMMENDED" },
  reasons: []
};
const incompleteTask = {
  portfolioCycleId: artifact.acquisitionPortfolioCycleId,
  checkpointId: "mer_histbootcp_fixture",
  atlasProductId: selected[0].atlasProductId,
  query: "FIXTURE-MPN"
};
const review = createDurableProductsReview({ task: incompleteTask, result, assessment, retrievedAt: at });
assert.equal(review.sourceRightsDigest, undefined);
assert.equal(typeof review.reviewId, "string");
assert.equal(typeof review.materialDigest, "string");
assert.notEqual(review.identityState, undefined);

console.log("Historical bootstrap PRODUCTS review binding tests passed (8 cases).");
