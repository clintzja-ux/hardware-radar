import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    PUBLIC_CURRENT_RETAIL_POLICY,
    createEmptyPublicCurrentRetailProjection,
    createPublicCurrentRetailProjection,
    validatePublicCurrentRetailProjection
} from "../current-display/PublicCurrentRetailProjection.js";

let cases = 0;
const product = (id, memoryType, formFactor, lifecycleStatus = "ACTIVE", publicationStatus = "READY") => ({
    identity: { atlasProductId: id, productType: "ram", brand: "Example", productFamily: "Family", series: null, displayName: `${id} display` },
    governance: { lifecycleStatus, publicationStatus },
    extension: { data: { classification: { memoryType, formFactor }, capacity: { capacityGb: 32, moduleCount: 2, capacityPerModuleGb: 16 }, performance: { dataRateMtps: 6000, casLatency: 30 } } }
});
const retailers = [
    { id: "RETAILER-0001", name: "Amazon", status: "active", affiliateProgram: { status: "pending" } },
    { id: "RETAILER-0004", name: "Newegg", status: "active", affiliateProgram: { status: "approved" } }
];
const products = [
    product("ram_ddr5_one", "DDR5", "DIMM"),
    product("ram_ddr4_one", "DDR4", "DIMM"),
    product("ram_laptop_one", "DDR5", "SO_DIMM"),
    product("ram_held_one", "DDR5", "DIMM", "DRAFT", "PENDING")
];
const destination = (suffix, atlasProductId, retailerId) => ({ destinationId: `mer_dest_${suffix.repeat(24).slice(0, 24)}`, atlasProductId, retailerId, destinationUrl: `https://retailer.example/${suffix}` });
const destinations = [
    destination("a", "ram_ddr5_one", "RETAILER-0001"),
    destination("b", "ram_ddr4_one", "RETAILER-0004"),
    destination("c", "ram_laptop_one", "RETAILER-0004"),
    destination("d", "ram_held_one", "RETAILER-0001")
];
const offer = ({ productId, retailerId, destinationId, price, observedAt, itemPriceEligible = true, availability = "AVAILABLE", condition = "NEW" }) => ({
    atlasProductId: productId, retailerId, destinationId, priceUsd: price, currency: "USD", observedAt,
    itemPriceEligible, availability, condition, shippingUsd: null, feesUsd: null
});
const asOf = "2026-09-07T12:00:00.000Z";
const source = {
    offers: [
        offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: destinations[0].destinationId, price: 200, observedAt: "2026-09-06T00:00:00.000Z" }),
        offer({ productId: "ram_ddr4_one", retailerId: "RETAILER-0004", destinationId: destinations[1].destinationId, price: 150, observedAt: "2026-09-07T00:00:00.000Z" }),
        offer({ productId: "ram_laptop_one", retailerId: "RETAILER-0004", destinationId: destinations[2].destinationId, price: 300, observedAt: "2026-09-07T01:00:00.000Z" }),
        offer({ productId: "ram_held_one", retailerId: "RETAILER-0001", destinationId: destinations[3].destinationId, price: 100, observedAt: "2026-09-07T01:00:00.000Z" })
    ]
};
const before = structuredClone({ products, retailers, destinations, source });
const projection = createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: source, asOf });
assert.equal(projection.counts.publicCurrentEligibleOffers, 3); cases += 1;
assert.equal(projection.counts.staleOffers, 0); cases += 1;
assert.equal(projection.winners.overall.atlasProductId, "ram_ddr4_one"); cases += 1;
assert.equal(projection.winners.ddr5.atlasProductId, "ram_ddr5_one"); cases += 1;
assert.equal(projection.winners.ddr4.atlasProductId, "ram_ddr4_one"); cases += 1;
assert.equal(projection.winners.laptop.atlasProductId, "ram_laptop_one"); cases += 1;
assert.equal(projection.products.some(item => item.atlasProductId === "ram_held_one"), false); cases += 1;
assert.deepEqual({ products, retailers, destinations, source }, before); cases += 1;
assert.deepEqual(createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: source, asOf }), projection); cases += 1;
assert.equal(Object.isFrozen(projection), true); cases += 1;
assert.equal(validatePublicCurrentRetailProjection(projection).valid, true); cases += 1;
assert.equal(projection.disclosure, "Prices shown exclude applicable shipping, taxes, and fees."); cases += 1;
assert.equal(projection.comparisonSemantics, "ITEM_PRICE"); cases += 1;
assert.equal(projection.products.every(item => item.offers.every(item => item.shippingUsd === null && item.feesUsd === null && item.taxesIncluded === false)), true); cases += 1;
assert.doesNotMatch(JSON.stringify(projection), /\.forge-review|operatorNotes|workbook|affiliate/i); cases += 1;

