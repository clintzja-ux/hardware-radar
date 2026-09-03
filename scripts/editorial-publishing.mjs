import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const SITE_ORIGIN = "https://cheapestram.com";
export const EDITORIAL_SCHEMA_VERSION = "1.0";
const AUTHORS = new Set(["Hardware Radar Editorial"]);
const PUBLISHERS = new Set(["Mirabelle Labs"]);
const CATEGORIES = new Set(["RAM"]);
const ARTICLE_TYPES = new Set(["GUIDE", "HUB"]);
const CALLOUTS = new Set(["terminology", "compatibility", "warning", "evidence", "note"]);

export class EditorialValidationError extends Error {
    constructor(code, message) { super(`${code}: ${message}`); this.name = "EditorialValidationError"; this.code = code; }
}

function fail(code, message) { throw new EditorialValidationError(code, message); }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function safeJson(value) { return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026"); }
function parseValue(value) {
    const trimmed = value.trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "null") return null;
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
        try { return JSON.parse(trimmed); } catch { fail("EDITORIAL_FRONT_MATTER_INVALID", `Invalid JSON value: ${trimmed}`); }
    }
    return trimmed;
}

export function parseEditorialSource(source, sourceName = "article.md") {
    const opening = source.match(/^---(?:\r\n|\n)/);
    if (!opening) fail("EDITORIAL_FRONT_MATTER_MISSING", `${sourceName} must begin with front matter.`);
    const closingPattern = /\r?\n---(?:\r\n|\n)/g;
    closingPattern.lastIndex = opening[0].length;
    const closing = closingPattern.exec(source);
    if (!closing) fail("EDITORIAL_FRONT_MATTER_INVALID", `${sourceName} front matter is not closed.`);
    const metadata = {};
    for (const line of source.slice(opening[0].length, closing.index).split(/\r?\n/)) {
        if (!line.trim() || line.trimStart().startsWith("#")) continue;
        const match = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
        if (!match) fail("EDITORIAL_FRONT_MATTER_INVALID", `${sourceName} contains unsupported front matter syntax.`);
        if (Object.hasOwn(metadata, match[1])) fail("EDITORIAL_FRONT_MATTER_DUPLICATE_FIELD", `${match[1]} is duplicated.`);
        metadata[match[1]] = parseValue(match[2]);
    }
    return { metadata, markdown: source.slice(closing.index + closing[0].length).trim() };
}

