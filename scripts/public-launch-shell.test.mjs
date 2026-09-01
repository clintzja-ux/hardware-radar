import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const readPublic = (relativePath) => readFile(path.join(publicRoot, relativePath), "utf8");

const categoryPages = ["ddr5.html", "ddr4.html", "sodimm.html"];
const categoryModules = [
    "js/modules/pages/ddr5.js",
    "js/modules/pages/ddr4.js",
    "js/modules/pages/sodimm.js"
];

for (const obsoletePath of [
    "data/ram.json",
    "data/ram/ddr5.json",
    "data/ram/ddr4.json",
    "data/ram/sodimm.json",
    "js/modules/data.js",
    "js/modules/renderDecisionPaths.js"
]) {
    await assert.rejects(access(path.join(publicRoot, obsoletePath)), { code: "ENOENT" });
}

const loader = await readPublic("js/modules/loadCategory.js");
assert.match(loader, /loadMarketSnapshot\(\)/);
assert.doesNotMatch(loader, /fetch\(path\)/);
assert.match(loader, /Unsupported governed market scope/);
assert.match(loader, /scopeToDisplayProducts/);

for (const file of categoryModules) {
    assert.doesNotMatch(await readPublic(file), /data\/ram\//);
}

for (const file of [...categoryPages, ...categoryModules]) {
    const source = await readPublic(file);
    assert.doesNotMatch(source, /Gaming Pick|RGB Pick|Workstation Pick|Upgrade Pick|Business Pick|href=["']#["']/i);
}

for (const file of categoryPages) {
    const source = await readPublic(file);
    assert.equal((source.match(/<main(?:\s|>)/g) ?? []).length, 1, `${file} must contain one main landmark.`);
    assert.match(source, /aria-live="polite"/);
}

for (const file of categoryModules) {
    const source = await readPublic(file);
    assert.match(source, /catch \(error\)/);
    assert.match(source, /renderRecommendationError/);
    assert.match(source, /renderExpandableComparison\(\[\]/);
}

const productionCopy = await Promise.all([
    "index.html",
    ...categoryPages,
    "how-we-choose.html",
    "js/modules/renderTrust.js",
    "js/modules/renderFooter.js"
].map(readPublic));
for (const source of productionCopy) {
    assert.doesNotMatch(source, /updated throughout the day|prices verified throughout the day|today['’]s best verified|next-lowest verified/i);
}

const containers = new Map();
globalThis.document = {
    getElementById(id) {
        if (!containers.has(id)) containers.set(id, { innerHTML: "", setAttribute() {} });
        return containers.get(id);
    }
};
const { renderRecommendation } = await import(pathToFileURL(path.join(publicRoot, "js/modules/renderRecommendation.js")));
renderRecommendation({
    brand: "Example",
    model: "RAM",
    bestFor: "Fixture",
    capacity: "32GB",
    memoryType: "DDR5",
    speed: "6000 MT/s",
    price: "99.00",
    retailer: "Retailer",
    priceBasis: "Listed price",
    shippingMessage: "Shipping not verified",
    insight: "Fixture",
    affiliateUrl: "https://retailer.example/item"
}, "recommendation");
assert.match(containers.get("recommendation").innerHTML, /target="_blank"/);
assert.match(containers.get("recommendation").innerHTML, /rel="noopener noreferrer"/);
assert.match(containers.get("recommendation").innerHTML, /Shipping not verified/);

const { scopeToDisplayProducts } = await import(pathToFileURL(path.join(publicRoot, "js/modules/marketData.js")));
const projected = scopeToDisplayProducts({ status: "AVAILABLE", cheapest: { atlasProductId: "ram_one", observationId: "mer_obs_000000001", brand: "Example", modelName: "Winner", capacityGb: 32, memoryType: "DDR5", dataRateMtps: 6000, price: 99, currency: "USD", priceBasis: "LISTED_PRICE", shipping: { known: false, amount: null, currency: null }, retailer: "Retailer A", sourceUrl: "https://retailer.example/a", observedAt: "2026-08-31T12:00:00Z", freshness: "CURRENT", confidence: "HIGH" }, alternatives: [{ atlasProductId: "ram_two", observationId: "mer_obs_000000002", brand: "Example", modelName: "Alternative", capacityGb: 32, memoryType: "DDR5", dataRateMtps: 5600, price: 109, currency: "USD", priceBasis: "LISTED_PRICE", shipping: { known: true, amount: 0, currency: "USD" }, retailer: "Retailer B", sourceUrl: "https://retailer.example/b", observedAt: "2026-08-31T12:01:00Z", freshness: "CURRENT", confidence: "HIGH" }], coverage: { eligibleObservations: 2, retailersRepresented: 2 } }, "ddr5", "Qualifying DDR5 listed price");
assert.equal(projected.length, 2);
assert.equal(projected[0].rank, 1);
assert.equal(projected[1].rank, 2);
assert.equal(projected[0].shippingMessage, "Shipping not verified");
assert.equal(projected[1].shippingMessage, "Shipping verified as free");
assert.deepEqual(scopeToDisplayProducts({ status: "INSUFFICIENT_DATA", cheapest: null, alternatives: [] }, "ddr5", "DDR5"), []);
const comparisonSource = await readPublic("js/modules/renderExpandableComparison.js");
assert.match(comparisonSource, /shippingMessage/);
assert.match(comparisonSource, /target="_blank" rel="noopener noreferrer"/);

const privacy = await readPublic("privacy-policy.html");
assert.match(privacy, /Google Analytics/);
assert.match(privacy, /Microsoft Clarity/);

console.log("Public launch-shell truth and safety contract passed.");
