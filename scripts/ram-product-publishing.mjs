import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRamPublicProductIdentity } from "../packages/atlas/RamCatalogProjection.js";
import { formatProductName } from "../public/js/modules/ramTerminal.js";

const SITE_ORIGIN = "https://cheapestram.com";
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const safeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
const displayFormFactor = (value) => value === "SO_DIMM" ? "SO-DIMM" : value;
const displayEnum = (value) => String(value).replaceAll("_", " ").toLowerCase();
const formatMoney = (value) => `$${Number(value).toFixed(2)}`;
const formatHistoryDate = (value) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(new Date(value));
const formatHistorySpan = (value) => value < 1 ? "Less than 1 day" : `${Math.floor(value)} day${Math.floor(value) === 1 ? "" : "s"}`;

function displayTitle(product) {
    return formatProductName(product.brand, `${product.brand} ${product.productFamily || product.modelName} ${product.manufacturerPartNumber} ${product.capacityGb}GB ${product.memoryType}-${product.dataRateMtps}`);
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

function retailerDestinations(destinations) {
    if (!destinations.length) return "";
    const links = destinations.map(destination => {
        let url;
        try { url = new URL(destination.destinationUrl); } catch { throw new Error("RAM_PRODUCT_DESTINATION_INVALID"); }
        if (url.protocol !== "https:" || url.href !== destination.destinationUrl) throw new Error("RAM_PRODUCT_DESTINATION_INVALID");
        return `<li><span>${escapeHtml(destination.retailerDisplayName)}</span><a href="${escapeHtml(destination.destinationUrl)}" target="_blank" rel="noopener noreferrer">Visit retailer</a></li>`;
    }).join("");
    return `<section class="ram-product-destinations" aria-labelledby="retailer-links-heading"><h2 id="retailer-links-heading">Retailer links</h2><p>These links are provided for navigation and do not indicate current price or availability.</p><ul>${links}</ul></section>`;
}

function currentRetailSection(currentRetail, disclosure) {
    if (!currentRetail?.offers?.length) return "";
    const offers = currentRetail.offers.map(offer => `<li><div><strong>${escapeHtml(offer.retailerName)}</strong><span>Current tracked price: $${Number(offer.itemPriceUsd).toFixed(2)} USD</span><small>Price checked ${escapeHtml(new Date(offer.observedAt).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }))} UTC</small></div><a href="${escapeHtml(offer.destinationUrl)}" target="_blank" rel="noopener noreferrer">View retailer listing</a></li>`).join("");
    const lower = currentRetail.lowerCurrentItemPrice ? `<p class="ram-product-current-retail__lower">Lower current item price: <strong>${escapeHtml(currentRetail.lowerCurrentItemPrice.retailerName)} — $${Number(currentRetail.lowerCurrentItemPrice.itemPriceUsd).toFixed(2)} USD</strong></p>` : "";
    return `<section class="ram-product-current-retail" aria-labelledby="current-retail-heading"><p class="eyebrow">Qualified retailer evidence</p><h2 id="current-retail-heading">Current market</h2>${lower}<p>${escapeHtml(disclosure)}</p><ul>${offers}</ul></section>`;
}

function historyMetric(label, value, detail = "") {
    return `<div><dt>${escapeHtml(label)}</dt><dd>${value}${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</dd></div>`;
}

function historyMovement(history) {
    const amount = formatMoney(Math.abs(Number(history.changeFromPreviousAmount)));
    if (history.movement === "DOWN") return `<span class="ram-product-history__movement ram-product-history__movement--down"><span aria-hidden="true">↓</span> ${amount}</span><span class="sr-only">Latest comparable observation down ${amount} from previous comparable observation</span>`;
    if (history.movement === "UP") return `<span class="ram-product-history__movement ram-product-history__movement--up"><span aria-hidden="true">↑</span> ${amount}</span><span class="sr-only">Latest comparable observation up ${amount} from previous comparable observation</span>`;
    return `<span class="ram-product-history__movement ram-product-history__movement--flat"><span aria-hidden="true">—</span> Unchanged</span><span class="sr-only">Latest comparable observation unchanged from previous comparable observation</span>`;
}

function historySection(summary) {
    const history = summary?.history;
    if (!history || history.comparableObservationCount === 0) {
        const detail = history?.admittedObservationCount > 0
            ? "Hardware Radar has admitted observations for this product, but none currently qualify as a public-comparable price series."
            : "Hardware Radar does not yet have comparable price history for this product.";
        return `<section class="ram-product-history" aria-labelledby="observed-history-heading"><p class="eyebrow">Independent historical evidence</p><h2 id="observed-history-heading">Hardware Radar-observed price history</h2><div class="ram-product-history__empty"><strong>Comparable history not yet available</strong><p>${escapeHtml(detail)}</p></div><p class="ram-product-history__separation">Current market prices and historical observations are independently qualified evidence.</p></section>`;
    }
    const latest = history.latestComparableObservation;
    const timestamps = history.distinctComparableTimestampCount;
    let metrics = historyMetric("Latest comparable", formatMoney(latest.itemPriceUsd), formatHistoryDate(latest.observedAt));
    if (timestamps >= 2) {
        const previous = history.previousComparableObservation;
        metrics += historyMetric("Previous comparable", formatMoney(previous.itemPriceUsd), formatHistoryDate(previous.observedAt));
        metrics += historyMetric("Historical movement", historyMovement(history));
        metrics += historyMetric("Comparable observed range", `${formatMoney(history.observedMinimumItemPrice)}–${formatMoney(history.observedMaximumItemPrice)}`);
    }
    metrics += historyMetric("Comparable observations", String(history.comparableObservationCount), `${timestamps} distinct time${timestamps === 1 ? "" : "s"}`);
    if (timestamps >= 2) metrics += historyMetric("Observed history span", formatHistorySpan(history.historySpanDays));
    const low = timestamps >= 2 && history.atObservedLow === true ? `<p class="ram-product-history__low"><span aria-hidden="true">★</span> Latest at observed low</p>` : "";
    const insufficient = timestamps === 1 ? `<p class="ram-product-history__insufficient">Insufficient history for movement.</p>` : "";
    return `<section class="ram-product-history" aria-labelledby="observed-history-heading"><p class="eyebrow">Independent historical evidence</p><h2 id="observed-history-heading">Hardware Radar-observed price history</h2><p>This summary describes Hardware Radar's governed comparable observations, not complete internet-wide price history.</p><dl class="ram-product-history__metrics">${metrics}</dl>${low}${insufficient}<p class="ram-product-history__separation">Current market prices and historical observations are independently qualified evidence.</p></section>`;
}

function methodologySection() {
    return `<section class="ram-product-methodology" aria-labelledby="product-methodology-heading"><p class="eyebrow">How to read this page</p><h2 id="product-methodology-heading">Methodology</h2><p>Current values are qualified item prices and exclude applicable shipping, taxes, and fees. Unknown shipping or fees are never treated as zero. Historical movement compares the latest and previous distinct-time comparable historical observations; it does not compare Current with previous History. Observed ranges and observed-low labels apply only to Hardware Radar's comparable historical dataset.</p></section>`;
}

function renderRamProductPageBase(product, destinations = [], currentRetail = null, disclosure = "", terminalSummary = null) {
    if (!product || typeof product !== "object" || !/^\/ram\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(product.publicPath ?? "")) {
        throw new Error("RAM_PRODUCT_PUBLIC_IDENTITY_INVALID");
    }
    destinations = destinations.filter(destination => destination.atlasProductId === product.atlasProductId);
    const publicDisplayName = formatProductName(product.brand, product.displayName);
    const title = displayTitle(product);
    const canonicalUrl = `${SITE_ORIGIN}${product.publicPath}`;
    const categoryLink = categoryLinkForRamProduct(product);
    const identity = [["Brand", product.brand], ["Family", product.productFamily], ["Model", product.modelName], ["Manufacturer part number", product.manufacturerPartNumber]].filter(([, value]) => value);
    const memory = [["Memory generation", product.memoryType], ["Total capacity", `${product.capacityGb}GB`], ["Module configuration", `${product.moduleCount} × ${product.capacityPerModuleGb}GB`], ["Form factor", displayFormFactor(product.formFactor)]];
    const performance = [["Rated speed", `${product.dataRateMtps} MT/s`], ...(product.casLatency ? [["CAS latency", `CL${product.casLatency}`]] : []), ...(product.primaryTimings ? [["Primary timings", product.primaryTimings]] : []), ...(product.ratedVoltage ? [["Rated voltage", `${product.ratedVoltage}V`]] : [])];
    const features = [["ECC", displayEnum(product.eccType)], ["Buffering", displayEnum(product.buffering)], ...(product.xmpSupport !== "UNKNOWN" ? [["Intel XMP", displayEnum(product.xmpSupport)]] : []), ...(product.expoSupport !== "UNKNOWN" ? [["AMD EXPO", displayEnum(product.expoSupport)]] : [])];
    const productLd = { "@context": "https://schema.org", "@type": "Product", name: product.displayName, brand: { "@type": "Brand", name: product.brand }, mpn: product.manufacturerPartNumber, category: "Computer memory", url: canonicalUrl };
    const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` }, { "@type": "ListItem", position: 2, name: "RAM catalog", item: `${SITE_ORIGIN}/ram/` }, { "@type": "ListItem", position: 3, name: product.displayName, item: canonicalUrl }] };
    const description = `${publicDisplayName} specifications: ${product.memoryType}, ${product.capacityGb}GB, ${product.moduleCount} × ${product.capacityPerModuleGb}GB, ${product.dataRateMtps} MT/s.`;
    if (terminalSummary && (terminalSummary.atlasProductId !== product.atlasProductId || terminalSummary.publicPath !== product.publicPath)) throw new Error("RAM_PRODUCT_TERMINAL_SUMMARY_BINDING_INVALID");
    product = Object.freeze({ ...product, displayName: publicDisplayName });
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${escapeHtml(title)} RAM Specifications | Hardware Radar</title>\n<meta name="description" content="${escapeHtml(description)}">\n<link rel="canonical" href="${canonicalUrl}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${escapeHtml(title)} RAM Specifications">\n<meta property="og:description" content="${escapeHtml(description)}">\n<meta property="og:url" content="${canonicalUrl}">\n<meta property="og:site_name" content="Hardware Radar">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="${escapeHtml(title)} RAM Specifications">\n<meta name="twitter:description" content="${escapeHtml(description)}">\n<link rel="icon" type="image/svg+xml" href="/images/branding/favicon.svg">\n<link rel="stylesheet" href="/css/styles.css">\n<script type="application/ld+json">${safeJson(productLd)}</script>\n<script type="application/ld+json">${safeJson(breadcrumbLd)}</script>\n</head>\n<body>\n<header id="headerContainer"></header>\n<nav class="catalog-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/ram/">RAM catalog</a></li><li><span aria-current="page">${escapeHtml(product.displayName)}</span></li></ol></nav>\n<main class="ram-product-main" data-atlas-product-id="${escapeHtml(product.atlasProductId)}"><header class="ram-product-heading"><p class="eyebrow">Product intelligence</p><h1>${escapeHtml(product.displayName)}</h1><p>Reference specifications, qualified current prices, and Hardware Radar-observed history for this product.</p></header><div class="ram-product-specs">${specificationGroup("Identity", identity)}${specificationGroup("Memory", memory)}${specificationGroup("Performance specifications", performance)}${specificationGroup("Platform and features", features)}</div>${currentRetailSection(currentRetail, disclosure)}${historySection(terminalSummary)}${retailerDestinations(destinations)}${methodologySection()}<aside class="ram-product-next" aria-label="Related browsing"><a href="/ram/terminal/">View RAM Market Terminal</a><a href="/ram/">Back to the RAM catalog</a><a href="/ram/compare/?products=${escapeHtml(product.publicSlug)}">Compare this RAM</a><a href="${categoryLink.path}">${categoryLink.label}</a><p>Price pages cover broader tracked categories and do not establish an offer for this exact product.</p></aside></main>\n<footer id="footerContainer"></footer>\n<script type="module">import {renderHeader} from "/js/modules/renderHeader.js";import {renderFooter} from "/js/modules/renderFooter.js";renderHeader("headerContainer",{basePath:"/"});renderFooter("footerContainer",{basePath:"/"});</script>\n</body>\n</html>\n`;
}

export function renderRamProductPage(product, destinations = [], currentRetail = null, disclosure = "", terminalSummary = null) {
    const page = renderRamProductPageBase(product, destinations, currentRetail, disclosure, terminalSummary);
    const analytics = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-QF6XJ8GCMY"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-QF6XJ8GCMY");</script>\n`;
    return page.replace('<script type="application/ld+json">', `${analytics}<script type="application/ld+json">`);
}

export function createRamProductSitemapRoutes(products) {
    return products.map((product) => {
        const identity = createRamPublicProductIdentity(product);
        return { path: identity.publicPath, lastmod: identity.lastModified, changefreq: "monthly", priority: "0.70" };
    });
}

export async function generateRamProductPages({ catalog, products, destinations = [], currentRetailByProduct = new Map(), terminalByProduct = new Map(), disclosure = "", outputDir }) {
    if (!catalog || catalog.productCount !== catalog.products?.length) throw new Error("RAM_PRODUCT_CATALOG_INVALID");
    const routes = createRamProductSitemapRoutes(products);
    const paths = new Set(routes.map((route) => route.path));
    if (routes.length !== catalog.productCount || catalog.products.some((product) => !paths.has(product.publicPath))) throw new Error("RAM_PRODUCT_ROUTE_BINDING_INVALID");
    const ramRoot = path.join(outputDir, "ram");
    await mkdir(ramRoot, { recursive: true });
    for (const entry of await readdir(ramRoot, { withFileTypes: true })) if (entry.isDirectory() && entry.name !== "compare") await rm(path.join(ramRoot, entry.name), { recursive: true, force: true });
    for (const product of catalog.products) {
        const destination = path.join(outputDir, product.publicPath.slice(1), "index.html");
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, renderRamProductPage(product, destinations.filter(item => item.atlasProductId === product.atlasProductId), currentRetailByProduct.get(product.atlasProductId) ?? null, disclosure, terminalByProduct.get(product.atlasProductId) ?? null), "utf8");
    }
    return Object.freeze({ productCount: catalog.products.length, routes: Object.freeze(routes) });
}