function validPath(value, { article = false } = {}) {
    if (typeof value !== "string" || !value.startsWith("/") || value.includes("//") || value.includes("..") || /[?#<>'"\\]/.test(value)) return false;
    if (article && (!value.startsWith("/guides/") || !value.endsWith("/"))) return false;
    return value === "/" || /^\/[a-z0-9/-]+(?:\.html|\/)?$/.test(value);
}
function validDate(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function stringArray(value, field) { if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) fail("EDITORIAL_FRONT_MATTER_INVALID", `${field} must be a string array.`); return value; }

export function validateArticleMetadata(metadata, { knownRoutes = [] } = {}) {
    const required = ["schemaVersion", "slug", "title", "description", "canonicalPath", "category", "articleType", "author", "publisher", "publishedAt", "updatedAt", "relatedGuides", "relevantPricePages", "references"];
    for (const field of required) if (!Object.hasOwn(metadata, field)) fail("EDITORIAL_REQUIRED_FIELD_MISSING", field);
    if (metadata.schemaVersion !== EDITORIAL_SCHEMA_VERSION) fail("EDITORIAL_SCHEMA_UNSUPPORTED", metadata.schemaVersion);
    for (const field of ["slug", "title", "description", "author", "publisher"]) if (typeof metadata[field] !== "string" || !metadata[field].trim() || /[<>\u0000-\u001f]/.test(metadata[field])) fail("EDITORIAL_METADATA_UNSAFE", field);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug)) fail("EDITORIAL_SLUG_INVALID", metadata.slug);
    if (!validPath(metadata.canonicalPath, { article: true })) fail("EDITORIAL_ROUTE_INVALID", metadata.canonicalPath);
    if (!CATEGORIES.has(metadata.category)) fail("EDITORIAL_CATEGORY_UNSUPPORTED", metadata.category);
    if (!ARTICLE_TYPES.has(metadata.articleType)) fail("EDITORIAL_TYPE_UNSUPPORTED", metadata.articleType);
    if (!AUTHORS.has(metadata.author)) fail("EDITORIAL_AUTHOR_UNSUPPORTED", metadata.author);
    if (!PUBLISHERS.has(metadata.publisher)) fail("EDITORIAL_PUBLISHER_UNSUPPORTED", metadata.publisher);
    if (!validDate(metadata.publishedAt) || !validDate(metadata.updatedAt)) fail("EDITORIAL_DATE_INVALID", "publishedAt/updatedAt");
    if (metadata.updatedAt < metadata.publishedAt) fail("EDITORIAL_DATE_ORDER_INVALID", "updatedAt precedes publishedAt.");
    const internal = [...stringArray(metadata.relatedGuides, "relatedGuides"), ...stringArray(metadata.relevantPricePages, "relevantPricePages")];
    for (const route of internal) if (!validPath(route) || !knownRoutes.includes(route)) fail("EDITORIAL_INTERNAL_LINK_INVALID", route);
    for (const parent of ["/guides/", `/guides/${metadata.category.toLowerCase()}/`]) if (!knownRoutes.includes(parent) && metadata.canonicalPath !== parent) fail("EDITORIAL_BREADCRUMB_PARENT_MISSING", parent);
    if (!Array.isArray(metadata.references)) fail("EDITORIAL_FRONT_MATTER_INVALID", "references must be an array.");
    for (const reference of metadata.references) {
        if (!reference || typeof reference !== "object" || !["FACT", "EXPLANATION", "EXTERNAL TEST EVIDENCE", "PRICE EVIDENCE", "EDITORIAL JUDGMENT", "GOVERNED PICK"].includes(reference.classification) || typeof reference.label !== "string" || typeof reference.url !== "string" || !/^https:\/\//.test(reference.url)) fail("EDITORIAL_REFERENCE_INVALID", "Each reference needs a supported classification, label, and HTTPS URL.");
    }
    for (const field of ["dek", "affiliateDisclosure"]) if (metadata[field] !== undefined && (typeof metadata[field] !== "string" || /[<>\u0000-\u001f]/.test(metadata[field]))) fail("EDITORIAL_METADATA_UNSAFE", field);
    for (const field of ["tableOfContents"]) if (metadata[field] !== undefined && typeof metadata[field] !== "boolean") fail("EDITORIAL_FRONT_MATTER_INVALID", field);
    return Object.freeze({ ...metadata, relatedGuides: Object.freeze([...metadata.relatedGuides]), relevantPricePages: Object.freeze([...metadata.relevantPricePages]), references: Object.freeze(metadata.references.map((item) => Object.freeze({ ...item }))) });
}

function inline(text) {
    if (/<\/?[A-Za-z][^>]*>/.test(text)) fail("EDITORIAL_RAW_HTML_FORBIDDEN", "Raw HTML is not allowed.");
    let output = escapeHtml(text);
    output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
    output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
        if (/^javascript:/i.test(href) || (!href.startsWith("https://") && !validPath(href))) fail("EDITORIAL_LINK_UNSAFE", href);
        return `<a href="${escapeHtml(href)}"${href.startsWith("https://") ? ' rel="noopener noreferrer"' : ""}>${label}</a>`;
    });
    return output;
}

