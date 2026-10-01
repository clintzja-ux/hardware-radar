import crypto from "node:crypto";
import { RIGHTS_STATES } from "../rights/SourceRightsPolicy.js";
import { assessRetailerDestinationBinding } from "../destinations/RetailerDestination.js";
import { assessCurrentDisplayItemPriceEligibility } from "./CurrentDisplayEligibility.js";

export const MANUAL_CURRENT_PRICE_POLICY_VERSION = "CURRENT-RETAIL-ITEM-PRICE-DISPLAY-QUALIFICATION-P1-1.0";
export const NEWEGG_MANUAL_SOURCE_ID = "NEWEGG_MANUAL_PUBLISHER_OBSERVATION";
export const AMAZON_MANUAL_SOURCE_ID = "AMAZON_MANUAL_PUBLISHER_OBSERVATION";
const SOURCE_BY_RETAILER = Object.freeze({
  "RETAILER-0001": Object.freeze({ retailer: "AMAZON", sourceId: AMAZON_MANUAL_SOURCE_ID, marketplace: "amazon.com", adapterId: "mer_adapter_operator_amazon_manual_current" }),
  "RETAILER-0004": Object.freeze({ retailer: "NEWEGG", sourceId: NEWEGG_MANUAL_SOURCE_ID, marketplace: "newegg.com", adapterId: "mer_adapter_operator_newegg_manual_current" })
});
const HOUR_MS = 60 * 60 * 1000;
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
export const manualCurrentPriceDigest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim().length > 0;
const CONDITIONS = new Set([null, "NEW", "USED", "REFURBISHED", "OPEN_BOX"]);
const normalizedFacts = input => {
  const condition=input?.condition === "UNKNOWN" || input?.condition === undefined ? null : input?.condition;
  const shippingUsd=input?.shippingUsd === "UNKNOWN" || input?.shippingUsd === undefined ? null : input?.shippingUsd;
  const seller=typeof input?.seller === "string" && input.seller.trim() && input.seller.trim().toUpperCase() !== "UNKNOWN" ? input.seller.trim() : null;
  return {condition,shippingUsd,seller,researchUrl:nonBlank(input?.researchUrl)?input.researchUrl.trim():null};
};

