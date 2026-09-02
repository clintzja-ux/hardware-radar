import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const read = (relative) => readFile(path.join(publicRoot, relative), "utf8");
const [guides, ram, sitemap, header, footer, homepage, ddr5] = await Promise.all([
    read("guides/index.html"), read("guides/ram/index.html"), read("sitemap.xml"),
    read("js/modules/renderHeader.js"), read("js/modules/renderFooter.js"), read("index.html"), read("ddr5.html")
]);

for (const [name, source] of [["guides", guides], ["ram", ram]]) {
    assert.equal((source.match(/<h1>/g) ?? []).length, 1, `${name} must contain one H1.`);
    assert.match(source, /<main(?:\s|>)/);
    assert.match(source, /aria-label="Breadcrumb"/);
    assert.match(source, /aria-current="page"/);
    assert.match(source, /<meta name="description"/);
    assert.doesNotMatch(source, /fixture-memory-notation|Lorem ipsum|coming soon/i);
}
assert.match(guides, /<link rel="canonical" href="https:\/\/cheapestram\.com\/guides\/">/);
assert.match(guides, /Hardware Buying Guides/);
assert.match(guides, /href="\/guides\/ram\/"/);
assert.match(guides, /"@type":"BreadcrumbList"/);
assert.doesNotMatch(guides, /"@type":"Article"|Latest articles|Popular guides|Featured articles|\d+ guides/i);

assert.match(ram, /<link rel="canonical" href="https:\/\/cheapestram\.com\/guides\/ram\/">/);
assert.match(ram, /"@type":"Article"/);
assert.match(ram, /"@type":"BreadcrumbList"/);
assert.match(ram, /By Hardware Radar Editorial/);
assert.match(ram, /Published by Mirabelle Labs/);
for (const route of ["/ddr5.html", "/ddr4.html", "/sodimm.html"]) assert.match(ram, new RegExp(`href="${route.replace(".", "\\.")}"`));
assert.equal((ram.match(/article-price-cta/g) ?? []).length, 3);
assert.doesNotMatch(ram, /\bCheapest\b|GOVERNED PICK|specific retailer/i);

assert.equal((header.match(/>Guides<\/a>/g) ?? []).length, 1, "Shared header must contain exactly one Guides item.");
assert.match(header, /href="\$\{basePath\}guides\/"/);
assert.doesNotMatch(header, />Learn<|>Blog<|>Reviews<|>News<|>Resources<|>Deals</);
assert.equal((footer.match(/>Guides<\/a>/g) ?? []).length, 1, "Footer Browse group should expose one Guides link.");

const sitemapRoutes = [...sitemap.matchAll(/<loc>https:\/\/cheapestram\.com([^<]*)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapRoutes.filter((route) => route === "/guides/").length, 1);
assert.equal(sitemapRoutes.filter((route) => route === "/guides/ram/").length, 1);
assert.equal(sitemapRoutes.filter((route) => route.startsWith("/guides/ram/") && route !== "/guides/ram/").length, 4);
assert.doesNotMatch(sitemap, /fixture-memory-notation/);

for (const route of ["guides/index.html", "guides/ram/index.html"]) await access(path.join(publicRoot, route));
for (const spoke of ["ddr4-vs-ddr5", "16gb-vs-32gb", "check-ram-compatibility", "ram-speed-cas-latency"]) await access(path.join(publicRoot, "guides", "ram", spoke, "index.html"));

assert.match(homepage, /<h1>Compare RAM Prices<\/h1>/);
assert.match(homepage, /Find the cheapest RAM from the retailers we track\./);
assert.match(ddr5, /<h1>Compare DDR5 RAM Prices<\/h1>/);

const styles = await read("css/styles.css");
assert.match(styles, /@media\(max-width:700px\)[\s\S]*\.guide-category-card/);
assert.match(styles, /\.header-nav[\s\S]*overflow-x:auto/);
assert.match(styles, /\.guide-category-card__link:focus-visible/);
assert.match(styles, /\.article-price-cta \.button\{color:white/);

console.log("CONTENT-003 Guides surface fixture contract passed (31 assertions/groups).");
