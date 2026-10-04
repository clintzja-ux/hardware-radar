import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRamCatalogProjection, createRamPublicProductIdentity } from "../packages/atlas/RamCatalogProjection.js";
import { formatProductName } from "../public/js/modules/ramTerminal.js";
import { calculatePriceDisplayDomain, createRamProductSitemapRoutes, renderRamProductPage, selectChronologyTickIndexes } from "./ram-product-publishing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const manifest = JSON.parse(await read("packages/atlas/atlas-manifest.json"));
const products = await Promise.all(manifest.products.map(async (entry) => JSON.parse(await read(path.join("packages/atlas", entry.path)))));
const retailers = await Promise.all(manifest.retailers.map(async (entry) => JSON.parse(await read(path.join("packages/atlas", entry.path)))));
const releaseManifestPath = process.env.HARDWARE_RADAR_STATIC_RELEASE_MANIFEST
  ? path.resolve(process.env.HARDWARE_RADAR_STATIC_RELEASE_MANIFEST)
  : path.join(root, "config/publication-release.json");
const releaseManifest = JSON.parse(await readFile(releaseManifestPath, "utf8"));
const releaseArtifact = JSON.parse(
  await readFile(path.resolve(path.dirname(releaseManifestPath), releaseManifest.artifact.relativePath), "utf8"),
);
const destinations = JSON.parse(releaseArtifact.fileTexts.destinations);
const chronology = JSON.parse(releaseArtifact.fileTexts.chronology);
const chronologicalSeriesByProduct = new Map(chronology.products.map(item => [item.atlasProductId, item]));
const currentRetail = JSON.parse(await read("public/data/ram-current-retail.json"));
const currentRetailByProduct = new Map(currentRetail.products.map(item => [item.atlasProductId, item]));
const terminal = JSON.parse(await read("public/data/ram-terminal.json"));
const terminalByProduct = new Map(terminal.lenses.ALL_RAM.productRows.map(item => [item.atlasProductId, item]));
const catalog = createRamCatalogProjection(products);
const replay = createRamCatalogProjection([...products].reverse());

assert.equal(catalog.productCount, 103);
assert.equal(catalog.products.length, 103);
assert.equal(new Set(catalog.products.map((product) => product.atlasProductId)).size, 103);
assert.equal(new Set(catalog.products.map((product) => product.publicSlug)).size, 103);
assert.equal(new Set(catalog.products.map((product) => product.publicPath)).size, 103);
assert.deepEqual(replay, catalog, "Public identity must be deterministic across input order.");
assert.ok(catalog.products.every((product) => product.publicPath === `/ram/${product.publicSlug}/`));
assert.ok(catalog.products.every((product) => product.capacityGb === product.moduleCount * product.capacityPerModuleGb));

for (const product of products) {
    const identity = createRamPublicProductIdentity(product);
    assert.equal(identity.atlasProductId, product.identity.atlasProductId, "Atlas ID remains the authoritative identity.");
    assert.equal(identity.publicSlug, product.identity.slug, "Public routing reuses the canonical Atlas slug.");
}

