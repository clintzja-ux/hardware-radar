import { validateHistoricalObservation } from "./HistoricalObservation.js";

export const PUBLIC_CHRONOLOGICAL_PRICE_SERIES_SCHEMA_VERSION = "1.0";
export const PUBLIC_CHRONOLOGICAL_PRICE_SERIES_METHODOLOGY_VERSION = "MERCURY-PUBLIC-CHRONOLOGICAL-PRICE-SERIES-P1-1.0";

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const publicHistorySource = source => typeof source === "string" && (source.startsWith("DATAFORSEO_") || source.endsWith("_MANUAL_PUBLISHER_OBSERVATION"));
const standalone = record => record.schemaVersion === "1.0" || (record.comparability?.classification === "STANDALONE_COMPARABLE" && record.comparability?.standaloneEligible === true);
const publicEquivalentKey = value => JSON.stringify([value.retailerId, value.retailerName, value.itemPriceUsd, value.currency]);

function validateInputs({ catalog, retailers, historicalRepository }) {
    if (!catalog || catalog.productCount !== catalog.products?.length) throw new Error("PUBLIC_PRICE_SERIES_CATALOG_INVALID");
    if (!Array.isArray(retailers)) throw new Error("PUBLIC_PRICE_SERIES_RETAILERS_INVALID");
    if (!historicalRepository?.getAll) throw new Error("PUBLIC_PRICE_SERIES_REPOSITORY_REQUIRED");
}

export async function createPublicChronologicalPriceSeries({ catalog, retailers, historicalRepository } = {}) {
    validateInputs({ catalog, retailers, historicalRepository });
    const records = await historicalRepository.getAll();
    if (!Array.isArray(records)) throw new Error("PUBLIC_PRICE_SERIES_REPOSITORY_RESULT_INVALID");
    const products = new Map(catalog.products.map(product => [product.atlasProductId.toLowerCase(), product]));
    const retailerById = new Map(retailers.map(retailer => [retailer.id, retailer]));
    const seen = new Set();
    const eligibleByProduct = new Map();
    const suppressedProductIds = new Set();
    let excludedObservationCount = 0;

    for (const record of records) {
        const report = validateHistoricalObservation(record);
        if (!report.valid) throw new Error("PUBLIC_PRICE_SERIES_CANONICAL_HISTORY_INVALID");
        if (seen.has(record.observationId)) throw new Error("PUBLIC_PRICE_SERIES_DUPLICATE_OBSERVATION_ID");
        seen.add(record.observationId);
        const product = products.get(record.atlasProductId.toLowerCase());
        if (!product) { suppressedProductIds.add(record.atlasProductId); continue; }
        if (!standalone(record) || record.market.currency !== "USD" || !publicHistorySource(record.provenance.source)) { excludedObservationCount += 1; continue; }
        const retailer = record.retailerId === null ? null : retailerById.get(record.retailerId);
        if (record.retailerId !== null && !retailer) { suppressedProductIds.add(product.atlasProductId); continue; }
        const row = {
            observedAt: new Date(record.observationTime).toISOString(),
            itemPriceUsd: record.market.basePrice,
            currency: record.market.currency,
            retailerId: retailer?.id ?? null,
            retailerName: retailer?.name ?? null,
            observationId: record.observationId
        };
        if (!eligibleByProduct.has(product.atlasProductId)) eligibleByProduct.set(product.atlasProductId, []);
        eligibleByProduct.get(product.atlasProductId).push(row);
    }

    const series = [];
    for (const product of catalog.products) {
        if (suppressedProductIds.has(product.atlasProductId)) continue;
        const rows = eligibleByProduct.get(product.atlasProductId) ?? [];
        const groups = new Map();
        for (const row of rows) {
            if (!groups.has(row.observedAt)) groups.set(row.observedAt, []);
            groups.get(row.observedAt).push(row);
        }
        const timestampGroups = [...groups.entries()].sort(([a], [b]) => Date.parse(a) - Date.parse(b)).map(([observedAt, group]) => {
            const aggregated = new Map();
            for (const row of group) {
                const publicRow = { itemPriceUsd: row.itemPriceUsd, currency: row.currency, retailerId: row.retailerId, retailerName: row.retailerName };
                const key = publicEquivalentKey(publicRow);
                const existing = aggregated.get(key);
                if (existing) existing.observationCount += 1;
                else aggregated.set(key, { ...publicRow, observationCount: 1, tieBreaker: row.observationId });
            }
            const observations = [...aggregated.values()].sort((a, b) => {
                const nullOrder = Number(a.retailerId === null) - Number(b.retailerId === null);
                return nullOrder || (a.retailerId ?? "").localeCompare(b.retailerId ?? "") || a.itemPriceUsd - b.itemPriceUsd || a.currency.localeCompare(b.currency) || a.tieBreaker.localeCompare(b.tieBreaker);
            }).map(({ tieBreaker, ...value }) => value);
            return { observedAt, observations };
        });
        series.push({ schemaVersion: PUBLIC_CHRONOLOGICAL_PRICE_SERIES_SCHEMA_VERSION, methodologyVersion: PUBLIC_CHRONOLOGICAL_PRICE_SERIES_METHODOLOGY_VERSION, atlasProductId: product.atlasProductId, publicPath: product.publicPath, comparisonSemantics: "ITEM_PRICE", timestampGroups });
    }
    return freeze({ schemaVersion: PUBLIC_CHRONOLOGICAL_PRICE_SERIES_SCHEMA_VERSION, methodologyVersion: PUBLIC_CHRONOLOGICAL_PRICE_SERIES_METHODOLOGY_VERSION, eligibleObservationCount: series.reduce((sum, item) => sum + item.timestampGroups.reduce((groupSum, group) => groupSum + group.observations.reduce((count, observation) => count + observation.observationCount, 0), 0), 0), timestampGroupCount: series.reduce((sum, item) => sum + item.timestampGroups.length, 0), productSeriesCount: series.filter(item => item.timestampGroups.length > 0).length, excludedObservationCount, suppressedProductIds: [...suppressedProductIds].sort(), products: series });
}

export function validatePublicChronologicalPriceSeries(value) {
    const forbidden = /observationId|evidenceId|provider|task|rawPayload|sourceUrl|researchUrl|affiliate|admitted|operator|review|rights|recordHash|seller|acquisition/i;
    if (!value || value.schemaVersion !== PUBLIC_CHRONOLOGICAL_PRICE_SERIES_SCHEMA_VERSION || !Array.isArray(value.products) || forbidden.test(JSON.stringify(value))) return false;
    return value.products.every(product => product.comparisonSemantics === "ITEM_PRICE" && Array.isArray(product.timestampGroups) && product.timestampGroups.every(group => Number.isFinite(Date.parse(group.observedAt)) && Array.isArray(group.observations) && group.observations.every(row => Number.isFinite(row.itemPriceUsd) && row.itemPriceUsd > 0 && row.currency === "USD" && Number.isInteger(row.observationCount) && row.observationCount > 0)));
}
