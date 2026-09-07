import { loadCurrentRetailSnapshot, winnerToDisplayProduct } from "./marketData.js";

const CATEGORY_SCOPES = Object.freeze({
    ddr5: "Cheapest DDR5 Today",
    ddr4: "Cheapest DDR4 Today",
    sodimm: "Cheapest Laptop RAM Today"
});

export async function loadCategory(scopeName) {
    const title = CATEGORY_SCOPES[scopeName];
    if (!title) throw new Error(`Unsupported governed market scope: ${scopeName}`);
    const snapshot = await loadCurrentRetailSnapshot();
    const publicScope = scopeName === "sodimm" ? "laptop" : scopeName;
    const winner = winnerToDisplayProduct(snapshot, publicScope, scopeName, title);
    return winner ? [winner] : [];
}
