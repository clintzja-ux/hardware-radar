import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateEditorialSite, generateSitemap, parseEditorialSource, renderArticle, renderMarkdown, validateArticleMetadata } from "./editorial-publishing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureSource = await readFile(path.join(root, "scripts", "fixtures", "editorial", "fixture-guide.md"), "utf8");
const parsed = parseEditorialSource(fixtureSource);
const knownRoutes = ["/", "/ddr5.html", "/guides/", "/guides/ram/", parsed.metadata.canonicalPath];
const metadata = validateArticleMetadata(parsed.metadata, { knownRoutes });

assert.equal(metadata.author, "Hardware Radar Editorial");
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, title: undefined }, { knownRoutes }), /EDITORIAL_METADATA_UNSAFE|EDITORIAL_REQUIRED_FIELD_MISSING/);
assert.throws(() => validateArticleMetadata(Object.fromEntries(Object.entries(parsed.metadata).filter(([key]) => key !== "title")), { knownRoutes }), /EDITORIAL_REQUIRED_FIELD_MISSING/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, publishedAt: "September 1" }, { knownRoutes }), /EDITORIAL_DATE_INVALID/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, updatedAt: "2026-08-31" }, { knownRoutes }), /EDITORIAL_DATE_ORDER_INVALID/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, author: "Fixture Person" }, { knownRoutes }), /EDITORIAL_AUTHOR_UNSUPPORTED/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, publisher: "Fixture Publisher" }, { knownRoutes }), /EDITORIAL_PUBLISHER_UNSUPPORTED/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, canonicalPath: "/news/example/" }, { knownRoutes }), /EDITORIAL_ROUTE_INVALID/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, category: "GPU" }, { knownRoutes }), /EDITORIAL_CATEGORY_UNSUPPORTED/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, articleType: "REVIEW" }, { knownRoutes }), /EDITORIAL_TYPE_UNSUPPORTED/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, relatedGuides: ["/guides/ram/not-published/"] }, { knownRoutes }), /EDITORIAL_INTERNAL_LINK_INVALID/);
assert.throws(() => validateArticleMetadata(parsed.metadata, { knownRoutes: ["/", "/ddr5.html", parsed.metadata.canonicalPath] }), /EDITORIAL_BREADCRUMB_PARENT_MISSING/);
assert.throws(() => validateArticleMetadata({ ...parsed.metadata, title: "<script>bad" }, { knownRoutes }), /EDITORIAL_METADATA_UNSAFE/);
assert.throws(() => renderMarkdown("<script>alert(1)</script>"), /EDITORIAL_RAW_HTML_FORBIDDEN/);
assert.throws(() => renderMarkdown("[Bad](javascript:alert(1))"), /EDITORIAL_LINK_UNSAFE/);
assert.throws(() => renderMarkdown("#### Skipped heading"), /EDITORIAL_HEADING_HIERARCHY_INVALID/);

const html = renderArticle({ metadata, markdown: parsed.markdown });
assert.equal(html, renderArticle({ metadata, markdown: parsed.markdown }), "Article output must be byte-stable.");
assert.equal((html.match(/<h1>/g) ?? []).length, 1);
assert.match(html, /<main class="article-main"><article/);
assert.match(html, /aria-label="Breadcrumb"/);
assert.match(html, /aria-current="page"/);
assert.match(html, /"@type":"Article"/);
assert.match(html, /"@type":"BreadcrumbList"/);
assert.match(html, /<th scope="col">/);
assert.match(html, /article-price-cta/);
assert.match(html, /href="\/ddr5\.html"/);
assert.match(html, /article-references/);
assert.doesNotMatch(html, /article-disclosure/);
assert.match(html, /article-callout--terminology/);
assert.match(html, /<script type="module">[\s\S]*renderHeader/);
assert.match(html, /<div class="article-body">[\s\S]*Read the notation/);
assert.match(html, /href="#read-the-notation"/);

const disclosed = renderArticle({ metadata: { ...metadata, affiliateDisclosure: "This article contains affiliate links." }, markdown: parsed.markdown });
assert.match(disclosed, /article-disclosure/);
assert.match(disclosed, /affiliate-disclosure\.html/);

const routes = [{ path: "/", lastmod: "2026-07-11", changefreq: "daily", priority: "1.0" }, { path: "/ddr5.html", lastmod: "2026-07-11", changefreq: "daily", priority: "0.95" }, { path: "/guides/", lastmod: "2026-09-01", changefreq: "monthly", priority: "0.70" }, { path: "/guides/ram/", lastmod: "2026-09-01", changefreq: "monthly", priority: "0.70" }];
const sitemap = generateSitemap({ staticRoutes: routes, articles: [{ metadata }] });
assert.equal(sitemap, generateSitemap({ staticRoutes: [...routes].reverse(), articles: [{ metadata }] }));
assert.match(sitemap, /fixture-memory-notation/);
assert.match(sitemap, /<lastmod>2026-09-02<\/lastmod>/);
assert.match(sitemap, /ddr5\.html/);
assert.throws(() => generateSitemap({ staticRoutes: [...routes, routes[0]], articles: [] }), /EDITORIAL_ROUTE_DUPLICATE/);

async function generateFrom(sources) {
    const temp = await mkdtemp(path.join(os.tmpdir(), "hardware-radar-editorial-"));
    const sourceDir = path.join(temp, "content"); const outputDir = path.join(temp, "public");
    await mkdir(sourceDir, { recursive: true }); await mkdir(outputDir, { recursive: true });
    const manifest = path.join(temp, "routes.json"); const sitemapPath = path.join(outputDir, "sitemap.xml");
    await writeFile(manifest, JSON.stringify(routes));
    for (const [name, source] of sources) await writeFile(path.join(sourceDir, name), source);
    const result = await generateEditorialSite({ sourceDir, outputDir, sitemapPath, routeManifestPath: manifest });
    return { result, outputDir, sitemapPath };
}

const first = await generateFrom([["fixture.md", fixtureSource]]);
const generated = await readFile(path.join(first.outputDir, "guides", "ram", "fixture-memory-notation", "index.html"), "utf8");
assert.equal(generated, html);
assert.equal(first.result.articles.length, 1);

const duplicate = fixtureSource.replace('slug: "fixture-memory-notation"', 'slug: "fixture-memory-notation-two"');
await assert.rejects(generateFrom([["a.md", fixtureSource], ["b.md", duplicate]]), /EDITORIAL_ROUTE_DUPLICATE/);

const productionContent = await readFile(path.join(root, "content", "guides", "README.md"), "utf8");
assert.doesNotMatch(productionContent, /^---$/m, "Production source must contain no fixture article.");
const productionSitemap = await readFile(path.join(root, "public", "sitemap.xml"), "utf8");
assert.doesNotMatch(productionSitemap, /fixture-memory-notation/);

for (const route of ["index.html", "ddr5.html", "ddr4.html", "sodimm.html", "about.html", "how-we-choose.html", "contact.html", "affiliate-disclosure.html", "privacy-policy.html", "terms.html", "404.html"]) {
    await readFile(path.join(root, "public", route), "utf8");
}

const styles = await readFile(path.join(root, "public", "css", "styles.css"), "utf8");
assert.match(styles, /\.article-shell/);
assert.match(styles, /@media\(max-width:600px\)[\s\S]*\.article-price-cta/);
assert.match(styles, /focus-visible/);

console.log("Editorial publishing foundation fixture contract passed (28 assertions/groups).");
