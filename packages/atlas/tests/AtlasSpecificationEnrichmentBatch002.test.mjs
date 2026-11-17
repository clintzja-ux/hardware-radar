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
    ["ram_g_skill_f4_3200c16d_32gvk", ["F4-3200C16D-32GVK", "PROFILE_INCLUDED", "NONE", [16, 18, 18, 38], 1.35]],
    ["ram_corsair_cmh32gx5m2b6000z30wcb", ["CMH32GX5M2B6000Z30WCB", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [30, 36, 36, 76], 1.4]],
    ["ram_corsair_cmk64gx5m2b5200c40", ["CMK64GX5M2B5200C40", "PROFILE_INCLUDED", "UNKNOWN", [40, 40, 40, 77], 1.25]],
    ["ram_corsair_cmk32gx5m2b6000c30", ["CMK32GX5M2B6000C30", "PROFILE_INCLUDED", "UNKNOWN", [30, 36, 36, 76], 1.4]],
    ["ram_corsair_cmh16gx5m2e6000z36", ["CMH16GX5M2E6000Z36", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [36, 44, 44, 96], 1.35]],
    ["ram_corsair_cmh16gx5m2b5200z40", ["CMH16GX5M2B5200Z40", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [40, 40, 40, 77], 1.25]],
    ["ram_corsair_cmh64gx5m2d5600z40", ["CMH64GX5M2D5600Z40", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [40, 44, 44, 90], 1.25]],
    ["ram_corsair_cmk32gx5m2b6000c38", ["CMK32GX5M2B6000C38", "PROFILE_INCLUDED", "UNKNOWN", [38, 44, 44, 96], 1.35]],
    ["ram_g_skill_f5_6000j3636f16gx2_fx5", ["F5-6000J3636F16GX2-FX5", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [36, 36, 36, 96], 1.35]],
    ["ram_g_skill_f5_6000j3038f16gh2_fx5", ["F5-6000J3038F16GH2-FX5", "UNKNOWN", "PROFILE_INCLUDED", [30, 38, 38, 96], 1.35]],
    ["ram_g_skill_f5_6000j2836g16gx2_fx5", ["F5-6000J2836G16GX2-FX5", "UNKNOWN", "PROFILE_INCLUDED", [28, 36, 36, 96], 1.4]],
    ["ram_g_skill_f5_6000j3636f32gx2_fx5", ["F5-6000J3636F32GX2-FX5", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [36, 36, 36, 96], 1.35]],
    ["ram_g_skill_f5_6400j3239g32gx2_tz5rk", ["F5-6400J3239G32GX2-TZ5RK", "PROFILE_INCLUDED", "UNKNOWN", [32, 39, 39, 102], 1.4]],
    ["ram_g_skill_f5_7600j3646g16gx2_tz5rk", ["F5-7600J3646G16GX2-TZ5RK", "PROFILE_INCLUDED", "UNKNOWN", [36, 46, 46, 121], 1.4]],
    ["ram_g_skill_f5_6000j3636f16gx2_rs5k", ["F5-6000J3636F16GX2-RS5K", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [36, 36, 36, 96], 1.35]],
    ["ram_g_skill_f5_6000j3636f32gx2_rs5k", ["F5-6000J3636F32GX2-RS5K", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [36, 36, 36, 96], 1.35]],
    ["ram_g_skill_f5_6000j3040f16gx2_rs5w", ["F5-6000J3040F16GX2-RS5W", "PROFILE_INCLUDED", "UNKNOWN", [30, 40, 40, 96], 1.35]],
    ["ram_g_skill_f5_6000j3040f16gx2_rs5k", ["F5-6000J3040F16GX2-RS5K", "PROFILE_INCLUDED", "UNKNOWN", [30, 40, 40, 96], 1.35]],
    ["ram_g_skill_f5_6000j3238f16gx2_rs5w", ["F5-6000J3238F16GX2-RS5W", "PROFILE_INCLUDED", "UNKNOWN", [32, 38, 38, 96], 1.35]],
    ["ram_g_skill_f5_5200j4040a16gx2_rs5k", ["F5-5200J4040A16GX2-RS5K", "PROFILE_INCLUDED", "PROFILE_INCLUDED", [40, 40, 40, 83], 1.1]],
    ["ram_g_skill_f5_5600j3636d32gx2_rs5w", ["F5-5600J3636D32GX2-RS5W", "PROFILE_INCLUDED", "UNKNOWN", [36, 36, 36, 89], 1.25]],
    ["ram_g_skill_f5_5600s4645a32gx2_rs", ["F5-5600S4645A32GX2-RS", "PROFILE_INCLUDED", "UNKNOWN", [46, 45, 45, 89], 1.1]]
]);

