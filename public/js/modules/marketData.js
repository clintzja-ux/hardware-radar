export async function loadMarketSnapshot() {
    const response = await fetch("data/market-snapshot.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load published market intelligence.");
    return response.json();
}

export function scopeToDisplayProduct(scope, section, title) {
    if (!scope || scope.status !== "AVAILABLE" || !scope.cheapest) return null;
    const item = scope.cheapest;
    const observed = new Date(item.observedAt);
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
        priceBasis: "Listed price",
        shippingMessage: "Shipping not verified",
        retailer: item.retailer,
        affiliateUrl: item.sourceUrl,
        verified: observed.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC",
        lastVerifiedTime: observed.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC",
        pricesChecked: scope.coverage.eligibleObservations,
        retailersMonitored: scope.coverage.retailersRepresented,
        insight: `✓ ${item.freshness} • ${item.confidence} confidence`,
        hardwareRadarVerified: true
    };
}
