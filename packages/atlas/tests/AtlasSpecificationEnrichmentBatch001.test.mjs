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

const timingRecords = new Map([
    ["ram_g_skill_f5_6000j3038f16gx2_fx5", [30, 38, 38, 96, 1.35]],
    ["ram_kingston_kf560c30bbeak2_16", [30, 36, 36, 80, 1.4]],
    ["ram_kingston_kf560c30bweak2_32", [30, 36, 36, 80, 1.4]],
    ["ram_kingston_kf560c36bbe2ak2_32", [36, 44, 44, 90, 1.35]],
    ["ram_kingston_kf560c36bbe2k2_32", [36, 44, 44, 90, 1.35]],
    ["ram_kingston_kf560c36bwe2k2_32", [36, 44, 44, 90, 1.35]],
    ["ram_kingston_kf564c32bbeak2_32", [32, 39, 39, 80, 1.4]],
    ["ram_kingston_kf564c32bbek2_32", [32, 39, 39, 80, 1.4]],
    ["ram_lexar_ld4as008g_b3200gsst", [22, 22, 22, 52, 1.2]],
    ["ram_lexar_ld4s16g32c22st_hgn", [22, 22, 22, 52, 1.2]],
    ["ram_lexar_ld4s32g32c22st_hgn", [22, 22, 22, 52, 1.2]]
]);

for (const [atlasProductId, expected] of timingRecords) {
    const product = byId.get(atlasProductId);
    assert.ok(product, atlasProductId);
    const performance = product.extension.data.performance;
    assert.deepEqual(
        [performance.casLatency, performance.tRcd, performance.tRp, performance.tRas],
        expected.slice(0, 4),
        atlasProductId
    );
    assert.equal(performance.primaryTimings, expected.slice(0, 4).join("-"), atlasProductId);
    assert.equal(product.extension.data.electrical.ratedVoltage, expected[4], atlasProductId);
    assert.equal(product.identity.recordRevision, 3, atlasProductId);
    assert.equal(product.identity.updatedBy, "system:atlas-spec-enrichment-batch-001", atlasProductId);
    assert.equal(product.validation.validatedAt, "2026-11-16T00:00:00.000Z", atlasProductId);
    const performanceSources = product.provenance.fieldSources["extension.data.performance"];
    assert.ok(performanceSources.some(source =>
        source.verificationStatus === "VERIFIED" &&
        /^https:\/\/(www\.gskill\.com|media\.kingston\.com|americas\.lexar\.com)\//.test(source.sourceLocator)
    ), atlasProductId + " requires verified manufacturer performance provenance");
    assert.equal(validateTimingValueIntegrity(product).result, "PASS", atlasProductId);
    assert.equal(validateUnitNormalization(product).result, "PASS", atlasProductId);
}

for (const atlasProductId of [
    "ram_klevv_kd58gu880_60a300f",
    "ram_klevv_kd5agu880_60a300l",
    "ram_klevv_kd5agua80_64b300h",
    "ram_klevv_kd5bgua80_60a300h"
]) {
    const product = byId.get(atlasProductId);
    assert.equal(product.extension.data.performance.xmpSupport, "SUPPORTED", atlasProductId);
    assert.equal(product.extension.data.performance.expoSupport, "SUPPORTED", atlasProductId);
    assert.equal(product.extension.data.performance.primaryTimings, null, atlasProductId);
    assert.equal(product.extension.data.electrical.ratedVoltage, null, atlasProductId);
    assert.equal(product.validation.validatedAt, "2026-11-16T00:00:00.000Z", atlasProductId);
}

for (const atlasProductId of [
    "ram_corsair_cmk32gx4m2e3200c16",
    "ram_crucial_cp2k16g4dfra32a",
    "ram_kingston_kf556s40ibk2_32",
    "ram_kingston_kf560s38ibk2_32",
    "ram_kingston_kf564s38ib_16"
]) {
    assert.equal(byId.get(atlasProductId).extension.data.performance.primaryTimings, null, atlasProductId);
}

assert.equal(products.length, 159);
const completeTimingTuple = product => {
    const performance = product.extension.data.performance;
    const values = [performance.casLatency, performance.tRcd, performance.tRp, performance.tRas];
    return values.every(value => Number.isInteger(value) && value > 0) && performance.primaryTimings === values.join("-");
};
assert.equal(products.filter(product => Number.isInteger(product.extension.data.performance.casLatency)).length, 66);
assert.equal(products.filter(completeTimingTuple).length, 64);
assert.equal(products.filter(product => typeof product.extension.data.electrical.ratedVoltage === "number").length, 132);
console.log("Atlas specification enrichment Batch 001 regression tests passed.");
