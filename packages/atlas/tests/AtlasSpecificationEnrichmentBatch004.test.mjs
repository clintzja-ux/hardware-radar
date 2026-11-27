import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ProductRepository } from "../ProductRepository.js";
import {
    validateTimingValueIntegrity,
    validateUnitNormalization
} from "../../sentinel/extensions/ram/RamValidators.js";

const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const products = await new ProductRepository({
    manifestUrl: new URL("../atlas-manifest.json", import.meta.url),
    readJson
}).getAll();
const byId = new Map(products.map(product => [product.identity.atlasProductId, product]));

const approved = new Map([
    ["ram_corsair_cmsx32gx5m1a5600c48", ["CMSX32GX5M1A5600C48", 48, 1.1, "UNKNOWN"]],
    ["ram_g_skill_f5_5600s4040a16gx2_rs", ["F5-5600S4040A16GX2-RS", 40, 1.1, "PROFILE_INCLUDED"]],
    ["ram_g_skill_f5_6000j3040g32gx2_tz5n", ["F5-6000J3040G32GX2-TZ5N", 30, 1.4, "PROFILE_INCLUDED"]],
    ["ram_patriot_psd416g24002s", ["PSD416G24002S", null, 1.2, "UNKNOWN"]],
    ["ram_patriot_psd416g26662s", ["PSD416G26662S", null, 1.2, "UNKNOWN"]],
    ["ram_patriot_psd416g320081s", ["PSD416G320081S", null, 1.2, "UNKNOWN"]],
    ["ram_patriot_psd432g26662s", ["PSD432G26662S", null, 1.2, "UNKNOWN"]],
    ["ram_patriot_psd432g32002s", ["PSD432G32002S", null, 1.2, "UNKNOWN"]],
    ["ram_patriot_psd48g240081s", ["PSD48G240081S", null, 1.2, "UNKNOWN"]],
    ["ram_patriot_psd48g266681s", ["PSD48G266681S", null, 1.2, "UNKNOWN"]],
    ["ram_pny_md32gk2d4320016xrgb", ["MD32GK2D4320016XRGB", null, 1.35, "SUPPORTED"]],
    ["ram_pny_md32gk2d5560046_tb", ["MD32GK2D5560046-TB", null, 1.1, "UNKNOWN"]],
    ["ram_pny_mn64gk2d43200_tb", ["MN64GK2D43200-TB", null, 1.2, "NONE"]],
    ["ram_xpg_ax5u6400c3216g_dclabk", ["AX5U6400C3216G-DCLABK", null, 1.4, "UNKNOWN"]],
    ["ram_xpg_ax5u6400c3232g_dclarbk", ["AX5U6400C3232G-DCLARBK", null, 1.35, "UNKNOWN"]]
]);

for (const [atlasProductId, [mpn, cas, voltage, xmpSupport]] of approved) {
    const product = byId.get(atlasProductId);
    assert.ok(product, atlasProductId);
    assert.equal(product.identity.manufacturerPartNumber, mpn, atlasProductId);
    assert.equal(product.extension.data.performance.casLatency, cas, atlasProductId);
    assert.equal(product.extension.data.electrical.ratedVoltage, voltage, atlasProductId);
    assert.equal(product.extension.data.performance.xmpSupport, xmpSupport, atlasProductId);
    assert.equal(product.identity.updatedBy, "system:atlas-spec-enrichment-batch-004", atlasProductId);
    assert.equal(product.validation.validatedAt, "2026-11-23T00:00:00.000Z", atlasProductId);
    const sources = Object.values(product.provenance.fieldSources).flat();
    assert.ok(sources.some(source =>
        ["MANUFACTURER_PRODUCT_PAGE", "MANUFACTURER_DATASHEET"].includes(source.sourceType) &&
        source.verificationStatus === "VERIFIED"
    ), atlasProductId + " requires verified manufacturer provenance");
    assert.equal(validateTimingValueIntegrity(product).result, "PASS", atlasProductId);
    assert.equal(validateUnitNormalization(product).result, "PASS", atlasProductId);
}

const completeTimingTuple = product => {
    const performance = product.extension.data.performance;
    const values = [performance.casLatency, performance.tRcd, performance.tRp, performance.tRas];
    return values.every(value => Number.isInteger(value) && value > 0) &&
        performance.primaryTimings === values.join("-");
};

const preBatch005Products = products.filter(product => !["system:atlas-feed-expansion-batch-005", "system:atlas-batch-006-draft-admission"].includes(product.identity.createdBy));
assert.equal(preBatch005Products.length, 159);
assert.equal(preBatch005Products.filter(product => Number.isInteger(product.extension.data.performance.casLatency)).length, 71);
assert.equal(preBatch005Products.filter(completeTimingTuple).length, 69);
assert.equal(preBatch005Products.filter(product => typeof product.extension.data.electrical.ratedVoltage === "number").length, 148);

for (const product of products.filter(product => product.identity.brand === "Kingston")) {
    assert.notEqual(product.identity.updatedBy, "system:atlas-spec-enrichment-batch-004");
}
for (const product of products.filter(product => product.identity.brand === "Timetec")) {
    assert.notEqual(product.identity.updatedBy, "system:atlas-spec-enrichment-batch-004");
}

console.log("Atlas specification enrichment Batch 004 regression tests passed.");