for (const [atlasProductId, [mpn, xmp, expo, timings, voltage]] of approved) {
    const product = byId.get(atlasProductId);
    assert.ok(product, atlasProductId);
    const performance = product.extension.data.performance;
    assert.equal(product.identity.manufacturerPartNumber, mpn, atlasProductId);
    assert.equal(performance.xmpSupport, xmp, atlasProductId);
    assert.equal(performance.expoSupport, expo, atlasProductId);
    assert.deepEqual(
        [performance.casLatency, performance.tRcd, performance.tRp, performance.tRas],
        timings,
        atlasProductId
    );
    assert.equal(performance.primaryTimings, timings.join("-"), atlasProductId);
    assert.equal(product.extension.data.electrical.ratedVoltage, voltage, atlasProductId);
    assert.equal(product.identity.recordRevision, 3, atlasProductId);
    assert.equal(product.identity.updatedBy, "system:atlas-spec-enrichment-batch-002", atlasProductId);
    assert.equal(product.validation.validatedAt, "2026-11-17T00:00:00.000Z", atlasProductId);
    const sources = product.provenance.fieldSources["extension.data.performance"];
    assert.ok(sources.some(source =>
        source.sourceType === "MANUFACTURER_PRODUCT_PAGE" &&
        source.verificationStatus === "VERIFIED" &&
        source.verifiedBy === "system:atlas-spec-enrichment-batch-002" &&
        source.notes.startsWith("VERIFIED_EXACT_MPN:")
    ), atlasProductId + " requires exact-MPN manufacturer profile provenance");
    assert.equal(validateTimingValueIntegrity(product).result, "PASS", atlasProductId);
    assert.equal(validateUnitNormalization(product).result, "PASS", atlasProductId);
}

const voltageProduct = byId.get("ram_g_skill_f4_3200c16d_32gvk");
assert.ok(voltageProduct.provenance.fieldSources["extension.data.electrical"].some(source =>
    source.sourceId === "SRC-MFG-G-SKILL-F4-3200C16D-32GVK-VOLTAGE-B002" &&
    source.verificationStatus === "VERIFIED"
));

const completeTimingTuple = product => {
    const performance = product.extension.data.performance;
    const values = [performance.casLatency, performance.tRcd, performance.tRp, performance.tRas];
    return values.every(value => Number.isInteger(value) && value > 0) &&
        performance.primaryTimings === values.join("-");
};
assert.equal(products.length, 159);
assert.equal(products.filter(product => Number.isInteger(product.extension.data.performance.casLatency)).length, 66);
assert.equal(products.filter(completeTimingTuple).length, 64);
assert.equal(products.filter(product => typeof product.extension.data.electrical.ratedVoltage === "number").length, 133);
assert.equal(products.filter(product => product.extension.data.performance.xmpSupport === "PROFILE_INCLUDED").length, 38);
assert.equal(products.filter(product => product.extension.data.performance.expoSupport === "PROFILE_INCLUDED").length, 25);
console.log("Atlas specification enrichment Batch 002 regression tests passed.");
