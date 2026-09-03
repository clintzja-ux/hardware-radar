import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRetailerDestination, RETAILER_DESTINATION_BINDING_METHOD, RETAILER_DESTINATION_SOURCE_TYPE, RETAILER_DESTINATION_TYPE, validateRetailerDestination } from "../packages/mercury/destinations/RetailerDestination.js";
import { createPublicRetailerDestinationProjection, loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { renderRamProductPage } from "./ram-product-publishing.mjs";
import { createRamCatalogProjection } from "../packages/atlas/RamCatalogProjection.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = async file => JSON.parse(await readFile(file, "utf8"));
const manifest = await json(path.join(root, "packages/atlas/atlas-manifest.json"));
const products = await Promise.all(manifest.products.map(entry => json(path.join(root, "packages/atlas", entry.path))));
const retailers = await Promise.all(manifest.retailers.map(entry => json(path.join(root, "packages/atlas", entry.path))));
const catalog = createRamCatalogProjection(products);
const product = products.find(item => item.identity.atlasProductId === "ram_corsair_cmk32gx5m2b6000z30");
const publicProduct = catalog.products.find(item => item.atlasProductId === product.identity.atlasProductId);
const retailer = retailers.find(item => item.id === "RETAILER-0002");
const directory = await mkdtemp(path.join(tmpdir(), "growth-005b-"));
const sourcePath = path.join(directory, "destinations.json");
const input = (overrides = {}) => ({ atlasProductId: product.identity.atlasProductId, retailerId: retailer.id, marketplace: "platinummicro.com", destinationType: RETAILER_DESTINATION_TYPE, destinationUrl: "https://platinummicro.com/fixture-reviewed/exact-product", retailerListingId: "FIXTURE-ONLY", binding: { manufacturerPartNumber: product.identity.manufacturerPartNumber, method: RETAILER_DESTINATION_BINDING_METHOD, scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: ["fixture:growth-005b:review:1"] }, provenance: { sourceType: RETAILER_DESTINATION_SOURCE_TYPE }, reviewedBy: "operator:fixture", reviewedAt: "2026-09-02T22:00:00Z", status: "ACTIVE", supersedesDestinationId: null, retirementReason: null, createdAt: "2026-09-02T22:00:00Z", createdBy: "operator:fixture", ...overrides });
const record = createRetailerDestination(input());
const save = async records => writeFile(sourcePath, `${JSON.stringify({ schemaVersion: "1.0", records }, null, 2)}\n`);

await save([]);
const empty = await loadRetailerDestinationSource({ sourcePath, products, retailers });
assert.equal(empty.recordCount, 0);
assert.equal(createPublicRetailerDestinationProjection({ source: empty, retailers }).length, 0);
assert.doesNotMatch(renderRamProductPage(publicProduct), /Retailer links/);

await save([record]);
const loaded = await loadRetailerDestinationSource({ sourcePath, products, retailers });
const projected = createPublicRetailerDestinationProjection({ source: loaded, retailers });
assert.equal(loaded.recordCount, 1);
assert.equal(projected.length, 1);
assert.deepEqual(Object.keys(projected[0]), ["destinationId", "atlasProductId", "retailerId", "retailerDisplayName", "marketplace", "destinationUrl", "destinationType"]);
const html = renderRamProductPage(publicProduct, projected);
assert.match(html, /<h2 id="retailer-links-heading">Retailer links<\/h2>/);
assert.match(html, />Platinummicro<\/span><a href="https:\/\/platinummicro\.com\/fixture-reviewed\/exact-product" target="_blank" rel="noopener noreferrer">Visit retailer<\/a>/);
assert.match(html, /do not indicate current price or availability/);
assert.doesNotMatch(html, /rel="[^"]*sponsored|affiliate|>Buy now<|>In stock<|>Best price<|>Lowest price<|>Cheapest<|>Recommended retailer<|"@type":"Offer"/i);
assert.doesNotMatch(renderRamProductPage({ ...publicProduct, atlasProductId: products[1].identity.atlasProductId }, projected.filter(item => item.atlasProductId === products[1].identity.atlasProductId)), /Retailer links/);
assert.doesNotMatch(renderRamProductPage({ ...publicProduct, atlasProductId: products[1].identity.atlasProductId }, projected), /Retailer links/);
assert.throws(() => renderRamProductPage(publicProduct, [{ ...projected[0], destinationUrl: "javascript:alert(1)" }]), /DESTINATION_INVALID/);