const duplicateBrandProducts = catalog.products.filter((product) => formatProductName(product.brand, product.displayName) !== product.displayName);
assert.equal(duplicateBrandProducts.length, 14);
const observedDuplicate = duplicateBrandProducts.find((product) => product.atlasProductId === "ram_crucial_ct16g4dfra32a");
assert.ok(observedDuplicate);
const observedDuplicateHtml = renderRamProductPage(observedDuplicate);
assert.match(observedDuplicateHtml, /<h1>Crucial DDR4 16GB \(1×16GB\) 3200 MT\/s<\/h1>/);
assert.match(observedDuplicateHtml, /aria-current="page">Crucial DDR4 16GB \(1×16GB\) 3200 MT\/s<\/span>/);
assert.match(observedDuplicateHtml, /<meta name="description" content="Crucial DDR4 16GB \(1×16GB\) 3200 MT\/s specifications:/);
assert.doesNotMatch(observedDuplicateHtml, /<h1>Crucial Crucial|aria-current="page">Crucial Crucial|content="Crucial Crucial/);
assert.match(observedDuplicateHtml, /"@type":"Product","name":"Crucial Crucial DDR4 16GB \(1×16GB\) 3200 MT\/s"/, "Structured canonical identity must remain unchanged.");
assert.equal(observedDuplicate.publicPath, "/ram/crucial-crucial-ct16g4dfra32a/");
assert.equal(observedDuplicate.atlasProductId, "ram_crucial_ct16g4dfra32a");

const corsairFixture = { ...catalog.products.find((product) => product.brand === "Corsair"), displayName: "Corsair Corsair Vengeance DDR5" };
const corsairFixtureHtml = renderRamProductPage(corsairFixture);
assert.match(corsairFixtureHtml, /<h1>Corsair Vengeance DDR5<\/h1>/);
assert.doesNotMatch(corsairFixtureHtml, /<h1>Corsair Corsair/);
const legitimateRepeatFixture = { ...corsairFixture, displayName: "Corsair Vengeance Vengeance DDR5" };
assert.match(renderRamProductPage(legitimateRepeatFixture), /<h1>Corsair Vengeance Vengeance DDR5<\/h1>/);

const collision = structuredClone(products[1]);
collision.identity.slug = products[0].identity.slug;
assert.throws(() => createRamCatalogProjection([products[0], collision]), /RAM_CATALOG_DUPLICATE_PUBLIC_SLUG/);
const unsafe = structuredClone(products[0]);
unsafe.identity.slug = "unsafe/../route";
assert.throws(() => createRamPublicProductIdentity(unsafe), /RAM_PUBLIC_IDENTITY_ATLAS_PRODUCT_INVALID/);

const titles = new Set();
const canonicals = new Set();
for (const product of catalog.products) {
    const output = path.join(root, "public", product.publicPath.slice(1), "index.html");
    await stat(output);
    const html = await readFile(output, "utf8");
    assert.equal(html, renderRamProductPage(product, destinations.filter(destination => destination.atlasProductId === product.atlasProductId), currentRetailByProduct.get(product.atlasProductId) ?? null, currentRetail.disclosure, terminalByProduct.get(product.atlasProductId), chronologicalSeriesByProduct.get(product.atlasProductId) ?? null), `${product.publicPath} must match its canonical generator.`);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.match(html, new RegExp(`data-atlas-product-id="${product.atlasProductId}"`));
    assert.ok(html.includes(product.manufacturerPartNumber));
    assert.match(html, /href="\/ram\/">Back to the RAM catalog<\/a>/);
    assert.match(html, /href="\/ram\/terminal\/">View RAM Market Terminal<\/a>/);
    assert.match(html, /<h2 id="observed-history-heading">Hardware Radar-observed price history<\/h2>/);
    assert.doesNotMatch(html, /"@type":"(?:Offer|AggregateOffer|Review|AggregateRating)"/);
    assert.doesNotMatch(html, /"(?:offers|price|priceCurrency|availability|seller|review|aggregateRating|merchantReturnPolicy|shippingDetails|retailer|affiliateUrl|sourceUrl)"\s*:/i);
    assert.doesNotMatch(html, />[^<]*(?:\bCheapest\b|\bPick\b|we tested|our testing|recommended|recommendation)[^<]*</i);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    assert.ok(title && !titles.has(title), `Unique title required for ${product.publicPath}.`);
    assert.ok(canonical && !canonicals.has(canonical), `Unique canonical required for ${product.publicPath}.`);
    titles.add(title);
    canonicals.add(canonical);
    assert.match(html, /"@type":"Product"/);
    assert.doesNotMatch(html, /"@type":"(?:Offer|AggregateOffer|Review|AggregateRating)"/);
}

const optionalMissing = catalog.products.find((product) => !product.casLatency && !product.primaryTimings && !product.ratedVoltage);
assert.ok(optionalMissing);
const optionalHtml = renderRamProductPage(optionalMissing);
assert.doesNotMatch(optionalHtml, /CAS latency|Primary timings|Rated voltage/);

const malicious = { ...catalog.products[0], displayName: `<script>alert("x")</script>`, modelName: `<img src=x onerror=alert(1)>` };
const escaped = renderRamProductPage(malicious);
assert.doesNotMatch(escaped, /<script>alert|<img src=x/);
assert.match(escaped, /&lt;script&gt;alert/);
assert.match(escaped, /\\u003cscript\\u003ealert/);

const catalogScript = await read("public/js/modules/ramCatalog.js");
assert.match(catalogScript, /href="\$\{escapeHtml\(item\.publicPath\)\}"/);
assert.match(catalogScript, /View specifications/);
const generatedCatalog = JSON.parse(await read("public/data/ram-catalog.json"));
assert.deepEqual(generatedCatalog, catalog);

const sitemap = await read("public/sitemap.xml");
const productRoutes = createRamProductSitemapRoutes(products);
assert.equal(productRoutes.length, 103);
for (const route of productRoutes) assert.equal((sitemap.match(new RegExp(`<loc>https://cheapestram\\.com${route.path}</loc>`, "g")) ?? []).length, 1);
const ramChildRoutes = [...sitemap.matchAll(/<loc>https:\/\/cheapestram\.com(\/ram\/[^<]+\/)<\/loc>/g)].map((match) => match[1]);
assert.equal(ramChildRoutes.filter((route) => !["/ram/compare/", "/ram/terminal/"].includes(route)).length, 103);

const styles = await read("public/css/styles.css");
assert.match(styles, /\.ram-product-heading h1[^}]*overflow-wrap:anywhere/);
assert.match(styles, /@media\(max-width:650px\)[^}]*\.ram-product-main/s);
assert.match(styles, /\.ram-product-specs\{grid-template-columns:1fr\}/);
assert.match(styles, /\.ram-product-current-retail/);
assert.match(styles, /@media\(max-width:650px\)[^}]*\.ram-product-current-retail/s);
assert.match(styles, /\.ram-product-history__metrics/);
assert.match(styles, /\.ram-price-series__chart/);
assert.match(styles, /\.ram-price-series__point:focus/);
assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(styles, /@media\(max-width:500px\)\{\.ram-product-history,\.ram-product-methodology\{[^}]+\}\.ram-product-history__metrics\{grid-template-columns:1fr\}\}/);
assert.ok(Array.isArray(currentRetail.products), "Generated current-retail state must expose an explicit product collection.");
const pricedPage = catalog.products.find(product => destinations.some(destination => destination.atlasProductId === product.atlasProductId));
assert.ok(pricedPage);
const pricedDestination = destinations.find(destination => destination.atlasProductId === pricedPage.atlasProductId);
const fixtureRetail = {
    offers: [{ retailerName: pricedDestination.retailerDisplayName, itemPriceUsd: 100, observedAt: "2026-09-18T11:00:00.000Z", destinationUrl: pricedDestination.destinationUrl }],
    lowerCurrentItemPrice: { retailerName: pricedDestination.retailerDisplayName, itemPriceUsd: 100 }
};
const pricedHtml = renderRamProductPage(pricedPage, [pricedDestination], fixtureRetail, currentRetail.disclosure);
assert.match(pricedHtml, /<h2 id="current-retail-heading">Current market<\/h2>/);
assert.match(pricedHtml, /Lower current item price:/);
assert.match(pricedHtml, /Prices shown exclude applicable shipping, taxes, and fees\./);
assert.doesNotMatch(pricedHtml, /"@type":"Offer"/);

