export async function loadCurrentRetailSnapshot() {
    const response = await fetch("/data/ram-current-retail.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load current retail prices.");
    return response.json();
}

export function offerToDisplayProduct(item, section, title, coverage = {}) {
    if (!item) return null;
    const observed = new Date(item.observedAt);
    return {
        id: item.atlasProductId, section, title, brand: item.brand,
        model: item.family || item.displayName, displayName: item.displayName,
        capacity: `${item.totalCapacityGb}GB`, memoryType: item.ddrGeneration,
        speed: `${item.speedMtps} MT/s`, moduleConfiguration: `${item.moduleCount} × ${item.capacityPerModuleGb}GB`,
        bestFor: "Lowest qualifying current displayed item price",
        price: Number(item.itemPriceUsd).toFixed(2), currency: item.currency,
        priceBasis: "Current tracked item price", shippingMessage: "Shipping, taxes and fees excluded",
        retailer: item.retailerName, offerUrl: item.destinationUrl,
        verified: observed.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC",
        lastVerifiedTime: observed.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC",
        pricesChecked: coverage.offerCount ?? 1, retailersMonitored: coverage.retailerCount ?? 1,
        insight: "Item-price comparison", comparisonSemantics: item.comparisonSemantics
    };
}

export function winnerToDisplayProduct(snapshot, scope, section, title) {
    const winner = snapshot?.winners?.[scope] ?? null;
    if (!winner) return null;
    const offers = snapshot.products?.flatMap(product => product.offers ?? []) ?? [];
    const scoped = offers.filter(offer => scope === "overall"
        || (scope === "laptop" ? offer.formFactor === "SO_DIMM" : offer.ddrGeneration.toLowerCase() === scope && offer.formFactor === "DIMM"));
    return offerToDisplayProduct(winner, section, title, {
        offerCount: scoped.length,
        retailerCount: new Set(scoped.map(offer => offer.retailerId)).size
    });
}
