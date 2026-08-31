import { loadMarketSnapshot, scopeToDisplayProduct } from "./marketData.js";

const CATEGORY_SCOPES = Object.freeze({
    ddr5: "Qualifying DDR5 listed price",
    ddr4: "Qualifying DDR4 listed price",
    sodimm: "Qualifying SODIMM listed price"
});

export async function loadCategory(scopeName) {
    const title = CATEGORY_SCOPES[scopeName];
    if (!title) throw new Error(`Unsupported governed market scope: ${scopeName}`);
    const snapshot = await loadMarketSnapshot();
    const product = scopeToDisplayProduct(snapshot.scopes[scopeName], scopeName, title);
    return product ? [{ ...product, rank: 1 }] : [];
}
