import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRamCatalogProjection } from "../packages/atlas/RamCatalogProjection.js";
import { RAM_COMPARISON_AUTHORITY, buildRamComparisonPath, compareRamProducts, parseRamComparisonQuery } from "../public/js/modules/ramComparison.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const manifest = JSON.parse(await read("packages/atlas/atlas-manifest.json"));
const products = await Promise.all(manifest.products.map(async (entry) => JSON.parse(await read(path.join("packages/atlas", entry.path)))));
const catalog = createRamCatalogProjection(products);
const [left, right] = catalog.products;

assert.equal(RAM_COMPARISON_AUTHORITY, "DETERMINISTIC_FACTUAL_SPECIFICATION_COMPARISON");
const query = `?products=${left.publicSlug},${right.publicSlug}`;
const ready = parseRamComparisonQuery(query, catalog.products);
assert.equal(ready.status, "READY");
assert.deepEqual(ready.products.map((product) => product.atlasProductId), [left.atlasProductId, right.atlasProductId]);
assert.equal(buildRamComparisonPath(ready.products), `/ram/compare/${query}`);
assert.deepEqual(parseRamComparisonQuery(query, catalog.products), ready);

const growthProducts = ["kingston-fury-beast-rgb-kf560c30bbea-8", "kingston-fury-beast-rgb-kf560c36bbea-8"];
const growthReady = parseRamComparisonQuery(`?products=${growthProducts.join(",")}`, catalog.products);
assert.equal(growthReady.status, "READY");
assert.deepEqual(growthReady.products.map((product) => product.manufacturerPartNumber), ["KF560C30BBEA-8", "KF560C36BBEA-8"]);

const reversed = parseRamComparisonQuery(`?products=${right.publicSlug},${left.publicSlug}`, catalog.products);
assert.deepEqual(reversed.products.map((product) => product.publicSlug), [right.publicSlug, left.publicSlug], "Product A/B order must preserve transparent URL order.");
assert.equal(parseRamComparisonQuery(`?products=${left.publicSlug}`, catalog.products).status, "INCOMPLETE");
assert.deepEqual(parseRamComparisonQuery(`?products=${left.publicSlug},${left.publicSlug}`, catalog.products).reasons, ["DUPLICATE_PRODUCT"]);
assert.deepEqual(parseRamComparisonQuery("?products=unknown-product,another-unknown", catalog.products).reasons, ["UNKNOWN_PRODUCT"]);
assert.ok(parseRamComparisonQuery(`?products=${left.publicSlug},${right.publicSlug},third-product`, catalog.products).reasons.includes("TOO_MANY_PRODUCTS"));
assert.ok(parseRamComparisonQuery("?products=%3Cscript%3E,known", catalog.products).reasons.includes("MALFORMED_PUBLIC_PRODUCT_IDENTITY"));
assert.throws(() => buildRamComparisonPath([left, left]), /RAM_COMPARISON_PUBLIC_IDENTITIES_INVALID/);

const rows = compareRamProducts(left, right);
assert.ok(rows.length >= 18);
assert.ok(rows.every((row) => ["SAME", "DIFFERENT", "NOT_AVAILABLE"].includes(row.state)));
assert.ok(rows.some((row) => row.state === "SAME"));
assert.ok(rows.some((row) => row.state === "DIFFERENT"));
const withCas = catalog.products.find((product) => product.casLatency === 30 && product.dataRateMtps === 6000);
const withoutCas = catalog.products.find((product) => product.casLatency === undefined);
const missingRows = compareRamProducts(withCas, withoutCas);
assert.equal(missingRows.find((row) => row.label === "CAS latency").state, "NOT_AVAILABLE");
assert.equal(missingRows.find((row) => row.label === "Approximate first-word latency").left, "10 ns");
const explicitNone = { ...withoutCas, publicSlug: "explicit-none-fixture", xmpSupport: "NONE" };
const unknownProfile = { ...withoutCas, publicSlug: "unknown-profile-fixture", xmpSupport: "UNKNOWN" };
assert.equal(compareRamProducts(explicitNone, unknownProfile).find((row) => row.label === "Intel XMP").state, "NOT_AVAILABLE", "Missing must remain distinct from explicit NONE.");
for (const label of ["DDR generation", "Total capacity", "Module count", "Form factor", "Rated speed", "CAS latency", "Intel XMP", "AMD EXPO"]) assert.ok(rows.some((row) => row.label === label));

const html = await read("public/ram/compare/index.html");
assert.equal((html.match(/<h1>/g) ?? []).length, 1);
assert.match(html, /<h1>Compare RAM Specifications<\/h1>/);
assert.match(html, /<label for="ramComparisonA">Product A<\/label>/);
assert.match(html, /<label for="ramComparisonB">Product B<\/label>/);
assert.match(html, /role="status" aria-live="polite"/);
assert.match(html, /<link rel="canonical" href="https:\/\/cheapestram\.com\/ram\/compare\/">/);
assert.match(html, /<meta name="robots" content="noindex,follow">/);
assert.doesNotMatch(html, /"@type":"(?:Product|Offer|AggregateOffer|Review|AggregateRating)"/);

const source = await read("public/js/modules/ramComparison.js");
assert.match(source, /<table>/);
assert.match(source, /scope="col"/);
assert.match(source, /scope="row"/);
assert.match(source, /data-comparison-state=/);
assert.match(source, /history\.replaceState/);
assert.match(source, /Not listed/);
assert.match(source, /\(CL × 2000\) ÷ MT\/s/);
assert.doesNotMatch(source, />[^<]*(?:\bBest\b|\bBetter\b|\bWinner\b|\bCheapest\b|\bPick\b)[^<]*</i);
assert.doesNotMatch(source, /(?:priceCurrency|affiliateUrl|sourceUrl|retailerId|availability)/);

const catalogSource = await read("public/js/modules/ramCatalog.js");
assert.match(catalogSource, /\/ram\/compare\/\?products=\$\{escapeHtml\(item\.publicSlug\)\}/);
assert.match(catalogSource, />Compare</);
const productGenerator = await read("scripts/ram-product-publishing.mjs");
assert.match(productGenerator, /Compare this RAM/);

const sitemap = await read("public/sitemap.xml");
assert.equal((sitemap.match(/<loc>https:\/\/cheapestram\.com\/ram\/compare\/<\/loc>/g) ?? []).length, 1);
assert.equal((sitemap.match(/<loc>https:\/\/cheapestram\.com\/ram\/compare\/\?products=/g) ?? []).length, 0);
const detailRoutes = [...sitemap.matchAll(/<loc>https:\/\/cheapestram\.com(\/ram\/[^<]+\/)<\/loc>/g)].map((match) => match[1]).filter((route) => route !== "/ram/compare/");
assert.equal(detailRoutes.length, 103);

const styles = await read("public/css/styles.css");
assert.match(styles, /\.ram-comparison-table-wrap\{[^}]*overflow-x:auto/);
assert.match(styles, /@media\(max-width:700px\)[^}]*\.ram-comparison-main/s);
assert.match(styles, /\.ram-comparison-products\{grid-template-columns:1fr\}/);

const [homepage, ddr5, guides] = await Promise.all([read("public/index.html"), read("public/ddr5.html"), read("public/guides/index.html")]);
assert.match(homepage, /<h1>Compare RAM Prices<\/h1>/);
assert.match(ddr5, /<h1>Compare DDR5 RAM Prices<\/h1>/);
assert.match(guides, /<h1>Hardware Buying Guides<\/h1>/);

console.log("GROWTH-004 deterministic RAM specification comparison contract passed.");