export function renderMarkdown(markdown) {
    if (/<\/?(?:script|style|iframe|object|embed|form|input|button)\b/i.test(markdown)) fail("EDITORIAL_RAW_HTML_FORBIDDEN", "Unsafe HTML is not allowed.");
    const lines = markdown.replaceAll("\r\n", "\n").split("\n");
    const html = []; let index = 0; let previousHeading = 1;
    while (index < lines.length) {
        const line = lines[index];
        if (!line.trim()) { index++; continue; }
        const heading = line.match(/^(#{2,6})\s+(.+)$/);
        if (heading) { const level = heading[1].length; if (level > previousHeading + 1) fail("EDITORIAL_HEADING_HIERARCHY_INVALID", line); previousHeading = level; const id = heading[2].toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"); html.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`); index++; continue; }
        if (/^#\s/.test(line)) fail("EDITORIAL_H1_FORBIDDEN", "The template owns the only H1.");
        const callout = line.match(/^:::(\w+)\s+(.+)$/);
        if (callout) { if (!CALLOUTS.has(callout[1])) fail("EDITORIAL_CALLOUT_UNSUPPORTED", callout[1]); html.push(`<aside class="article-callout article-callout--${callout[1]}" aria-label="${callout[1]}"><strong>${escapeHtml(callout[1][0].toUpperCase() + callout[1].slice(1))}:</strong> ${inline(callout[2])}</aside>`); index++; continue; }
        const cta = line.match(/^\[\[price-cta:\s*([^|]+)\|\s*([^\]]+)\]\]$/);
        if (cta) { if (!validPath(cta[2].trim()) || !["/ddr5.html", "/ddr4.html", "/sodimm.html"].includes(cta[2].trim())) fail("EDITORIAL_CTA_INVALID", cta[2]); html.push(`<aside class="article-price-cta"><p>${inline(cta[1].trim())}</p><a class="button" href="${escapeHtml(cta[2].trim())}">View tracked prices</a></aside>`); index++; continue; }
        if (/^>\s/.test(line)) { const parts=[]; while (index < lines.length && /^>\s/.test(lines[index])) parts.push(lines[index++].replace(/^>\s?/, "")); html.push(`<blockquote>${inline(parts.join(" "))}</blockquote>`); continue; }
        if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) { const ordered = /^\d+\./.test(line); const items=[]; const pattern = ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/; while (index < lines.length && pattern.test(lines[index])) items.push(`<li>${inline(lines[index++].match(pattern)[1])}</li>`); html.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`); continue; }
        if (line.includes("|") && index + 1 < lines.length && /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(lines[index + 1])) { const rows=[]; const split=(row)=>row.trim().replace(/^\||\|$/g, "").split("|").map((cell)=>cell.trim()); const headers=split(line); index+=2; while(index<lines.length && lines[index].includes("|")) rows.push(split(lines[index++])); html.push(`<div class="article-table-wrap"><table><thead><tr>${headers.map((h)=>`<th scope="col">${inline(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row)=>`<tr>${row.map((cell)=>`<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue; }
        if (/^---+$/.test(line)) { html.push("<hr>"); index++; continue; }
        const paragraph=[]; while(index<lines.length && lines[index].trim() && !/^(#{1,6})\s|^[-*]\s+|^\d+\.\s+|^>\s|^:::\w+|^\[\[price-cta:|^---+$/.test(lines[index])) paragraph.push(lines[index++].trim()); html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    }
    return html.join("\n");
}

function breadcrumbs(metadata) {
    const categoryPath = `/guides/${metadata.category.toLowerCase()}/`;
    const items = [{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/" }, { name: metadata.category, path: categoryPath }];
    if (metadata.canonicalPath !== categoryPath) items.push({ name: metadata.title, path: metadata.canonicalPath });
    return items;
}

export function renderArticle({ metadata, markdown }) {
    const body = renderMarkdown(markdown); const crumbs = breadcrumbs(metadata); const url = `${SITE_ORIGIN}${metadata.canonicalPath}`;
    const tocItems = [...body.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)];
    const articleLd = { "@context":"https://schema.org", "@type":"Article", headline:metadata.title, description:metadata.description, datePublished:metadata.publishedAt, dateModified:metadata.updatedAt, author:{"@type":"Organization",name:metadata.author}, publisher:{"@type":"Organization",name:metadata.publisher}, mainEntityOfPage:{"@type":"WebPage","@id":url} };
    const crumbLd = { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement:crumbs.map((item,index)=>({"@type":"ListItem",position:index+1,name:item.name,item:`${SITE_ORIGIN}${item.path}`})) };
    const related = metadata.relatedGuides.length ? `<section class="article-related" aria-labelledby="related-guides"><h2 id="related-guides">Related guides</h2><ul>${metadata.relatedGuides.map((route)=>`<li><a href="${route}">${escapeHtml(route)}</a></li>`).join("")}</ul></section>` : "";
    const refs = metadata.references.length ? `<section class="article-references" aria-labelledby="references"><h2 id="references">References</h2><ol>${metadata.references.map((ref)=>`<li><span class="evidence-label">${escapeHtml(ref.classification)}</span> <a href="${escapeHtml(ref.url)}" rel="noopener noreferrer">${escapeHtml(ref.label)}</a></li>`).join("")}</ol></section>` : "";
    const disclosure = metadata.affiliateDisclosure ? `<aside class="article-disclosure" aria-label="Affiliate disclosure"><p>${escapeHtml(metadata.affiliateDisclosure)} <a href="/affiliate-disclosure.html">Read our full Affiliate Disclosure.</a></p></aside>` : "";
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${escapeHtml(metadata.title)} | Hardware Radar</title>\n<meta name="description" content="${escapeHtml(metadata.description)}">\n<link rel="canonical" href="${url}">\n<meta property="og:type" content="article">\n<meta property="og:title" content="${escapeHtml(metadata.title)}">\n<meta property="og:description" content="${escapeHtml(metadata.description)}">\n<meta property="og:url" content="${url}">\n<meta property="og:site_name" content="Hardware Radar">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="${escapeHtml(metadata.title)}">\n<meta name="twitter:description" content="${escapeHtml(metadata.description)}">\n<link rel="icon" type="image/svg+xml" href="/images/branding/favicon.svg">\n<link rel="stylesheet" href="/css/styles.css">\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-QF6XJ8GCMY"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-QF6XJ8GCMY");</script>\n<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","xmw7yj015l");</script>\n<script type="application/ld+json">${safeJson(articleLd)}</script>\n<script type="application/ld+json">${safeJson(crumbLd)}</script>\n</head>\n<body>\n<header id="headerContainer"></header>\n<nav class="article-breadcrumbs" aria-label="Breadcrumb"><ol>${crumbs.map((item,index)=>`<li>${index === crumbs.length - 1 ? `<span aria-current="page">${escapeHtml(item.name)}</span>` : `<a href="${item.path}">${escapeHtml(item.name)}</a>`}</li>`).join("")}</ol></nav>\n<main class="article-main"><article class="article-shell"><header class="article-heading"><p class="article-category">${escapeHtml(metadata.category)} guide</p><h1>${escapeHtml(metadata.title)}</h1>${metadata.dek ? `<p class="article-dek">${escapeHtml(metadata.dek)}</p>` : ""}<p class="article-byline">By ${escapeHtml(metadata.author)} · Published by ${escapeHtml(metadata.publisher)}</p><p class="article-dates"><time datetime="${metadata.publishedAt}">Published ${metadata.publishedAt}</time>${metadata.updatedAt !== metadata.publishedAt ? ` · <time datetime="${metadata.updatedAt}">Updated ${metadata.updatedAt}</time>` : ""}</p></header>${metadata.tableOfContents && tocItems.length ? `<nav class="article-toc" aria-label="Table of contents"><p><strong>On this page</strong></p><ol>${tocItems.map((item)=>`<li><a href="#${item[1]}">${item[2]}</a></li>`).join("")}</ol></nav>` : ""}${disclosure}<div class="article-body">${body}</div>${refs}${related}</article></main>\n<footer id="footerContainer"></footer>\n<script type="module">import {renderHeader} from "/js/modules/renderHeader.js";import {renderFooter} from "/js/modules/renderFooter.js";renderHeader("headerContainer",{basePath:"/"});renderFooter("footerContainer",{basePath:"/"});</script>\n</body>\n</html>\n`;
}

export function renderGuidesIndex(metadata, articles = []) {
    if (!metadata || metadata.schemaVersion !== EDITORIAL_SCHEMA_VERSION || metadata.canonicalPath !== "/guides/" || !validDate(metadata.publishedAt) || !validDate(metadata.updatedAt) || metadata.updatedAt < metadata.publishedAt) fail("EDITORIAL_INDEX_METADATA_INVALID", "Guides index metadata is invalid.");
    for (const field of ["title", "description", "heading", "intro"]) if (typeof metadata[field] !== "string" || !metadata[field].trim() || /[<>\u0000-\u001f]/.test(metadata[field])) fail("EDITORIAL_INDEX_METADATA_INVALID", field);
    const url = `${SITE_ORIGIN}/guides/`;
    const crumbLd = { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${SITE_ORIGIN}/`},{"@type":"ListItem",position:2,name:"Guides",item:url}] };
    const published = [...articles].sort((a,b)=>(a.metadata.articleType === "HUB" ? -1 : b.metadata.articleType === "HUB" ? 1 : a.metadata.title.localeCompare(b.metadata.title)));
    const guideLinks = published.map(({metadata:article})=>`<li><a href="${article.canonicalPath}">${escapeHtml(article.title)}</a><p>${escapeHtml(article.description)}</p></li>`).join("");
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${escapeHtml(metadata.title)} | Hardware Radar</title>\n<meta name="description" content="${escapeHtml(metadata.description)}">\n<link rel="canonical" href="${url}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${escapeHtml(metadata.title)}">\n<meta property="og:description" content="${escapeHtml(metadata.description)}">\n<meta property="og:url" content="${url}">\n<meta property="og:site_name" content="Hardware Radar">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="${escapeHtml(metadata.title)}">\n<meta name="twitter:description" content="${escapeHtml(metadata.description)}">\n<link rel="icon" type="image/svg+xml" href="/images/branding/favicon.svg">\n<link rel="stylesheet" href="/css/styles.css">\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-QF6XJ8GCMY"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-QF6XJ8GCMY");</script>\n<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","xmw7yj015l");</script>\n<script type="application/ld+json">${safeJson(crumbLd)}</script>\n</head>\n<body>\n<header id="headerContainer"></header>\n<nav class="article-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><span aria-current="page">Guides</span></li></ol></nav>\n<main class="guides-index"><header class="guides-index__heading"><h1>${escapeHtml(metadata.heading)}</h1><p>${escapeHtml(metadata.intro)}</p></header><section class="guide-category-card guide-category-card--published" aria-labelledby="ram-guides"><div><p class="article-category">RAM</p><h2 id="ram-guides">RAM guides</h2><p>Understand memory generations, capacity, compatibility, speed and timings, then continue to the price comparison that fits your system.</p><ul class="guides-published-list">${guideLinks}</ul></div></section></main>\n<footer id="footerContainer"></footer>\n<script type="module">import {renderHeader} from "/js/modules/renderHeader.js";import {renderFooter} from "/js/modules/renderFooter.js";renderHeader("headerContainer",{basePath:"/"});renderFooter("footerContainer",{basePath:"/"});</script>\n</body>\n</html>\n`;
}

export function generateSitemap({ staticRoutes, articles, additionalRoutes = [] }) {
    const entries = [...staticRoutes.map((route)=>({ ...route })), ...articles.map(({ metadata })=>({ path:metadata.canonicalPath,lastmod:metadata.updatedAt,changefreq:"monthly",priority:"0.70" })), ...additionalRoutes.map((route)=>({ ...route }))].sort((a,b)=>a.path.localeCompare(b.path));
    const seen = new Set(); for (const entry of entries) { if (seen.has(entry.path)) fail("EDITORIAL_ROUTE_DUPLICATE", entry.path); seen.add(entry.path); if (!validPath(entry.path) || !validDate(entry.lastmod)) fail("SITEMAP_ENTRY_INVALID", entry.path); }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry)=>`  <url>\n    <loc>${SITE_ORIGIN}${entry.path}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
}

export async function generateEditorialSite({ sourceDir, outputDir, sitemapPath, routeManifestPath, guidesIndexPath }) {
    const staticRoutes = JSON.parse(await readFile(routeManifestPath, "utf8"));
    const knownRoutes = staticRoutes.map((item)=>item.path); const sources=[];
    try { for (const name of (await readdir(sourceDir)).filter((name)=>name.endsWith(".md") && name !== "README.md").sort()) sources.push({ name, source:await readFile(path.join(sourceDir,name),"utf8") }); } catch (error) { if (error.code !== "ENOENT") throw error; }
    const articles = sources.map(({name,source})=>({ name,...parseEditorialSource(source,name) }));
    const allRoutes = [...knownRoutes,...articles.map((article)=>article.metadata.canonicalPath)];
    const identities = new Set(); const routes = new Set();
    for (const article of articles) { article.metadata=validateArticleMetadata(article.metadata,{knownRoutes:allRoutes}); if (identities.has(article.metadata.slug)) fail("EDITORIAL_IDENTITY_DUPLICATE",article.metadata.slug); if(routes.has(article.metadata.canonicalPath)) fail("EDITORIAL_ROUTE_DUPLICATE",article.metadata.canonicalPath); identities.add(article.metadata.slug);routes.add(article.metadata.canonicalPath); }
    for (const article of articles) { const destination=path.join(outputDir,article.metadata.canonicalPath.slice(1),"index.html"); await mkdir(path.dirname(destination),{recursive:true}); await writeFile(destination,renderArticle(article)); }
    if (guidesIndexPath) {
        const indexMetadata = JSON.parse(await readFile(guidesIndexPath, "utf8"));
        const destination = path.join(outputDir, "guides", "index.html");
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, renderGuidesIndex(indexMetadata, articles));
    }
    const sitemap=generateSitemap({staticRoutes,articles}); await writeFile(sitemapPath,sitemap); return {articles,sitemap};
}
