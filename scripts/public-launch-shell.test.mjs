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

const privacy = await readPublic("privacy-policy.html");
assert.match(privacy, /Google Analytics/);
assert.match(privacy, /Microsoft Clarity/);

console.log("Public launch-shell truth and safety contract passed.");
