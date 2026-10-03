import assert from "node:assert/strict";
import { assessDataForSeoAmazonSellerOfferPresence, composeDataForSeoAmazonSellerOffer, summarizeDataForSeoAmazonSellerOffers } from "../current-display/DataForSeoAmazonSellersCurrentOfferAdapter.js";
import { reconcileCurrentOffers } from "../current-display/CurrentOfferModel.js";

let cases = 0;
const delivery = { delivery_date_from: "2026-10-02T00:00:00+00:00", delivery_date_to: "2026-10-04T00:00:00+00:00", fastest_delivery_date_from: null, fastest_delivery_date_to: null, delivery_message: "FREE delivery October 2 - 4. Details", delivery_price: null };
const evidence = ({ sellerName = "Amazon.com", sellerUrl = "http://amazon.com/gp/aag/main?seller=A1&asin=B012345678", condition = "New", price = 100, observedAt = "2026-09-30 05:36:23 +00:00", availability = null, offerDelivery = delivery } = {}) => ({ evidenceId: "dfev_fixture", candidate: { identity: { outcome: "CONFIRMED", atlasProductId: "ram_fixture_product", externalProductId: "B012345678" }, marketEvidence: { provider: "DATAFORSEO", source: "DATAFORSEO_AMAZON", atlasProductId: "ram_fixture_product", providerIdentity: { asin: "B012345678" }, seller: { name: sellerName, url: sellerUrl, shipsFrom: sellerName }, pricing: { basePrice: price, currency: price == null ? null : "USD", shippingPrice: null }, offer: { condition, availability, delivery: offerDelivery }, provenance: { sourceTaskId: "task-1", observedAt, immutableProviderResultId: "mer_providerresult_fixture", immutableProviderResultDigest: "a".repeat(64) } } } });
const result = { canonicalResultId: "mer_providerresult_fixture", resultDigest: "a".repeat(64), providerTaskId: "task-1", atlasProductId: "ram_fixture_product", operation: "AMAZON_SELLERS", sourceId: "DATAFORSEO_AMAZON", operationResult: { data: { asin: "B012345678" }, result: [{ asin: "B012345678" }] } };
const destination = { destinationId: "mer_dest_fixture", atlasProductId: "ram_fixture_product", retailerId: "RETAILER-0001", marketplace: "amazon.com", retailerListingId: "B012345678", destinationUrl: "https://amazon.com/dp/B012345678", status: "ACTIVE" };
const compose = overrides => composeDataForSeoAmazonSellerOffer({ record: evidence(overrides), canonicalResult: result, destination });

const amazon = compose();
assert.equal(amazon.offer.commerceChannel.retailer, "AMAZON"); cases++;
assert.equal(amazon.sellerClassification, "KNOWN_FIRST_PARTY_AMAZON"); cases++;
assert.equal(amazon.offer.seller.sourceLocalSellerId, "A1"); cases++;
assert.equal(amazon.sellerProfile.classification, "SELLER_PROFILE_ONLY"); cases++;
assert.equal(amazon.offer.actionability, "CHANNEL_PRODUCT_DESTINATION"); cases++;
assert.equal(amazon.priceCorrespondingAction, false); cases++;
assert.equal(amazon.offerPresence.state, "EVIDENCED"); cases++;
assert.equal(amazon.offer.availability, "AVAILABLE"); cases++;
assert.deepEqual(amazon.qualification.blockers.includes("AVAILABILITY_NOT_ESTABLISHED"), false); cases++;
assert.deepEqual(amazon.qualification.blockers.includes("OFFER_ACTION_NOT_ESTABLISHED"), true); cases++;
assert.equal(amazon.offer.observedAt, "2026-09-30 05:36:23 +00:00"); cases++;
assert.equal(amazon.authority.canonicalCurrent, false); cases++;

const memoryC = compose({ sellerName: "MemoryC", sellerUrl: "http://amazon.com/gp/aag/main?seller=M1&asin=B012345678", price: 90 });
const platinum = compose({ sellerName: "Platinum Micro, Inc.", sellerUrl: "http://amazon.com/gp/aag/main?seller=P1&asin=B012345678", price: 80 });
assert.equal(memoryC.sellerClassification, "KNOWN_THIRD_PARTY"); cases++;
assert.equal(new Set([amazon.offer.offerIdentity, memoryC.offer.offerIdentity, platinum.offer.offerIdentity]).size, 3); cases++;
const repriced = compose({ price: 77, observedAt: "2026-10-01 05:36:23 +00:00" });
assert.equal(repriced.offer.offerIdentity, amazon.offer.offerIdentity); cases++;
const manualSameOffer = { ...memoryC.offer, sourceIdentity: { adapterId: "manual", sourceId: "AMAZON_MANUAL_PUBLISHER_OBSERVATION" } };
assert.throws(() => reconcileCurrentOffers({ existingOffers: [manualSameOffer], incomingOffer: memoryC.offer }), /CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED/); cases++;
assert.equal(reconcileCurrentOffers({ existingOffers: [amazon.offer], incomingOffer: memoryC.offer }).length, 2); cases++;

