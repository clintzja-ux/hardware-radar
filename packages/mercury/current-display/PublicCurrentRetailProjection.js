export const PUBLIC_CURRENT_RETAIL_SCHEMA_VERSION = "1.0";
export const PUBLIC_CURRENT_RETAIL_POLICY = Object.freeze({
    policyId: "PUBLIC-RAM-CURRENT-RETAIL-001",
    version: "PUBLIC-RAM-CURRENT-RETAIL-001-1.0",
    maxAgeHours: 36,
    comparisonSemantics: "TOTAL_ACQUISITION_COST",
    disclosure: "Observed seller and price are timestamped. Product and all-offers links may not preselect that seller or price. Cheapest uses item price plus known shipping and mandatory fees; taxes may apply."
});

const HOUR_MS = 60 * 60 * 1000;
const SCOPES = Object.freeze(["overall", "ddr5", "ddr4", "laptop"]);
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const activeProduct = product => product?.identity?.productType === "ram" && product?.governance?.lifecycleStatus === "ACTIVE" && product?.governance?.publicationStatus === "READY";
const activeRetailer = retailer => retailer?.status === "active";
const classification = product => product?.extension?.data?.classification ?? {};
const capacity = product => product?.extension?.data?.capacity ?? {};
const performance = product => product?.extension?.data?.performance ?? {};
const scopeMatches = (product, scope) => {
    const value = classification(product);
    if (scope === "overall") return ["DDR4", "DDR5"].includes(value.memoryType) && ["DIMM", "SO_DIMM"].includes(value.formFactor);
    if (scope === "ddr5") return value.memoryType === "DDR5" && value.formFactor === "DIMM";
    if (scope === "ddr4") return value.memoryType === "DDR4" && value.formFactor === "DIMM";
    if (scope === "laptop") return value.formFactor === "SO_DIMM";
    return false;
};
const orderOffers = (left, right) => (left.totalAcquisitionCostUsd ?? left.itemPriceUsd) - (right.totalAcquisitionCostUsd ?? right.itemPriceUsd)
    || left.retailerId.localeCompare(right.retailerId)
    || left.atlasProductId.localeCompare(right.atlasProductId)
    || left.destinationId.localeCompare(right.destinationId);
const marketplaceComparable = offer => offer.deliveredCostEligible === true || (offer.sellerName === null && offer.comparisonEligible === true);

function publicOffer({ offer, product, retailer, destination, asOf }) {
    const ageHours = (Date.parse(asOf) - Date.parse(offer.observedAt)) / HOUR_MS;
    const freshnessMaximumAgeHours = offer?.sourceIdentity?.sourceId === "AMAZON_MANUAL_PUBLISHER_OBSERVATION" ? 24 : PUBLIC_CURRENT_RETAIL_POLICY.maxAgeHours;
    return {
        atlasProductId: product.identity.atlasProductId,
        brand: product.identity.brand,
        family: product.identity.productFamily ?? null,
        series: product.identity.series ?? null,
        displayName: product.identity.displayName,
        ddrGeneration: classification(product).memoryType,
        formFactor: classification(product).formFactor,
        totalCapacityGb: capacity(product).capacityGb,
        moduleCount: capacity(product).moduleCount,
        capacityPerModuleGb: capacity(product).capacityPerModuleGb,
        speedMtps: performance(product).dataRateMtps,
        casLatency: performance(product).casLatency ?? null,
        retailerId: retailer.id,
        retailerName: retailer.name,
        destinationId: destination.destinationId,
        destinationUrl: destination.destinationUrl,
        destinationSemantics: offer.destinationSemantics ?? "CHANNEL_PRODUCT_DESTINATION",
        priceCorrespondingAction: offer.priceCorrespondingAction === true,
        itemPriceUsd: offer.priceUsd,
        currency: "USD",
        observedAt: offer.observedAt,
        ageHours: Math.round(ageHours * 1000) / 1000,
        freshness: "PUBLIC_CURRENT",
        freshnessMaximumAgeHours,
        sellerName: offer.sellerName ?? null,
        navigationDisclosure: offer.priceCorrespondingAction === true ? "EXACT_SELLER_OFFER_ACTION" : "PRODUCT_OR_ALL_OFFERS_NAVIGATION_SELLER_AND_PRICE_NOT_PRESELECTED",
        comparisonSemantics: "TOTAL_ACQUISITION_COST",
        comparisonEligible: offer.comparisonEligible === true,
        shippingUsd: offer.shippingUsd ?? null,
        feesUsd: offer.feesUsd ?? null,
        deliveredCostEligible: offer.deliveredCostEligible === true,
        totalAcquisitionCostUsd: offer.deliveredCostEligible === true ? Math.round((offer.priceUsd + offer.shippingUsd + offer.feesUsd) * 100) / 100 : null,
        taxesIncluded: false
    };
}

