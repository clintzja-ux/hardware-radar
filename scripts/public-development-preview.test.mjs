import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { representativeCurrentOffer } from "../public/js/modules/marketData.js";
import { representativeCatalogPrice, sortRamCatalogProductsByCurrentPrice } from "../public/js/modules/ramCatalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = await mkdtemp(path.join(os.tmpdir(), "hardware-radar-development-preview-"));
const asOf = "2026-09-30T17:00:00.000Z";

try {
    const build = spawnSync(process.execPath, ["scripts/build-public-development-preview.mjs"], {
        cwd: root,
        encoding: "utf8",
        env: {
            ...process.env,
            HARDWARE_RADAR_DEVELOPMENT_PREVIEW_OUTPUT: output,
            HARDWARE_RADAR_DEVELOPMENT_PREVIEW_AT: asOf
        }
    });
    assert.equal(build.status, 0, build.stderr || build.stdout);

    const readJson = async (relativePath) => JSON.parse(await readFile(path.join(output, relativePath), "utf8"));
    const catalog = await readJson("data/ram-catalog.json");
    const currentRetail = await readJson("data/ram-current-retail.json");
    const marker = await readJson("development-preview.json");
    const terminal = await readJson("data/ram-terminal.json");
    const marketSnapshot = await readJson("data/ram-market-snapshot-2026-09-30.json");
    const dual = currentRetail.products.find((product) => product.lowerCurrentItemPrice && product.eligibleOfferCount >= 2);
    const single = currentRetail.products.find((product) => product.lowerCurrentItemPrice === null && product.eligibleOfferCount === 1);
    const target = catalog.products.find((product) => product.atlasProductId === dual?.atlasProductId);

    assert.ok(target, "A governed dual-retailer product must resolve to its public catalog route.");
    assert.ok(single, "A governed single-retailer current product must remain useful.");
    assert.equal(catalog.productCount, 103);
    assert.equal(marker.mode, "DEVELOPMENT_PREVIEW");
    assert.equal(marker.productionPublication, false);
    assert.equal(marker.releaseAuthority, false);
    assert.equal(marker.deploymentAuthority, false);
    assert.equal(marker.asOf, asOf);
    assert.equal(marker.currentPriceProductCount, currentRetail.products.length);
    assert.ok(marker.currentPriceProductCount > 0);
    assert.equal(terminal.lenses.ALL_RAM.coverage.productsTracked, 103);
    assert.equal(terminal.lenses.ALL_RAM.coverage.productsCurrentlyPriced, marker.currentPriceProductCount);
    assert.equal(terminal.lenses.ALL_RAM.historyCoverage.totalAdmittedObservationCount, 329);
    assert.equal(terminal.lenses.ALL_RAM.historyCoverage.comparableObservationCount, 329);
    assert.equal(terminal.lenses.DDR4.currentMarket.state, "INSUFFICIENT_MARKET_COHORT");
    assert.equal(terminal.lenses.LAPTOP_SODIMM.currentMarket.medianCurrentItemPrice, 442.42);
    assert.equal(marketSnapshot.snapshotType, "POINT_IN_TIME_MARKET_SNAPSHOT");
    assert.equal(marketSnapshot.coverage.productsTracked, 103);
    assert.equal(marketSnapshot.coverage.productsCurrentlyPriced, 40);
    assert.equal(marketSnapshot.coverage.qualifiedCurrentOfferCount, 64);
    assert.equal(marketSnapshot.coverage.productsWithComparableHistory, 54);
    assert.equal(marketSnapshot.coverage.comparableHistoricalObservations, 329);
    assert.equal(marketSnapshot.coverage.distinctHistoricalTimestampGroups, 124);
    assert.deepEqual(marketSnapshot.historyMaturity, { h0: 49, h1: 28, h2: 7, h3Plus: 19, productsWithTwoPlusTimestamps: 26, productsWithThreePlusTimestamps: 19, productsSpanningSevenPlusDays: 16, productsSpanningFourteenPlusDays: 8, productsSpanningThirtyPlusDays: 1 });
    assert.equal(marketSnapshot.currentMarket.lowestCurrentItemPrice, 67.71);
    assert.equal(marketSnapshot.currentMarket.medianCurrentItemPrice, 537.5);
    assert.equal(marketSnapshot.lenses.DDR5.currentMarket.medianCurrentItemPrice, 569.99);
    assert.equal(marketSnapshot.lenses.DDR4.currentMarket.medianCurrentItemPrice, null);
    assert.equal(marketSnapshot.lenses.LAPTOP_SODIMM.currentMarket.medianCurrentItemPrice, 442.42);
    assert.deepEqual(marketSnapshot.marketPulse, { productsDownFromPrevious: 1, productsUpFromPrevious: 5, productsFlatFromPrevious: 6, productsAtObservedLow: 4, productsWithInsufficientComparableHistory: 91 });
    assert.equal(marketSnapshot.releaseAuthority, false);
    assert.equal(marketSnapshot.deploymentAuthority, false);
    assert.doesNotMatch(JSON.stringify(marketSnapshot), /providerTask|retainedEvidence|authorizationId|rawPayload|researchUrl|affiliate|rightsProfile|sellerName/i);
    const terminalHtml = await readFile(path.join(output, "ram", "terminal", "index.html"), "utf8");
    assert.match(terminalHtml, /RAM Market Terminal/);
    assert.match(terminalHtml, />103<\/strong>/);
    const snapshotHtml = await readFile(path.join(output, "ram", "market-snapshots", "2026-09-30", "index.html"), "utf8");
    assert.match(snapshotHtml, /<h1>RAM Market Snapshot — September 30, 2026<\/h1>/);
    assert.match(snapshotHtml, /This is not a September market-performance report/);
    assert.match(snapshotHtml, /noindex, nofollow/);
    assert.doesNotMatch(snapshotHtml, /application\/ld\+json|datePublished/);

    assert.equal(representativeCurrentOffer(dual), dual.lowerCurrentItemPrice);
    assert.equal(representativeCurrentOffer(single), single.offers[0]);
    assert.equal(representativeCatalogPrice(single), single.offers[0]);
    const ordered = sortRamCatalogProductsByCurrentPrice(catalog.products, new Map(currentRetail.products.map(product => [product.atlasProductId, product])));
    const firstUnpriced = ordered.findIndex(product => !currentRetail.products.some(current => current.atlasProductId === product.atlasProductId));
    assert.equal(ordered.slice(0, firstUnpriced).length, currentRetail.products.length);
    assert.ok(ordered.slice(firstUnpriced).every(product => !currentRetail.products.some(current => current.atlasProductId === product.atlasProductId)));

    const targetHtml = await readFile(path.join(output, target.publicPath.slice(1), "index.html"), "utf8");
    assert.match(targetHtml, /<h2 id="current-retail-heading">Current market<\/h2>/);
    assert.match(targetHtml, /Hardware Radar-observed price history/);
    assert.match(targetHtml, new RegExp(`Lower current item price:[\\s\\S]*?\\$${dual.lowerCurrentItemPrice.itemPriceUsd.toFixed(2).replace(".", "\\.")} USD`));
    for (const offer of dual.offers) {
        assert.match(targetHtml, new RegExp(offer.retailerName));
        assert.match(targetHtml, new RegExp(`\\$${offer.itemPriceUsd.toFixed(2).replace(".", "\\.")}`));
    }
    assert.match(targetHtml, /Prices shown exclude applicable shipping, taxes, and fees/);
    assert.doesNotMatch(targetHtml, /final checkout total|delivered total|condition unknown|seller unknown/i);

    const unrelated = catalog.products.find((product) => product.atlasProductId !== target.atlasProductId);
    const unrelatedHtml = await readFile(path.join(output, unrelated.publicPath.slice(1), "index.html"), "utf8");
    assert.doesNotMatch(unrelatedHtml, new RegExp(dual.offers.map(offer => `\\$${offer.itemPriceUsd.toFixed(2).replace(".", "\\.")}`).join("|")));

    const home = await readFile(path.join(output, "index.html"), "utf8");
    const homeScript = await readFile(path.join(output, "js/main.js"), "utf8");
    assert.match(home, /ddr5Section/);
    assert.match(homeScript, /currentProductsForScope/);
    assert.match(homeScript, /loadRamCatalog/);
    for (const page of ["ddr5.html", "ddr4.html", "sodimm.html"]) {
        const html = await readFile(path.join(output, page), "utf8");
        assert.match(html, /id="ramCatalogResults"/);
        assert.match(html, /Prices shown exclude applicable shipping, taxes, and fees/);
    }
} finally {
    await rm(output, { recursive: true, force: true });
}

console.log("Explicit governed public development preview contract passed.");
