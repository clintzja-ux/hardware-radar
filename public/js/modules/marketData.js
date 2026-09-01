export async function loadMarketSnapshot() {
    const response = await fetch("data/market-snapshot.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load published market intelligence.");
    return response.json();
}

function offerToDisplayProduct(item, scope, section, title, rank) {
    const observed = new Date(item.observedAt);
    const shipping = item.shipping?.known === true
        ? item.shipping.amount === 0 ? "Shipping verified as free" : `Shipping: $${Number(item.shipping.amount).toFixed(2)} ${item.shipping.currency}`
        : "Shipping not verified";
    return {
        id: item.atlasProductId,
        observationId: item.observationId,
        section,
        title,
        brand: item.brand,
        model: item.modelName,
        capacity: `${item.capacityGb}GB`,
        memoryType: item.memoryType,
        speed: `${item.dataRateMtps} MT/s`,
        bestFor: "Verified current market candidate",
        price: item.price.toFixed(2),
        currency: item.currency,
        priceBasis: item.priceBasis === "LISTED_PRICE" ? "Listed price" : "Price basis unavailable",
        shippingMessage: shipping,
        retailer: item.retailer,
        affiliateUrl: item.sourceUrl,
        verified: observed.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC",
        lastVerifiedTime: observed.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC",
        pricesChecked: scope.coverage.eligibleObservations,
        retailersMonitored: scope.coverage.retailersRepresented,
        insight: `✓ ${item.freshness} • ${item.confidence} confidence`,
        hardwareRadarVerified: true,
        rank
    };
}

export function scopeToDisplayProducts(scope, section, title) {
    if (!scope || scope.status !== "AVAILABLE" || !scope.cheapest) return [];
    return [scope.cheapest, ...(Array.isArray(scope.alternatives) ? scope.alternatives : [])]
        .map((item, index) => offerToDisplayProduct(item, scope, section, title, index + 1));
}

export function scopeToDisplayProduct(scope, section, title) {
    return scopeToDisplayProducts(scope, section, title)[0] ?? null;
}
