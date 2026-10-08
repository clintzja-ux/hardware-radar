import { createHash } from "node:crypto";
import { AUTOMATED_CURRENT_LANE_CERTIFICATIONS, AUTOMATED_CURRENT_LANE_CERTIFICATION_POLICY_VERSION } from "./AutomatedCurrentLaneCertification.js";

export const CURRENT_REFRESH_PLAN_SCHEMA_VERSION = "1.0";
export const CURRENT_REFRESH_PLAN_POLICY_VERSION = "CURRENT-REFRESH-AND-STATIC-RECOMPOSITION-P1-1.0";
export const CURRENT_REFRESH_LANE_STATES = Object.freeze(["ROUTINE_READY", "READY_WITH_REVIEW", "RESEARCH_ONLY", "BLOCKED", "NOT_APPLICABLE"]);
const HOUR = 3_600_000;
const AMAZON_TASK_USD = 0.0015;
const GOOGLE_TASK_USD = 0.001;
const DAILY_CEILING_USD = 0.075;
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => createHash("sha256").update(stable(value)).digest("hex");
const money = value => Number(Number(value).toFixed(4));
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const productId = product => product?.identity?.atlasProductId ?? product?.atlasProductId;
const key = (id, retailer) => `${id}|${retailer}`;
const source = offer => offer?.sourceIdentity?.sourceId ?? "LEGACY_UNSPECIFIED";
const explicit = offer => source(offer) !== "LEGACY_UNSPECIFIED";
const expiry = offer => new Date(Date.parse(offer.observedAt) + 36 * HOUR).toISOString();
const live = (offer, asOf) => explicit(offer) && Date.parse(expiry(offer)) >= Date.parse(asOf) && offer.itemPriceEligible === true && offer.comparisonEligible === true;
const stateForManual = item => item?.classification === "DESTINATION_EXCEPTION" ? "READY_WITH_REVIEW" : ["NEW_ACTIONABLE", "UPDATED_ACTIONABLE"].includes(item?.classification) ? "ROUTINE_READY" : item?.classification === "INCOMPLETE" ? "RESEARCH_ONLY" : "BLOCKED";

function lanesFor({ atlasProductId, retailer, inventoryItem, destinationReady, reusableAmazonIdentity, rakutenReadiness }) {
  if (retailer === "AMAZON") return [
    { lane: "MANUAL_AMAZON", state: stateForManual(inventoryItem), maximumTasks: 0, maximumSpendUsd: 0 },
    { lane: "DATAFORSEO_AMAZON_SELLERS", state: reusableAmazonIdentity ? "BLOCKED" : "NOT_APPLICABLE", maximumTasks: reusableAmazonIdentity ? 1 : 0, maximumSpendUsd: reusableAmazonIdentity ? AMAZON_TASK_USD : 0, certification: AUTOMATED_CURRENT_LANE_CERTIFICATIONS.DATAFORSEO_AMAZON_SELLERS },
    { lane: "DATAFORSEO_AMAZON_PRODUCTS_PLUS_SELLERS", state: "BLOCKED", maximumTasks: 2, maximumSpendUsd: 2 * AMAZON_TASK_USD, certification: AUTOMATED_CURRENT_LANE_CERTIFICATIONS.DATAFORSEO_AMAZON_PRODUCTS_PLUS_SELLERS },
    { lane: "DATAFORSEO_GOOGLE_SHOPPING", state: "NOT_APPLICABLE", maximumTasks: 1, maximumSpendUsd: GOOGLE_TASK_USD, certification: AUTOMATED_CURRENT_LANE_CERTIFICATIONS.DATAFORSEO_GOOGLE_SHOPPING }
  ];
  return [
    { lane: "MANUAL_NEWEGG", state: stateForManual(inventoryItem), maximumTasks: 0, maximumSpendUsd: 0 },
    { lane: "RAKUTEN_NEWEGG", state: rakutenReadiness?.classification === "DETERMINISTIC_SINGLE_BINDING" ? destinationReady ? "ROUTINE_READY" : "READY_WITH_REVIEW" : rakutenReadiness?.classification === "MULTI_SKU_REVIEW_REQUIRED" ? "READY_WITH_REVIEW" : "BLOCKED", maximumTasks: 0, maximumSpendUsd: 0, historicalRetentionAllowed: true, readiness: rakutenReadiness ?? { classification: "NO_BINDING" }, certification: AUTOMATED_CURRENT_LANE_CERTIFICATIONS.RAKUTEN_NEWEGG }
  ];
}

