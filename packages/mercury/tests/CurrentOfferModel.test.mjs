import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCurrentDisplaySnapshot, CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION, validateCurrentDisplaySnapshot } from "../current-display/CurrentDisplaySnapshot.js";
import { FileCurrentDisplaySnapshotRepository } from "../current-display/FileCurrentDisplaySnapshotRepository.js";
import { createCurrentOfferProjection, createLegacyCompatibilityOfferIdentity, deriveOfferActionability, normalizeSellerAttribution, projectLegacyCurrentOffer, reconcileCurrentOffers, simulateLegacyCurrentOfferMigration } from "../current-display/CurrentOfferModel.js";

let cases = 0;
const base = ({ retailer = "AMAZON", retailerId = "RETAILER-0001", sellerName = "Amazon.com", condition = "NEW", priceUsd = 300, sourceId = "MANUAL" } = {}) => ({
    atlasProductId: "ram_fixture_product", retailer, retailerId, marketplace: "US", priceUsd, currency: "USD", availability: "AVAILABLE", condition,
    shippingUsd: null, feesUsd: null, researchUrl: `https://example.com/${retailer.toLowerCase()}/product`, destinationId: "mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa", matchStatus: "FIXTURE", sourceRow: 1,
    observedAt: "2026-10-01T12:00:00.000Z", sellerName, sourceIdentity: { adapterId: "mer_adapter_fixture", sourceId }, comparisonEligible: false, comparisonReasons: ["P1_PUBLIC_FREEZE"], itemPriceEligible: false, deliveredCostEligible: false, deliveredCostReasons: ["P1_PUBLIC_FREEZE"]
});

const amazon = createCurrentOfferProjection({ offer: base(), listingIdentity: "ASIN:B0001", sourceLocalSellerId: "A1" });
const memoryC = createCurrentOfferProjection({ offer: base({ sellerName: "MemoryC", priceUsd: 290 }), listingIdentity: "ASIN:B0001", sourceLocalSellerId: "M1" });
const platinum = createCurrentOfferProjection({ offer: base({ sellerName: "Platinum Micro", priceUsd: 280 }), listingIdentity: "ASIN:B0001", sourceLocalSellerId: "P1" });
assert.equal(new Set([amazon.offerIdentity, memoryC.offerIdentity, platinum.offerIdentity]).size, 3); cases += 1;
assert.deepEqual(amazon.commerceChannel, { retailer: "AMAZON", retailerId: "RETAILER-0001", marketplace: "US" }); cases += 1;
assert.equal(amazon.seller.identityState, "KNOWN"); cases += 1;
assert.equal(normalizeSellerAttribution().identityState, "UNKNOWN"); cases += 1;

const repriced = createCurrentOfferProjection({ offer: base({ priceUsd: 290, sourceId: "MANUAL" }), listingIdentity: "ASIN:B0001", sourceLocalSellerId: "A1" });
assert.equal(repriced.offerIdentity, amazon.offerIdentity); cases += 1;
const later = createCurrentOfferProjection({ offer: { ...base(), observedAt: "2026-10-01T13:00:00.000Z" }, listingIdentity: "ASIN:B0001", sourceLocalSellerId: "A1" });
assert.equal(later.offerIdentity, amazon.offerIdentity); cases += 1;
const automated = createCurrentOfferProjection({ offer: base({ sourceId: "AUTOMATED" }), listingIdentity: "ASIN:B0001", sourceLocalSellerId: "A1" });
assert.equal(automated.offerIdentity, amazon.offerIdentity); cases += 1;
assert.throws(() => reconcileCurrentOffers({ existingOffers: [amazon], incomingOffer: automated }), /CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED/); cases += 1;
const newerAutomated = createCurrentOfferProjection({ offer: { ...base({ sourceId: "AUTOMATED", priceUsd: 310 }), observedAt: "2026-10-01T13:00:00.000Z" }, listingIdentity: "ASIN:B0001", sourceLocalSellerId: "A1" });
assert.equal(reconcileCurrentOffers({ existingOffers: [amazon], incomingOffer: newerAutomated })[0].priceUsd,310); cases += 1;
assert.equal(reconcileCurrentOffers({ existingOffers: [amazon], incomingOffer: memoryC }).length, 2); cases += 1;
assert.equal(reconcileCurrentOffers({ existingOffers: [amazon, memoryC], withdrawOfferIdentity: memoryC.offerIdentity })[0].offerIdentity, amazon.offerIdentity); cases += 1;

