import crypto from "node:crypto";
import { createCurrentDisplaySnapshot } from "./CurrentDisplaySnapshot.js";
import { assessCurrentDisplayItemPriceEligibility } from "./CurrentDisplayEligibility.js";

export const CURRENT_RETAIL_SOURCE_MODES = Object.freeze(["AUTOMATED_PRIMARY", "AUTOMATED_ALTERNATE", "MANUAL_ONLY", "UNAVAILABLE"]);
export const CURRENT_RETAIL_REFRESH_OUTCOMES = Object.freeze(["REFRESHED", "OUT_OF_STOCK", "PRICE_NOT_EXPOSED", "MARKETPLACE_ONLY", "CONDITION_UNKNOWN", "AVAILABILITY_UNKNOWN", "DESTINATION_INVALID", "SOURCE_UNAVAILABLE", "RATE_LIMITED", "TIMEOUT", "PROVIDER_ERROR", "INVALID_SOURCE_RESULT"]);

const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const activeReady = product => product?.identity?.productType === "ram" && product?.governance?.lifecycleStatus === "ACTIVE" && product?.governance?.publicationStatus === "READY";
const modeRank = mode => CURRENT_RETAIL_SOURCE_MODES.indexOf(mode);
const retailerKey = (retailers, retailerId) => {
    const explicit = retailers.find(item => item.id === retailerId)?.name;
    if (explicit) return String(explicit).toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    if (retailerId === "RETAILER-0001") return "AMAZON";
    if (retailerId === "RETAILER-0004") return "NEWEGG";
    return null;
};

function validateRegistration(registration) {
    if (!registration || typeof registration !== "object" || !/^mer_adapter_[a-z0-9_]+$/.test(registration.adapterId ?? "") || !CURRENT_RETAIL_SOURCE_MODES.includes(registration.mode)) throw new TypeError("CURRENT_RETAIL_SOURCE_REGISTRATION_INVALID");
    if (typeof registration.supports !== "function" || typeof registration.refresh !== "function") throw new TypeError("CURRENT_RETAIL_SOURCE_ADAPTER_INVALID");
    const rights = registration.rights;
    if (!rights || rights.acquisitionAllowed !== true || rights.ephemeralRetentionAllowed !== true || typeof rights.publicDisplayAllowed !== "boolean" || typeof rights.comparisonAllowed !== "boolean" || rights.historicalRetentionAllowed !== false) throw new TypeError("CURRENT_RETAIL_SOURCE_RIGHTS_INVALID");
}

export function createCurrentRetailRefreshPortfolio({ products, destinations, retailers = [], adapters, asOf } = {}) {
    if (!validTime(asOf) || !Array.isArray(products) || !Array.isArray(destinations) || !Array.isArray(adapters)) throw new TypeError("CURRENT_RETAIL_REFRESH_PORTFOLIO_INPUT_INVALID");
    adapters.forEach(validateRegistration);
    const active = new Map(products.filter(activeReady).map(product => [product.identity.atlasProductId, product]));
    const items = [];
    const excluded = [];
    const orderedAdapters = [...adapters].sort((a, b) => modeRank(a.mode) - modeRank(b.mode) || a.adapterId.localeCompare(b.adapterId));
    const orderedDestinations = [...destinations].sort((a, b) => a.atlasProductId.localeCompare(b.atlasProductId) || a.retailerId.localeCompare(b.retailerId) || a.destinationId.localeCompare(b.destinationId));
    for (const destination of orderedDestinations) {
        const product = active.get(destination.atlasProductId);
        if (!product || destination.status !== "ACTIVE") { excluded.push({ destinationId: destination.destinationId, reason: "ATLAS_OR_DESTINATION_NOT_ACTIVE_READY" }); continue; }
        let validUrl = false;
        try { validUrl = new URL(destination.destinationUrl).protocol === "https:"; } catch {}
        const retailer = retailerKey(retailers, destination.retailerId);
        if (!/^mer_dest_[a-f0-9]{24}$/.test(destination.destinationId ?? "") || !validUrl || !retailer) { excluded.push({ destinationId: destination.destinationId ?? null, reason: "DESTINATION_INVALID" }); continue; }
        const context = freeze({ atlasProductId: destination.atlasProductId, retailerId: destination.retailerId, retailer, destinationId: destination.destinationId, destinationUrl: destination.destinationUrl, retailerListingId: destination.retailerListingId ?? null, marketplace: destination.marketplace, asOf });
        const capable = orderedAdapters.filter(adapter => adapter.mode !== "UNAVAILABLE" && adapter.mode !== "MANUAL_ONLY" && adapter.supports(context) === true);
        const selected = capable[0] ?? null;
        if (!selected) { excluded.push({ destinationId: destination.destinationId, reason: "AUTOMATED_SOURCE_UNAVAILABLE" }); continue; }
        items.push({ ...context, sourceAdapterId: selected.adapterId, sourceMode: selected.mode });
    }
    const material = { asOf, items };
    const portfolioDigest = hash(material);
    return freeze({ schemaVersion: "1.0", portfolioId: `mer_curportfolio_${portfolioDigest.slice(0, 24)}`, portfolioDigest, asOf, items, excluded, counts: { operations: items.length, excluded: excluded.length }, externalOperations: 0, providerTasks: 0, actualSpendUsd: 0, affiliateStateUsed: false });
}

