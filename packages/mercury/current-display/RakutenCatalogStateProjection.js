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

export function projectRakutenCatalogState({ files } = {}) {
    if (!Array.isArray(files) || files.length === 0) fail("RAKUTEN_CATALOG_SEQUENCE_INVALID");
    let state = new Map();
    const applied = [];

    for (const [fileIndex, file] of files.entries()) {
        if (!file || !["MAIN_FULL", "MAIN_DELTA"].includes(file.feedProfile) || !Array.isArray(file.records)) fail("RAKUTEN_CATALOG_FILE_INVALID");
        const products = file.records.filter(item => item?.recordType === "PRODUCT");
        if (file.feedProfile === "MAIN_FULL") {
            const replacement = new Map();
            for (const record of products) {
                if (record.modification !== null && record.modification !== undefined) fail("RAKUTEN_FULL_MODIFICATION_INVALID");
                const key = rakutenSourceEntryKey(record);
                if (replacement.has(key)) fail("RAKUTEN_FULL_SOURCE_ENTRY_DUPLICATE");
                replacement.set(key, copyRecord(record));
            }
            state = replacement;
        } else {
            for (const record of products) {
                if (!['I', 'U', 'D'].includes(record.modification)) fail("RAKUTEN_DELTA_MODIFICATION_INVALID");
                const key = rakutenSourceEntryKey(record);
                if (record.modification === "D") state.delete(key);
                else {
                    state.delete(key);
                    state.set(key, copyRecord(record));
                }
            }
        }
        applied.push({ fileIndex, feedProfile: file.feedProfile, productRecords: products.length });
    }

    const entries = [...state.entries()].map(([sourceEntryKey, record]) => freeze({ sourceEntryKey, record }));
    return freeze({
        schemaVersion: "1.0",
        source: "RAKUTEN_PRODUCT_CATALOG",
        filesApplied: applied,
        entries,
        sourceEntryCount: entries.length,
        bindingDigest: digest({ filesApplied: applied, entries: entries.map(({ sourceEntryKey, record }) => ({ sourceEntryKey, record })) })
    });
}
