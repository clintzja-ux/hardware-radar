import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRetailerDestination, RETAILER_DESTINATION_BINDING_METHOD, RETAILER_DESTINATION_SOURCE_TYPE, RETAILER_DESTINATION_TYPE } from "../packages/mercury/destinations/RetailerDestination.js";
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
assert.equal(production.recordCount, 0);
for (const productPage of catalog.products) assert.doesNotMatch(renderRamProductPage(productPage, []), /fixture-reviewed|Retailer links/);
const marketData = await readFile(path.join(root, "public/js/modules/marketData.js"), "utf8");
assert.match(marketData, /offerUrl: item\.sourceUrl/);
assert.doesNotMatch(marketData, /affiliateUrl/);
console.log("GROWTH-005B retailer destination source and rendering tests passed.");
