import { createCurrentOfferProjection } from "./CurrentOfferModel.js";

export const DATAFORSEO_AMAZON_SELLERS_CURRENT_OFFER_ADAPTER_VERSION = "DATAFORSEO-AMAZON-SELLERS-MULTI-SELLER-ADAPTER-P1-1.0";
export const DATAFORSEO_AMAZON_SELLERS_OFFER_PRESENCE_POLICY_VERSION = "DATAFORSEO-AMAZON-SELLERS-OFFER-PRESENCE-P1-1.0";
export const AMAZON_COMMERCE_CHANNEL = Object.freeze({ retailer: "AMAZON", retailerId: "RETAILER-0001", marketplace: "amazon.com" });

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const text = value => typeof value === "string" && value.trim() ? value.trim() : null;
const validTime = value => text(value) !== null && Number.isFinite(Date.parse(value));
const exactAsin = value => typeof value === "string" && /^[A-Z0-9]{10}$/.test(value) ? value : null;

function normalizeCondition(value) {
  const condition = text(value)?.toUpperCase() ?? null;
  if (condition === "NEW") return "NEW";
  if (condition?.startsWith("USED")) return condition.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return "UNKNOWN";
}

function sellerProfile(value) {
  const raw = text(value);
  if (!raw) return { classification: "ABSENT", sourceLocalSellerId: null, normalizedUrl: null, rawUrl: null };
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const sellerId = text(url.searchParams.get("seller"));
    const profile = host === "amazon.com" && url.pathname.startsWith("/gp/aag");
    return {
      classification: profile ? "SELLER_PROFILE_ONLY" : host === "amazon.com" && /\/dp\/[A-Z0-9]{10}/i.test(url.pathname) ? "PRODUCT_PAGE" : "UNKNOWN",
      sourceLocalSellerId: profile ? sellerId : null,
      normalizedUrl: profile ? `https://amazon.com${url.pathname}${url.search}` : null,
      rawUrl: raw
    };
  } catch { return { classification: "UNKNOWN", sourceLocalSellerId: null, normalizedUrl: null, rawUrl: raw }; }
}

function classifySeller(name) {
  if (!name) return "UNKNOWN";
  return name === "Amazon.com" ? "KNOWN_FIRST_PARTY_AMAZON" : "KNOWN_THIRD_PARTY";
}

const NEGATIVE_DELIVERY_SIGNAL = /(?:currently\s+unavailable|cannot\s+(?:ship|deliver)|can['’]?t\s+(?:ship|deliver)|delivery\s+unavailable|out[\s-]*of[\s-]*stock|temporarily\s+unavailable|back[\s-]*order|pre[\s-]*order|does\s+not\s+(?:ship|deliver)|won['’]?t\s+(?:ship|deliver))/i;

export function assessDataForSeoAmazonSellerOfferPresence({ delivery, price, currency, observedAt } = {}) {
  const message = text(delivery?.delivery_message);
  const deliveryFrom = text(delivery?.delivery_date_from);
  const deliveryTo = text(delivery?.delivery_date_to);
  const fastestFrom = text(delivery?.fastest_delivery_date_from);
  const fastestTo = text(delivery?.fastest_delivery_date_to);
  const dates = [deliveryFrom, deliveryTo, fastestFrom, fastestTo].filter(Boolean);
  const malformedDate = dates.some(value => !validTime(value));
  const observationTimeValid = validTime(observedAt);
  const observedUtcDay = observationTimeValid ? Date.parse(`${new Date(observedAt).toISOString().slice(0, 10)}T00:00:00.000Z`) : null;
  const deliveryDateIsCurrentOrFuture = deliveryFrom !== null && validTime(deliveryFrom) && observationTimeValid && Date.parse(deliveryFrom) >= observedUtcDay;
  const negative = message !== null && NEGATIVE_DELIVERY_SIGNAL.test(message);
  const priceReady = Number.isFinite(price) && price >= 0 && currency === "USD";
  const affirmativeDelivery = message !== null && deliveryDateIsCurrentOrFuture && !malformedDate && !negative;
  const state = negative ? "NEGATIVELY_EVIDENCED" : malformedDate ? "AMBIGUOUS" : priceReady && affirmativeDelivery ? "EVIDENCED" : "UNKNOWN";
  return freeze({
    policyVersion: DATAFORSEO_AMAZON_SELLERS_OFFER_PRESENCE_POLICY_VERSION,
    state,
    sellerItemScoped: true,
    priceReady,
    affirmativeDelivery,
    negativeDeliverySignal: negative,
    malformedDeliveryDate: malformedDate,
    observationTimeValid,
    deliveryDateIsCurrentOrFuture,
    evidence: affirmativeDelivery ? ["SELLER_ITEM_DELIVERY_MESSAGE", "SELLER_ITEM_DELIVERY_DATE_FROM"] : []
  });
}

