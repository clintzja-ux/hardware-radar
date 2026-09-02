import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const publicRoot=path.join(root,"public");
const routes=["/guides/","/guides/ram/","/guides/ram/16gb-vs-32gb/","/guides/ram/check-ram-compatibility/","/guides/ram/ddr4-vs-ddr5/","/guides/ram/ram-speed-cas-latency/"];
const routeFile=(route)=>route === "/" ? path.join(publicRoot,"index.html") : route.endsWith("/") ? path.join(publicRoot,...route.slice(1).split("/"),"index.html") : path.join(publicRoot,route.slice(1));
const pages=[]; const titles=new Set(); const descriptions=new Set(); const canonicals=new Set();
for (const route of routes) {
    const html=await readFile(routeFile(route),"utf8"); pages.push({route,html});
    assert.equal((html.match(/<h1>/g)??[]).length,1,`${route} must have one H1`);
    assert.match(html,/<main(?:\s|>)/); assert.match(html,/aria-label="Breadcrumb"/);
    const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description=html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    const canonical=html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    assert.ok(title && description && canonical); assert.ok(!titles.has(title)); assert.ok(!descriptions.has(description)); assert.ok(!canonicals.has(canonical));
    titles.add(title); descriptions.add(description); canonicals.add(canonical);
    assert.equal(canonical,`https://cheapestram.com${route}`);
    assert.match(html,new RegExp(`<meta property="og:url" content="https:\\/\\/cheapestram\\.com${route.replaceAll("/","\\/")}">`));
    const jsonLd=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(x=>JSON.parse(x[1]));
    assert.ok(jsonLd.some(value=>value["@type"]==="BreadcrumbList"));
    if (route==="/guides/") assert.ok(!jsonLd.some(value=>value["@type"]==="Article")); else assert.ok(jsonLd.some(value=>value["@type"]==="Article"));
    assert.doesNotMatch(html,/"@type":"(?:Review|AggregateRating|FAQPage)"/);
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
        const href=match[1]; if (!href.startsWith("/") || href.startsWith("//") || href.includes("#")) continue;
        await access(routeFile(href));
    }
    assert.doesNotMatch(html,/<a(?:\s[^>]*)?>\s*<\/a>/);
}

const index=pages.find(x=>x.route==="/guides/").html;
for (const route of routes.slice(1)) assert.equal((index.match(new RegExp(`href="${route.replaceAll("/","\\/")}"`,"g"))??[]).length,1);
const hub=pages.find(x=>x.route==="/guides/ram/").html;
for (const route of routes.slice(2)) assert.equal((hub.match(new RegExp(`href="${route.replaceAll("/","\\/")}"`,"g"))??[]).length,1);

const sitemap=await readFile(path.join(publicRoot,"sitemap.xml"),"utf8");
const sitemapEditorial=[...sitemap.matchAll(/<loc>https:\/\/cheapestram\.com(\/guides[^<]*)<\/loc>/g)].map(x=>x[1]);
assert.deepEqual(sitemapEditorial,routes); assert.doesNotMatch(sitemap,/fixture-memory-notation/);
assert.match(await readFile(path.join(publicRoot,"robots.txt"),"utf8"),/User-agent: \*[\s\S]*Allow: \/[\s\S]*Sitemap: https:\/\/cheapestram\.com\/sitemap\.xml/);

const homepage=await readFile(path.join(publicRoot,"index.html"),"utf8");
assert.match(homepage,/<h1>Compare RAM Prices<\/h1>/);
assert.equal((homepage.match(/<h1>/g)??[]).length,1); assert.doesNotMatch(homepage,/"@type":"Article"/);
assert.doesNotMatch(homepage,/class="homepage-guides"|Hardware Buying Guides/);
const homepageSequence=['<header class="hero">','id="overallSection"','class="category-grid"','id="trustSection"','id="footerContainer"'];
for (let index=1;index<homepageSequence.length;index+=1) assert.ok(homepage.indexOf(homepageSequence[index-1]) < homepage.indexOf(homepageSequence[index]),"Homepage must preserve the price-first hero, answer, category, trust, and footer sequence.");

const [header,footer,styles]=await Promise.all([
    readFile(path.join(publicRoot,"js","modules","renderHeader.js"),"utf8"),readFile(path.join(publicRoot,"js","modules","renderFooter.js"),"utf8"),readFile(path.join(publicRoot,"css","styles.css"),"utf8")
]);
assert.equal((header.match(/>Guides<\/a>/g)??[]).length,1); assert.equal((footer.match(/>Guides<\/a>/g)??[]).length,1);
assert.match(header,/href="\$\{basePath\}guides\/"/); assert.match(footer,/href="\$\{basePath\}guides\/"/);
assert.match(styles,/\.header-nav[\s\S]*overflow-x:auto/); assert.match(styles,/@media\(max-width:700px\)[\s\S]*\.guides-published-list/); assert.doesNotMatch(styles,/\.homepage-guides/);

const sources=await Promise.all(["ram-hub.md","ddr4-vs-ddr5.md","16gb-vs-32gb.md","check-ram-compatibility.md","ram-speed-cas-latency.md"].map(file=>readFile(path.join(root,"content","guides",file),"utf8")));
for (const source of sources) {
    assert.match(source,/^publishedAt: "2026-09-02"$/m); assert.match(source,/^updatedAt: "2026-09-02"$/m);
    assert.doesNotMatch(source,/\b(?:GOVERNED PICK|Best RAM|Top RAM Kits|in our testing|we benchmarked|our lab|cheapest today)\b/i);
    assert.doesNotMatch(source,/\$\s*\d/);
}

console.log("CONTENT-006A editorial launch QA contract passed.");
