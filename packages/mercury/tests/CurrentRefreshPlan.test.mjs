import assert from "node:assert/strict";
import { prepareCurrentRefreshPlan, validateCurrentRefreshPlan } from "../current-refresh/index.js";

const asOf = "2026-10-01T12:00:00.000Z";
const products = ["one", "two", "three"].map(atlasProductId => ({ identity: { atlasProductId } }));
const offer = (atlasProductId, retailer, observedAt, sourceId = `${retailer}_MANUAL_PUBLISHER_OBSERVATION`) => ({ atlasProductId, retailer, observedAt, itemPriceEligible: true, comparisonEligible: true, sourceIdentity: { sourceId } });
const currentSnapshot = { snapshotId: "mer_display_fixture", observedAt: asOf, offers: [
  offer("one", "AMAZON", "2026-09-30T02:30:00.000Z"),
  offer("two", "AMAZON", "2026-09-30T08:00:00.000Z"),
  offer("two", "NEWEGG", "2026-09-30T08:00:00.000Z"),
  offer("three", "AMAZON", "2026-09-29T00:00:00.000Z")
] };
const destinations = products.flatMap(product => ["RETAILER-0001", "RETAILER-0004"].map(retailerId => ({ atlasProductId: product.identity.atlasProductId, retailerId, status: "ACTIVE" })));
const manualInventory = products.flatMap(product => ["AMAZON", "NEWEGG"].map(retailer => ({ atlasProductId: product.identity.atlasProductId, retailer, classification: "UPDATED_ACTIONABLE" })));
const plan = prepareCurrentRefreshPlan({ products, currentSnapshot, destinations, manualInventory, reusableAmazonProductIds: ["one"], asOf, currentUtcDaySpendUsd: 0.074, requestedMaximumMembers: 6 });
assert.equal(validateCurrentRefreshPlan(plan), true);
assert.equal(plan.authority, "NONE");
assert.equal(plan.providerCalls, 0);
assert.equal(plan.paidTasksCreated, 0);
assert.equal(plan.actualSpendUsd, 0);
assert.equal(plan.costEnvelope.automaticPaidRetries, 0);
assert.equal(plan.expiryBuckets.within6h, 1);
assert.equal(plan.selectedMembers[0].atlasProductId, "one");
assert.equal(plan.selectedMembers[0].urgency, "LOSES_ALL_CURRENT");
assert.equal(plan.selectedMembers.every(value => value.maximumSpendUsd === 0), true);
assert.equal(plan.selectedMembers.some(value => value.atlasProductId === "three" && value.freshnessState === "STALE"), true);
assert.throws(() => validateCurrentRefreshPlan({ ...plan, authority: "EXECUTE" }), /INVALID/);
console.log("Current refresh plan tests passed.");
