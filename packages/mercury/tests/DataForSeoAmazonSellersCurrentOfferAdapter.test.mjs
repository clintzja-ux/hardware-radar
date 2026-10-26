import assert from "node:assert/strict";
import { assessDataForSeoAmazonSellerOfferAction, assessDataForSeoAmazonSellerOfferPresence, assessDataForSeoAmazonSellersFreshness, composeDataForSeoAmazonSellerOffer, DATAFORSEO_AMAZON_SELLERS_FRESHNESS_POLICY, summarizeDataForSeoAmazonSellerOffers } from "../current-display/DataForSeoAmazonSellersCurrentOfferAdapter.js";
import { reconcileCurrentOffers } from "../current-display/CurrentOfferModel.js";

let cases = 0;
const delivery = { delivery_date_from: "2026-10-02T00:00:00+00:00", delivery_date_to: "2026-10-04T00:00:00+00:00", fastest_delivery_date_from: null, fastest_delivery_date_to: null, delivery_message: "FREE delivery October 2 - 4. Details", delivery_price: null };
const evidence = ({ productId = "ram_fixture_product", asin = "B012345678", sellerName = "Amazon.com", sellerUrl = "http://amazon.com/gp/aag/main?seller=A1&asin=B012345678", condition = "New", price = 100, currency = price == null ? null : "USD", shippingPrice = null, observedAt = "2026-09-30T05:36:23.000Z", availability = null, offerDelivery = delivery } = {}) => ({ evidenceId: "dfev_fixture", candidate: { identity: { outcome: "CONFIRMED", atlasProductId: productId, externalProductId: asin }, marketEvidence: { provider: "DATAFORSEO", source: "DATAFORSEO_AMAZON", atlasProductId: productId, providerIdentity: { asin }, seller: { name: sellerName, url: sellerUrl, shipsFrom: sellerName }, pricing: { basePrice: price, currency, shippingPrice }, offer: { condition, availability, delivery: offerDelivery }, provenance: { sourceTaskId: "task-1", observedAt, immutableProviderResultId: "mer_providerresult_fixture", immutableProviderResultDigest: "a".repeat(64) } } } });
const result = { canonicalResultId: "mer_providerresult_fixture", resultDigest: "a".repeat(64), providerTaskId: "task-1", atlasProductId: "ram_fixture_product", operation: "AMAZON_SELLERS", sourceId: "DATAFORSEO_AMAZON", operationResult: { data: { asin: "B012345678" }, result: [{ asin: "B012345678" }] } };
const destination = { destinationId: "mer_dest_fixture", atlasProductId: "ram_fixture_product", retailerId: "RETAILER-0001", marketplace: "amazon.com", retailerListingId: "B012345678", destinationUrl: "https://amazon.com/dp/B012345678", status: "ACTIVE" };
const exactDestination = { ...destination, destinationUrl: "https://amazon.com/gp/product/B012345678?smid=A1" };
const exactAction = { actionType: "EXACT_SELLER_OFFER", destinationId: destination.destinationId, atlasProductId: destination.atlasProductId, retailerId: destination.retailerId, marketplace: destination.marketplace, asin: destination.retailerListingId, sellerName: "Amazon.com", sourceLocalSellerId: "A1", destinationUrl: exactDestination.destinationUrl, evidenceReference: "fixture:exact-seller-offer" };
const compose = (overrides = {}, options = {}) => composeDataForSeoAmazonSellerOffer({ record: evidence(overrides), canonicalResult: result, destination: options.destination ?? destination, offerActionEvidence: options.offerActionEvidence ?? null, evaluatedAt: options.evaluatedAt ?? "2026-09-30T17:36:23.000Z", rightsAllowed: options.rightsAllowed ?? true });

assert.equal(DATAFORSEO_AMAZON_SELLERS_FRESHNESS_POLICY.maximumAgeHours, 24); cases++;
const fresh = assessDataForSeoAmazonSellersFreshness({ observedAt: "2026-09-30T05:36:23.000Z", evaluatedAt: "2026-10-01T05:36:23.000Z" });
assert.equal(fresh.state, "FRESH"); assert.equal(fresh.expiresAt, "2026-10-01T05:36:23.000Z"); assert.equal(fresh.automaticExtension, false); cases += 3;
assert.equal(assessDataForSeoAmazonSellersFreshness({ observedAt: "2026-09-30T05:36:23.000Z", evaluatedAt: "2026-10-01T05:36:23.001Z" }).state, "STALE"); cases++;
assert.equal(assessDataForSeoAmazonSellersFreshness({ observedAt: "2026-09-30T05:36:23.000Z", evaluatedAt: "2026-09-30T05:36:22.999Z" }).state, "INVALID_FUTURE_OBSERVATION"); cases++;

const generic = compose();
assert.equal(generic.sellerClassification, "KNOWN_FIRST_PARTY_AMAZON"); assert.equal(generic.offerPresence.state, "EVIDENCED"); assert.equal(generic.freshness, "FRESH"); cases += 3;
assert.equal(generic.destinationSemantics, "SELLER_PROFILE_PLUS_CHANNEL_PRODUCT_DESTINATION"); assert.equal(generic.priceCorrespondingAction, false); cases += 2;
assert.equal(generic.qualification.blockers.includes("EXACT_SELLER_OFFER_ACTION_NOT_ESTABLISHED"), true); assert.equal(generic.authority.canonicalCurrent, false); cases += 2;