const secondRetailer = retailers.find(item => item.id !== retailer.id);
const second = createRetailerDestination(input({ retailerId: secondRetailer.id, marketplace: new URL(secondRetailer.websiteUrl).hostname.replace(/^www\./, ""), destinationUrl: `https://${new URL(secondRetailer.websiteUrl).hostname.replace(/^www\./, "")}/fixture-reviewed/exact-product`, retailerListingId: "FIXTURE-SECOND" }));
await save([record, second]);
const ordered = createPublicRetailerDestinationProjection({ source: await loadRetailerDestinationSource({ sourcePath, products, retailers }), retailers });
assert.deepEqual(ordered.map(item => item.retailerDisplayName), [...ordered.map(item => item.retailerDisplayName)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));

const replacement = createRetailerDestination(input({ destinationUrl: "https://platinummicro.com/fixture-reviewed/replacement", supersedesDestinationId: record.destinationId, reviewedAt: "2026-09-02T23:00:00Z", createdAt: "2026-09-02T23:00:00Z" }));
await save([record, replacement]);
assert.equal((await loadRetailerDestinationSource({ sourcePath, products, retailers })).effective[0].destinationId, replacement.destinationId);
const retirement = createRetailerDestination(input({ destinationUrl: replacement.destinationUrl, status: "RETIRED", supersedesDestinationId: replacement.destinationId, retirementReason: "Fixture retirement", reviewedAt: "2026-09-03T00:00:00Z", createdAt: "2026-09-03T00:00:00Z" }));
await save([record, replacement, retirement]);
assert.equal((await loadRetailerDestinationSource({ sourcePath, products, retailers })).effective.length, 0);

await writeFile(sourcePath, "not-json");
await assert.rejects(() => loadRetailerDestinationSource({ sourcePath, products, retailers }), /MALFORMED_JSON/);
for (const invalid of [
    { ...record, price: 1 },
    { ...record, destinationUrl: "http://platinummicro.com/item" },
    { ...record, marketplace: "example.com" },
    { ...record, atlasProductId: "ram_unknown_product" }
]) { await save([invalid]); await assert.rejects(() => loadRetailerDestinationSource({ sourcePath, products, retailers }), /SOURCE_INVALID/); }
await save([record, record]); await assert.rejects(() => loadRetailerDestinationSource({ sourcePath, products, retailers }), /DUPLICATE_ID/);
await save([record, createRetailerDestination(input({ destinationUrl: "https://platinummicro.com/fixture-reviewed/parallel" }))]); await assert.rejects(() => loadRetailerDestinationSource({ sourcePath, products, retailers }), /ACTIVE_HEAD_CONFLICT/);
await save([replacement]); await assert.rejects(() => loadRetailerDestinationSource({ sourcePath, products, retailers }), /SUPERSESSION/);

