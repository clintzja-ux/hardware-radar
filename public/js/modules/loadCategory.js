import { loadMarketSnapshot, scopeToDisplayProduct } from "./marketData.js";

const SCOPE_BY_PATH = Object.freeze({
    "data/ram/ddr5.json": ["ddr5", "Cheapest DDR5"],
    "data/ram/ddr4.json": ["ddr4", "Cheapest DDR4"],
    "data/ram/sodimm.json": ["sodimm", "Cheapest SODIMM"]
});

export async function loadCategory(path) {
    const mapping = SCOPE_BY_PATH[path];
    if (mapping) {
        const [scopeName, title] = mapping;
        const snapshot = await loadMarketSnapshot();
        const product = scopeToDisplayProduct(snapshot.scopes[scopeName], scopeName, title);
        return product ? [{ ...product, rank: 1 }] : [];
    }
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.json();
}
