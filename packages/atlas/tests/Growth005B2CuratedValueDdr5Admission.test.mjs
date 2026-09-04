import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRamCatalogProjection } from "../RamCatalogProjection.js";
import { validateRepository } from "../ProductValidator.js";

const manifestUrl = new URL("../atlas-manifest.json", import.meta.url);
const manifest = JSON.parse(await readFile(fileURLToPath(manifestUrl), "utf8"));
const products = await Promise.all(manifest.products.map(async ({ path }) =>
    JSON.parse(await readFile(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8"))
));
const catalog = createRamCatalogProjection(products);

const admitted = [
    ["KF560C30BBEA-8", "ram_kingston_kf560c30bbea_8", 8, 1, 8, 6000, 30, "PROFILE_INCLUDED", "PROFILE_INCLUDED"],
    ["KF560C36BBEA-8", "ram_kingston_kf560c36bbea_8", 8, 1, 8, 6000, 36, "PROFILE_INCLUDED", "PROFILE_INCLUDED"],
    ["CMK16GX5M2B5200Z40", "ram_corsair_cmk16gx5m2b5200z40", 16, 2, 8, 5200, 40, "PROFILE_INCLUDED", "PROFILE_INCLUDED"],
    ["F5-6000J3636F16GX1-RS5K", "ram_g_skill_f5_6000j3636f16gx1_rs5k", 16, 1, 16, 6000, 36, "PROFILE_INCLUDED", "PROFILE_INCLUDED"]
];

assert.ok(manifest.counts.products >= 26);
assert.equal(manifest.counts.brands, 5, "Existing registered brands are reused; empty candidate brands are not created.");
assert.equal(validateRepository(products).valid, true);
assert.equal(new Set(products.map(({ identity }) => identity.atlasProductId)).size, products.length);
assert.equal(new Set(products.map(({ identity }) => identity.manufacturerPartNumber.toLowerCase())).size, products.length);
assert.equal(new Set(products.map(({ identity }) => identity.slug)).size, products.length);

for (const [mpn, atlasProductId, capacityGb, moduleCount, capacityPerModuleGb, speed, cas, xmp, expo] of admitted) {
    const product = products.find(({ identity }) => identity.manufacturerPartNumber === mpn);
    assert.ok(product, `${mpn} must be admitted through the existing Atlas product boundary.`);
    assert.equal(product.identity.atlasProductId, atlasProductId);
    assert.equal(product.governance.lifecycleStatus, "ACTIVE");
    assert.equal(product.governance.publicationStatus, "READY");
    assert.equal(product.extension.data.classification.memoryType, "DDR5");
    assert.equal(product.extension.data.classification.formFactor, "DIMM");
    assert.equal(product.extension.data.classification.moduleType, "UDIMM");
    assert.equal(product.extension.data.capacity.capacityGb, capacityGb);
    assert.equal(product.extension.data.capacity.moduleCount, moduleCount);
    assert.equal(product.extension.data.capacity.capacityPerModuleGb, capacityPerModuleGb);
    assert.equal(capacityGb, moduleCount * capacityPerModuleGb);
    assert.equal(product.extension.data.performance.dataRateMtps, speed);
    assert.equal(product.extension.data.performance.casLatency, cas);
    assert.equal(product.extension.data.performance.xmpSupport, xmp);
    assert.equal(product.extension.data.performance.expoSupport, expo);
    assert.ok(product.provenance.fieldSources["identity.manufacturerPartNumber"].every(({ sourceType, sourceLocator }) =>
        sourceType.startsWith("MANUFACTURER_") && sourceLocator.startsWith("https://")
    ));
    const projection = catalog.products.find((item) => item.atlasProductId === atlasProductId);
    assert.ok(projection);
    assert.equal(projection.manufacturerPartNumber, mpn);
    assert.equal(projection.publicPath, `/ram/${product.identity.slug}/`);
}

for (const excludedMpn of [
    "HMCG66AEBUA084N-ATC",
    "MD8GSD5560046-TB",
    "MD16GSD5560046-TB",
    "SP016GXLWU60FBDKAI",
    "SP016GXLWU60FBDKAI Gray"
]) {
    assert.equal(products.some(({ identity }) => identity.manufacturerPartNumber === excludedMpn), false);
    assert.equal(catalog.products.some(({ manufacturerPartNumber }) => manufacturerPartNumber === excludedMpn), false);
}

const forbiddenKeys = new Set([
    "retailerId", "retailer", "price", "availability", "shipping", "condition",
    "affiliateUrl", "destinationUrl", "cheapest", "pick", "recommendation"
]);
const visit = (value, path = "$") => {
    if (Array.isArray(value)) return value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
        assert.equal(forbiddenKeys.has(key), false, `Market/retailer authority is forbidden at ${path}.${key}.`);
        visit(child, `${path}.${key}`);
    }
};
admitted.forEach(([mpn]) => visit(products.find(({ identity }) => identity.manufacturerPartNumber === mpn)));

const destinations = JSON.parse(await readFile(fileURLToPath(new URL("../../mercury/destinations/production-destinations.json", import.meta.url)), "utf8"));
assert.equal(destinations.records.length, 24);
for (const atlasProductId of ["ram_kingston_kf560c30bbea_8", "ram_corsair_cmk16gx5m2b5200z40", "ram_g_skill_f5_6000j3636f16gx1_rs5k"]) {
    assert.equal(destinations.records.some(destination => destination.atlasProductId === atlasProductId && destination.retailerId === "RETAILER-0001"), true);
}
assert.equal(destinations.records.some(({ atlasProductId }) => atlasProductId === "ram_kingston_kf560c36bbea_8"), false);

console.log("GROWTH-005B.2 curated value-DDR5 Atlas admission tests passed (4 admitted, 3 held, 1 rejected).");