const production = await loadRetailerDestinationSource({ sourcePath: path.join(root, "packages/mercury/destinations/production-destinations.json"), products, retailers });
const productionProjection = createPublicRetailerDestinationProjection({ source: production, retailers });
const expectedProduction = new Map([
    ["ram_kingston_kf560c30bbea_8", { mpn: "KF560C30BBEA-8", listing: "B0CYM3TYCR", id: "mer_dest_a09300f14e011c9edac43a0d", url: "https://amazon.com/Kingston-6000MT-Desktop-Memory-KF560C30BBEA-8/dp/B0CYM3TYCR" }],
    ["ram_corsair_cmk16gx5m2b5200z40", { mpn: "CMK16GX5M2B5200Z40", listing: "B0D2P1CVQD", id: "mer_dest_47a09c16a1755fe032dddf33", url: "https://amazon.com/CORSAIR-Vengeance-5200MHz-Compatible-Computer/dp/B0D2P1CVQD" }],
    ["ram_g_skill_f5_6000j3636f16gx1_rs5k", { mpn: "F5-6000J3636F16GX1-RS5K", listing: "B0G7Q6R7N5", id: "mer_dest_f77afb296ff8e32efabaa489", url: "https://amazon.com/G-SKILL-Ripjaws-CL36-36-36-96-Desktop-Computer/dp/B0G7Q6R7N5" }]
]);
assert.equal(production.recordCount, 3);
assert.equal(production.effective.length, 3);
assert.equal(productionProjection.length, 3);
assert.equal(new Set(production.records.map(item => item.destinationId)).size, 3);
assert.equal(new Set(production.records.map(item => item.materialFingerprint)).size, 3);
for (const destination of production.records) {
    const expected = expectedProduction.get(destination.atlasProductId);
    assert.ok(expected, `Unexpected production destination ${destination.destinationId}.`);
    assert.equal(destination.destinationId, expected.id);
    assert.equal(destination.binding.manufacturerPartNumber, expected.mpn);
    assert.equal(destination.retailerListingId, expected.listing);
    assert.equal(destination.destinationUrl, expected.url);
    assert.equal(destination.retailerId, "RETAILER-0001");
    assert.equal(destination.marketplace, "amazon.com");
    assert.equal(destination.status, "ACTIVE");
    assert.equal(destination.binding.method, "OPERATOR_EXACT_PRODUCT_REVIEW");
    assert.equal(destination.binding.scope, "EXACT_STANDALONE_PRODUCT");
    assert.equal(destination.provenance.sourceType, "OPERATOR_INSPECTED_PUBLIC_PAGE");
    assert.equal(destination.reviewedBy, "operator:Clinton_Ramsook");
    assert.equal(destination.destinationUrl.startsWith("https://amazon.com/"), true);
    assert.equal(new URL(destination.destinationUrl).search, "");
    assert.equal(new URL(destination.destinationUrl).hash, "");
    assert.equal(destination.destinationUrl.includes("tag="), false);
    assert.equal(destination.destinationUrl.endsWith(`/dp/${expected.listing}`), true);
    assert.equal(validateRetailerDestination(destination).valid, true);
    assert.equal(createRetailerDestination({
        atlasProductId: destination.atlasProductId, retailerId: destination.retailerId, marketplace: destination.marketplace,
        destinationType: destination.destinationType, destinationUrl: destination.destinationUrl, retailerListingId: destination.retailerListingId,
        binding: destination.binding, provenance: destination.provenance, reviewedBy: destination.reviewedBy, reviewedAt: destination.reviewedAt,
        status: destination.status, supersedesDestinationId: destination.supersedesDestinationId, retirementReason: destination.retirementReason,
        createdAt: destination.createdAt, createdBy: destination.createdBy
    }).materialFingerprint, destination.materialFingerprint);
}
for (const productPage of catalog.products) {
    const destinations = productionProjection.filter(item => item.atlasProductId === productPage.atlasProductId);
    const rendered = renderRamProductPage(productPage, destinations);
    const generated = await readFile(path.join(root, "public", productPage.publicPath.slice(1), "index.html"), "utf8");
    assert.equal(generated, rendered);
    assert.equal((rendered.match(/googletagmanager\.com\/gtag\/js/g) ?? []).length, 1);
    assert.equal((rendered.match(/gtag\("config","G-QF6XJ8GCMY"\)/g) ?? []).length, 1);
    if (expectedProduction.has(productPage.atlasProductId)) {
        assert.match(rendered, /<h2 id="retailer-links-heading">Retailer links<\/h2>/);
        assert.match(rendered, />Amazon<\/span><a href="https:\/\/amazon\.com\//);
        assert.match(rendered, /target="_blank" rel="noopener noreferrer">Visit retailer<\/a>/);
        assert.doesNotMatch(rendered, /onclick=|sendBeacon\(|fetch\(|gtag\("event"|data-(?:analytics|event|destination)/i);
        assert.match(rendered, /do not indicate current price or availability/);
        assert.doesNotMatch(rendered, /rel="[^"]*sponsored|affiliate|"@type":"(?:Offer|AggregateOffer)"|"price(?:Currency)?"|"availability"|"seller"/i);
    } else {
        assert.doesNotMatch(rendered, /Retailer links|amazon\.com/);
    }
}
assert.equal(catalog.products.length - expectedProduction.size, 23);
const marketData = await readFile(path.join(root, "public/js/modules/marketData.js"), "utf8");
assert.match(marketData, /offerUrl: item\.sourceUrl/);
assert.doesNotMatch(marketData, /affiliateUrl/);
const catalogClient = await readFile(path.join(root, "public/js/modules/ramCatalog.js"), "utf8");
const comparisonClient = await readFile(path.join(root, "public/js/modules/ramComparison.js"), "utf8");
assert.doesNotMatch(catalogClient, /destinationUrl|retailerListingId|amazon\.com/);
assert.doesNotMatch(comparisonClient, /destinationUrl|retailerListingId|amazon\.com/);
console.log("GROWTH-005B retailer destination source and rendering tests passed.");