export function createEmptyPublicCurrentRetailProjection({ asOf, state = "NO_CURRENT_RETAIL_STATE" } = {}) {
    if (!validTime(asOf)) throw new TypeError("PUBLIC_CURRENT_RETAIL_AS_OF_INVALID");
    return freeze({
        schemaVersion: PUBLIC_CURRENT_RETAIL_SCHEMA_VERSION,
        policyVersion: PUBLIC_CURRENT_RETAIL_POLICY.version,
        asOf,
        state,
        comparisonSemantics: PUBLIC_CURRENT_RETAIL_POLICY.comparisonSemantics,
        disclosure: PUBLIC_CURRENT_RETAIL_POLICY.disclosure,
        freshness: { maxAgeHours: PUBLIC_CURRENT_RETAIL_POLICY.maxAgeHours },
        counts: { sourceOffers: 0, publicCurrentEligibleOffers: 0, staleOffers: 0 },
        winners: { overall: null, ddr5: null, ddr4: null, laptop: null },
        products: []
    });
}

export function createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot, asOf } = {}) {
    if (!validTime(asOf)) throw new TypeError("PUBLIC_CURRENT_RETAIL_AS_OF_INVALID");
    if (!Array.isArray(products) || !Array.isArray(retailers) || !Array.isArray(destinations) || !currentSnapshot || !Array.isArray(currentSnapshot.offers)) {
        throw new TypeError("PUBLIC_CURRENT_RETAIL_INPUT_INVALID");
    }
    const productById = new Map(products.map(product => [product.identity?.atlasProductId, product]));
    const retailerById = new Map(retailers.map(retailer => [retailer.id, retailer]));
    const destinationById = new Map(destinations.map(destination => [destination.destinationId, destination]));
    const eligible = [];
    let staleOffers = 0;
    for (const offer of currentSnapshot.offers) {
        if (offer?.itemPriceEligible !== true) continue;
        const product = productById.get(offer.atlasProductId);
        const retailer = retailerById.get(offer.retailerId);
        const destination = destinationById.get(offer.destinationId);
        if (!activeProduct(product) || !activeRetailer(retailer) || !destination
            || destination.atlasProductId !== offer.atlasProductId || destination.retailerId !== offer.retailerId
            || !validTime(offer.observedAt) || !Number.isFinite(offer.priceUsd) || offer.priceUsd <= 0 || offer.currency !== "USD") continue;
        const ageMs = Date.parse(asOf) - Date.parse(offer.observedAt);
        const maximumAgeHours = offer?.sourceIdentity?.sourceId === "AMAZON_MANUAL_PUBLISHER_OBSERVATION" ? 24 : PUBLIC_CURRENT_RETAIL_POLICY.maxAgeHours;
        if (ageMs < 0) continue;
        if (ageMs > maximumAgeHours * HOUR_MS) { staleOffers += 1; continue; }
        eligible.push(publicOffer({ offer, product, retailer, destination, asOf }));
    }
    eligible.sort(orderOffers);
    const grouped = new Map();
    for (const offer of eligible) {
        if (!grouped.has(offer.atlasProductId)) grouped.set(offer.atlasProductId, []);
        grouped.get(offer.atlasProductId).push(offer);
    }
    const publicProducts = [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([atlasProductId, offers]) => {
        const comparable = offers.filter(marketplaceComparable).sort(orderOffers);
        const comparableRetailers = new Set(comparable.map(offer => offer.retailerId));
        return {
            atlasProductId,
            status: "CURRENT_PRICE_AVAILABLE",
            lowerCurrentItemPrice: comparableRetailers.size >= 2 ? comparable[0] : null,
            eligibleOfferCount: offers.length,
            offers
        };
    });
    const comparable = eligible.filter(marketplaceComparable);
    const winners = {};
    for (const scope of SCOPES) winners[scope] = comparable.filter(offer => scopeMatches(productById.get(offer.atlasProductId), scope)).sort(orderOffers)[0] ?? null;
    const projection = {
        schemaVersion: PUBLIC_CURRENT_RETAIL_SCHEMA_VERSION,
        policyVersion: PUBLIC_CURRENT_RETAIL_POLICY.version,
        asOf,
        state: eligible.length ? "AVAILABLE" : "NO_QUALIFYING_CURRENT_PRICE",
        comparisonSemantics: PUBLIC_CURRENT_RETAIL_POLICY.comparisonSemantics,
        disclosure: PUBLIC_CURRENT_RETAIL_POLICY.disclosure,
        freshness: { maxAgeHours: PUBLIC_CURRENT_RETAIL_POLICY.maxAgeHours },
        counts: { sourceOffers: currentSnapshot.offers.length, publicCurrentEligibleOffers: eligible.length, staleOffers },
        winners,
        products: publicProducts
    };
    const report = validatePublicCurrentRetailProjection(projection);
    if (!report.valid) throw new TypeError(report.errors.join(","));
    return freeze(projection);
}

