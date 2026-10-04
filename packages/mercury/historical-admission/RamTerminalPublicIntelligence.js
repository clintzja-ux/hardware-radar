import { HistoricalObservationIntelligence } from "./HistoricalObservationIntelligence.js";

export const RAM_TERMINAL_SCHEMA_VERSION = "1.0";
export const RAM_TERMINAL_METHODOLOGY_VERSION = "MERCURY-RAM-TERMINAL-P1-1.0";
export const RAM_TERMINAL_AGGREGATE_MINIMUM = 5;
export const RAM_TERMINAL_LENSES = Object.freeze(["ALL_RAM", "DDR5", "DDR4", "LAPTOP_SODIMM"]);

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const round = value => Math.round(value * 100) / 100;
const lensIncludes = (product, lens) => lens === "ALL_RAM" || (lens === "LAPTOP_SODIMM" ? product.formFactor === "SO_DIMM" : product.memoryType === lens && product.formFactor === "DIMM");
const median = values => { const ordered = [...values].sort((a, b) => a - b), middle = Math.floor(ordered.length / 2); return ordered.length % 2 ? ordered[middle] : round((ordered[middle - 1] + ordered[middle]) / 2); };
const isoSpanDays = (first, last) => first && last ? round((Date.parse(last) - Date.parse(first)) / 86400000) : null;
const publicHistorySource = record => typeof record?.provenance?.source === "string" && (record.provenance.source.startsWith("DATAFORSEO_") || record.provenance.source.endsWith("_MANUAL_PUBLISHER_OBSERVATION") || record.provenance.acquisition?.type === "RETAINED_COMMERCE_FEED");

function currentValue(currentProduct) {
    const offers = (currentProduct?.offers ?? []).filter(offer => offer.comparisonEligible === true && offer.currency === "USD" && Number.isFinite(offer.itemPriceUsd)).sort((a, b) => a.itemPriceUsd - b.itemPriceUsd || a.retailerId.localeCompare(b.retailerId));
    if (!offers.length) return null;
    return { itemPriceUsd: offers[0].itemPriceUsd, currency: "USD", retailerCount: new Set(offers.map(offer => offer.retailerId)).size, qualifiedOfferCount: offers.length, retailerIds: [...new Set(offers.map(offer => offer.retailerId))].sort() };
}

function productHistory(intelligence) {
    const comparable = intelligence.chronologicalObservations.filter(row => row.comparability.standaloneEligible === true && row.currency === "USD");
    const byTime = [...new Map(comparable.map(row => [row.observationTime, row])).values()].sort((a, b) => Date.parse(a.observationTime) - Date.parse(b.observationTime) || a.observationId.localeCompare(b.observationId));
    const first = byTime[0] ?? null, latest = byTime.at(-1) ?? null, previous = byTime.at(-2) ?? null;
    const values = comparable.map(row => row.basePrice), minimum = values.length ? Math.min(...values) : null, maximum = values.length ? Math.max(...values) : null;
    const compatibleMovement = previous && latest && previous.currency === latest.currency && previous.condition === latest.condition && previous.comparability.classification === latest.comparability.classification;
    let movement = "INSUFFICIENT_HISTORY", amount = null, percent = null;
    if (compatibleMovement) { amount = round(latest.basePrice - previous.basePrice); percent = previous.basePrice > 0 ? round(amount / previous.basePrice * 100) : null; movement = amount > 0 ? "UP" : amount < 0 ? "DOWN" : "FLAT"; }
    const supported = byTime.length >= 2;
    return {
        status: intelligence.observationCount === 0 ? "NO_HISTORY" : comparable.length === 0 ? "HISTORY_NOT_COMPARABLE" : supported ? "COMPARABLE_HISTORY" : "INSUFFICIENT_HISTORY",
        admittedObservationCount: intelligence.observationCount,
        comparableObservationCount: comparable.length,
        distinctComparableTimestampCount: byTime.length,
        ...(first ? { firstComparableObservation: { observedAt: first.observationTime, itemPriceUsd: first.basePrice } } : {}),
        ...(latest ? { latestComparableObservation: { observedAt: latest.observationTime, itemPriceUsd: latest.basePrice } } : {}),
        ...(previous ? { previousComparableObservation: { observedAt: previous.observationTime, itemPriceUsd: previous.basePrice } } : {}),
        ...(first ? { historyStart: first.observationTime, historyEnd: latest.observationTime, historySpanDays: isoSpanDays(first.observationTime, latest.observationTime) } : {}),
        ...(supported ? { observedMinimumItemPrice: minimum, observedMaximumItemPrice: maximum, movement, ...(amount !== null ? { changeFromPreviousAmount: amount } : {}), ...(percent !== null ? { changeFromPreviousPercent: percent } : {}), atObservedLow: latest.basePrice === minimum, newObservedLow: latest.basePrice === minimum && previous.basePrice > minimum, retailerCoverage: new Set(comparable.map(row => row.retailerId)).size } : { movement: "INSUFFICIENT_HISTORY" })
    };
}

