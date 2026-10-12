import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateRepository } from "../ProductValidator.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../atlas-manifest.json", import.meta.url)), "utf8"));
const products = await Promise.all(manifest.products.map(async ({ path }) =>
    JSON.parse(await readFile(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8"))
));
const releasedProducts=products.filter(product=>product.governance.lifecycleStatus==="ACTIVE"&&product.governance.publicationStatus==="READY");
const admitted = products.filter((product) => product.identity.createdBy === "system:atlas-ram-expansion-002");
const holdMpns = [
    "CMH32GX5M2N6400C36",
    "CMH32GX5M2B6000Z30CB",
    "CMH32GX5M2N6400C36W",
    "CMH32GX5M2N6000Z30"
];

assert.equal(manifest.counts.products, products.length);
assert.equal(products.find(product=>product.identity.atlasProductId==="ram_timetec_76tt26nus2r8_16gk2")?.governance.lifecycleStatus,"ACTIVE");
assert.equal(products.find(product=>product.identity.atlasProductId==="ram_timetec_76tt26nus2r8_16gk2")?.governance.publicationStatus,"READY");
assert.equal(admitted.length, 77);
assert.equal(new Set(admitted.map((product) => product.identity.atlasProductId)).size, 77);
assert.equal(new Set(admitted.map((product) => `${product.identity.brand}:${product.identity.manufacturerPartNumber.toUpperCase()}`)).size, 77);
const releasedByBrand=Object.groupBy(releasedProducts,product=>product.identity.brand),releasedByGeneration=Object.groupBy(releasedProducts,product=>product.extension.data.classification.memoryType),releasedByFormFactor=Object.groupBy(releasedProducts,product=>product.extension.data.classification.formFactor);
assert.equal(Object.values(releasedByBrand).reduce((count,group)=>count+group.length,0),releasedProducts.length);
assert.equal(Object.values(releasedByGeneration).reduce((count,group)=>count+group.length,0),releasedProducts.length);
assert.equal(Object.values(releasedByFormFactor).reduce((count,group)=>count+group.length,0),releasedProducts.length);
assert.deepEqual(Object.keys(releasedByGeneration).sort(),["DDR4","DDR5"]);
assert.deepEqual(Object.keys(releasedByFormFactor).sort(),["DIMM","SO_DIMM"]);

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
assert.equal((await readdir(fileURLToPath(new URL("../products/ram/", import.meta.url)), { recursive: true })).filter((path) => path.endsWith(".json")).length, products.length);

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