function normalizedObservation(result, item, adapter, operationId) {
    if (!result || result.type !== "OBSERVATION" || result.atlasProductId !== item.atlasProductId || result.retailerId !== item.retailerId || result.retailer !== item.retailer || result.destinationId !== item.destinationId || result.destinationUrl !== item.destinationUrl || result.marketplace !== item.marketplace || !validTime(result.observedAt) || Date.parse(result.observedAt) > Date.parse(item.asOf)) return null;
    if (!Number.isFinite(result.itemPriceUsd) || result.itemPriceUsd <= 0 || result.currency !== "USD") return null;
    if (![null, "NEW", "USED", "REFURBISHED", "OPEN_BOX"].includes(result.condition ?? null) || ![null, "AVAILABLE", "AVAILABLE_MARKETPLACE", "OUT_OF_STOCK"].includes(result.availability ?? null)) return null;
    if (result.shippingUsd !== null || result.feesUsd !== null) return null;
    const condition = result.condition ?? null;
    const availability = result.availability ?? null;
    const eligibility = assessCurrentDisplayItemPriceEligibility({ condition, availability, destinationId: item.destinationId, publicDisplayAllowed: adapter.rights.publicDisplayAllowed, comparisonAllowed: adapter.rights.comparisonAllowed });
    return {
        atlasProductId: item.atlasProductId, retailer: item.retailer, retailerId: item.retailerId, marketplace: item.marketplace,
        priceUsd: result.itemPriceUsd, currency: result.currency, availability: availability ?? "UNKNOWN", condition,
        shippingUsd: null, feesUsd: null, researchUrl: item.destinationUrl, destinationId: item.destinationId,
        matchStatus: "CANONICAL_DESTINATION_REFRESH", sourceRow: operationId,
        observedAt: result.observedAt, sellerType: result.sellerType ?? null, sellerName: result.sellerName ?? null,
        sourceIdentity: { adapterId: adapter.adapterId, sourceId: result.sourceId, rightsProfileId: adapter.rights.profileId, historicalRetentionAllowed: false },
        ...eligibility
    };
}

function observationOutcome(offer) {
    if (offer.availability === "AVAILABLE_MARKETPLACE") return "MARKETPLACE_ONLY";
    if (offer.availability === "UNKNOWN") return "AVAILABILITY_UNKNOWN";
    if (offer.condition === null) return "CONDITION_UNKNOWN";
    return "REFRESHED";
}

export class CurrentRetailRefreshOrchestrator {
    constructor({ adapters, snapshotRepository = null, concurrency = 10 } = {}) {
        if (!Array.isArray(adapters) || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 30) throw new TypeError("CURRENT_RETAIL_REFRESH_ORCHESTRATOR_INPUT_INVALID");
        adapters.forEach(validateRegistration);
        this.adapters = new Map(adapters.map(adapter => [adapter.adapterId, adapter]));
        if (this.adapters.size !== adapters.length) throw new TypeError("CURRENT_RETAIL_SOURCE_REGISTRATION_CONFLICT");
        this.snapshotRepository = snapshotRepository;
        this.concurrency = concurrency;
    }