const baseSummary = terminalByProduct.get(pricedPage.atlasProductId);
const summary = (history) => ({ ...baseSummary, atlasProductId: pricedPage.atlasProductId, publicPath: pricedPage.publicPath, history });
const noHistoryHtml = renderRamProductPage(pricedPage, [], fixtureRetail, currentRetail.disclosure, summary({ status: "NO_HISTORY", admittedObservationCount: 0, comparableObservationCount: 0, distinctComparableTimestampCount: 0, movement: "INSUFFICIENT_HISTORY" }));
assert.match(noHistoryHtml, /Hardware Radar does not yet have comparable price history for this product\./);
assert.match(noHistoryHtml, /<h2 id="current-retail-heading">Current market<\/h2>/, "Current must remain useful without History.");
assert.doesNotMatch(noHistoryHtml, /<svg|<canvas|price-history-chart/);

const nonComparableHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary({ status: "NO_COMPARABLE_HISTORY", admittedObservationCount: 3, comparableObservationCount: 0, distinctComparableTimestampCount: 0, movement: "INSUFFICIENT_HISTORY" }));
assert.match(nonComparableHtml, /none currently qualify as a public-comparable price series/);
assert.doesNotMatch(nonComparableHtml, /<h2 id="current-retail-heading">Current market<\/h2>/);