export function validatePublicCurrentRetailProjection(projection) {
    const errors = [];
    if (!projection || typeof projection !== "object" || Array.isArray(projection)) return freeze({ valid: false, errors: ["PUBLIC_CURRENT_RETAIL_REQUIRED"] });
    if (projection.schemaVersion !== PUBLIC_CURRENT_RETAIL_SCHEMA_VERSION) errors.push("PUBLIC_CURRENT_RETAIL_SCHEMA_INVALID");
    if (projection.policyVersion !== PUBLIC_CURRENT_RETAIL_POLICY.version) errors.push("PUBLIC_CURRENT_RETAIL_POLICY_INVALID");
    if (!validTime(projection.asOf)) errors.push("PUBLIC_CURRENT_RETAIL_AS_OF_INVALID");
    const legacyItemPrice = projection.comparisonSemantics === "ITEM_PRICE" && projection.disclosure === "Prices shown exclude applicable shipping, taxes, and fees.";
    const totalAcquisitionCost = projection.comparisonSemantics === "TOTAL_ACQUISITION_COST" && projection.disclosure === PUBLIC_CURRENT_RETAIL_POLICY.disclosure;
    if ((!legacyItemPrice && !totalAcquisitionCost) || projection.freshness?.maxAgeHours !== 36) errors.push("PUBLIC_CURRENT_RETAIL_SEMANTICS_INVALID");
    if (!["AVAILABLE", "NO_QUALIFYING_CURRENT_PRICE", "NO_CURRENT_RETAIL_STATE"].includes(projection.state)) errors.push("PUBLIC_CURRENT_RETAIL_STATE_INVALID");
    if (!Array.isArray(projection.products) || !SCOPES.every(scope => scope in (projection.winners ?? {}))) errors.push("PUBLIC_CURRENT_RETAIL_CONTENT_INVALID");
    const allOffers = [];
    for (const product of projection.products ?? []) {
        if (product?.status !== "CURRENT_PRICE_AVAILABLE" || (product.lowerCurrentItemPrice !== null && product?.atlasProductId !== product?.lowerCurrentItemPrice?.atlasProductId) || !Array.isArray(product?.offers) || product.offers.length !== product.eligibleOfferCount) errors.push("PUBLIC_CURRENT_RETAIL_PRODUCT_INVALID");
        allOffers.push(...(product.offers ?? []));
        const comparable = product.offers?.filter(offer => legacyItemPrice ? offer.comparisonEligible : marketplaceComparable(offer)).sort(orderOffers) ?? [];
        const expected = new Set(comparable.map(offer => offer.retailerId)).size >= 2 ? comparable[0] : null;
        if ((expected?.destinationId ?? null) !== (product.lowerCurrentItemPrice?.destinationId ?? null)) errors.push("PUBLIC_CURRENT_RETAIL_PRODUCT_WINNER_INVALID");
    }
    for (const offer of allOffers) {
        if (!/^ram_[a-z0-9_]+$/.test(offer?.atlasProductId ?? "") || !/^RETAILER-\d{4}$/.test(offer?.retailerId ?? "") || !/^mer_dest_[a-f0-9]{24}$/.test(offer?.destinationId ?? "")) errors.push("PUBLIC_CURRENT_RETAIL_IDENTITY_INVALID");
        if (!Number.isFinite(offer?.itemPriceUsd) || offer.itemPriceUsd <= 0 || offer.currency !== "USD" || offer.comparisonSemantics !== projection.comparisonSemantics || typeof offer.comparisonEligible !== "boolean" || (!legacyItemPrice && typeof offer.deliveredCostEligible !== "boolean")) errors.push("PUBLIC_CURRENT_RETAIL_PRICE_INVALID");
        const offerFreshnessMaximumAgeHours = offer?.freshnessMaximumAgeHours ?? PUBLIC_CURRENT_RETAIL_POLICY.maxAgeHours;
        if (!validTime(offer?.observedAt) || offer?.freshness !== "PUBLIC_CURRENT" || ![24, 36].includes(offerFreshnessMaximumAgeHours) || offer?.ageHours < 0 || offer?.ageHours > offerFreshnessMaximumAgeHours) errors.push("PUBLIC_CURRENT_RETAIL_FRESHNESS_INVALID");
        const shippingValid = offer?.shippingUsd === null || (Number.isFinite(offer.shippingUsd) && offer.shippingUsd >= 0);
        const feesValid = offer?.feesUsd === null || (Number.isFinite(offer.feesUsd) && offer.feesUsd >= 0);
        if (!shippingValid || !feesValid || offer?.taxesIncluded !== false) errors.push("PUBLIC_CURRENT_RETAIL_COST_INVALID");
        if (!legacyItemPrice) {
            const expectedTotal = offer?.deliveredCostEligible ? Math.round((offer.itemPriceUsd + offer.shippingUsd + offer.feesUsd) * 100) / 100 : null;
            if (offer?.totalAcquisitionCostUsd !== expectedTotal) errors.push("PUBLIC_CURRENT_RETAIL_TOTAL_COST_INVALID");
            if (offer?.deliveredCostEligible && (!offer?.comparisonEligible || offer.shippingUsd === null || offer.feesUsd === null)) errors.push("PUBLIC_CURRENT_RETAIL_TOTAL_COST_INVALID");
            if ((offer?.sellerName !== null && (typeof offer.sellerName !== "string" || !offer.sellerName.trim())) || !["EXACT_SELLER_OFFER_ACTION", "PRODUCT_OR_ALL_OFFERS_NAVIGATION_SELLER_AND_PRICE_NOT_PRESELECTED"].includes(offer?.navigationDisclosure)) errors.push("PUBLIC_CURRENT_RETAIL_SELLER_DISCLOSURE_INVALID");
        }
        const destinationSemantics = offer?.destinationSemantics ?? "CHANNEL_PRODUCT_DESTINATION";
        const priceCorrespondingAction = offer?.priceCorrespondingAction ?? false;
        if (!["CHANNEL_PRODUCT_DESTINATION", "ALL_OFFERS_DESTINATION", "EXACT_SELLER_OFFER_DESTINATION"].includes(destinationSemantics) || typeof priceCorrespondingAction !== "boolean") errors.push("PUBLIC_CURRENT_RETAIL_ACTION_SEMANTICS_INVALID");
        if (priceCorrespondingAction && destinationSemantics !== "EXACT_SELLER_OFFER_DESTINATION") errors.push("PUBLIC_CURRENT_RETAIL_ACTION_SEMANTICS_INVALID");
        try { if (new URL(offer.destinationUrl).protocol !== "https:") throw new Error(); } catch { errors.push("PUBLIC_CURRENT_RETAIL_DESTINATION_INVALID"); }
    }
    for (const scope of SCOPES) {
        const winner = projection.winners?.[scope];
        const candidates = allOffers.filter(offer => (legacyItemPrice ? offer.comparisonEligible : marketplaceComparable(offer)) && (scope === "overall"
            || (scope === "laptop" ? offer.formFactor === "SO_DIMM" : offer.ddrGeneration.toLowerCase() === scope && offer.formFactor === "DIMM"))).sort(orderOffers);
        if ((winner?.destinationId ?? null) !== (candidates[0]?.destinationId ?? null)) errors.push("PUBLIC_CURRENT_RETAIL_SCOPE_WINNER_INVALID");
    }
    const serialized = JSON.stringify(projection);
    if (/\.forge-review|workbook|operatorNotes|manualReviewProvenance|affiliate/i.test(serialized)) errors.push("PUBLIC_CURRENT_RETAIL_PRIVATE_FIELD_INVALID");
    return freeze({ valid: errors.length === 0, errors: [...new Set(errors)] });
}