export function prepareCurrentRefreshPlan({ products, currentSnapshot, destinations = [], manualInventory = [], reusableAmazonProductIds = [], rakutenReadinessByProduct = {}, asOf, currentUtcDaySpendUsd = 0, requestedMaximumMembers = 50 } = {}) {
  if (!Array.isArray(products) || products.length === 0 || !Array.isArray(currentSnapshot?.offers) || !Number.isFinite(Date.parse(asOf)) || !Number.isFinite(currentUtcDaySpendUsd) || currentUtcDaySpendUsd < 0) throw new TypeError("CURRENT_REFRESH_PLAN_INPUT_INVALID");
  const destinationKeys = new Set(destinations.filter(value => value?.status !== "INACTIVE").map(value => key(value.atlasProductId, value.retailerId === "RETAILER-0001" ? "AMAZON" : value.retailerId === "RETAILER-0004" ? "NEWEGG" : value.retailerId)));
  const inventory = new Map(manualInventory.map(value => [key(value.atlasProductId, value.retailer), value]));
  const destinationExceptions = manualInventory
    .filter(value => value?.classification === "DESTINATION_EXCEPTION")
    .map(value => ({ atlasProductId: value.atlasProductId, retailer: value.retailer, classification: value.classification, reason: value.error, disposition: "OPERATOR_REVIEW" }))
    .sort((a, b) => a.atlasProductId.localeCompare(b.atlasProductId) || a.retailer.localeCompare(b.retailer));
  const reusable = new Set(reusableAmazonProductIds);
  const offers = currentSnapshot.offers;
  const candidates = [];
  const expiryBuckets = { within6h: 0, within12h: 0, within24h: 0 };
  for (const product of products) {
    const atlasProductId = productId(product);
    if (!atlasProductId) continue;
    const productOffers = offers.filter(value => value.atlasProductId === atlasProductId);
    const fresh = productOffers.filter(value => live(value, asOf));
    const freshRetailers = new Set(fresh.map(value => value.retailer));
    for (const offer of fresh) {
      const hours = (Date.parse(expiry(offer)) - Date.parse(asOf)) / HOUR;
      if (hours <= 6) expiryBuckets.within6h++;
      if (hours <= 12) expiryBuckets.within12h++;
      if (hours <= 24) expiryBuckets.within24h++;
    }
    for (const retailer of ["AMAZON", "NEWEGG"]) {
      const retailerOffers = fresh.filter(value => value.retailer === retailer);
      const nextExpiry = retailerOffers.map(expiry).sort()[0] ?? null;
      const losesAll = fresh.length > 0 && retailerOffers.length === fresh.length;
      const losesOne = freshRetailers.size > 1 && retailerOffers.length > 0;
      const stale = productOffers.some(value => value.retailer === retailer && explicit(value) && !live(value, asOf));
      const uncovered = retailerOffers.length === 0;
      const urgency = losesAll ? "LOSES_ALL_CURRENT" : losesOne ? "LOSES_ONE_RETAILER" : stale || uncovered ? "STALE_OR_UNCOVERED" : "ROUTINE_REFRESH";
      const priority = { LOSES_ALL_CURRENT: 1, LOSES_ONE_RETAILER: 2, STALE_OR_UNCOVERED: 3, ROUTINE_REFRESH: 4 }[urgency];
      const destinationReady = destinationKeys.has(key(atlasProductId, retailer));
      const rakutenReadiness = rakutenReadinessByProduct[atlasProductId] ?? { classification: "NO_BINDING" };
      const lanes = lanesFor({ atlasProductId, retailer, inventoryItem: inventory.get(key(atlasProductId, retailer)), destinationReady, reusableAmazonIdentity: reusable.has(atlasProductId), rakutenReadiness });
      const preferred = lanes.find(value => value.state === "ROUTINE_READY") ?? lanes.find(value => value.state === "READY_WITH_REVIEW") ?? lanes[0];
      const existingSource = retailerOffers[0]?.sourceIdentity?.sourceId ?? null;
      const selectionReason = preferred.lane.startsWith("MANUAL_") && existingSource?.includes("MANUAL") ? "EXISTING_SOURCE_CONTINUITY" : preferred.lane === "RAKUTEN_NEWEGG" ? "RAKUTEN_ROUTINE_READY" : preferred.lane.startsWith("MANUAL_") ? "MANUAL_ONLY_VALID_LANE" : "FIRST_CERTIFIED_ROUTINE_LANE";
      candidates.push({ atlasProductId, retailer, urgency, priority, nextExpiry, freshnessState: retailerOffers.length ? "FRESH" : stale ? "STALE" : "UNCOVERED", destinationReady, identityReadiness: retailer === "AMAZON" ? reusable.has(atlasProductId) ? "REUSABLE_ASIN" : "DISCOVERY_REQUIRED" : rakutenReadiness.classification, manualReviewRequired: preferred.state === "READY_WITH_REVIEW" || lanes.some(value => value.state === "RESEARCH_ONLY"), lanes, proposedLane: preferred.lane, selectionReason, laneState: preferred.state, expectedTaskCount: preferred.maximumTasks, maximumSpendUsd: preferred.maximumSpendUsd });
    }
  }
  candidates.sort((a, b) => a.priority - b.priority || (a.nextExpiry ?? "9999").localeCompare(b.nextExpiry ?? "9999") || a.atlasProductId.localeCompare(b.atlasProductId) || a.retailer.localeCompare(b.retailer));
  const remaining = money(Math.max(0, DAILY_CEILING_USD - currentUtcDaySpendUsd));
  const selected = []; let spend = 0;
  for (const candidate of candidates) {
    if (selected.length >= requestedMaximumMembers) break;
    if (["BLOCKED", "RESEARCH_ONLY", "NOT_APPLICABLE"].includes(candidate.laneState)) continue;
    if (money(spend + candidate.maximumSpendUsd) > remaining) continue;
    selected.push(candidate); spend = money(spend + candidate.maximumSpendUsd);
  }
  const material = { policyVersion: CURRENT_REFRESH_PLAN_POLICY_VERSION, laneCertificationPolicyVersion: AUTOMATED_CURRENT_LANE_CERTIFICATION_POLICY_VERSION, asOf, currentSnapshotId: currentSnapshot.snapshotId, currentSnapshotObservedAt: currentSnapshot.observedAt, expiryBuckets, destinationExceptions, requestedMaximumMembers, selectedMembers: selected, blockedMembers: candidates.filter(value => !selected.includes(value)), costEnvelope: { maximumPaidTasks: selected.reduce((sum, value) => sum + value.expectedTaskCount, 0), maximumSpendUsd: spend, utcDayCeilingUsd: DAILY_CEILING_USD, currentUtcDaySpendUsd: money(currentUtcDaySpendUsd), remainingUtcDayCapacityUsd: remaining, automaticPaidRetries: 0 }, recomposition: { state: "REQUIRED_AFTER_GOVERNED_REFRESH_OR_BEFORE_CURRENT_EXPIRY", releaseAuthority: false, deploymentAuthority: false }, authority: "NONE" };
  const bindingDigest = digest(material);
  return freeze({ schemaVersion: CURRENT_REFRESH_PLAN_SCHEMA_VERSION, planType: "CURRENT_REFRESH_PLAN", planId: `mer_currentrefresh_${bindingDigest.slice(0, 24)}`, bindingDigest, ...material, providerCalls: 0, paidTasksCreated: 0, actualSpendUsd: 0 });
}