const oneHistory = { status: "INSUFFICIENT_HISTORY", admittedObservationCount: 2, comparableObservationCount: 2, distinctComparableTimestampCount: 1, latestComparableObservation: { observedAt: "2026-09-29T17:35:00-05:00", itemPriceUsd: 128 }, historySpanDays: 0, movement: "INSUFFICIENT_HISTORY" };
const oneHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(oneHistory));
assert.match(oneHtml, /Latest comparable/);
assert.match(oneHtml, /Sep 29, 2026/);
assert.match(oneHtml, /2 distinct time|1 distinct time/);
assert.match(oneHtml, /Insufficient history for movement\./);
assert.doesNotMatch(oneHtml, /Previous comparable|Comparable observed range|Observed history span/);

const twoHistory = { status: "COMPARABLE_HISTORY", admittedObservationCount: 2, comparableObservationCount: 2, distinctComparableTimestampCount: 2, latestComparableObservation: { observedAt: "2026-09-29T17:35:00-05:00", itemPriceUsd: 90 }, previousComparableObservation: { observedAt: "2026-09-20T17:35:00-05:00", itemPriceUsd: 100 }, historySpanDays: 9, observedMinimumItemPrice: 90, observedMaximumItemPrice: 100, movement: "DOWN", changeFromPreviousAmount: -10, atObservedLow: true };
const twoHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(twoHistory));
assert.match(twoHtml, /Previous comparable/);
assert.match(twoHtml, /Historical movement/);
assert.match(twoHtml, /↓<\/span> \$10\.00/);
assert.match(twoHtml, /\$90\.00–\$100\.00/);
assert.match(twoHtml, /Latest at observed low/);
assert.match(twoHtml, /9 days/);

const threeHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary({ ...twoHistory, admittedObservationCount: 4, comparableObservationCount: 4, distinctComparableTimestampCount: 3, movement: "UP", changeFromPreviousAmount: 10, atObservedLow: false }));
assert.match(threeHtml, /3 distinct times/);
assert.match(threeHtml, /↑<\/span> \$10\.00/);
assert.doesNotMatch(threeHtml, /<svg|<canvas|sparkline/);

