import { readFile } from "node:fs/promises";
import { assessRetailerDestinationBinding, orderRetailerDestinations, retailerDestinationKey, validateRetailerDestination } from "./RetailerDestination.js";

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const fail = reason => { throw new Error(`RETAILER_DESTINATION_SOURCE_INVALID:${reason}`); };

export async function loadRetailerDestinationSource({ sourcePath, products, retailers } = {}) {
    let source;
    try { source = JSON.parse(await readFile(sourcePath, "utf8")); } catch { fail("MALFORMED_JSON"); }
    if (!source || Object.keys(source).some(key => !["schemaVersion", "records"].includes(key)) || source.schemaVersion !== "1.0" || !Array.isArray(source.records)) fail("SCHEMA");
    const productById = new Map((products ?? []).map(product => [product.identity?.atlasProductId, product]));
    const retailerById = new Map((retailers ?? []).map(retailer => [retailer.id, retailer]));
    const byId = new Map();
    for (const record of source.records) {
        const report = validateRetailerDestination(record);
        if (!report.valid) fail(report.errors.join(","));
        if (byId.has(record.destinationId)) fail("DUPLICATE_ID");
        const binding = assessRetailerDestinationBinding({ destination: record, product: productById.get(record.atlasProductId), retailer: retailerById.get(record.retailerId) });
        if (binding.reasons.some(reason => reason !== "RETAILER_DESTINATION_RETIRED")) fail(binding.reasons.join(","));
        byId.set(record.destinationId, structuredClone(record));
    }
    const byKey = new Map();
    for (const record of byId.values()) {
        const key = retailerDestinationKey(record);
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key).push(record);
        if (record.supersedesDestinationId) {
            const predecessor = byId.get(record.supersedesDestinationId);
            if (!predecessor || predecessor.status !== "ACTIVE" || retailerDestinationKey(predecessor) !== key) fail("SUPERSESSION");
        }
    }
    const effective = [];
    for (const records of byKey.values()) {
        const superseded = new Set(records.map(record => record.supersedesDestinationId).filter(Boolean));
        const heads = records.filter(record => !superseded.has(record.destinationId));
        if (heads.length !== 1) fail("ACTIVE_HEAD_CONFLICT");
        for (const record of records) {
            const visited = new Set(); let cursor = record;
            while (cursor.supersedesDestinationId) { if (visited.has(cursor.destinationId)) fail("SUPERSESSION_CYCLE"); visited.add(cursor.destinationId); cursor = byId.get(cursor.supersedesDestinationId); if (!cursor) fail("SUPERSESSION"); }
        }
        if (heads[0].status === "ACTIVE") effective.push(heads[0]);
    }
    return freeze({ schemaVersion: "1.0", recordCount: byId.size, records: [...byId.values()], effective: orderRetailerDestinations(effective, retailers ?? []) });
}

export function createPublicRetailerDestinationProjection({ source, retailers } = {}) {
    if (!source || !Array.isArray(source.effective)) fail("PROJECTION_SOURCE");
    const retailerById = new Map((retailers ?? []).map(retailer => [retailer.id, retailer]));
    return freeze(source.effective.map(record => {
        const retailer = retailerById.get(record.retailerId);
        if (!retailer) fail("PROJECTION_RETAILER");
        return {
            destinationId: record.destinationId,
            atlasProductId: record.atlasProductId,
            retailerId: record.retailerId,
            retailerDisplayName: retailer.name,
            marketplace: record.marketplace,
            destinationUrl: record.destinationUrl,
            destinationType: record.destinationType
        };
    }));
}
