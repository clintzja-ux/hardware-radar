const PRODUCT_PATHS = {
    "HR-RAM-DDR5-000001":
        "data/atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000.json"
};

export async function loadAtlasProduct(productId) {
    const path = PRODUCT_PATHS[productId];

    if (!path) {
        throw new Error(`Unknown Atlas product ID: ${productId}`);
    }

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `Failed to load Atlas product ${productId}: ${response.status} ${response.statusText}`
        );
    }

    const product = await response.json();

    if (product.id !== productId) {
        throw new Error(
            `Atlas product ID mismatch: expected ${productId}, received ${product.id}`
        );
    }

    return product;
}