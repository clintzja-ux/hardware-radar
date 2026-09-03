import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRamPublicProductIdentity } from "../packages/atlas/RamCatalogProjection.js";

const SITE_ORIGIN = "https://cheapestram.com";
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const safeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
const displayFormFactor = (value) => value === "SO_DIMM" ? "SO-DIMM" : value;
const displayEnum = (value) => String(value).replaceAll("_", " ").toLowerCase();

function displayTitle(product) {
    return `${product.brand} ${product.productFamily || product.modelName} ${product.capacityGb}GB ${product.memoryType}-${product.dataRateMtps}`;
}

function specificationGroup(title, rows) {
    if (!rows.length) return "";
    return `<section class="ram-product-spec-group"><h2>${escapeHtml(title)}</h2><dl>${rows.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></section>`;
}

export function categoryLinkForRamProduct(product) {
    if (product.formFactor === "SO_DIMM") return Object.freeze({ path: "/sodimm.html", label: "Browse laptop RAM prices" });
    if (product.memoryType === "DDR5") return Object.freeze({ path: "/ddr5.html", label: "Browse DDR5 RAM prices" });
    if (product.memoryType === "DDR4") return Object.freeze({ path: "/ddr4.html", label: "Browse DDR4 RAM prices" });
    throw new Error(`RAM_PRODUCT_CATEGORY_ROUTE_UNSUPPORTED:${product.atlasProductId}`);
}

export function renderRamProductPage(product) {
    if (!product || typeof product !== "object" || !/^\/ram\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(product.publicPath ?? "")) {
        throw new Error("RAM_PRODUCT_PUBLIC_IDENTITY_INVALID");
    }
    const title = displayTitle(product);
    const canonicalUrl = `${SITE_ORIGIN}${product.publicPath}`;
    const categoryLink = categoryLinkForRamProduct(product);
    const identity = [["Brand", product.brand], ["Family", product.productFamily], ["Model", product.modelName], ["Manufacturer part number", product.manufacturerPartNumber]].filter(([, value]) => value);
    const memory = [["Memory generation", product.memoryType], ["Total capacity", `${product.capacityGb}GB`], ["Module configuration", `${product.moduleCount} × ${product.capacityPerModuleGb}GB`], ["Form factor", displayFormFactor(product.formFactor)]];
    const performance = [["Rated speed", `${product.dataRateMtps} MT/s`], ...(product.casLatency ? [["CAS latency", `CL${product.casLatency}`]] : []), ...(product.primaryTimings ? [["Primary timings", product.primaryTimings]] : []), ...(product.ratedVoltage ? [["Rated voltage", `${product.ratedVoltage}V`]] : [])];
    const features = [["ECC", displayEnum(product.eccType)], ["Buffering", displayEnum(product.buffering)], ...(product.xmpSupport !== "UNKNOWN" ? [["Intel XMP", displayEnum(product.xmpSupport)]] : []), ...(product.expoSupport !== "UNKNOWN" ? [["AMD EXPO", displayEnum(product.expoSupport)]] : [])];
    const productLd = { "@context": "https://schema.org", "@type": "Product", name: product.displayName, brand: { "@type": "Brand", name: product.brand }, mpn: product.manufacturerPartNumber, category: "Computer memory", url: canonicalUrl };
    const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` }, { "@type": "ListItem", position: 2, name: "RAM catalog", item: `${SITE_ORIGIN}/ram/` }, { "@type": "ListItem", position: 3, name: product.displayName, item: canonicalUrl }] };
    const description = `${product.displayName} specifications: ${product.memoryType}, ${product.capacityGb}GB, ${product.moduleCount} × ${product.capacityPerModuleGb}GB, ${product.dataRateMtps} MT/s.`;
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${escapeHtml(title)} RAM Specifications | Hardware Radar</title>\n<meta name="description" content="${escapeHtml(description)}">\n<link rel="canonical" href="${canonicalUrl}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${escapeHtml(title)} RAM Specifications">\n<meta property="og:description" content="${escapeHtml(description)}">\n<meta property="og:url" content="${canonicalUrl}">\n<meta property="og:site_name" content="Hardware Radar">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="${escapeHtml(title)} RAM Specifications">\n<meta name="twitter:description" content="${escapeHtml(description)}">\n<link rel="icon" type="image/svg+xml" href="/images/branding/favicon.svg">\n<link rel="stylesheet" href="/css/styles.css">\n<script type="application/ld+json">${safeJson(productLd)}</script>\n<script type="application/ld+json">${safeJson(breadcrumbLd)}</script>\n</head>\n<body>\n<header id="headerContainer"></header>\n<nav class="catalog-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/ram/">RAM catalog</a></li><li><span aria-current="page">${escapeHtml(product.displayName)}</span></li></ol></nav>\n<main class="ram-product-main" data-atlas-product-id="${escapeHtml(product.atlasProductId)}"><header class="ram-product-heading"><p class="eyebrow">RAM specifications</p><h1>${escapeHtml(product.displayName)}</h1><p>Reference specifications from Hardware Radar's canonical product catalog. This factual reference is separate from market offers and buying guidance.</p></header><div class="ram-product-specs">${specificationGroup("Identity", identity)}${specificationGroup("Memory", memory)}${specificationGroup("Performance specifications", performance)}${specificationGroup("Platform and features", features)}</div><aside class="ram-product-next" aria-label="Related browsing"><a href="/ram/">Back to the RAM catalog</a><a href="${categoryLink.path}">${categoryLink.label}</a><p>Price pages cover broader tracked categories and do not establish an offer for this exact product.</p></aside></main>\n<footer id="footerContainer"></footer>\n<script type="module">import {renderHeader} from "/js/modules/renderHeader.js";import {renderFooter} from "/js/modules/renderFooter.js";renderHeader("headerContainer",{basePath:"/"});renderFooter("footerContainer",{basePath:"/"});</script>\n</body>\n</html>\n`;
}

export function createRamProductSitemapRoutes(products) {
    return products.map((product) => {
        const identity = createRamPublicProductIdentity(product);
        return { path: identity.publicPath, lastmod: identity.lastModified, changefreq: "monthly", priority: "0.70" };
    });
}

export async function generateRamProductPages({ catalog, products, outputDir }) {
    if (!catalog || catalog.productCount !== catalog.products?.length) throw new Error("RAM_PRODUCT_CATALOG_INVALID");
    const routes = createRamProductSitemapRoutes(products);
    const paths = new Set(routes.map((route) => route.path));
    if (routes.length !== catalog.productCount || catalog.products.some((product) => !paths.has(product.publicPath))) throw new Error("RAM_PRODUCT_ROUTE_BINDING_INVALID");
    const ramRoot = path.join(outputDir, "ram");
    await mkdir(ramRoot, { recursive: true });
    for (const entry of await readdir(ramRoot, { withFileTypes: true })) if (entry.isDirectory()) await rm(path.join(ramRoot, entry.name), { recursive: true, force: true });
    for (const product of catalog.products) {
        const destination = path.join(outputDir, product.publicPath.slice(1), "index.html");
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, renderRamProductPage(product), "utf8");
    }
    return Object.freeze({ productCount: catalog.products.length, routes: Object.freeze(routes) });
}
