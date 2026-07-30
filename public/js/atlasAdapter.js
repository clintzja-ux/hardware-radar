import Atlas from "../data/atlas/Atlas.js";

const PRICE_OBSERVATION_URL = new URL(
    "../data/mercury/observations/PRICE-20260715-000001.json",
    import.meta.url
);

async function loadJson(resource, description) {
    const response = await fetch(resource);
    if (!response.ok) throw new Error(`Failed to load ${description}: ${response.status} ${response.statusText}`);
    return response.json();
}

export async function loadAtlasProduct(productId) {
    return Atlas.getProduct(productId);
}

export async function loadAtlasOverallProduct() {
    const productId = "ram_corsair_cmk32gx5m2b6000z30";
    const priceObservation = await loadJson(PRICE_OBSERVATION_URL, "Mercury price observation");
    const product = await Atlas.getProduct(productId);
    if (priceObservation.productId !== product.identity.atlasProductId) {
        throw new Error(`Price observation product mismatch: expected ${product.identity.atlasProductId}, received ${priceObservation.productId}`);
    }
    const [brand, retailer] = await Promise.all([
        Atlas.getBrand("BRAND-CORSAIR"),
        Atlas.getRetailer(priceObservation.retailerId)
    ]);
    const observedDate = new Date(priceObservation.observedAt);
    if (Number.isNaN(observedDate.getTime())) throw new Error(`Invalid observedAt timestamp: ${priceObservation.observedAt}`);
    const verifiedTime = observedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
    const ram = product.extension.data;
    return {
        id: product.identity.atlasProductId, section: "overall", title: "TODAY'S CHEAPEST RAM",
        brand: brand.displayName, model: `${product.identity.series ?? product.identity.modelName} ${ram.classification.memoryType}`,
        capacity: `${ram.capacity.capacityGb}GB`, memoryType: ram.classification.memoryType,
        speed: `${ram.performance.dataRateMtps} MT/s`, bestFor: "Gaming and productivity PCs",
        price: priceObservation.price.toFixed(2), currency: priceObservation.currency, retailer: retailer.name,
        affiliateUrl: priceObservation.sourceUrl, verified: "Today", lastVerifiedTime: `${verifiedTime} UTC`,
        hardwareRadarVerified: priceObservation.verification.status === "verified", pricesChecked: 1, retailersMonitored: 1,
        insight: "✓ First verified Atlas price observation"
    };
}
