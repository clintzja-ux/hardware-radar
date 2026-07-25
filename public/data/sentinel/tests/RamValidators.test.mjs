import assert from "node:assert/strict";
import {
    validateCapacityInvariant,
    validateKitStateConsistency,
    validateTimingValueIntegrity,
    validateUnitNormalization,
    validateUnknownValueIntegrity
} from "../extensions/ram/RamValidators.js";
import { VALIDATION_RESULTS } from "../types/ValidationResult.js";

function createRamSubject() {
    return {
        atlasProductId: "HR-RAM-DDR5-TEST-001",
        extension: {
            extensionType: "ram",
            schemaVersion: "1.0",
            data: {
                classification: {
                    memoryType: "DDR5",
                    formFactor: "DIMM",
                    applicationClass: "DESKTOP",
                    moduleType: "UDIMM",
                    buffering: "UNKNOWN",
                    eccType: "ON_DIE_ONLY",
                    isKit: true
                },
                capacity: {
                    capacityGb: 32,
                    moduleCount: 2,
                    capacityPerModuleGb: 16,
                    rankConfiguration: "UNKNOWN",
                    chipDensityGb: null,
                    organization: null
                },
                performance: {
                    dataRateMtps: 6000,
                    baseJedecDataRateMtps: null,
                    speedLabel: "DDR5-6000",
                    casLatency: 30,
                    tRcd: 36,
                    tRp: 36,
                    tRas: 76,
                    primaryTimings: "30-36-36-76",
                    xmpSupport: "PROFILE_INCLUDED",
                    expoSupport: "UNKNOWN",
                    testedSpeedMtps: 6000,
                    testedLatencyCl: 30,
                    bandwidthGbps: 48
                },
                electrical: {
                    ratedVoltage: 1.4,
                    baseVoltage: null,
                    pmicLocation: "UNKNOWN",
                    powerManagementNotes: null
                },
                physical: {
                    heatSpreader: true,
                    heatSpreaderMaterial: null,
                    heightMm: null,
                    lengthMm: null,
                    widthMm: null,
                    color: null,
                    rgbLighting: false,
                    lightingEcosystem: [],
                    lowProfile: null,
                    moduleWeightGrams: null,
                    kitWeightGrams: null
                },
                compatibility: {
                    platformCompatibility: [],
                    chipsetCompatibility: [],
                    cpuGenerationCompatibility: [],
                    qvlReferences: [],
                    requiresBiosSupport: null,
                    compatibilityNotes: null
                }
            }
        }
    };
}

function clone(value) {
    return structuredClone(value);
}

function assertUnchanged(subject, original, context, originalContext) {
    assert.deepEqual(subject, original);
    assert.deepEqual(context, originalContext);
}

{
    const subject = createRamSubject();
    const context = { source: "unit-test" };
    const original = clone(subject);
    const originalContext = clone(context);
    const result = validateCapacityInvariant(subject, context);

    assert.equal(result.result, VALIDATION_RESULTS.PASS);
    assert.equal(result.evidence.expectedCapacityGb, 32);
    assertUnchanged(subject, original, context, originalContext);
}

{
    const subject = createRamSubject();
    subject.extension.data.capacity.capacityGb = 64;
    const result = validateCapacityInvariant(subject);

    assert.equal(result.result, VALIDATION_RESULTS.FAIL);
    assert.equal(result.evidence.expectedCapacityGb, 32);
}

{
    const subject = createRamSubject();
    subject.extension.data.capacity.moduleCount = "2";
    const result = validateCapacityInvariant(subject);

    assert.equal(result.result, VALIDATION_RESULTS.FAIL);
    assert.equal(result.evidence.operandsValid, false);
}

{
    const subject = createRamSubject();
    assert.equal(validateKitStateConsistency(subject).result, VALIDATION_RESULTS.PASS);

    subject.extension.data.classification.isKit = false;
    assert.equal(validateKitStateConsistency(subject).result, VALIDATION_RESULTS.FAIL);
}

{
    const subject = createRamSubject();
    subject.extension.data.capacity.moduleCount = 1;
    subject.extension.data.capacity.capacityGb = 16;
    subject.extension.data.classification.isKit = false;
    assert.equal(validateKitStateConsistency(subject).result, VALIDATION_RESULTS.PASS);

    subject.extension.data.classification.isKit = true;
    assert.equal(validateKitStateConsistency(subject).result, VALIDATION_RESULTS.FAIL);
}