function validateLineage({ record, canonicalResult, destination }) {
  const evidence = record?.candidate?.marketEvidence;
  const identity = record?.candidate?.identity;
  const provenance = evidence?.provenance;
  const asin = exactAsin(evidence?.providerIdentity?.asin);
  if (evidence?.provider !== "DATAFORSEO" || evidence?.source !== "DATAFORSEO_AMAZON" || identity?.outcome !== "CONFIRMED") throw new Error("AMAZON_SELLERS_RETAINED_EVIDENCE_INVALID");
  if (!asin || identity.externalProductId !== asin || identity.atlasProductId !== evidence.atlasProductId) throw new Error("AMAZON_SELLERS_PRODUCT_ASIN_BINDING_INVALID");
  if (canonicalResult?.canonicalResultId !== provenance?.immutableProviderResultId || canonicalResult?.resultDigest !== provenance?.immutableProviderResultDigest || canonicalResult?.providerTaskId !== provenance?.sourceTaskId || canonicalResult?.atlasProductId !== evidence.atlasProductId || canonicalResult?.operation !== "AMAZON_SELLERS" || canonicalResult?.sourceId !== "DATAFORSEO_AMAZON") throw new Error("AMAZON_SELLERS_PROVIDER_RESULT_BINDING_INVALID");
  const resultAsin = canonicalResult?.operationResult?.result?.[0]?.asin ?? canonicalResult?.operationResult?.data?.asin;
  if (resultAsin !== asin) throw new Error("AMAZON_SELLERS_PROVIDER_RESULT_ASIN_INVALID");
  if (destination?.atlasProductId !== evidence.atlasProductId || destination?.retailerId !== AMAZON_COMMERCE_CHANNEL.retailerId || destination?.marketplace !== AMAZON_COMMERCE_CHANNEL.marketplace || destination?.status !== "ACTIVE" || destination?.retailerListingId !== asin) throw new Error("AMAZON_SELLERS_CHANNEL_DESTINATION_BINDING_INVALID");
  if (!validTime(provenance?.observedAt)) throw new Error("AMAZON_SELLERS_OBSERVATION_TIME_INVALID");
  return { evidence, asin };
}

