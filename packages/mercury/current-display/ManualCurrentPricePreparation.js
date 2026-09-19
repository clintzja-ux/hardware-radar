import crypto from "node:crypto";
import { RIGHTS_STATES } from "../rights/SourceRightsPolicy.js";
import { assessRetailerDestinationBinding } from "../destinations/RetailerDestination.js";
import { assessCurrentDisplayItemPriceEligibility } from "./CurrentDisplayEligibility.js";

export const MANUAL_CURRENT_PRICE_POLICY_VERSION = "CURRENT-RETAIL-ITEM-PRICE-DISPLAY-QUALIFICATION-P1-1.0";
export const NEWEGG_MANUAL_SOURCE_ID = "NEWEGG_MANUAL_PUBLISHER_OBSERVATION";
const HOUR_MS = 60 * 60 * 1000;
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim().length > 0;

export function assessManualCurrentPriceInput({ input, product, retailer, destination, rightsProfile, preparedAt, currentSnapshot = null } = {}) {
  const reasons = [];
  if (!product || product.identity?.atlasProductId !== input?.atlasProductId) reasons.push("ATLAS_PRODUCT_NOT_FOUND");
  if (product && (product.governance?.lifecycleStatus !== "ACTIVE" || product.governance?.publicationStatus !== "READY")) reasons.push("ATLAS_PRODUCT_NOT_ACTIVE_READY");
  if (!retailer || retailer.id !== "RETAILER-0004" || retailer.status !== "active") reasons.push("NEWEGG_RETAILER_NOT_ACTIVE");
  const destinationBinding = assessRetailerDestinationBinding({ destination, product, retailer });
  if (!destinationBinding.eligible || destination?.destinationId !== input?.destinationId || destination?.marketplace !== "newegg.com") reasons.push(...destinationBinding.reasons, "NEWEGG_DESTINATION_NOT_ELIGIBLE");
  if (!Number.isFinite(input?.itemPriceUsd) || input.itemPriceUsd <= 0) reasons.push("ITEM_PRICE_INVALID");
  if (input?.currency !== "USD") reasons.push("CURRENCY_NOT_USD");
  if (!["AVAILABLE", "OUT_OF_STOCK"].includes(input?.availability)) reasons.push("AVAILABILITY_INVALID");
  if (!nonBlank(input?.observedBy) || !nonBlank(input?.evidenceReference)) reasons.push("OPERATOR_PROVENANCE_REQUIRED");
  const observedMs = Date.parse(input?.observedAt), preparedMs = Date.parse(preparedAt);
  if (!Number.isFinite(observedMs) || !Number.isFinite(preparedMs) || observedMs > preparedMs) reasons.push("OBSERVATION_TIME_INVALID");
  else if (preparedMs - observedMs > 36 * HOUR_MS) reasons.push("OBSERVATION_STALE");
  if (rightsProfile?.sourceId !== NEWEGG_MANUAL_SOURCE_ID || rightsProfile.acquisition?.manual !== RIGHTS_STATES.ALLOWED || rightsProfile.live?.currentObservation !== RIGHTS_STATES.ALLOWED || rightsProfile.live?.publicDisplay !== RIGHTS_STATES.ALLOWED || rightsProfile.live?.comparison !== RIGHTS_STATES.BLOCKED || rightsProfile.retention?.historical !== RIGHTS_STATES.BLOCKED) reasons.push("SOURCE_RIGHTS_INVALID");
  const current = currentSnapshot?.offers?.find(offer => offer.atlasProductId === input?.atlasProductId && offer.retailerId === "RETAILER-0004");
  if (current?.sourceIdentity?.sourceId && current.sourceIdentity.sourceId !== NEWEGG_MANUAL_SOURCE_ID) reasons.push("CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED");
  const eligibility = assessCurrentDisplayItemPriceEligibility({ condition: null, conditionReasons: ["CONDITION_UNKNOWN"], availability: input?.availability, destinationId: destination?.destinationId, publicDisplayAllowed: rightsProfile?.live?.publicDisplay === RIGHTS_STATES.ALLOWED, comparisonAllowed: rightsProfile?.live?.comparison === RIGHTS_STATES.ALLOWED, weakItemPriceAllowed: true });
  if (!eligibility.itemPriceEligible) reasons.push(...eligibility.comparisonReasons.filter(reason => reason !== "CONDITION_UNKNOWN" && reason !== "SOURCE_COMPARISON_NOT_ALLOWED"));
  return freeze({ eligible: [...new Set(reasons)].length === 0, reasons: [...new Set(reasons)], eligibility });
}

export function prepareManualCurrentPriceObservation({ input, product, retailer, destination, rightsProfile, preparedAt, currentSnapshot = null } = {}) {
  const assessment = assessManualCurrentPriceInput({ input, product, retailer, destination, rightsProfile, preparedAt, currentSnapshot });
  if (!assessment.eligible) throw new Error(`MANUAL_CURRENT_PRICE_PREPARE_BLOCKED:${assessment.reasons.join(",")}`);
  const binding = {
    policyVersion: MANUAL_CURRENT_PRICE_POLICY_VERSION,
    sourceId: NEWEGG_MANUAL_SOURCE_ID,
    sourceRightsProfileDigest: digest(rightsProfile),
    atlasProductId: input.atlasProductId,
    destinationId: destination.destinationId,
    destinationBindingDigest: destination.materialFingerprint,
    retailerId: "RETAILER-0004",
    marketplace: "newegg.com",
    itemPriceUsd: input.itemPriceUsd,
    currency: "USD",
    availability: input.availability,
    observedAt: input.observedAt,
    observedBy: input.observedBy.trim(),
    evidenceReference: input.evidenceReference.trim(),
    evidenceNotes: nonBlank(input.evidenceNotes) ? input.evidenceNotes.trim() : null,
    condition: null, seller: null, shippingUsd: null, feesUsd: null,
    itemPriceEligible: true, comparisonEligible: false,
    comparisonReasons: assessment.eligibility.comparisonReasons
  };
  const bindingDigest = digest(binding);
  return freeze({
    schemaVersion: "1.0", preparationId: `mer_manualpriceprep_${bindingDigest.slice(0, 24)}`,
    preparedAt, binding, bindingDigest,
    authorizationState: "NOT_AUTHORIZED", executionAuthorized: false, providerSpendAuthorized: false,
    networkOperation: "NONE", paidTaskCreated: false, actualSpendUsd: 0,
    historicalAuthority: false, comparisonAuthority: false, cheapestAuthority: false, pickAuthority: false, publicationAuthority: false
  });
}

export function projectPreparedManualCurrentOffer(preparation) {
  const b = preparation.binding;
  return freeze({ atlasProductId: b.atlasProductId, retailer: "NEWEGG", retailerId: b.retailerId, marketplace: b.marketplace, priceUsd: b.itemPriceUsd, currency: b.currency, availability: b.availability, condition: null, shippingUsd: null, feesUsd: null, researchUrl: null, destinationId: b.destinationId, matchStatus: "OPERATOR_CONFIRMED_EXACT_PRODUCT_PAGE", sourceRow: 1, observedAt: b.observedAt, sellerType: null, sellerName: null, sourceIdentity: { adapterId: "mer_adapter_operator_newegg_manual_current", sourceId: b.sourceId, rightsProfileId: b.sourceId, historicalRetentionAllowed: false }, itemPriceEligible: true, comparisonEligible: false, comparisonReasons: [...b.comparisonReasons], deliveredCostEligible: false, deliveredCostReasons: [...b.comparisonReasons] });
}
