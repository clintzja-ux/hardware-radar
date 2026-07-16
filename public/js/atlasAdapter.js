const ATLAS_FILES = {
    products: {
        "HR-RAM-DDR5-000001":
            "../data/atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000.json"
    },

    brands: {
        "BRAND-0001":
            "../data/atlas/brands/BRAND-0001-corsair.json"
    },

    retailers: {
        "RETAILER-0001":
            "../data/atlas/retailers/RETAILER-0001-amazon.json"
    },

    prices: {
        "PRICE-20260715-000001":
            "../data/mercury/observations/PRICE-20260715-000001.json"
    }
};

/**
 * Resolve a data path relative to this JavaScript module.
 * This remains reliable even when the adapter is called from another page.
 */
function resolveAtlasUrl(relativePath) {
    return new URL(relativePath, import.meta.url).href;
}

async function loadJson(relativePath, recordDescription) {
    const response = await fetch(resolveAtlasUrl(relativePath));

    if (!response.ok) {
        throw new Error(
            `Failed to load ${recordDescription}: ` +
            `${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

export async function loadAtlasProduct(productId) {
    const path = ATLAS_FILES.products[productId];

    if (!path) {
        throw new Error(`Unknown Atlas product ID: ${productId}`);
    }

    const product = await loadJson(path, `Atlas product ${productId}`);

    if (product.id !== productId) {
        throw new Error(
            `Atlas product ID mismatch: expected ${productId}, ` +
            `received ${product.id}`
        );
    }

    return product;
}

/**
 * Loads the records required for the first Atlas-powered homepage hero
 * and converts them into the structure renderOverall() currently expects.
 */
export async function loadAtlasOverallProduct() {
    const productId = "HR-RAM-DDR5-000001";
    const priceId = "PRICE-20260715-000001";

    const product = await loadAtlasProduct(productId);

    const pricePath = ATLAS_FILES.prices[priceId];

    if (!pricePath) {
        throw new Error(`Unknown Mercury price observation ID: ${priceId}`);
    }

    const priceObservation = await loadJson(
        pricePath,
        `Mercury price observation ${priceId}`
    );

    if (priceObservation.productId !== product.id) {
        throw new Error(
            `Price observation product mismatch: expected ${product.id}, ` +
            `received ${priceObservation.productId}`
        );
    }

    const brandPath = ATLAS_FILES.brands[product.brandId];
    const retailerPath =
        ATLAS_FILES.retailers[priceObservation.retailerId];

    if (!brandPath) {
        throw new Error(`Unknown Atlas brand ID: ${product.brandId}`);
    }

    if (!retailerPath) {
        throw new Error(
            `Unknown Atlas retailer ID: ${priceObservation.retailerId}`
        );
    }

    const [brand, retailer] = await Promise.all([
        loadJson(brandPath, `Atlas brand ${product.brandId}`),
        loadJson(
            retailerPath,
            `Atlas retailer ${priceObservation.retailerId}`
        )
    ]);

    const observedDate = new Date(priceObservation.observedAt);

    if (Number.isNaN(observedDate.getTime())) {
        throw new Error(
            `Invalid observedAt timestamp: ${priceObservation.observedAt}`
        );
    }

    const verifiedTime = observedDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC"
    });

    return {
        id: product.id,
        section: "overall",
        title: "TODAY'S CHEAPEST RAM",

        brand: brand.name,
        model: `${product.series} ${product.specifications.memoryType}`,
        capacity: `${product.specifications.capacityGb}GB`,

        memoryType: product.specifications.memoryType,
        speed: `${product.specifications.speedMtS} MT/s`,

        bestFor: Array.isArray(product.bestFor)
            ? product.bestFor.join(", ")
            : product.bestFor,

        price: priceObservation.price.toFixed(2),
        currency: priceObservation.currency,
        retailer: retailer.name,
        affiliateUrl: priceObservation.sourceUrl,

        verified: "Today",
        lastVerifiedTime: `${verifiedTime} UTC`,
        hardwareRadarVerified:
            priceObservation.verification.status === "verified",

        pricesChecked: 1,
        retailersMonitored: 1,

        /*
         * We currently have only one historical observation, so we must
         * not claim this is the lowest price in 90 days.
         */
        insight: "✓ First verified Atlas price observation"
    };
}