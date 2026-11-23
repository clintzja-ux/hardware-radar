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
    ["ram_corsair_cmk32gx4m2e3200c16", ["CMK32GX4M2E3200C16", [16, 20, 20, 38]]],
    ["ram_g_skill_f4_3200c22d_32grs", ["F4-3200C22D-32GRS", [22, 22, 22, 52]]],
    ["ram_g_skill_f5_6000j3040g32gx2_tz5n", ["F5-6000J3040G32GX2-TZ5N", [30, 40, 40, 96]]],
    ["ram_teamgroup_tf3d432g3200hc16fdc01", ["TF3D432G3200HC16FDC01", [16, 20, 20, 40]]],
    ["ram_teamgroup_tlzgd432g3200hc16fdc01", ["TLZGD432G3200HC16FDC01", [16, 20, 20, 40]]]
]);

for (const [atlasProductId, [mpn, timings]] of approved) {
    const product = byId.get(atlasProductId);
    assert.ok(product, atlasProductId);
    const performance = product.extension.data.performance;
    assert.equal(product.identity.manufacturerPartNumber, mpn, atlasProductId);
    assert.deepEqual(
        [performance.casLatency, performance.tRcd, performance.tRp, performance.tRas],
        timings,
        atlasProductId
    );
    assert.equal(performance.primaryTimings, timings.join("-"), atlasProductId);
    const supersededByBatch004 = atlasProductId === "ram_g_skill_f5_6000j3040g32gx2_tz5n";
    assert.equal(product.identity.recordRevision, supersededByBatch004 ? 4 : 3, atlasProductId);
    assert.equal(
        product.identity.updatedBy,
        supersededByBatch004
            ? "system:atlas-spec-enrichment-batch-004"
            : "system:atlas-spec-enrichment-batch-003",
        atlasProductId
    );
    assert.equal(product.validation.validatedAt, "2026-11-23T00:00:00.000Z", atlasProductId);
    const sources = product.provenance.fieldSources["extension.data.performance"];
    assert.ok(sources.some(source =>
        ["MANUFACTURER_PRODUCT_PAGE", "MANUFACTURER_DATASHEET"].includes(source.sourceType) &&
        source.verificationStatus === "VERIFIED" &&
        source.verifiedBy === "system:atlas-spec-enrichment-batch-003" &&
        source.notes.startsWith("VERIFIED_EXACT_MPN:")
    ), atlasProductId + " requires exact-MPN manufacturer timing provenance");
    assert.equal(validateTimingValueIntegrity(product).result, "PASS", atlasProductId);
    assert.equal(validateUnitNormalization(product).result, "PASS", atlasProductId);
}

const completeTimingTuple = product => {
    const performance = product.extension.data.performance;
    const values = [performance.casLatency, performance.tRcd, performance.tRp, performance.tRas];
    return values.every(value => Number.isInteger(value) && value > 0) &&
        performance.primaryTimings === values.join("-");
};

assert.equal(products.length, 159);
assert.ok(products.filter(product => Number.isInteger(product.extension.data.performance.casLatency)).length >= 71);
assert.equal(products.filter(completeTimingTuple).length, 69);

for (const product of products.filter(product => product.identity.brand === "Kingston")) {
    assert.notEqual(product.identity.updatedBy, "system:atlas-spec-enrichment-batch-003");
}
for (const product of products.filter(product => product.identity.brand === "Timetec")) {
    assert.notEqual(product.identity.updatedBy, "system:atlas-spec-enrichment-batch-003");
}

console.log("Atlas specification enrichment Batch 003 regression tests passed.");
