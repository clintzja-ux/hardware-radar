import assert from "node:assert/strict";
import { prepareCurrentRefreshPlan, prepareRakutenCurrentRefresh, validateCurrentRefreshPlan, validateRakutenCurrentRefreshPreparation } from "../current-refresh/index.js";

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
assert.equal(plan.laneCertificationPolicyVersion, "AUTOMATED-CURRENT-REFRESH-LANE-CERTIFICATION-P1-1.0");
assert.ok(plan.selectedMembers.every(value => typeof value.selectionReason === "string" && typeof value.identityReadiness === "string"));
const amazon = [...plan.selectedMembers, ...plan.blockedMembers].find(value => value.retailer === "AMAZON");
assert.equal(amazon.lanes.find(value => value.lane === "DATAFORSEO_AMAZON_PRODUCTS_PLUS_SELLERS").state, "BLOCKED");
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
const rakutenPlan = prepareCurrentRefreshPlan({ products, currentSnapshot, destinations, manualInventory: manualInventory.filter(value => value.retailer !== "NEWEGG"), reusableAmazonProductIds: [], rakutenReadinessByProduct: { one: { classification: "DETERMINISTIC_SINGLE_BINDING", retailerListingId: "N82E16800000001", destinationId: "mer_dest_fixture" }, two: { classification: "MULTI_SKU_REVIEW_REQUIRED" }, three: { classification: "NO_BINDING" } }, asOf, requestedMaximumMembers: 6 });
const rakutenOne = [...rakutenPlan.selectedMembers, ...rakutenPlan.blockedMembers].find(value => value.atlasProductId === "one" && value.retailer === "NEWEGG");
assert.equal(rakutenOne.proposedLane, "RAKUTEN_NEWEGG");
assert.equal(rakutenOne.selectionReason, "RAKUTEN_ROUTINE_READY");
assert.equal([...rakutenPlan.selectedMembers, ...rakutenPlan.blockedMembers].find(value => value.atlasProductId === "two" && value.retailer === "NEWEGG").lanes.find(value => value.lane === "RAKUTEN_NEWEGG").state, "READY_WITH_REVIEW");
assert.equal([...rakutenPlan.selectedMembers, ...rakutenPlan.blockedMembers].find(value => value.atlasProductId === "three" && value.retailer === "NEWEGG").lanes.find(value => value.lane === "RAKUTEN_NEWEGG").state, "BLOCKED");
const preparation = prepareRakutenCurrentRefresh({ plan: rakutenPlan, preparedAt: asOf, members: [{ atlasProductId: "one", retailerId: "RETAILER-0004", source: "RAKUTEN_NEWEGG_PRODUCT_CATALOG", identityBinding: "DETERMINISTIC_SINGLE_BINDING", destinationId: "mer_dest_fixture", retailerListingId: "N82E16800000001", freshnessTarget: asOf, sourceRightsProfileId: "RAKUTEN_NEWEGG_PRODUCT_CATALOG_CURRENT_COMMERCE_1_0" }] });
assert.equal(validateRakutenCurrentRefreshPreparation(preparation), true);
assert.equal(preparation.authority, "NONE");
assert.equal(preparation.historyEligibility, false);
assert.equal(preparation.maximumProviderOperations, 1);
assert.throws(() => prepareRakutenCurrentRefresh({ plan: rakutenPlan, preparedAt: asOf, members: [{ atlasProductId: "two" }] }), /NOT_ROUTINE_READY/);
console.log("Current refresh plan tests passed.");