const series = timestampGroups => ({ schemaVersion: "1.0", methodologyVersion: "MERCURY-PUBLIC-CHRONOLOGICAL-PRICE-SERIES-P1-1.0", atlasProductId: pricedPage.atlasProductId, publicPath: pricedPage.publicPath, comparisonSemantics: "ITEM_PRICE", timestampGroups });
const domain = calculatePriceDisplayDomain([569.99, 587.09]);
assert.equal(domain.observedMinimum, 569.99);
assert.equal(domain.observedMaximum, 587.09);
assert.ok(domain.displayMinimum < domain.observedMinimum && domain.displayMaximum > domain.observedMaximum, "Observed bounds need deterministic presentation breathing room.");
const zeroDomain = calculatePriceDisplayDomain([249.99, 249.99, 249.99]);
assert.equal(zeroDomain.observedMinimum, zeroDomain.observedMaximum);
assert.ok(zeroDomain.displayRange > 0 && zeroDomain.displayMinimum < 249.99 && zeroDomain.displayMaximum > 249.99, "A flat series needs a nonzero presentation domain without changing observed prices.");
const smallDomain = calculatePriceDisplayDomain([100, 100.01]);
assert.equal(smallDomain.displayMinimum, 99.5);
assert.equal(smallDomain.displayMaximum, 100.51);
const largeDomain = calculatePriceDisplayDomain([100, 500]);
assert.equal(largeDomain.displayMinimum, 40);
assert.equal(largeDomain.displayMaximum, 560);
assert.deepEqual(selectChronologyTickIndexes(1), [0]);
assert.deepEqual(selectChronologyTickIndexes(2), [0, 1]);
assert.deepEqual(selectChronologyTickIndexes(3), [0, 1, 2]);
assert.deepEqual(selectChronologyTickIndexes(4), [0, 1, 2, 3]);
assert.deepEqual(selectChronologyTickIndexes(20), [0, 5, 10, 14, 19]);
assert.equal(new Set(selectChronologyTickIndexes(20)).size, 5);
const oneSeriesHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(oneHistory), series([{ observedAt: "2026-09-29T22:35:00.000Z", observations: [{ itemPriceUsd: 128, currency: "USD", retailerId: "RETAILER-0004", retailerName: "Newegg", observationCount: 1 }] }]));
assert.match(oneSeriesHtml, /<h2 id="price-series-heading">Observed price history<\/h2>/);
assert.match(oneSeriesHtml, /<table>/);
assert.doesNotMatch(oneSeriesHtml, /ram-price-series__chart/);
const multiSeriesHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(twoHistory), series([
    { observedAt: "2026-09-20T22:35:00.000Z", observations: [{ itemPriceUsd: 100, currency: "USD", retailerId: "RETAILER-0001", retailerName: "Amazon", observationCount: 1 }, { itemPriceUsd: 95, currency: "USD", retailerId: "RETAILER-0004", retailerName: "Newegg", observationCount: 1 }] },
    { observedAt: "2026-09-29T22:35:00.000Z", observations: [{ itemPriceUsd: 90, currency: "USD", retailerId: null, retailerName: null, observationCount: 2 }] }
]));
assert.match(multiSeriesHtml, /<svg class="ram-price-series__chart"/);
assert.match(multiSeriesHtml, /aria-describedby="price-series-summary-/);
assert.equal((multiSeriesHtml.match(/class="ram-price-series__point/g) ?? []).length, 3);
assert.match(multiSeriesHtml, /Amazon, \$100\.00 USD/);
assert.match(multiSeriesHtml, /Newegg, \$95\.00 USD/);
assert.match(multiSeriesHtml, /Retailer not canonically attributed/);
assert.match(multiSeriesHtml, />2<\/td>/);
assert.doesNotMatch(multiSeriesHtml, /<polyline|<path|prediction|forecast|recommendation/i);
assert.match(multiSeriesHtml, /tabindex="0" role="img"/);
assert.match(multiSeriesHtml, /Hardware Radar does not observe prices continuously/);
assert.match(multiSeriesHtml, /<circle[^>]+aria-label="Amazon[^"]+" cx="68"/);
assert.match(multiSeriesHtml, /<rect[^>]+aria-label="Newegg[^"]+" x="63"/, "Same-time Amazon circle and Newegg square must share center X=68 without chronological jitter.");
assert.doesNotMatch(multiSeriesHtml, /y="30"|y="222"/, "Display-domain and plot padding must keep point centers off plot boundaries.");
const equalSeriesHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(twoHistory), series([
    { observedAt: "2026-09-20T22:35:00.000Z", observations: [{ itemPriceUsd: 249.99, currency: "USD", retailerId: "RETAILER-0001", retailerName: "Amazon", observationCount: 1 }] },
    { observedAt: "2026-09-29T22:35:00.000Z", observations: [{ itemPriceUsd: 249.99, currency: "USD", retailerId: "RETAILER-0004", retailerName: "Newegg", observationCount: 1 }] }
]));
assert.equal((equalSeriesHtml.match(/\$249\.99 USD/g) ?? []).length >= 2, true);
assert.doesNotMatch(equalSeriesHtml, /NaN|Infinity|<polyline|<path/);
const fourGroups = Array.from({ length: 4 }, (_, index) => ({ observedAt: `2026-09-${String(20 + index).padStart(2, "0")}T12:00:00.000Z`, observations: [{ itemPriceUsd: 100 + index, currency: "USD", retailerId: "RETAILER-0001", retailerName: "Amazon", observationCount: 1 }] }));
const fourSeriesHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(twoHistory), series(fourGroups));
assert.equal((fourSeriesHtml.match(/class="ram-price-series__x-label"/g) ?? []).length, 4);
assert.match(fourSeriesHtml, /Sep 20, 2026/);
assert.match(fourSeriesHtml, /Sep 23, 2026/);
const denseGroups = Array.from({ length: 20 }, (_, index) => ({ observedAt: `2026-09-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`, observations: [{ itemPriceUsd: 100 + index, currency: "USD", retailerId: "RETAILER-0001", retailerName: "Amazon", observationCount: 1 }] }));
const denseSeriesHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(twoHistory), series(denseGroups));
assert.equal((denseSeriesHtml.match(/class="ram-price-series__x-label"/g) ?? []).length, 5, "Dense series must use a bounded representative tick set.");
assert.match(denseSeriesHtml, /Sep 1, 2026/);
assert.match(denseSeriesHtml, /Sep 20, 2026/);
assert.equal(renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary(twoHistory), series(fourGroups)), fourSeriesHtml, "Chart coordinates and ticks must rebuild deterministically.");
assert.throws(() => renderRamProductPage(pricedPage, [], null, "", baseSummary, { ...series([]), atlasProductId: "wrong" }), /RAM_PRODUCT_CHRONOLOGICAL_SERIES_BINDING_INVALID/);