export function assessManualCurrentPriceInput({ input, product, retailer, destination, rightsProfile, preparedAt, currentSnapshot = null } = {}) {
  const reasons = [];
  const source = SOURCE_BY_RETAILER[retailer?.id];
  if (!product || product.identity?.atlasProductId !== input?.atlasProductId) reasons.push("ATLAS_PRODUCT_NOT_FOUND");
  if (product && (product.governance?.lifecycleStatus !== "ACTIVE" || product.governance?.publicationStatus !== "READY")) reasons.push("ATLAS_PRODUCT_NOT_ACTIVE_READY");
  if (!source || retailer.status !== "active") reasons.push("MANUAL_RETAILER_NOT_ACTIVE");
  const destinationBinding = assessRetailerDestinationBinding({ destination, product, retailer });
  if (!destinationBinding.eligible || destination?.destinationId !== input?.destinationId || destination?.marketplace !== source?.marketplace) reasons.push(...destinationBinding.reasons, "MANUAL_DESTINATION_NOT_ELIGIBLE");
  if (!Number.isFinite(input?.itemPriceUsd) || input.itemPriceUsd <= 0) reasons.push("ITEM_PRICE_INVALID");
  if (input?.currency !== "USD") reasons.push("CURRENCY_NOT_USD");
  if (!["AVAILABLE", "OUT_OF_STOCK"].includes(input?.availability)) reasons.push("AVAILABILITY_INVALID");
  if (!nonBlank(input?.observedBy) || !nonBlank(input?.evidenceReference)) reasons.push("OPERATOR_PROVENANCE_REQUIRED");
  const facts=normalizedFacts(input);
  if (!CONDITIONS.has(facts.condition)) reasons.push("CONDITION_INVALID");
  if (facts.shippingUsd !== null && (!Number.isFinite(facts.shippingUsd) || facts.shippingUsd < 0)) reasons.push("SHIPPING_INVALID");
  if (input?.seller != null && typeof input.seller !== "string") reasons.push("SELLER_INVALID");
  const observedMs = Date.parse(input?.observedAt), preparedMs = Date.parse(preparedAt);
  if (!Number.isFinite(observedMs) || !Number.isFinite(preparedMs) || observedMs > preparedMs) reasons.push("OBSERVATION_TIME_INVALID");
  else if (preparedMs - observedMs > 36 * HOUR_MS) reasons.push("OBSERVATION_STALE");
  if (rightsProfile?.sourceId !== source?.sourceId || rightsProfile.acquisition?.manual !== RIGHTS_STATES.ALLOWED || rightsProfile.live?.currentObservation !== RIGHTS_STATES.ALLOWED || rightsProfile.live?.publicDisplay !== RIGHTS_STATES.ALLOWED || rightsProfile.live?.comparison !== RIGHTS_STATES.ALLOWED || rightsProfile.retention?.historical !== RIGHTS_STATES.ALLOWED || rightsProfile.derivation?.historicalAnalytics !== RIGHTS_STATES.ALLOWED) reasons.push("SOURCE_RIGHTS_INVALID");
  const current = currentSnapshot?.offers?.find(offer => offer.atlasProductId === input?.atlasProductId && offer.retailerId === retailer?.id);
  if (current?.sourceIdentity?.sourceId && current.sourceIdentity.sourceId !== source?.sourceId) reasons.push("CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED");
  const eligibility = assessCurrentDisplayItemPriceEligibility({ condition: facts.condition, conditionReasons: ["CONDITION_UNKNOWN"], availability: input?.availability, destinationId: destination?.destinationId, publicDisplayAllowed: rightsProfile?.live?.publicDisplay === RIGHTS_STATES.ALLOWED, comparisonAllowed: rightsProfile?.live?.comparison === RIGHTS_STATES.ALLOWED, weakItemPriceAllowed: true });
  if (!eligibility.itemPriceEligible) reasons.push(...eligibility.comparisonReasons.filter(reason => reason !== "CONDITION_UNKNOWN" && reason !== "SOURCE_COMPARISON_NOT_ALLOWED"));
  return freeze({ eligible: [...new Set(reasons)].length === 0, reasons: [...new Set(reasons)], eligibility });
}