export function validateCurrentRefreshPlan(plan) {
  const material = { policyVersion: plan?.policyVersion, laneCertificationPolicyVersion: plan?.laneCertificationPolicyVersion, asOf: plan?.asOf, currentSnapshotId: plan?.currentSnapshotId, currentSnapshotObservedAt: plan?.currentSnapshotObservedAt, expiryBuckets: plan?.expiryBuckets, destinationExceptions: plan?.destinationExceptions, requestedMaximumMembers: plan?.requestedMaximumMembers, selectedMembers: plan?.selectedMembers, blockedMembers: plan?.blockedMembers, costEnvelope: plan?.costEnvelope, recomposition: plan?.recomposition, authority: plan?.authority };
  if (plan?.schemaVersion !== CURRENT_REFRESH_PLAN_SCHEMA_VERSION || plan?.planType !== "CURRENT_REFRESH_PLAN" || plan?.policyVersion !== CURRENT_REFRESH_PLAN_POLICY_VERSION || plan?.bindingDigest !== digest(material) || plan?.planId !== `mer_currentrefresh_${plan.bindingDigest.slice(0, 24)}` || plan?.authority !== "NONE" || plan?.providerCalls !== 0 || plan?.paidTasksCreated !== 0 || plan?.actualSpendUsd !== 0 || plan?.costEnvelope?.automaticPaidRetries !== 0 || plan?.recomposition?.releaseAuthority !== false || plan?.recomposition?.deploymentAuthority !== false) throw new Error("CURRENT_REFRESH_PLAN_INVALID");
  return true;
}