const flatHtml = renderRamProductPage(pricedPage, [], null, currentRetail.disclosure, summary({ ...twoHistory, movement: "FLAT", changeFromPreviousAmount: 0, latestComparableObservation: { ...twoHistory.latestComparableObservation, itemPriceUsd: 100 }, observedMinimumItemPrice: 100 }));
assert.match(flatHtml, /—<\/span> Unchanged/);
assert.match(flatHtml, /Current market prices and historical observations are independently qualified evidence\./);
assert.match(flatHtml, /Unknown shipping or fees are never treated as zero\./);
assert.doesNotMatch(flatHtml, /all-time low|best ever|good price|bad price|prediction|recommendation/i);
assert.throws(() => renderRamProductPage(pricedPage, [], null, "", { ...baseSummary, atlasProductId: "wrong" }), /RAM_PRODUCT_TERMINAL_SUMMARY_BINDING_INVALID/);

const [homepage, ddr5, ddr4, sodimm, guides] = await Promise.all([read("public/index.html"), read("public/ddr5.html"), read("public/ddr4.html"), read("public/sodimm.html"), read("public/guides/index.html")]);
assert.match(homepage, /<h1>Compare RAM Prices<\/h1>/);
assert.match(ddr5, /<h1>Compare DDR5 RAM Prices<\/h1>/);
assert.match(ddr4, /<h1>Compare DDR4 RAM Prices<\/h1>/);
assert.match(sodimm, /<h1>Compare Laptop RAM Prices<\/h1>/);
assert.match(guides, /<h1>Hardware Buying Guides<\/h1>/);
assert.equal([...sitemap.matchAll(/<loc>https:\/\/cheapestram\.com\/guides\/[^<]*<\/loc>/g)].length, 6);

console.log("GROWTH-003 canonical public RAM product identity contract passed (103 routes).");