export function composeDataForSeoAmazonSellerOffer({ record, canonicalResult, destination, freshness = "UNASSESSED", rightsAllowed = true } = {}) {
  const { evidence, asin } = validateLineage({ record, canonicalResult, destination });
  const sellerName = text(evidence.seller?.name);
  const profile = sellerProfile(evidence.seller?.url);
  const condition = normalizeCondition(evidence.offer?.condition);
  const price = Number.isFinite(evidence.pricing?.basePrice) && evidence.pricing.basePrice >= 0 ? evidence.pricing.basePrice : null;
  const currency = text(evidence.pricing?.currency);
  const offerPresence = assessDataForSeoAmazonSellerOfferPresence({ delivery: evidence.offer?.delivery, price, currency, observedAt: evidence.provenance.observedAt });
  const availabilityState = offerPresence.state === "EVIDENCED" ? "CONTRACTUALLY_DERIVABLE" : offerPresence.state === "NEGATIVELY_EVIDENCED" ? "NEGATIVE" : offerPresence.state === "AMBIGUOUS" ? "AMBIGUOUS" : "ABSENT";
  const offer = createCurrentOfferProjection({
    offer: {
      atlasProductId: evidence.atlasProductId,
      ...AMAZON_COMMERCE_CHANNEL,
      priceUsd: price,
      currency,
      availability: offerPresence.state === "EVIDENCED" ? "AVAILABLE" : "UNKNOWN",
      condition,
      shippingUsd: Number.isFinite(evidence.pricing?.shippingPrice) && evidence.pricing.shippingPrice >= 0 ? evidence.pricing.shippingPrice : null,
      feesUsd: null,
      researchUrl: destination.destinationUrl,
      destinationId: destination.destinationId,
      matchStatus: "EXACT_GOVERNED_ASIN",
      sourceRow: null,
      observedAt: evidence.provenance.observedAt,
      sellerName,
      sourceIdentity: { adapterId: DATAFORSEO_AMAZON_SELLERS_CURRENT_OFFER_ADAPTER_VERSION, sourceId: "DATAFORSEO_AMAZON", canonicalResultId: canonicalResult.canonicalResultId, evidenceId: record.evidenceId },
      comparisonEligible: false,
      comparisonReasons: ["MARKETPLACE_CURRENT_NOT_QUALIFIED"],
      itemPriceEligible: false,
      deliveredCostEligible: false,
      deliveredCostReasons: ["MARKETPLACE_CURRENT_NOT_QUALIFIED"]
    },
    listingIdentity: `ASIN:${asin}`,
    sourceLocalSellerId: profile.sourceLocalSellerId,
    sellerProfileUrl: profile.normalizedUrl
  });
  const blockers = [];
  if (!sellerName) blockers.push("SELLER_IDENTITY_UNRESOLVED");
  if (condition === "UNKNOWN") blockers.push("CONDITION_UNRESOLVED");
  if (price === null || currency === null) blockers.push("PRICE_NOT_ESTABLISHED");
  if (availabilityState !== "EXPLICIT" && availabilityState !== "CONTRACTUALLY_DERIVABLE") blockers.push("AVAILABILITY_NOT_ESTABLISHED");
  blockers.push("OFFER_ACTION_NOT_ESTABLISHED");
  if (freshness !== "FRESH") blockers.push(freshness === "STALE" ? "STALE" : "FRESHNESS_POLICY_NOT_ESTABLISHED");
  if (!rightsAllowed) blockers.push("RIGHTS_BLOCKED");
  return freeze({
    schemaVersion: "1.0",
    policyVersion: DATAFORSEO_AMAZON_SELLERS_CURRENT_OFFER_ADAPTER_VERSION,
    offer,
    channelDetermination: { state: "ESTABLISHED", evidence: ["PROVIDER_OPERATION_AMAZON_SELLERS", "PROVIDER_ASIN_BINDING", "AMAZON_DOMAIN_RESULT", "CANONICAL_AMAZON_DESTINATION"] },
    sellerClassification: classifySeller(sellerName),
    sellerProfile: profile,
    offerPresence,
    availabilityState,
    shippingState: offer.shippingUsd === null ? "UNKNOWN" : "EXPLICIT",
    destinationSemantics: "CHANNEL_PRODUCT_DESTINATION",
    priceCorrespondingAction: false,
    freshness,
    qualification: { status: blockers.length ? "BLOCKED" : "READY_FOR_CURRENT_QUALIFICATION", blockers: [...new Set(blockers)] },
    authority: { canonicalCurrent: false, history: false, public: false, cheapest: false, picks: false, terminal: false, affiliate: false },
    networkOperation: "NONE",
    paidTaskCreated: false,
    actualSpendUsd: 0
  });
}

export function summarizeDataForSeoAmazonSellerOffers(compositions = []) {
  const count = predicate => compositions.filter(predicate).length;
  return freeze({
    observations: compositions.length,
    representable: compositions.length,
    identityReady: count(value => Boolean(value.offer?.offerIdentity)),
    sellerReady: count(value => value.offer?.seller?.identityState === "KNOWN"),
    conditionReady: count(value => value.offer?.condition !== "UNKNOWN"),
    availabilityReady: count(value => !value.qualification.blockers.includes("AVAILABILITY_NOT_ESTABLISHED")),
    actionabilityReady: count(value => value.priceCorrespondingAction === true),
    fresh: count(value => value.freshness === "FRESH"),
    fullyCurrentQualificationReady: count(value => value.qualification.status === "READY_FOR_CURRENT_QUALIFICATION")
  });
}
