import assert from "node:assert/strict";
import {
    DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES,
    DATAFORSEO_OBSERVATION_ELIGIBILITY,
    canonicalizeMerchantDomain,
    createDataForSeoMarketObservationCandidate,
    evaluateDataForSeoObservationEligibility,
    resolveDataForSeoMerchantIdentity
} from "../index.js";
import { normalizeDataForSeoSellerEvidence } from "../adapters/dataforseo/DataForSeoSellerNormalizer.js";

const seller = {
    type: "shops_list",
    seller_name: "Central Computers",
    title: "Central Computers",
    domain: "www.centralcomputer.com",
    url: "https://www.centralcomputer.com/corsair-cmk32gx5m2b6000z30.html",
    base_price: 549.99,
    tax: null,
    shipping_price: 38.260695,
    total_price: 588.25,
    currency: "USD",
    product_condition: null,
    product_availability: "in_stock",
    details: "Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s"
};

const marketEvidence = normalizeDataForSeoSellerEvidence(seller, {
    sourceTaskId: "08160527-2304-0183-0000-1446c8b7b26b",
    observedAt: "2026-08-16T05:27:00Z",
    productTitle: seller.details,
    dataDocId: "17540895125310173539",
    rawPayloadReference: "fixture:live1-sellers-result"
});

assert.equal(canonicalizeMerchantDomain("WWW.CentralComputer.com"), "centralcomputer.com");
assert.equal(canonicalizeMerchantDomain("https://www.centralcomputer.com/path"), "centralcomputer.com");

const discovered = resolveDataForSeoMerchantIdentity({ marketEvidence, retailers: [] });
assert.equal(discovered.outcome, DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.DISCOVERED);
assert.equal(discovered.retailerId, null);
assert.equal(discovered.merchantKey, "domain:centralcomputer.com");
assert.equal(discovered.requiresRegistration, true);

const centralRetailer = {
    id: "RETAILER-0042",
    name: "Central Computers",
    websiteUrl: "https://centralcomputer.com"
};
const resolved = resolveDataForSeoMerchantIdentity({ marketEvidence, retailers: [centralRetailer] });
assert.equal(resolved.outcome, DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.RESOLVED);
assert.equal(resolved.retailerId, "RETAILER-0042");
assert.equal(resolved.canonicalDomain, "centralcomputer.com");

const conflictEvidence = structuredClone(marketEvidence);
conflictEvidence.seller.domain = "example.com";
const conflict = resolveDataForSeoMerchantIdentity({ marketEvidence: conflictEvidence, retailers: [] });
assert.equal(conflict.outcome, DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.CONFLICT);
assert.equal(conflict.reason, "SELLER_DOMAIN_URL_CONFLICT");

const probableCandidate = createDataForSeoMarketObservationCandidate({
    marketEvidence,
    atlasResolution: {
        outcome: "PROBABLE",
        atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
        evidence: [],
        automaticMercuryEligible: false
    }
});
const probableEligibility = evaluateDataForSeoObservationEligibility({ candidate: probableCandidate, merchantResolution: resolved });
assert.equal(probableEligibility.status, DATAFORSEO_OBSERVATION_ELIGIBILITY.REVIEW_REQUIRED);
assert.equal(probableEligibility.canonicalObservationEligible, false);
assert.equal(probableEligibility.rawEvidenceRetentionEligible, true);
assert.equal(probableEligibility.historicalAnalyticsEligible, false);
assert.equal(probableEligibility.retailerId, "RETAILER-0042");

const confirmedCandidate = createDataForSeoMarketObservationCandidate({
    marketEvidence,
    atlasResolution: {
        outcome: "CONFIRMED",
        atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
        evidence: [],
        automaticMercuryEligible: true
    }
});
const discoveredEligibility = evaluateDataForSeoObservationEligibility({ candidate: confirmedCandidate, merchantResolution: discovered });
assert.equal(discoveredEligibility.status, DATAFORSEO_OBSERVATION_ELIGIBILITY.REVIEW_REQUIRED);
assert.equal(discoveredEligibility.canonicalObservationEligible, false);
assert.equal(discoveredEligibility.rawEvidenceRetentionEligible, true);
assert.equal(discoveredEligibility.historicalAnalyticsEligible, false);

const eligible = evaluateDataForSeoObservationEligibility({ candidate: confirmedCandidate, merchantResolution: resolved });
assert.equal(eligible.status, DATAFORSEO_OBSERVATION_ELIGIBILITY.ELIGIBLE);
assert.equal(eligible.canonicalObservationEligible, true);
assert.equal(eligible.retailerId, "RETAILER-0042");
assert.equal(eligible.rawEvidenceRetentionEligible, true);
assert.equal(eligible.historicalAnalyticsEligible, true);
assert.equal(eligible.requiresReview, false);

const blocked = evaluateDataForSeoObservationEligibility({ candidate: confirmedCandidate, merchantResolution: conflict });
assert.equal(blocked.status, DATAFORSEO_OBSERVATION_ELIGIBILITY.BLOCKED);
assert.equal(blocked.canonicalObservationEligible, false);
assert.equal(blocked.rawEvidenceRetentionEligible, true);
assert.equal(blocked.historicalAnalyticsEligible, false);

console.log("DataForSEO merchant identity and observation eligibility tests passed.");