const unknown = compose({ sellerName: null, sellerUrl: null, condition: null, price: null, offerDelivery: null });
assert.equal(unknown.offer.seller.identityState, "UNKNOWN"); cases++;
assert.equal(unknown.offer.listingIdentity, "ASIN:B012345678"); cases++;
assert.deepEqual(unknown.qualification.blockers.includes("SELLER_IDENTITY_UNRESOLVED"), true); cases++;
assert.deepEqual(unknown.qualification.blockers.includes("PRICE_NOT_ESTABLISHED"), true); cases++;
assert.equal(compose({ condition: "Used - Like New" }).offer.condition, "USED_LIKE_NEW"); cases++;
assert.notEqual(compose({ condition: "Used - Like New" }).offer.offerIdentity, amazon.offer.offerIdentity); cases++;
assert.equal(compose({ sellerName: "Amazon Japan" }).sellerClassification, "KNOWN_THIRD_PARTY"); cases++;
assert.equal(compose({ sellerName: "Amazon.com" }).sellerClassification, "KNOWN_FIRST_PARTY_AMAZON"); cases++;
assert.equal(compose({ sellerUrl: "http://amazon.com/Warehouse-Deals/b" }).sellerProfile.classification, "UNKNOWN"); cases++;
assert.equal(unknown.availabilityState, "ABSENT"); cases++;
assert.equal(unknown.shippingState, "UNKNOWN"); cases++;
assert.throws(() => composeDataForSeoAmazonSellerOffer({ record: evidence(), canonicalResult: { ...result, resultDigest: "b".repeat(64) }, destination }), /PROVIDER_RESULT_BINDING_INVALID/); cases++;
assert.throws(() => composeDataForSeoAmazonSellerOffer({ record: evidence(), canonicalResult: result, destination: { ...destination, retailerListingId: "B999999999" } }), /DESTINATION_BINDING_INVALID/); cases++;

const funnel = summarizeDataForSeoAmazonSellerOffers([amazon, memoryC, unknown]);
assert.deepEqual(funnel, { observations: 3, representable: 3, identityReady: 3, sellerReady: 2, conditionReady: 2, availabilityReady: 2, actionabilityReady: 0, fresh: 0, fullyCurrentQualificationReady: 0 }); cases++;
assert.equal([amazon, memoryC, unknown].every(value => value.networkOperation === "NONE" && value.paidTaskCreated === false && value.actualSpendUsd === 0), true); cases++;

const observedAt = "2026-09-30T05:36:23.000Z";
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery, price: 100, currency: "USD", observedAt }).state, "EVIDENCED"); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery: null, price: 100, currency: "USD", observedAt }).state, "UNKNOWN"); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery, price: null, currency: null, observedAt }).state, "UNKNOWN"); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery: { ...delivery, delivery_message: "Currently unavailable; cannot deliver" }, price: 100, currency: "USD", observedAt }).state, "NEGATIVELY_EVIDENCED"); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery: { ...delivery, delivery_date_from: "not-a-date" }, price: 100, currency: "USD", observedAt }).state, "AMBIGUOUS"); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery, price: 100, currency: "EUR", observedAt }).state, "UNKNOWN"); cases++;
assert.equal(assessDataForSeoAmazonSellerOfferPresence({ delivery: { ...delivery, delivery_date_from: "2026-09-29T00:00:00Z" }, price: 100, currency: "USD", observedAt }).state, "UNKNOWN"); cases++;
assert.equal(compose({ condition: "Used - Like New" }).offerPresence.state, "EVIDENCED"); cases++;
assert.equal(compose({ condition: null }).offerPresence.state, "EVIDENCED"); cases++;
assert.equal(compose({ sellerName: null, sellerUrl: null }).offerPresence.state, "EVIDENCED"); cases++;
assert.equal(compose({ sellerName: null, sellerUrl: null }).qualification.blockers.includes("SELLER_IDENTITY_UNRESOLVED"), true); cases++;

console.log(`DataForSEO Amazon Sellers Current offer adapter tests passed: ${cases} cases.`);
