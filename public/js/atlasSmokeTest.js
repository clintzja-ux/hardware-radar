import { loadAtlasProduct } from "./atlasAdapter.js";

async function runAtlasSmokeTest() {
    try {
        const product = await loadAtlasProduct("HR-RAM-DDR5-000001");

        console.log("Atlas smoke test passed.");
        console.log(product.name);
        console.log(product);
    } catch (error) {
        console.error("Atlas smoke test failed:", error);
    }
}

runAtlasSmokeTest();