{
    const subject = createRamSubject();
    const result = validateUnknownValueIntegrity(subject);

    assert.equal(result.result, VALIDATION_RESULTS.PASS);
    assert.deepEqual(result.evidence.unsupportedPlaceholders, []);
}

{
    const subject = createRamSubject();
    subject.extension.data.physical.color = "N/A";
    const result = validateUnknownValueIntegrity(subject);

    assert.equal(result.result, VALIDATION_RESULTS.FAIL);
    assert.deepEqual(result.evidence.unsupportedPlaceholders, [
        { path: "physical.color", value: "N/A" }
    ]);
}

{
    const subject = createRamSubject();
    subject.extension.data.physical.color = null;
    subject.extension.data.classification.eccType = "UNKNOWN";
    assert.equal(
        validateUnknownValueIntegrity(subject).result,
        VALIDATION_RESULTS.PASS
    );
}

{
    const subject = createRamSubject();
    const result = validateTimingValueIntegrity(subject);

    assert.equal(result.result, VALIDATION_RESULTS.PASS);
    assert.equal(result.evidence.expectedPrimaryTimings, "30-36-36-76");
}

{
    const subject = createRamSubject();
    subject.extension.data.performance.primaryTimings = "30-38-38-76";
    assert.equal(
        validateTimingValueIntegrity(subject).result,
        VALIDATION_RESULTS.FAIL
    );
}

{
    const subject = createRamSubject();
    subject.extension.data.performance.casLatency = 0;
    assert.equal(
        validateTimingValueIntegrity(subject).result,
        VALIDATION_RESULTS.FAIL
    );
}

{
    const subject = createRamSubject();
    subject.extension.data.performance.tRas = null;
    subject.extension.data.performance.primaryTimings = null;
    assert.equal(
        validateTimingValueIntegrity(subject).result,
        VALIDATION_RESULTS.FAIL
    );
}

{
    const subject = createRamSubject();
    const performance = subject.extension.data.performance;
    performance.casLatency = null;
    performance.tRcd = null;
    performance.tRp = null;
    performance.tRas = null;
    performance.primaryTimings = null;
    assert.equal(
        validateTimingValueIntegrity(subject).result,
        VALIDATION_RESULTS.PASS
    );
}

{
    const subject = createRamSubject();
    assert.equal(
        validateUnitNormalization(subject).result,
        VALIDATION_RESULTS.PASS
    );
}

{
    const subject = createRamSubject();
    subject.extension.data.electrical.ratedVoltage = "1.4V";
    const result = validateUnitNormalization(subject);

    assert.equal(result.result, VALIDATION_RESULTS.FAIL);
    assert.deepEqual(result.evidence.invalidCanonicalFields, [
        { path: "electrical.ratedVoltage", value: "1.4V" }
    ]);
}

{
    const subject = createRamSubject();
    subject.extension.data.performance.speed = "6000 MHz";
    const result = validateUnitNormalization(subject);

    assert.equal(result.result, VALIDATION_RESULTS.FAIL);
    assert.deepEqual(result.evidence.noncanonicalFields, [
        { path: "performance.speed", value: "6000 MHz" }
    ]);
}

{
    const subject = createRamSubject();
    const context = Object.freeze({ source: "frozen-test" });
    Object.freeze(subject.extension.data.capacity);
    Object.freeze(subject.extension.data.classification);
    Object.freeze(subject.extension.data.performance);
    Object.freeze(subject.extension.data.electrical);
    Object.freeze(subject.extension.data.physical);
    Object.freeze(subject.extension.data.compatibility);
    Object.freeze(subject.extension.data);
    Object.freeze(subject.extension);
    Object.freeze(subject);

    assert.equal(
        validateCapacityInvariant(subject, context).result,
        VALIDATION_RESULTS.PASS
    );
    assert.equal(
        validateKitStateConsistency(subject, context).result,
        VALIDATION_RESULTS.PASS
    );
    assert.equal(
        validateUnknownValueIntegrity(subject, context).result,
        VALIDATION_RESULTS.PASS
    );
    assert.equal(
        validateTimingValueIntegrity(subject, context).result,
        VALIDATION_RESULTS.PASS
    );
    assert.equal(
        validateUnitNormalization(subject, context).result,
        VALIDATION_RESULTS.PASS
    );
}

console.log("RAM validator tests passed.");
