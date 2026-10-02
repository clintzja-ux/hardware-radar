import crypto from "node:crypto";

const freeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
};

const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fail = code => { throw Object.assign(new TypeError(code), { code }); };
const copyRecord = record => structuredClone(record);
const validInstant = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const validDigest = value => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

function lineageFor(file, fileIndex, requireLineage) {
    const supplied = file.artifactDigest !== undefined || file.headerTimestamp !== undefined || file.feedFamilyKey !== undefined || file.filename !== undefined;
    if (!supplied && !requireLineage) return { bounded: false, fileIndex, feedProfile: file.feedProfile };
    if (!validDigest(file.artifactDigest) || !validInstant(file.headerTimestamp) || typeof file.feedFamilyKey !== "string" || !file.feedFamilyKey.trim() || typeof file.filename !== "string" || !file.filename.trim()) fail("RAKUTEN_CATALOG_LINEAGE_INVALID");
    return { bounded: true, fileIndex, feedProfile: file.feedProfile, filename: file.filename, artifactDigest: file.artifactDigest.toLowerCase(), headerTimestamp: new Date(file.headerTimestamp).toISOString(), feedFamilyKey: file.feedFamilyKey, remoteModifiedAt: validInstant(file.remoteModifiedAt) ? new Date(file.remoteModifiedAt).toISOString() : null, retrievedAt: validInstant(file.retrievedAt) ? new Date(file.retrievedAt).toISOString() : null };
}

export function rakutenSourceEntryKey(record) {
    if (record?.recordType !== "PRODUCT") fail("RAKUTEN_SOURCE_ENTRY_INVALID");
    const productId = typeof record.productId === "string" ? record.productId : "";
    const sku = typeof record.sku === "string" ? record.sku : "";
    if (!productId.trim() || !sku.trim()) fail("RAKUTEN_SOURCE_ENTRY_IDENTITY_INVALID");
    return JSON.stringify([productId, sku]);
}

export function reduceRakutenDeltaRecords(records) {
    if (!Array.isArray(records)) fail("RAKUTEN_DELTA_RECORDS_INVALID");
    const latest = new Map();
    for (const record of records.filter(item => item?.recordType === "PRODUCT")) {
        if (!['I', 'U', 'D'].includes(record.modification)) fail("RAKUTEN_DELTA_MODIFICATION_INVALID");
        const key = rakutenSourceEntryKey(record);
        latest.delete(key);
        latest.set(key, copyRecord(record));
    }
    return freeze([...latest.values()]);
}

export function projectRakutenCatalogState({ files, requireLineage = false } = {}) {
    if (!Array.isArray(files) || files.length === 0) fail("RAKUTEN_CATALOG_SEQUENCE_INVALID");
    let state = new Map();
    const applied = [];
    const withdrawals = [];
    let currentCandidates = [];
    let family = null;
    let lastHeader = null;
    let parentCatalogStateId = null;
    const appliedDigests = new Set();

    for (const [fileIndex, file] of files.entries()) {
        if (!file || !["MAIN_FULL", "MAIN_DELTA"].includes(file.feedProfile) || !Array.isArray(file.records)) fail("RAKUTEN_CATALOG_FILE_INVALID");
        if (fileIndex === 0 && file.feedProfile !== "MAIN_FULL") fail("RAKUTEN_CATALOG_BASELINE_REQUIRED");
        const lineage = lineageFor(file, fileIndex, requireLineage);
        if (lineage.bounded) {
            if (family === null) family = lineage.feedFamilyKey;
            else if (family !== lineage.feedFamilyKey) fail("RAKUTEN_CATALOG_FAMILY_MISMATCH");
            if (appliedDigests.has(lineage.artifactDigest)) {
                applied.push({ ...lineage, productRecords: file.records.filter(item => item?.recordType === "PRODUCT").length, outcome: "REPLAY_NO_CHANGE", parentCatalogStateId });
                currentCandidates = [];
                continue;
            }
            if (lastHeader !== null && Date.parse(lineage.headerTimestamp) <= Date.parse(lastHeader)) fail("RAKUTEN_DELTA_ORDER_AMBIGUOUS");
        } else if (requireLineage) fail("RAKUTEN_CATALOG_LINEAGE_REQUIRED");
        const products = file.records.filter(item => item?.recordType === "PRODUCT");
        const changed = [];
        if (file.feedProfile === "MAIN_FULL") {
            const replacement = new Map();
            for (const record of products) {
                if (record.modification !== null && record.modification !== undefined) fail("RAKUTEN_FULL_MODIFICATION_INVALID");
                const key = rakutenSourceEntryKey(record);
                if (replacement.has(key)) fail("RAKUTEN_FULL_SOURCE_ENTRY_DUPLICATE");
                replacement.set(key, { record: copyRecord(record), evidence: lineage.bounded ? { observedAt: lineage.headerTimestamp, artifactDigest: lineage.artifactDigest, feedProfile: file.feedProfile, modification: null } : null });
            }
            state = replacement;
            withdrawals.length = 0;
            currentCandidates = [...state.entries()].map(([sourceEntryKey, value]) => ({ sourceEntryKey, ...value }));
        } else {
            for (const record of products) {
                if (!['I', 'U', 'D'].includes(record.modification)) fail("RAKUTEN_DELTA_MODIFICATION_INVALID");
                const key = rakutenSourceEntryKey(record);
                const evidence = lineage.bounded ? { observedAt: lineage.headerTimestamp, artifactDigest: lineage.artifactDigest, feedProfile: file.feedProfile, modification: record.modification } : null;
                if (record.modification === "D") {
                    state.delete(key);
                    const withdrawal = { sourceEntryKey: key, record: copyRecord(record), evidence };
                    withdrawals.push(withdrawal);
                    changed.push(withdrawal);
                }
                else {
                    state.delete(key);
                    const value = { record: copyRecord(record), evidence };
                    state.set(key, value);
                    changed.push({ sourceEntryKey: key, ...value });
                }
            }
            currentCandidates = changed;
        }
        const stateMaterial = [...state.entries()].map(([sourceEntryKey, value]) => ({ sourceEntryKey, record: value.record, evidence: value.evidence }));
        const catalogStateId = `rakuten_catalog_${digest({ parentCatalogStateId, lineage, stateMaterial }).slice(0, 24)}`;
        applied.push({ ...lineage, productRecords: products.length, outcome: "APPLIED", parentCatalogStateId, catalogStateId });
        parentCatalogStateId = catalogStateId;
        if (lineage.bounded) { appliedDigests.add(lineage.artifactDigest); lastHeader = lineage.headerTimestamp; }
    }

    const entries = [...state.entries()].map(([sourceEntryKey, value]) => freeze({ sourceEntryKey, record: value.record, evidence: value.evidence }));
    return freeze({
        schemaVersion: "1.1",
        source: "RAKUTEN_PRODUCT_CATALOG",
        feedFamilyKey: family,
        filesApplied: applied,
        entries,
        currentCandidates,
        withdrawals,
        sourceEntryCount: entries.length,
        parentCatalogStateId: applied.at(-1)?.parentCatalogStateId ?? null,
        catalogStateId: parentCatalogStateId,
        latestProviderEvidenceAt: lastHeader,
        bindingDigest: digest({ filesApplied: applied, entries: entries.map(({ sourceEntryKey, record, evidence }) => ({ sourceEntryKey, record, evidence })), withdrawals })
    });
}