const differentListing = createCurrentOfferProjection({ offer: base(), listingIdentity: "ASIN:B0002", sourceLocalSellerId: "A1" });
assert.notEqual(differentListing.offerIdentity, amazon.offerIdentity); cases += 1;
const used = createCurrentOfferProjection({ offer: base({ condition: "USED" }), listingIdentity: "ASIN:B0001", sourceLocalSellerId: "A1" });
assert.notEqual(used.offerIdentity, amazon.offerIdentity); cases += 1;
const unknown = createCurrentOfferProjection({ offer: base({ sellerName: null }), listingIdentity: "NEWEGG-SKU:123" });
assert.equal(unknown.seller.identityState, "UNKNOWN"); cases += 1;
assert.throws(() => createCurrentOfferProjection({ offer: base({ sellerName: null }), listingIdentity: "" }), /EVIDENCE_INSUFFICIENT|LISTING_REQUIRED/); cases += 1;

const sellerProfileOnly = createCurrentOfferProjection({ offer: { ...base(), researchUrl: null, destinationId: null }, listingIdentity: "ASIN:B0003", sellerProfileUrl: "https://example.com/seller" });
assert.equal(sellerProfileOnly.actionability, "SELLER_PROFILE_ONLY"); cases += 1;
assert.equal(deriveOfferActionability({ channelProductDestination: "https://example.com/product", sellerProfileUrl: "https://example.com/seller" }), "CHANNEL_PRODUCT_DESTINATION"); cases += 1;

const legacy = projectLegacyCurrentOffer(base({ sellerName: null }));
assert.equal(legacy.offerIdentity, createLegacyCompatibilityOfferIdentity(base())); cases += 1;
assert.equal(legacy.seller.identityState, "UNKNOWN"); cases += 1;
const migration = simulateLegacyCurrentOfferMigration([base(), base({ retailer: "NEWEGG", retailerId: "RETAILER-0004", sellerName: null })]);
assert.deepEqual(migration, { legacyOffers: 2, derivedCompatibilityOfferIds: 2, collisions: 0, ambiguousRows: 0, sellerKnown: 1, sellerUnknown: 1 }); cases += 1;

const snapshot = createCurrentDisplaySnapshot({ schemaVersion: CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION, observedAt: "2026-10-01T12:00:00.000Z", importedAt: "2026-10-01T12:00:00.000Z", source: { workbook: "fixture", sheet: "multi-seller", digest: "a".repeat(64) }, offers: [amazon, memoryC, platinum] });
assert.equal(validateCurrentDisplaySnapshot(snapshot).valid, true); cases += 1;
assert.equal(snapshot.offers.length, 3); cases += 1;
assert.throws(() => createCurrentDisplaySnapshot({ schemaVersion: CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION, observedAt: snapshot.observedAt, importedAt: snapshot.importedAt, source: snapshot.source, offers: [amazon, amazon] }), /CURRENT_DISPLAY_OFFER_DUPLICATE/); cases += 1;
assert.equal(snapshot.offers.every(offer => offer.comparisonEligible === false), true); cases += 1;
const repositoryRoot = await mkdtemp(join(tmpdir(), "hardware-radar-current-offers-"));
try {
    const repository = new FileCurrentDisplaySnapshotRepository({ statePath: join(repositoryRoot, "current.json") });
    assert.equal((await repository.replace(snapshot)).status, "REPLACED"); cases += 1;
    assert.deepEqual((await new FileCurrentDisplaySnapshotRepository({ statePath: join(repositoryRoot, "current.json") }).getState()).current, snapshot); cases += 1;
} finally { await rm(repositoryRoot, { recursive: true, force: true }); }

const neweggFirstParty = createCurrentOfferProjection({ offer: base({ retailer: "NEWEGG", retailerId: "RETAILER-0004", sellerName: "Newegg" }), listingIdentity: "SKU:N1" });
assert.equal(neweggFirstParty.seller.sellerName, "Newegg"); cases += 1;
const rakutenUnknown = createCurrentOfferProjection({ offer: base({ retailer: "NEWEGG", retailerId: "RETAILER-0004", sellerName: null }), listingIdentity: "RAKUTEN-SKU:N2" });
assert.equal(rakutenUnknown.seller.identityState, "UNKNOWN"); cases += 1;
const googleMerchant = createCurrentOfferProjection({ offer: base({ retailer: "MEMORYC", retailerId: null, sellerName: "MemoryC" }), listingIdentity: "MERCHANT-SKU:M1" });
assert.equal(googleMerchant.commerceChannel.retailer, "MEMORYC"); cases += 1;

console.log(`Current offer model tests passed: ${cases} cases.`);
