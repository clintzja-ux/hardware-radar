import crypto from "node:crypto";
import { validateCurrentDisplaySnapshot, currentDisplaySnapshotFingerprint } from "../current-display/CurrentDisplaySnapshot.js";
import { createRamTerminalPublicIntelligence, RAM_TERMINAL_METHODOLOGY_VERSION } from "./RamTerminalPublicIntelligence.js";

export const RAM_MARKET_SNAPSHOT_SCHEMA_VERSION = "1.0";
export const RAM_MARKET_SNAPSHOT_TYPE = "POINT_IN_TIME_MARKET_SNAPSHOT";
export const RAM_MARKET_SNAPSHOT_METHODOLOGY_VERSION = "MERCURY-RAM-MARKET-SNAPSHOT-P1-1.0";

const stable = value => Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value && typeof value === "object"
        ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`
        : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const clone = value => structuredClone(value);

function effectiveComparabilityMaterial(rows) {
    return rows.map(row => ({ observationId: row.observationId, comparability: row.comparability })).sort((a, b) => a.observationId.localeCompare(b.observationId));
}

function manifestMaterial(value) {
    return {
        snapshotType: value.snapshotType,
        asOf: value.asOf,
        methodologyVersion: value.methodologyVersion,
        terminalMethodologyVersion: value.terminalMethodologyVersion,
        atlasCatalogDigest: value.atlasCatalogDigest,
        currentSnapshotId: value.currentSnapshotId,
        currentSnapshotDigest: value.currentSnapshotDigest,
        currentProjectionDigest: value.currentProjectionDigest,
        currentObservedAt: value.currentObservedAt,
        historyKnowledgeCutoff: value.historyKnowledgeCutoff,
        historyObservationIdDigest: value.historyObservationIdDigest,
        historyInputDigest: value.historyInputDigest,
        effectiveComparabilityDigest: value.effectiveComparabilityDigest,
        comparabilityReassessmentDigest: value.comparabilityReassessmentDigest
    };
}

export function freezeRamMarketSnapshotInputs({ catalog, currentSnapshot, currentRetail, effectiveHistory, comparabilityReassessments = [], asOf, historyKnowledgeCutoff, generatedAt } = {}) {
    if (!catalog?.products || !currentRetail?.products || !Array.isArray(effectiveHistory) || !Array.isArray(comparabilityReassessments)) throw new TypeError("RAM_MARKET_SNAPSHOT_INPUT_INVALID");
    if (![asOf, historyKnowledgeCutoff, generatedAt].every(validTime) || Date.parse(asOf) > Date.parse(historyKnowledgeCutoff) || Date.parse(generatedAt) < Date.parse(historyKnowledgeCutoff)) throw new TypeError("RAM_MARKET_SNAPSHOT_TIME_INVALID");
    const currentReport = validateCurrentDisplaySnapshot(currentSnapshot);
    if (!currentReport.valid) throw new Error(`RAM_MARKET_SNAPSHOT_CURRENT_INVALID:${currentReport.errors.join(",")}`);
    if (currentSnapshot.observedAt !== asOf) throw new Error("RAM_MARKET_SNAPSHOT_CURRENT_AS_OF_MISMATCH");

    const history = effectiveHistory
        .filter(row => Date.parse(row.admittedAt) <= Date.parse(historyKnowledgeCutoff) && Date.parse(row.observationTime) <= Date.parse(asOf))
        .sort((a, b) => a.observationId.localeCompare(b.observationId));
    if (history.some(row => !validTime(row.admittedAt) || !validTime(row.observationTime))) throw new Error("RAM_MARKET_SNAPSHOT_HISTORY_TIME_INVALID");
    const reassessments = comparabilityReassessments
        .filter(row => Date.parse(row.recordedAt) <= Date.parse(historyKnowledgeCutoff))
        .sort((a, b) => a.reassessmentId.localeCompare(b.reassessmentId));
    const observationIds = history.map(row => row.observationId);
    const manifest = {
        schemaVersion: RAM_MARKET_SNAPSHOT_SCHEMA_VERSION,
        snapshotType: RAM_MARKET_SNAPSHOT_TYPE,
        asOf,
        methodologyVersion: RAM_MARKET_SNAPSHOT_METHODOLOGY_VERSION,
        terminalMethodologyVersion: RAM_TERMINAL_METHODOLOGY_VERSION,
        atlasCatalogDigest: digest(catalog),
        currentSnapshotId: currentSnapshot.snapshotId,
        currentSnapshotDigest: currentDisplaySnapshotFingerprint(currentSnapshot),
        currentProjectionDigest: digest(currentRetail),
        currentObservedAt: currentSnapshot.observedAt,
        historyKnowledgeCutoff,
        historyObservationIdDigest: digest(observationIds),
        historyInputDigest: digest(history),
        effectiveComparabilityDigest: digest(effectiveComparabilityMaterial(history)),
        comparabilityReassessmentDigest: digest(reassessments.map(row => ({ reassessmentId: row.reassessmentId, bindingDigest: row.bindingDigest, recordedAt: row.recordedAt })))
    };
    manifest.manifestDigest = digest(manifestMaterial(manifest));
    return freeze({ manifest, generatedAt, inputs: { catalog: clone(catalog), currentSnapshot: clone(currentSnapshot), currentRetail: clone(currentRetail), effectiveHistory: clone(history), comparabilityReassessments: clone(reassessments) } });
}

function validateFrozenInput(frozen) {
    const { manifest, inputs } = frozen ?? {};
    if (!manifest || !inputs || manifest.schemaVersion !== RAM_MARKET_SNAPSHOT_SCHEMA_VERSION || manifest.snapshotType !== RAM_MARKET_SNAPSHOT_TYPE || manifest.methodologyVersion !== RAM_MARKET_SNAPSHOT_METHODOLOGY_VERSION) throw new Error("RAM_MARKET_SNAPSHOT_MANIFEST_INVALID");
    if (manifest.manifestDigest !== digest(manifestMaterial(manifest))) throw new Error("RAM_MARKET_SNAPSHOT_MANIFEST_MISMATCH");
    if (manifest.atlasCatalogDigest !== digest(inputs.catalog)) throw new Error("RAM_MARKET_SNAPSHOT_ATLAS_DIGEST_MISMATCH");
    if (manifest.currentSnapshotId !== inputs.currentSnapshot.snapshotId || manifest.currentSnapshotDigest !== currentDisplaySnapshotFingerprint(inputs.currentSnapshot) || manifest.currentProjectionDigest !== digest(inputs.currentRetail)) throw new Error("RAM_MARKET_SNAPSHOT_CURRENT_DIGEST_MISMATCH");
    if (manifest.historyObservationIdDigest !== digest(inputs.effectiveHistory.map(row => row.observationId)) || manifest.historyInputDigest !== digest(inputs.effectiveHistory)) throw new Error("RAM_MARKET_SNAPSHOT_HISTORY_MANIFEST_MISMATCH");
    if (manifest.effectiveComparabilityDigest !== digest(effectiveComparabilityMaterial(inputs.effectiveHistory))) throw new Error("RAM_MARKET_SNAPSHOT_COMPARABILITY_MANIFEST_MISMATCH");
    if (manifest.comparabilityReassessmentDigest !== digest(inputs.comparabilityReassessments.map(row => ({ reassessmentId: row.reassessmentId, bindingDigest: row.bindingDigest, recordedAt: row.recordedAt })))) throw new Error("RAM_MARKET_SNAPSHOT_REASSESSMENT_MANIFEST_MISMATCH");
}

const maturity = rows => ({
    h0: rows.filter(row => row.history.comparableObservationCount === 0).length,
    h1: rows.filter(row => row.history.distinctComparableTimestampCount === 1).length,
    h2: rows.filter(row => row.history.distinctComparableTimestampCount === 2).length,
    h3Plus: rows.filter(row => row.history.distinctComparableTimestampCount >= 3).length,
    productsWithTwoPlusTimestamps: rows.filter(row => row.history.distinctComparableTimestampCount >= 2).length,
    productsWithThreePlusTimestamps: rows.filter(row => row.history.distinctComparableTimestampCount >= 3).length,
    productsSpanningSevenPlusDays: rows.filter(row => row.history.historySpanDays >= 7).length,
    productsSpanningFourteenPlusDays: rows.filter(row => row.history.historySpanDays >= 14).length,
    productsSpanningThirtyPlusDays: rows.filter(row => row.history.historySpanDays >= 30).length
});

export async function createRamMarketSnapshotProjection({ frozenInput } = {}) {
    validateFrozenInput(frozenInput);
    const { manifest, generatedAt, inputs } = frozenInput;
    const terminal = await createRamTerminalPublicIntelligence({ catalog: inputs.catalog, currentRetail: inputs.currentRetail, historicalRepository: { getAll: async () => clone(inputs.effectiveHistory) }, asOf: manifest.asOf, currentSnapshotId: manifest.currentSnapshotId });
    const all = terminal.lenses.ALL_RAM;
    const timestampGroups = all.productRows.reduce((sum, row) => sum + row.history.distinctComparableTimestampCount, 0);
    const observedLowProducts = all.productRows.filter(row => row.history.atObservedLow === true).sort((a, b) => a.productName.localeCompare(b.productName)).slice(0, 5).map(row => ({ atlasProductId: row.atlasProductId, brand: row.brand, productName: row.productName, publicPath: row.publicPath, latestObservedAt: row.history.latestComparableObservation.observedAt, itemPriceUsd: row.history.latestComparableObservation.itemPriceUsd }));
    const longestHistoryProducts = all.productRows.filter(row => Number.isFinite(row.history.historySpanDays)).sort((a, b) => b.history.historySpanDays - a.history.historySpanDays || a.productName.localeCompare(b.productName)).slice(0, 5).map(row => ({ atlasProductId: row.atlasProductId, productName: row.productName, publicPath: row.publicPath, historySpanDays: row.history.historySpanDays, comparableObservationCount: row.history.comparableObservationCount }));
    const snapshotId = `mer_ramsnapshot_${manifest.manifestDigest.slice(0, 24)}`;
    return freeze({
        schemaVersion: RAM_MARKET_SNAPSHOT_SCHEMA_VERSION,
        artifactType: "MERCURY_RAM_MARKET_SNAPSHOT",
        snapshotId,
        snapshotType: RAM_MARKET_SNAPSHOT_TYPE,
        title: "RAM Market Snapshot — September 30, 2026",
        revision: 1,
        correctionState: "ORIGINAL",
        supersedesSnapshotId: null,
        retracted: false,
        asOf: manifest.asOf,
        generatedAt,
        methodologyVersion: RAM_MARKET_SNAPSHOT_METHODOLOGY_VERSION,
        inputManifest: clone(manifest),
        publicationState: "DEVELOPMENT_ONLY",
        releaseAuthority: false,
        deploymentAuthority: false,
        coverage: { ...all.coverage, productsWithComparableHistory: all.historyCoverage.productsWithComparableHistory, comparableHistoricalObservations: all.historyCoverage.comparableObservationCount, distinctHistoricalTimestampGroups: timestampGroups, earliestComparableObservationAt: all.historyCoverage.earliestComparableObservationAt, latestComparableObservationAt: all.historyCoverage.latestComparableObservationAt, comparableHistorySpanDays: all.historyCoverage.comparableHistorySpanDays },
        currentMarket: clone(all.currentMarket),
        lenses: Object.fromEntries(Object.entries(terminal.lenses).map(([key, lens]) => [key, { lens: key, coverage: clone(lens.coverage), currentMarket: clone(lens.currentMarket), signalSummary: clone(lens.signalSummary) }])),
        historyMaturity: maturity(all.productRows),
        marketPulse: clone(all.signalSummary),
        productFacts: { observedLowProducts, longestHistoryProducts },
        comparisonSemantics: "QUALIFIED_ITEM_PRICE",
        limitations: [
            "Hardware Radar does not observe every RAM product or retailer.",
            "Current metrics use qualified item prices; applicable shipping, taxes, and fees may be excluded.",
            "Acquisition coverage varies by product, source, retailer, and date.",
            "Historical observations do not reconstruct historical Current state.",
            "This snapshot is not a RAM Price Index or a report of September-wide market performance."
        ]
    });
}

export function validateRamMarketSnapshotProjection(value) {
    const errors = [];
    if (value?.schemaVersion !== RAM_MARKET_SNAPSHOT_SCHEMA_VERSION || value?.snapshotType !== RAM_MARKET_SNAPSHOT_TYPE || value?.methodologyVersion !== RAM_MARKET_SNAPSHOT_METHODOLOGY_VERSION) errors.push("RAM_MARKET_SNAPSHOT_HEADER_INVALID");
    if (value?.snapshotId !== `mer_ramsnapshot_${value?.inputManifest?.manifestDigest?.slice(0, 24)}` || !validTime(value?.asOf) || !validTime(value?.generatedAt)) errors.push("RAM_MARKET_SNAPSHOT_IDENTITY_INVALID");
    if (value?.publicationState !== "DEVELOPMENT_ONLY" || value?.releaseAuthority !== false || value?.deploymentAuthority !== false) errors.push("RAM_MARKET_SNAPSHOT_AUTHORITY_INVALID");
    const serialized = JSON.stringify(value);
    if (/providerTask|retainedEvidence|authorizationId|rawPayload|researchUrl|affiliate|rightsProfile|reviewedBy|admittedBy|sellerName/i.test(serialized)) errors.push("RAM_MARKET_SNAPSHOT_PRIVATE_FIELD_INVALID");
    if (/all-time low|lowest ever|best price|biggest market mover|winner|loser/i.test(serialized)) errors.push("RAM_MARKET_SNAPSHOT_CLAIM_INVALID");
    return freeze({ valid: errors.length === 0, errors });
}
