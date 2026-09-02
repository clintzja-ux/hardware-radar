import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSitemap, parseEditorialSource, renderArticle, renderGuidesIndex, validateArticleMetadata } from "./editorial-publishing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalText = (contents) => contents.toString("utf8").replaceAll("\r\n", "\n");
async function snapshot(directory, { exclude = [] } = {}, prefix = "") {
    const result = new Map();
    for (const entry of (await readdir(directory)).sort()) {
        if (prefix === "" && exclude.includes(entry)) continue;
        const fullPath = path.join(directory, entry);
        const relativePath = path.posix.join(prefix, entry);
        const info = await stat(fullPath);
        if (info.isDirectory()) for (const [key, value] of await snapshot(fullPath, { exclude }, relativePath)) result.set(key, value);
        else result.set(relativePath, await readFile(fullPath));
    }
    return result;
}
async function verifyProjection(label, source, destination, options) {
    const [expected, actual] = await Promise.all([snapshot(source, options), snapshot(destination)]);
    const errors = [];
    for (const [file, contents] of expected) {
        if (!actual.has(file)) errors.push(`${label}: missing public artifact ${file}`);
        else if (canonicalText(contents) !== canonicalText(actual.get(file))) errors.push(`${label}: stale public artifact ${file}`);
    }
    for (const file of actual.keys()) if (!expected.has(file)) errors.push(`${label}: unexpected public artifact ${file}`);
    return errors;
}
const errors = [
    ...(await verifyProjection("Atlas", path.join(root, "packages", "atlas"), path.join(root, "public", "data", "atlas"), { exclude: ["tests", "README.md"] })),
    ...(await verifyProjection("Forge", path.join(root, "apps", "forge"), path.join(root, "public", "forge"), { exclude: ["README.md"] }))
];
try {
    const staticRoutes = JSON.parse(await readFile(path.join(root, "content", "site-routes.json"), "utf8"));
    const sourceRoot = path.join(root, "content", "guides");
    const names = (await readdir(sourceRoot)).filter((name) => name.endsWith(".md") && name !== "README.md").sort();
    const rawArticles = await Promise.all(names.map(async (name) => ({ name, ...parseEditorialSource(await readFile(path.join(sourceRoot, name), "utf8"), name) })));
    const knownRoutes = [...staticRoutes.map((route) => route.path), ...rawArticles.map((article) => article.metadata.canonicalPath)];
    const articles = rawArticles.map((article) => ({ ...article, metadata: validateArticleMetadata(article.metadata, { knownRoutes }) }));
    const expectedSitemap = generateSitemap({ staticRoutes, articles });
    const actualSitemap = await readFile(path.join(root, "public", "sitemap.xml"), "utf8");
    if (expectedSitemap !== actualSitemap) errors.push("Editorial: sitemap.xml is stale or not deterministically generated.");
    if (/fixture-memory-notation|scripts\/fixtures\/editorial/.test(actualSitemap)) errors.push("Editorial: fixture content leaked into the production sitemap.");
    for (const article of articles) {
        const output = path.join(root, "public", article.metadata.canonicalPath.slice(1), "index.html");
        const actual = await readFile(output, "utf8");
        const expected = renderArticle(article);
        if (actual !== expected) errors.push(`Editorial: stale generated article ${article.metadata.canonicalPath}`);
        if ((actual.match(/<h1>/g) ?? []).length !== 1) errors.push(`Editorial: ${article.metadata.canonicalPath} must contain one H1.`);
        if (!actual.includes('"@type":"Article"') || !actual.includes('"@type":"BreadcrumbList"')) errors.push(`Editorial: ${article.metadata.canonicalPath} is missing structured data.`);
        if (!actual.includes('aria-label="Breadcrumb"')) errors.push(`Editorial: ${article.metadata.canonicalPath} is missing visible breadcrumbs.`);
        if (/<script[^>]*>\s*alert\(|javascript:/i.test(actual)) errors.push(`Editorial: unsafe output in ${article.metadata.canonicalPath}.`);
    }
    const guidesMetadata = JSON.parse(await readFile(path.join(root, "content", "guides-index.json"), "utf8"));
    const guidesOutput = await readFile(path.join(root, "public", "guides", "index.html"), "utf8");
    if (guidesOutput !== renderGuidesIndex(guidesMetadata, articles)) errors.push("Editorial: stale generated Guides index.");
    const editorialRoutes = [...actualSitemap.matchAll(/<loc>https:\/\/cheapestram\.com(\/guides\/[^<]*)<\/loc>/g)].map((match) => match[1]);
    const expectedEditorialRoutes = ["/guides/", "/guides/ram/", "/guides/ram/16gb-vs-32gb/", "/guides/ram/check-ram-compatibility/", "/guides/ram/ddr4-vs-ddr5/", "/guides/ram/ram-speed-cas-latency/"];
    if (editorialRoutes.length !== expectedEditorialRoutes.length || expectedEditorialRoutes.some((route) => !editorialRoutes.includes(route))) errors.push("Editorial: production sitemap must contain exactly the Guides index, RAM hub, and four approved RAM spokes.");
} catch (error) { errors.push(`Editorial: verification failed (${error.message}).`); }
for (const internal of ["sentinel", "mercury"]) {
    try { await stat(path.join(root, "public", "data", internal)); errors.push(`${internal}: internal package must not be present in public/data.`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
}
try {
    const published = JSON.parse(await readFile(path.join(root, "public", "data", "market-snapshot.json"), "utf8"));
    if (published.schemaVersion !== "1.0") errors.push("Publication: market snapshot schemaVersion must be 1.0.");
    for (const scope of ["overall", "ddr5", "ddr4", "sodimm"]) if (!published.scopes?.[scope]) errors.push(`Publication: missing ${scope} scope.`);
} catch (error) { errors.push(`Publication: market-snapshot.json missing or invalid (${error.message}).`); }
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log("Public deployment artifacts match canonical platform sources and publication boundary.");