export function prepareManualCurrentPriceObservation({ input, product, retailer, destination, rightsProfile, preparedAt, currentSnapshot = null } = {}) {
  const assessment = assessManualCurrentPriceInput({ input, product, retailer, destination, rightsProfile, preparedAt, currentSnapshot });
  if (!assessment.eligible) throw new Error(`MANUAL_CURRENT_PRICE_PREPARE_BLOCKED:${assessment.reasons.join(",")}`);
  const source = SOURCE_BY_RETAILER[retailer.id];
  const facts=normalizedFacts(input), researchUrl=facts.researchUrl ?? destination.destinationUrl;
  const operatorEvidence={acquisitionMode:"MANUAL",rawCondition:input?.operatorEvidence?.rawCondition ?? (input?.condition ?? "UNKNOWN"),normalizedCondition:facts.condition,rawShipping:input?.operatorEvidence?.rawShipping ?? (input?.shippingUsd ?? "UNKNOWN"),normalizedShippingUsd:facts.shippingUsd,rawSeller:input?.operatorEvidence?.rawSeller ?? (input?.seller ?? "UNKNOWN"),normalizedSeller:facts.seller,researchUrl,observedDate:input?.operatorEvidence?.observedDate ?? null,observedTime:input?.operatorEvidence?.observedTime ?? null,timezone:input?.operatorEvidence?.timezone ?? null,enteredObservedAt:input?.operatorEvidence?.enteredObservedAt ?? input?.observedAt,rawReadyForImport:input?.operatorEvidence?.rawReadyForImport ?? null,submittedForProcessing:input?.operatorEvidence?.submittedForProcessing === true};
  const binding = {
    policyVersion: MANUAL_CURRENT_PRICE_POLICY_VERSION,
    sourceId: source.sourceId,
    sourceRightsProfileDigest: manualCurrentPriceDigest(rightsProfile),
    atlasProductId: input.atlasProductId,
    destinationId: destination.destinationId,
    destinationBindingDigest: destination.materialFingerprint,
    retailer: source.retailer,
    retailerId: retailer.id,
    marketplace: source.marketplace,
    itemPriceUsd: input.itemPriceUsd,
    currency: "USD",
    availability: input.availability,
    observedAt: input.observedAt,
    observedBy: input.observedBy.trim(),
    evidenceReference: input.evidenceReference.trim(),
    evidenceNotes: nonBlank(input.evidenceNotes) ? input.evidenceNotes.trim() : null,
    condition: facts.condition, seller: facts.seller, shippingUsd: facts.shippingUsd, feesUsd: null, researchUrl, operatorEvidence,
    itemPriceEligible: assessment.eligibility.itemPriceEligible, comparisonEligible: assessment.eligibility.comparisonEligible,
    comparisonReasons: assessment.eligibility.comparisonReasons
  };
  const bindingDigest = manualCurrentPriceDigest(binding);
  return freeze({
    schemaVersion: "1.0", preparationId: `mer_manualpriceprep_${bindingDigest.slice(0, 24)}`,
    preparedAt, binding, bindingDigest,
    authorizationState: "NOT_AUTHORIZED", executionAuthorized: false, providerSpendAuthorized: false,
    networkOperation: "NONE", paidTaskCreated: false, actualSpendUsd: 0,
    historicalAuthority: false, comparisonAuthority: false, cheapestAuthority: false, pickAuthority: false, publicationAuthority: false
  });
}

export function projectPreparedManualCurrentOffer(preparation, { authorizationId = null } = {}) {
  const b = preparation.binding;
  const source = SOURCE_BY_RETAILER[b.retailerId];
  if (!source || source.sourceId !== b.sourceId) throw new Error("MANUAL_CURRENT_PRICE_SOURCE_BINDING_INVALID");
  const executionLineage = authorizationId === null ? null : { preparationId: preparation.preparationId, preparationDigest: preparation.bindingDigest, authorizationId, sourceRightsProfileDigest: b.sourceRightsProfileDigest, destinationBindingDigest: b.destinationBindingDigest };
  return freeze({ atlasProductId: b.atlasProductId, retailer: source.retailer, retailerId: b.retailerId, marketplace: b.marketplace, priceUsd: b.itemPriceUsd, currency: b.currency, availability: b.availability, condition: b.condition ?? null, shippingUsd: b.shippingUsd ?? null, feesUsd: null, researchUrl: b.researchUrl ?? null, destinationId: b.destinationId, matchStatus: "OPERATOR_CONFIRMED_EXACT_PRODUCT_PAGE", sourceRow: 1, observedAt: b.observedAt, sellerType: null, sellerName: b.seller ?? null, operatorEvidence: b.operatorEvidence ? structuredClone(b.operatorEvidence) : null, sourceIdentity: { adapterId: source.adapterId, sourceId: b.sourceId, rightsProfileId: b.sourceId, historicalRetentionAllowed: true }, ...(executionLineage ? { manualExecutionLineage: executionLineage } : {}), itemPriceEligible: b.itemPriceEligible, comparisonEligible: b.comparisonEligible, comparisonReasons: [...b.comparisonReasons], deliveredCostEligible: false, deliveredCostReasons: b.comparisonEligible ? [b.shippingUsd == null ? "SHIPPING_COST_UNKNOWN" : "FEES_UNKNOWN", ...(b.shippingUsd == null ? ["FEES_UNKNOWN"] : [])] : [...b.comparisonReasons] });
}