const qualified = compose({}, { destination: exactDestination, offerActionEvidence: exactAction });
assert.equal(qualified.priceCorrespondingAction, true); assert.equal(qualified.destinationSemantics, "EXACT_SELLER_OFFER_DESTINATION"); cases += 2;
assert.equal(qualified.qualification.status, "READY_FOR_CURRENT_QUALIFICATION"); assert.equal(qualified.offer.itemPriceEligible, true); assert.equal(qualified.offer.comparisonEligible, true); cases += 3;
assert.equal(qualified.offer.actionability, "OFFER_SPECIFIC_DESTINATION"); assert.equal(qualified.authority.cheapest, false); assert.equal(qualified.authority.picks, false); cases += 3;
assert.equal(qualified.offer.deliveredCostEligible, false); assert.deepEqual(qualified.offer.deliveredCostReasons, ["SHIPPING_COST_UNKNOWN", "FEES_UNKNOWN"]); cases += 2;

assert.equal(assessDataForSeoAmazonSellerOfferAction({ evidence: evidence().candidate.marketEvidence, destination }).priceCorrespondingAction, false); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferAction({ evidence: evidence().candidate.marketEvidence, destination: exactDestination, offerActionEvidence: { ...exactAction, sourceLocalSellerId: "WRONG" } }).priceCorrespondingAction, false); cases++;
assert.equal(compose({}, { destination: exactDestination, offerActionEvidence: { ...exactAction, destinationUrl: "https://amazon.com/dp/B012345678?tag=affiliate-20" } }).priceCorrespondingAction, false); cases++;

assert.equal(compose({ sellerName: "MemoryC" }).sellerClassification, "KNOWN_THIRD_PARTY"); cases++;
assert.equal(compose({ sellerName: null, sellerUrl: null }).qualification.blockers.includes("SELLER_IDENTITY_UNRESOLVED"), true); cases++;
assert.equal(compose({ condition: "Used - Like New" }).qualification.blockers.includes("CONDITION_NOT_NEW"), true); cases++;
assert.equal(compose({ price: null }).qualification.blockers.includes("PRICE_NOT_ESTABLISHED"), true); cases++;
assert.equal(compose({ currency: "EUR" }).qualification.blockers.includes("CURRENCY_NOT_USD"), true); cases++;
assert.equal(compose({ offerDelivery: null }).qualification.blockers.includes("AVAILABILITY_NOT_ESTABLISHED"), true); cases++;
assert.equal(compose({}, { evaluatedAt: "2026-10-01T05:36:23.001Z" }).qualification.blockers.includes("STALE"), true); cases++;
assert.equal(compose({}, { rightsAllowed: false }).qualification.blockers.includes("RIGHTS_BLOCKED"), true); cases++;
assert.equal(compose({}, { evaluatedAt: "2026-10-01T05:36:23.001Z" }).freshnessAssessment.historicalRetentionIndependent, true); cases++;

assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery, price: 100, currency: "USD", observedAt: "2026-09-30T05:36:23.000Z" }).state, "EVIDENCED"); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery: { ...delivery, delivery_message: "Currently unavailable" }, price: 100, currency: "USD", observedAt: "2026-09-30T05:36:23.000Z" }).state, "NEGATIVELY_EVIDENCED"); cases++;

const thirdParty = compose({ sellerName: "MemoryC", sellerUrl: "http://amazon.com/gp/aag/main?seller=M1&asin=B012345678" });
assert.notEqual(thirdParty.offer.offerIdentity, generic.offer.offerIdentity); cases++;
assert.equal(reconcileCurrentOffers({ existingOffers: [qualified.offer], incomingOffer: qualified.offer }).length, 1); cases++;
assert.throws(() => reconcileCurrentOffers({ existingOffers: [{ ...qualified.offer, sourceIdentity: { ...qualified.offer.sourceIdentity, sourceId: "OTHER" } }], incomingOffer: qualified.offer }), /CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED/); cases++;
assert.throws(() => composeDataForSeoAmazonSellerOffer({ record: evidence(), canonicalResult: { ...result, resultDigest: "b".repeat(64) }, destination }), /PROVIDER_RESULT_BINDING_INVALID/); cases++;
assert.throws(() => composeDataForSeoAmazonSellerOffer({ record: evidence(), canonicalResult: result, destination: { ...destination, retailerListingId: "B999999999" } }), /DESTINATION_BINDING_INVALID/); cases++;

const funnel = summarizeDataForSeoAmazonSellerOffers([generic, qualified, compose({ condition: "Used" })]);
assert.deepEqual(funnel, { observations: 3, representable: 3, identityReady: 3, sellerReady: 3, conditionReady: 3, availabilityReady: 3, actionabilityReady: 1, fresh: 3, fullyCurrentQualificationReady: 1 }); cases++;
assert.equal([generic, qualified].every(value => value.networkOperation === "NONE" && value.paidTaskCreated === false && value.actualSpendUsd === 0), true); cases++;

console.log(`DataForSEO Amazon Sellers Current offer adapter tests passed: ${cases} cases.`);
