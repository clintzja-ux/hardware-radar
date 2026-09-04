import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRamCatalogProjection, createRamPublicProductIdentity } from "../packages/atlas/RamCatalogProjection.js";
import { createPublicRetailerDestinationProjection, loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { createRamProductSitemapRoutes, renderRamProductPage } from "./ram-product-publishing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const manifest = JSON.parse(await read("packages/atlas/atlas-manifest.json"));
const products = await Promise.all(manifest.products.map(async (entry) => JSON.parse(await read(path.join("packages/atlas", entry.path)))));
const retailers = await Promise.all(manifest.retailers.map(async (entry) => JSON.parse(await read(path.join("packages/atlas", entry.path)))));
const destinationSource = await loadRetailerDestinationSource({ sourcePath: path.join(root, "packages/mercury/destinations/production-destinations.json"), products, retailers });
const destinations = createPublicRetailerDestinationProjection({ source: destinationSource, retailers });
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
    assert.equal(html, renderRamProductPage(product, destinations.filter(destination => destination.atlasProductId === product.atlasProductId)), `${product.publicPath} must match its canonical generator.`);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.match(html, new RegExp(`data-atlas-product-id="${product.atlasProductId}"`));
    assert.ok(html.includes(product.manufacturerPartNumber));
    assert.match(html, /href="\/ram\/">Back to the RAM catalog<\/a>/);
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
assert.equal(ramChildRoutes.filter((route) => route !== "/ram/compare/").length, 103);

const styles = await read("public/css/styles.css");
assert.match(styles, /\.ram-product-heading h1[^}]*overflow-wrap:anywhere/);
assert.match(styles, /@media\(max-width:650px\)[^}]*\.ram-product-main/s);
assert.match(styles, /\.ram-product-specs\{grid-template-columns:1fr\}/);

const [homepage, ddr5, ddr4, sodimm, guides] = await Promise.all([read("public/index.html"), read("public/ddr5.html"), read("public/ddr4.html"), read("public/sodimm.html"), read("public/guides/index.html")]);
assert.match(homepage, /<h1>Compare RAM Prices<\/h1>/);
assert.match(ddr5, /<h1>Compare DDR5 RAM Prices<\/h1>/);
assert.match(ddr4, /<h1>Compare DDR4 RAM Prices<\/h1>/);
assert.match(sodimm, /<h1>Compare Laptop RAM Prices<\/h1>/);
assert.match(guides, /<h1>Hardware Buying Guides<\/h1>/);
assert.equal([...sitemap.matchAll(/<loc>https:\/\/cheapestram\.com\/guides\/[^<]*<\/loc>/g)].length, 6);

console.log("GROWTH-003 canonical public RAM product identity contract passed (103 routes).");
