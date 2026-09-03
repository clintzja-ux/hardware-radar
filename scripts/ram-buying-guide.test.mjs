import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "content", "guides", "ram-hub.md");
const outputPath = path.join(root, "public", "guides", "ram", "index.html");
const [source, output, index, sitemap] = await Promise.all([
    readFile(sourcePath, "utf8"),
    readFile(outputPath, "utf8"),
    readFile(path.join(root, "public", "guides", "index.html"), "utf8"),
    readFile(path.join(root, "public", "sitemap.xml"), "utf8")
]);

assert.match(source, /^slug: "ram-guides-hub"$/m);
assert.match(source, /^canonicalPath: "\/guides\/ram\/"$/m);
assert.match(source, /^articleType: "HUB"$/m);
assert.match(source, /^title: "RAM Buying Guide: Everything You Need to Know Before You Buy"$/m);

const body = source.replace(/^---[\s\S]*?---\s*/, "");
const words = body.match(/[A-Za-z0-9]+(?:['’.-][A-Za-z0-9]+)*/g) ?? [];
assert.ok(words.length >= 2500 && words.length <= 4000, `Guide must contain 2,500–4,000 body words; found ${words.length}.`);

assert.equal((output.match(/<h1>/g) ?? []).length, 1);
assert.match(output, /<h1>RAM Buying Guide: Everything You Need to Know Before You Buy<\/h1>/);
assert.match(output, /<link rel="canonical" href="https:\/\/cheapestram\.com\/guides\/ram\/">/);
assert.match(output, /"datePublished":"2026-09-02"/);
assert.match(output, /"dateModified":"2026-09-02"/);
assert.match(output, /aria-label="Breadcrumb"/);
assert.match(output, /aria-label="Table of contents"/);

for (const headingId of [
    "start-with-compatibility", "ddr4-vs-ddr5", "how-much-ram-do-you-need",
    "dimm-vs-sodimm", "one-stick-vs-a-matched-kit", "ram-speed-what-mts-means",
    "cas-latency-and-memory-timings", "xmp-and-expo", "check-motherboard-and-laptop-limits",
    "common-ram-buying-mistakes", "final-checklist-before-buying", "ready-to-compare-prices"
]) assert.match(output, new RegExp(`<h2 id="${headingId}">`));

assert.match(output, /latency in nanoseconds = \(CAS latency × 2000\) ÷ data rate in MT\/s/);
assert.match(output, /DDR5-6000 CL30 yields/);
assert.match(output, /<table>[\s\S]*<th scope="col">/);
assert.match(output, /aria-label="note"/);
assert.match(output, /aria-label="compatibility"/);

for (const route of ["/ddr5.html", "/ddr4.html", "/sodimm.html"]) {
    assert.match(output, new RegExp(`href="${route.replace(".", "\\.")}"`));
}
assert.equal((output.match(/article-price-cta/g) ?? []).length, 3);
assert.match(output, /href="\/how-we-choose\.html"/);

for (const sourceUrl of [
    "https://www.crucial.com/articles/about-memory/is-my-ram-compatible-with-my-motherboard",
    "https://www.crucial.com/articles/about-memory/difference-among-ddr2-ddr3-ddr4-and-ddr5-memory",
    "https://www.crucial.com/support/articles-faq-memory/what-are-memory-timings",
    "https://www.intel.com/content/www/us/en/gaming/extreme-memory-profile-xmp.html",
    "https://www.amd.com/en/products/processors/technologies/expo.html",
    "https://www.kingston.com/en/support/technical/products/gaming-memory"
]) assert.match(output, new RegExp(sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

for (const route of ["ddr4-vs-ddr5", "16gb-vs-32gb", "check-ram-compatibility", "ram-speed-cas-latency"]) assert.match(source, new RegExp(`\\(/guides/ram/${route}/\\)`));
assert.doesNotMatch(body, /\b(?:Best Overall|Best Gaming|Editor['’]s Choice|GOVERNED PICK)\b/i);
assert.doesNotMatch(body, /\b(?:in our testing|we benchmarked|our lab|our performance tests show)\b/i);
assert.doesNotMatch(body, /\b(?:Amazon|Newegg|Adorama|MemoryC|Platinummicro)\b/i);
assert.doesNotMatch(body, /\$\s*\d/);
assert.doesNotMatch(body, /<(?:script|iframe|object|embed|style|link|meta)\b|javascript:/i);

assert.match(index, /href="\/guides\/ram\/"/);
assert.equal((sitemap.match(/<loc>https:\/\/cheapestram\.com\/guides\/ram\/<\/loc>/g) ?? []).length, 1);
for (const spoke of ["ddr4-vs-ddr5", "16gb-vs-32gb", "check-ram-compatibility", "ram-speed-cas-latency"]) await access(path.join(root, "public", "guides", "ram", spoke, "index.html"));

console.log(`CONTENT-004 RAM Buying Guide contract passed (body words: ${words.length}).`);
