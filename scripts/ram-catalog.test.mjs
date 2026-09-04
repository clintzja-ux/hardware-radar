import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRamCatalogProjection, RAM_CATALOG_ORDER } from "../packages/atlas/RamCatalogProjection.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const manifest = JSON.parse(await read("packages/atlas/atlas-manifest.json"));
const products = await Promise.all(manifest.products.map(async (entry) => JSON.parse(await read(path.join("packages/atlas", entry.path)))));
const catalog = createRamCatalogProjection(products);
const replay = createRamCatalogProjection([...products].reverse());

assert.equal(catalog.schemaVersion, "1.0");
assert.equal(catalog.catalogType, "ATLAS_RAM_PRODUCT_CATALOG");
assert.equal(catalog.defaultOrder, RAM_CATALOG_ORDER);
assert.equal(catalog.productCount, 103);
assert.equal(catalog.products.length, 103);
assert.equal(new Set(catalog.products.map((item) => item.atlasProductId)).size, 103);
assert.deepEqual(replay, catalog, "Catalog projection must not depend on manifest input order.");
assert.equal(Object.isFrozen(catalog), true);
assert.ok(catalog.products.every((item) => item.capacityGb === item.moduleCount * item.capacityPerModuleGb));

const invalidProduct = structuredClone(products[0]);
invalidProduct.identity.modelName = "";
assert.throws(
    () => createRamCatalogProjection([invalidProduct]),
    /RAM_CATALOG_ATLAS_PRODUCT_INVALID/,
    "Invalid Atlas records must fail closed rather than enter the public catalog."
);

assert.deepEqual(catalog.filters.brands, [...new Set(catalog.products.map((item) => item.brand))].sort());
assert.deepEqual(catalog.filters.memoryTypes, [...new Set(catalog.products.map((item) => item.memoryType))].sort());
assert.deepEqual(catalog.filters.capacitiesGb, [...new Set(catalog.products.map((item) => item.capacityGb))].sort((left, right) => left - right));

const forbidden = new Set(["price", "currentprice", "retailer", "retailerid", "sourceurl", "affiliateurl", "availability", "shipping", "condition", "cheapest", "pick", "rank", "rankingauthority"]);
const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
        assert.equal(forbidden.has(key.toLowerCase()), false, `Catalog must not project market field ${key}.`);
        visit(child);
    }
};
visit(catalog);

assert.deepEqual(JSON.parse(await read("public/data/ram-catalog.json")), catalog);

const browserModule = await import(pathToFileURL(path.join(root, "public/js/modules/ramCatalog.js")));
const filter = (values) => browserModule.filterRamCatalogProducts(catalog.products, values);
assert.equal(filter({ query: "CMK32GX5M2B6000Z30" }).length, 1);
for (const mpn of ["KF560C30BBEA-8", "KF560C36BBEA-8", "CMK16GX5M2B5200Z40", "F5-6000J3636F16GX1-RS5K"]) {
    assert.equal(filter({ query: mpn }).length, 1, `${mpn} must resolve through exact-MPN catalog search.`);
}
assert.equal(filter({ query: "6000z30" }).length, 2);
assert.ok(filter({ query: "Corsair" }).length >= 3);
assert.ok(filter({ query: "Crucial Pro" }).length >= 2);
assert.equal(filter({ query: "  cRuCiAl   pRo  " }).length, filter({ query: "crucial pro" }).length);
assert.ok(filter({ memoryType: "DDR4" }).length > 0);
assert.ok(filter({ memoryType: "DDR5" }).length > 0);
assert.ok(filter({ formFactor: "DIMM" }).length > 0);
assert.ok(filter({ formFactor: "SO_DIMM" }).length > 0);
assert.ok(filter({ capacityGb: "32" }).length > 0);
assert.ok(filter({ moduleCount: "1" }).length > 0);
assert.ok(filter({ dataRateMtps: "5600" }).length > 0);
assert.ok(filter({ brand: "Kingston" }).length > 0);
assert.equal(filter({ memoryType: "DDR5", formFactor: "SO_DIMM", capacityGb: "32", moduleCount: "1", dataRateMtps: "5600", brand: "Corsair" }).length, 1);
assert.equal(filter({ query: "does-not-exist" }).length, 0);
assert.equal(filter(browserModule.EMPTY_RAM_CATALOG_FILTERS).length, 103);

const [html, script, styles, sitemap, homepage, ddr5, ddr4, sodimm, header, footer] = await Promise.all([
    read("public/ram/index.html"), read("public/js/modules/ramCatalog.js"), read("public/css/styles.css"), read("public/sitemap.xml"),
    read("public/index.html"), read("public/ddr5.html"), read("public/ddr4.html"), read("public/sodimm.html"),
    read("public/js/modules/renderHeader.js"), read("public/js/modules/renderFooter.js")
]);
assert.equal((html.match(/<h1>/g) ?? []).length, 1);
assert.match(html, /<h1>Browse RAM by specification<\/h1>/);
assert.match(html, /<label for="ramCatalogQuery">Search products<\/label>/);
for (const name of ["brand", "memoryType", "capacityGb", "formFactor", "moduleCount", "dataRateMtps"]) assert.match(html, new RegExp(`<select name="${name}">`));
assert.match(html, /role="status" aria-live="polite"/);
assert.match(html, /<ul id="ramCatalogResults"[^>]*aria-label="RAM catalog results"/);
assert.match(html, /<link rel="canonical" href="https:\/\/cheapestram\.com\/ram\/">/);
assert.match(html, /<meta property="og:url" content="https:\/\/cheapestram\.com\/ram\/">/);
assert.match(html, /<meta name="twitter:card" content="summary">/);
assert.match(html, /"@type":"CollectionPage"/);
assert.doesNotMatch(html, /"@type":"(?:Product|Offer|AggregateOffer|Review|AggregateRating)"/);
assert.match(script, /No RAM products match these filters\./);
assert.match(script, /form\.reset\(\)/);
assert.match(script, /RAM catalog unavailable/);
assert.match(styles, /@media\(max-width:600px\)[^}]*\.catalog-breadcrumbs/s);
assert.match(styles, /\.ram-catalog-filter-grid,.ram-catalog-grid\{grid-template-columns:1fr\}/);
assert.match(sitemap, /<loc>https:\/\/cheapestram\.com\/ram\/<\/loc>[\s\S]*?<lastmod>2026-09-02<\/lastmod>/);
assert.equal((header.match(/<a href=/g) ?? []).length, 5, "Primary navigation must remain five items.");
assert.match(footer, /href="\$\{basePath\}ram\/">RAM Catalog<\/a>/);
assert.match(homepage, /<h1>Compare RAM Prices<\/h1>/);
assert.match(ddr5, /<h1>Compare DDR5 RAM Prices<\/h1>/);
assert.match(ddr4, /<h1>Compare DDR4 RAM Prices<\/h1>/);
assert.match(sodimm, /<h1>Compare Laptop RAM Prices<\/h1>/);

console.log("GROWTH-002 static Atlas RAM catalog contract passed (103 products). ");
