import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateRepository } from "../ProductValidator.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../atlas-manifest.json", import.meta.url)), "utf8"));
const products = await Promise.all(manifest.products.map(async ({ path }) =>
    JSON.parse(await readFile(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8"))
));
const admitted = products.filter((product) => product.identity.createdBy === "system:atlas-ram-expansion-002");
const holdMpns = [
    "CMH32GX5M2N6400C36",
    "CMH32GX5M2B6000Z30CB",
    "CMH32GX5M2N6400C36W",
    "CMH32GX5M2N6000Z30"
];

assert.equal(manifest.counts.products, 103);
assert.equal(products.length, 103);
assert.equal(admitted.length, 77);
assert.equal(new Set(admitted.map((product) => product.identity.atlasProductId)).size, 77);
assert.equal(new Set(admitted.map((product) => `${product.identity.brand}:${product.identity.manufacturerPartNumber.toUpperCase()}`)).size, 77);
assert.deepEqual(
    Object.fromEntries([...new Set(products.map((product) => product.identity.brand))].sort().map((brand) => [brand, products.filter((product) => product.identity.brand === brand).length])),
    { Corsair: 19, Crucial: 20, "G.SKILL": 25, Kingston: 23, TeamGroup: 16 }
);
assert.deepEqual(
    Object.fromEntries(["DDR4", "DDR5"].map((generation) => [generation, products.filter((product) => product.extension.data.classification.memoryType === generation).length])),
    { DDR4: 15, DDR5: 88 }
);
assert.deepEqual(
    Object.fromEntries(["DIMM", "SO_DIMM"].map((formFactor) => [formFactor, products.filter((product) => product.extension.data.classification.formFactor === formFactor).length])),
    { DIMM: 84, SO_DIMM: 19 }
);

for (const product of admitted) {
    const { classification, capacity } = product.extension.data;
    assert.equal(capacity.capacityGb, capacity.moduleCount * capacity.capacityPerModuleGb);
    assert.equal(product.governance.lifecycleStatus, "ACTIVE");
    assert.equal(product.governance.publicationStatus, "READY");
    assert.equal(product.governance.humanReviewRequired, false);
    assert.equal(product.governance.reviewedBy, "human:Clinton_Ramsook");
    assert.equal(product.governance.reviewedAt, "2026-09-04T18:00:00.000Z");
    assert.ok(["Corsair", "Crucial", "G.SKILL", "Kingston", "TeamGroup"].includes(product.identity.brand));
    assert.equal(["DDR4", "DDR5"].includes(classification.memoryType), true);
    for (const rule of RamRuleSet.rules) {
        assert.equal(rule.validate(product).result, "PASS", `${product.identity.atlasProductId} failed ${rule.ruleId}`);
    }
}

const canonicalMpns = new Set(products.map((product) => product.identity.manufacturerPartNumber.toUpperCase()));
for (const mpn of holdMpns) assert.equal(canonicalMpns.has(mpn), false, `${mpn} must remain outside Atlas.`);
assert.equal(validateRepository(products).valid, true);
assert.equal((await readdir(fileURLToPath(new URL("../products/ram/", import.meta.url)), { recursive: true })).filter((path) => path.endsWith(".json")).length, 103);

const forbiddenKeys = new Set(["retailerId", "retailer", "price", "availability", "shipping", "affiliateUrl", "destinationUrl"]);
function assertNoMarketData(value, path = "$") {
    if (Array.isArray(value)) return value.forEach((item, index) => assertNoMarketData(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
        assert.equal(forbiddenKeys.has(key), false, `Forbidden market field at ${path}.${key}`);
        assertNoMarketData(child, `${path}.${key}`);
    }
}
admitted.forEach((product) => assertNoMarketData(product));

console.log("ATLAS-RAM-EXPANSION-002 batch admission tests passed (77 records).");
