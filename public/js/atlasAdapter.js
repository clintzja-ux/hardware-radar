// Legacy compatibility module retained during M007 migration.
// Hardware Radar no longer reads raw Atlas/Mercury records in the browser.
export async function loadAtlasOverallProduct() {
    throw new Error("Direct Atlas/Mercury browser integration has been retired. Use data/market-snapshot.json.");
}