const staleSource = { offers: [offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: destinations[0].destinationId, price: 200, observedAt: "2026-09-05T23:59:59.999Z" })] };
const stale = createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: staleSource, asOf });
assert.equal(stale.counts.staleOffers, 1); cases += 1;
assert.equal(stale.winners.overall, null); cases += 1;
const boundarySource = { offers: [offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: destinations[0].destinationId, price: 200, observedAt: "2026-09-06T00:00:00.000Z" })] };
assert.equal(createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: boundarySource, asOf }).counts.publicCurrentEligibleOffers, 1); cases += 1;
const futureSource = { offers: [offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: destinations[0].destinationId, price: 200, observedAt: "2026-09-07T12:00:00.001Z" })] };
assert.equal(createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: futureSource, asOf }).winners.overall, null); cases += 1;

const tieDestinations = [destinations[0], destination("e", "ram_ddr5_one", "RETAILER-0004")];
const tieSource = { offers: [
    offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0004", destinationId: tieDestinations[1].destinationId, price: 200, observedAt: "2026-09-07T00:00:00.000Z" }),
    offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: tieDestinations[0].destinationId, price: 200, observedAt: "2026-09-07T00:00:00.000Z" })
] };
const tie = createPublicCurrentRetailProjection({ products, retailers, destinations: tieDestinations, currentSnapshot: tieSource, asOf });
assert.equal(tie.winners.overall.retailerId, "RETAILER-0001"); cases += 1;
const reversedAffiliates = retailers.map(item => ({ ...item, affiliateProgram: { status: item.id === "RETAILER-0001" ? "approved" : "pending" } }));
assert.equal(createPublicCurrentRetailProjection({ products, retailers: reversedAffiliates, destinations: tieDestinations, currentSnapshot: tieSource, asOf }).winners.overall.retailerId, "RETAILER-0001"); cases += 1;

for (const blocked of [
    offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: destinations[0].destinationId, price: 100, observedAt: "2026-09-07T00:00:00.000Z", itemPriceEligible: false, availability: "AVAILABLE_MARKETPLACE", condition: null }),
    offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: destinations[0].destinationId, price: 100, observedAt: "2026-09-07T00:00:00.000Z", itemPriceEligible: false, availability: "OUT_OF_STOCK" }),
    offer({ productId: "ram_ddr5_one", retailerId: "RETAILER-0001", destinationId: destinations[0].destinationId, price: 100, observedAt: "2026-09-07T00:00:00.000Z", itemPriceEligible: false, condition: null })
]) {
    assert.equal(createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: { offers: [blocked] }, asOf }).winners.overall, null); cases += 1;
}
const empty = createEmptyPublicCurrentRetailProjection({ asOf });
assert.equal(empty.state, "NO_CURRENT_RETAIL_STATE"); cases += 1;
assert.equal(validatePublicCurrentRetailProjection(empty).valid, true); cases += 1;
assert.throws(() => createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: source }), /AS_OF_INVALID/); cases += 1;
const tampered = structuredClone(projection); tampered.disclosure = "Costs included.";
assert.equal(validatePublicCurrentRetailProjection(tampered).valid, false); cases += 1;
assert.equal(PUBLIC_CURRENT_RETAIL_POLICY.maxAgeHours, 36); cases += 1;
const projectionSource = await readFile(new URL("../current-display/PublicCurrentRetailProjection.js", import.meta.url), "utf8");
assert.doesNotMatch(projectionSource, /HistoricalObservationRepository|ObservationAcceptanceRepository|DataForSeoMarketEvidenceRepository|ReviewDecisionRepository|PublicationDecisionRepository|CurrentPrice|HistoricalCheapest/); cases += 1;

console.log(`Public current-retail projection tests passed: ${cases} cases.`);