function lensProjection(lens, products) {
    const rows = products.filter(row => lensIncludes(row.product, lens));
    const current = rows.filter(row => row.current).map(row => row.current.itemPriceUsd);
    const aggregateAvailable = current.length >= RAM_TERMINAL_AGGREGATE_MINIMUM;
    const comparableRows = rows.filter(row => row.history.comparableObservationCount > 0);
    const comparableTimes = comparableRows.flatMap(row => [row.history.historyStart, row.history.historyEnd]).filter(Boolean).sort();
    const productRows = rows.map(({ product, current, history }) => ({
        atlasProductId: product.atlasProductId, publicPath: product.publicPath, brand: product.brand, productName: product.displayName,
        memoryType: product.memoryType, formFactor: product.formFactor, capacityGb: product.capacityGb, moduleCount: product.moduleCount,
        capacityPerModuleGb: product.capacityPerModuleGb, dataRateMtps: product.dataRateMtps, current: current ? { itemPriceUsd: current.itemPriceUsd, currency: current.currency, retailerCount: current.retailerCount, qualifiedOfferCount: current.qualifiedOfferCount } : null, history
    })).sort((a, b) => (a.current?.itemPriceUsd ?? Infinity) - (b.current?.itemPriceUsd ?? Infinity) || a.productName.localeCompare(b.productName));
    const count = movement => rows.filter(row => row.history.movement === movement).length;
    return {
        lens,
        coverage: { productsTracked: rows.length, productsCurrentlyPriced: current.length, currentCoverageNumerator: current.length, currentCoverageDenominator: rows.length, qualifiedCurrentOfferCount: rows.reduce((sum, row) => sum + (row.current?.qualifiedOfferCount ?? 0), 0) },
        currentMarket: { state: current.length === 0 ? "NO_QUALIFYING_CURRENT_PRICE" : aggregateAvailable ? "AVAILABLE" : "INSUFFICIENT_MARKET_COHORT", minimumProductsRequired: RAM_TERMINAL_AGGREGATE_MINIMUM, lowestCurrentItemPrice: current.length ? Math.min(...current) : null, medianCurrentItemPrice: aggregateAvailable ? median(current) : null, currentItemPriceMinimum: aggregateAvailable ? Math.min(...current) : null, currentItemPriceMaximum: aggregateAvailable ? Math.max(...current) : null, retailerCoverage: new Set(rows.flatMap(row => row.current?.retailerIds ?? [])).size },
        historyCoverage: { productsWithAnyHistory: rows.filter(row => row.history.admittedObservationCount > 0).length, productsWithComparableHistory: comparableRows.length, totalAdmittedObservationCount: rows.reduce((sum, row) => sum + row.history.admittedObservationCount, 0), comparableObservationCount: rows.reduce((sum, row) => sum + row.history.comparableObservationCount, 0), earliestComparableObservationAt: comparableTimes[0] ?? null, latestComparableObservationAt: comparableTimes.at(-1) ?? null, comparableHistorySpanDays: comparableTimes.length ? isoSpanDays(comparableTimes[0], comparableTimes.at(-1)) : null },
        signalSummary: { productsDownFromPrevious: count("DOWN"), productsUpFromPrevious: count("UP"), productsFlatFromPrevious: count("FLAT"), productsAtObservedLow: rows.filter(row => row.history.atObservedLow === true).length, productsWithInsufficientComparableHistory: rows.filter(row => row.history.movement === "INSUFFICIENT_HISTORY").length },
        productRows
    };
}

export async function createRamTerminalPublicIntelligence({ catalog, currentRetail, historicalRepository, asOf, currentSnapshotId = null } = {}) {
    if (!catalog?.products || !currentRetail?.products || !historicalRepository?.getAll || !Number.isFinite(Date.parse(asOf))) throw new TypeError("RAM_TERMINAL_INPUT_INVALID");
    const raw = await historicalRepository.getAll();
    const eligible = raw.filter(publicHistorySource);
    const repository = { getAll: async () => eligible };
    const service = new HistoricalObservationIntelligence({ repository });
    const currentByProduct = new Map(currentRetail.products.map(item => [item.atlasProductId, item]));
    const rows = [];
    for (const product of catalog.products) rows.push({ product, current: currentValue(currentByProduct.get(product.atlasProductId)), history: productHistory(await service.query({ atlasProductId: product.atlasProductId })) });
    return freeze({ schemaVersion: RAM_TERMINAL_SCHEMA_VERSION, artifactType: "MERCURY_RAM_TERMINAL_PUBLIC_INTELLIGENCE", methodologyVersion: RAM_TERMINAL_METHODOLOGY_VERSION, asOf, currentState: currentRetail.state, currentSnapshotId, comparisonSemantics: "ITEM_PRICE", disclosure: "Prices exclude applicable shipping, taxes, and fees.", lenses: Object.fromEntries(RAM_TERMINAL_LENSES.map(lens => [lens, lensProjection(lens, rows)])) });
}

export function validateRamTerminalPublicIntelligence(value) {
    const errors = [];
    if (value?.schemaVersion !== RAM_TERMINAL_SCHEMA_VERSION || value?.methodologyVersion !== RAM_TERMINAL_METHODOLOGY_VERSION || !Number.isFinite(Date.parse(value?.asOf))) errors.push("RAM_TERMINAL_HEADER_INVALID");
    if (!RAM_TERMINAL_LENSES.every(lens => value?.lenses?.[lens]?.lens === lens)) errors.push("RAM_TERMINAL_LENSES_INVALID");
    const serialized = JSON.stringify(value);
    if (/destinationUrl|sourceUrl|rawPayload|providerTask|evidenceId|\.forge-review|affiliate|credential/i.test(serialized)) errors.push("RAM_TERMINAL_PRIVATE_FIELD_INVALID");
    if (/all-time low|lowest price ever|best time to buy|deal score|buy now/i.test(serialized)) errors.push("RAM_TERMINAL_CLAIM_INVALID");
    return freeze({ valid: errors.length === 0, errors });
}