    async run({ portfolio, priorSnapshot = null, dryRun = false } = {}) {
        if (!portfolio?.portfolioId || !validTime(portfolio.asOf) || !Array.isArray(portfolio.items)) throw new TypeError("CURRENT_RETAIL_REFRESH_PORTFOLIO_INVALID");
        if (dryRun) return freeze({ status: "PREVIEW", portfolioId: portfolio.portfolioId, operations: portfolio.items.length, mutations: 0, externalOperations: 0, providerTasks: 0, actualSpendUsd: 0 });
        const startedAt = portfolio.asOf;
        const results = new Array(portfolio.items.length);
        let cursor = 0;
        const worker = async () => {
            while (true) {
                const index = cursor++;
                if (index >= portfolio.items.length) return;
                const item = portfolio.items[index];
                const adapter = this.adapters.get(item.sourceAdapterId);
                try { results[index] = await adapter.refresh(freeze(structuredClone(item))); }
                catch (error) { results[index] = { type: "OUTCOME", status: error?.code === "TIMEOUT" ? "TIMEOUT" : "PROVIDER_ERROR" }; }
            }
        };
        await Promise.all(Array.from({ length: Math.min(this.concurrency, Math.max(1, portfolio.items.length)) }, worker));
        const offers = new Map((priorSnapshot?.offers ?? []).map(offer => [`${offer.atlasProductId}|${offer.retailerId}`, structuredClone(offer)]));
        const outcomes = [];
        for (const [index, item] of portfolio.items.entries()) {
            const adapter = this.adapters.get(item.sourceAdapterId);
            const result = results[index];
            const key = `${item.atlasProductId}|${item.retailerId}`;
            const operationId = index + 1;
            if (result?.type === "OUTCOME" && ["OUT_OF_STOCK", "PRICE_NOT_EXPOSED"].includes(result.status)) { offers.delete(key); outcomes.push({ operationId, ...item, status: result.status }); continue; }
            if (result?.type === "OUTCOME" && CURRENT_RETAIL_REFRESH_OUTCOMES.includes(result.status)) { outcomes.push({ operationId, ...item, status: result.status }); continue; }
            const offer = normalizedObservation(result, item, adapter, operationId);
            if (!offer) { outcomes.push({ operationId, ...item, status: "INVALID_SOURCE_RESULT" }); continue; }
            offers.set(key, offer);
            outcomes.push({ operationId, ...item, status: observationOutcome(offer) });
        }
        const runMaterial = { portfolioId: portfolio.portfolioId, asOf: portfolio.asOf, outcomes };
        const runDigest = hash(runMaterial);
        const snapshot = createCurrentDisplaySnapshot({ observedAt: portfolio.asOf, importedAt: portfolio.asOf, source: { workbook: `fixture-current-retail-refresh:${portfolio.portfolioId}`, sheet: "Source-neutral fixture refresh", digest: runDigest }, offers: [...offers.values()] });
        const persistence = this.snapshotRepository ? await this.snapshotRepository.replace(snapshot) : { status: "NOT_PERSISTED", snapshotId: snapshot.snapshotId, previousSnapshotId: priorSnapshot?.snapshotId ?? null };
        const count = status => outcomes.filter(outcome => outcome.status === status).length;
        const successful = new Set(["REFRESHED", "MARKETPLACE_ONLY", "CONDITION_UNKNOWN", "AVAILABILITY_UNKNOWN", "OUT_OF_STOCK", "PRICE_NOT_EXPOSED"]);
        return freeze({ schemaVersion: "1.0", runId: `mer_currefresh_${runDigest.slice(0, 24)}`, runDigest, startedAt, asOf: portfolio.asOf, portfolioId: portfolio.portfolioId, outcomes, snapshot, persistence,
            counts: { attempted: outcomes.length, refreshed: count("REFRESHED"), failed: outcomes.filter(item => !successful.has(item.status)).length, preservedPrior: outcomes.filter(item => !successful.has(item.status) && offers.has(`${item.atlasProductId}|${item.retailerId}`)).length, outOfStock: count("OUT_OF_STOCK"), priceUnavailable: count("PRICE_NOT_EXPOSED"), conditionUnknown: snapshot.offers.filter(offer => offer.condition === null).length, availabilityUnknown: snapshot.offers.filter(offer => offer.availability === "UNKNOWN").length, marketplaceBlocked: count("MARKETPLACE_ONLY"), sourceUnavailable: count("SOURCE_UNAVAILABLE"), numericOffers: snapshot.offers.length, itemPriceEligibleOffers: snapshot.offers.filter(offer => offer.itemPriceEligible).length },
            countsByRetailer: Object.fromEntries([...new Set(outcomes.map(item => item.retailerId))].sort().map(id => [id, outcomes.filter(item => item.retailerId === id).length])),
            countsBySource: Object.fromEntries([...new Set(outcomes.map(item => item.sourceAdapterId))].sort().map(id => [id, outcomes.filter(item => item.sourceAdapterId === id).length])),
            historicalObservationsCreated: 0, canonicalObservationsCreated: 0, reviewDecisionsCreated: 0, publicationDecisionsCreated: 0, currentPriceRecordsCreated: 0, externalOperations: 0, providerTasks: 0, actualSpendUsd: 0 });
    }
}
