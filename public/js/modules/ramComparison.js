export const RAM_COMPARISON_AUTHORITY = "DETERMINISTIC_FACTUAL_SPECIFICATION_COMPARISON";
export const RAM_COMPARISON_QUERY_KEY = "products";
export const RAM_COMPARISON_MAX_PRODUCTS = 2;

const safeSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const missing = (value) => value === undefined || value === null || value === "UNKNOWN";
const displayEnum = (value) => String(value).replaceAll("_", " ").toLowerCase();
const displayFormFactor = (value) => value === "SO_DIMM" ? "SO-DIMM" : value;
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function parseRamComparisonQuery(search, products) {
    const params = new URLSearchParams(String(search ?? "").replace(/^\?/, ""));
    const raw = params.get(RAM_COMPARISON_QUERY_KEY);
    if (!raw) return Object.freeze({ status: "EMPTY", products: Object.freeze([]), reasons: Object.freeze([]) });
    const slugs = raw.split(",").map((value) => value.trim());
    const reasons = [];
    if (slugs.length > RAM_COMPARISON_MAX_PRODUCTS) reasons.push("TOO_MANY_PRODUCTS");
    if (slugs.some((slug) => !safeSlug(slug))) reasons.push("MALFORMED_PUBLIC_PRODUCT_IDENTITY");
    if (new Set(slugs).size !== slugs.length) reasons.push("DUPLICATE_PRODUCT");
    const bySlug = new Map(products.map((product) => [product.publicSlug, product]));
    if (slugs.some((slug) => !bySlug.has(slug))) reasons.push("UNKNOWN_PRODUCT");
    if (reasons.length) return Object.freeze({ status: "INVALID", products: Object.freeze([]), reasons: Object.freeze([...new Set(reasons)]) });
    const resolved = slugs.map((slug) => bySlug.get(slug));
    return Object.freeze({ status: resolved.length === 2 ? "READY" : "INCOMPLETE", products: Object.freeze(resolved), reasons: Object.freeze(resolved.length === 2 ? [] : ["TWO_PRODUCTS_REQUIRED"]) });
}

export function buildRamComparisonPath(products) {
    if (!Array.isArray(products) || products.length !== 2) throw new Error("RAM_COMPARISON_TWO_PRODUCTS_REQUIRED");
    const slugs = products.map((product) => product?.publicSlug);
    if (slugs.some((slug) => !safeSlug(slug)) || new Set(slugs).size !== 2) throw new Error("RAM_COMPARISON_PUBLIC_IDENTITIES_INVALID");
    return `/ram/compare/?products=${slugs.join(",")}`;
}

function row(group, label, left, right, format = (value) => value) {
    const leftMissing = missing(left);
    const rightMissing = missing(right);
    return Object.freeze({
        group,
        label,
        left: leftMissing ? null : String(format(left)),
        right: rightMissing ? null : String(format(right)),
        state: leftMissing || rightMissing ? "NOT_AVAILABLE" : Object.is(left, right) ? "SAME" : "DIFFERENT"
    });
}

const approximateCasNanoseconds = (product) => missing(product.casLatency) ? null : Math.round(((product.casLatency * 2000) / product.dataRateMtps) * 100) / 100;

export function compareRamProducts(left, right) {
    if (!left || !right || left.publicSlug === right.publicSlug) throw new Error("RAM_COMPARISON_DISTINCT_PRODUCTS_REQUIRED");
    return Object.freeze([
        row("Identity", "Brand", left.brand, right.brand),
        row("Identity", "Family", left.productFamily, right.productFamily),
        row("Identity", "Model", left.modelName, right.modelName),
        row("Identity", "Manufacturer part number", left.manufacturerPartNumber, right.manufacturerPartNumber),
        row("Memory configuration", "DDR generation", left.memoryType, right.memoryType),
        row("Memory configuration", "Total capacity", left.capacityGb, right.capacityGb, (value) => `${value}GB`),
        row("Memory configuration", "Module count", left.moduleCount, right.moduleCount),
        row("Memory configuration", "Capacity per module", left.capacityPerModuleGb, right.capacityPerModuleGb, (value) => `${value}GB`),
        row("Memory configuration", "Form factor", left.formFactor, right.formFactor, displayFormFactor),
        row("Performance specifications", "Rated speed", left.dataRateMtps, right.dataRateMtps, (value) => `${value} MT/s`),
        row("Performance specifications", "CAS latency", left.casLatency, right.casLatency, (value) => `CL${value}`),
        row("Performance specifications", "Primary timings", left.primaryTimings, right.primaryTimings),
        row("Performance specifications", "Rated voltage", left.ratedVoltage, right.ratedVoltage, (value) => `${value}V`),
        row("Performance specifications", "Approximate first-word latency", approximateCasNanoseconds(left), approximateCasNanoseconds(right), (value) => `${value} ns`),
        row("Platform and features", "ECC", left.eccType, right.eccType, displayEnum),
        row("Platform and features", "Buffering", left.buffering, right.buffering, displayEnum),
        row("Platform and features", "Intel XMP", left.xmpSupport, right.xmpSupport, displayEnum),
        row("Platform and features", "AMD EXPO", left.expoSupport, right.expoSupport, displayEnum)
    ]);
}

function options(products, selected) {
    return `<option value="">Choose a RAM product</option>${products.map((product) => `<option value="${escapeHtml(product.publicSlug)}"${product.publicSlug === selected ? " selected" : ""}>${escapeHtml(product.displayName)}</option>`).join("")}`;
}

function renderComparison(products, output, state) {
    if (state.status !== "READY") {
        output.innerHTML = state.status === "INVALID" ? `<section class="ram-comparison-empty" role="alert"><h2>Comparison unavailable</h2><p>The comparison link contains unknown, duplicate, malformed or unsupported product identities.</p></section>` : `<section class="ram-comparison-empty"><h2>Choose two RAM products</h2><p>Select two distinct products to compare their governed Atlas specifications.</p></section>`;
        return;
    }
    const [left, right] = state.products;
    const rows = compareRamProducts(left, right);
    const groups = [...new Set(rows.map((item) => item.group))];
    output.innerHTML = `<div class="ram-comparison-products"><article><p>Product A</p><h2><a href="${escapeHtml(left.publicPath)}">${escapeHtml(left.displayName)}</a></h2></article><article><p>Product B</p><h2><a href="${escapeHtml(right.publicPath)}">${escapeHtml(right.displayName)}</a></h2></article></div><div class="ram-comparison-table-wrap" tabindex="0" aria-label="RAM specification comparison"><table><thead><tr><th scope="col">Specification</th><th scope="col">Product A</th><th scope="col">Product B</th><th scope="col">Comparison state</th></tr></thead>${groups.map((group) => `<tbody><tr class="ram-comparison-group"><th colspan="4" scope="rowgroup">${escapeHtml(group)}</th></tr>${rows.filter((item) => item.group === group).map((item) => `<tr data-comparison-state="${item.state}"><th scope="row">${escapeHtml(item.label)}</th><td>${escapeHtml(item.left ?? "Not listed")}</td><td>${escapeHtml(item.right ?? "Not listed")}</td><td><span class="comparison-state comparison-state--${item.state.toLowerCase()}">${item.state.replace("_", " ")}</span></td></tr>`).join("")}</tbody>`).join("")}</table></div><p class="ram-comparison-formula">Approximate first-word latency is calculated only when CAS latency is listed: (CL × 2000) ÷ MT/s. It is a factual estimate, not an overall performance score.</p>${left.memoryType !== right.memoryType ? `<aside class="ram-comparison-notice"><strong>Different DDR generations:</strong> these products use different memory standards. This does not determine compatibility with a particular system.</aside>` : ""}`;
}

export async function initializeRamComparison({ fetchCatalog = () => fetch("/data/ram-catalog.json", { cache: "no-store" }) } = {}) {
    const form = document.getElementById("ramComparisonControls");
    const output = document.getElementById("ramComparisonOutput");
    const status = document.getElementById("ramComparisonStatus");
    if (!form || !output || !status) return;
    try {
        const response = await fetchCatalog();
        if (!response.ok) throw new Error("RAM_COMPARISON_CATALOG_LOAD_FAILED");
        const catalog = await response.json();
        if (catalog?.catalogType !== "ATLAS_RAM_PRODUCT_CATALOG" || !Array.isArray(catalog.products)) throw new Error("RAM_COMPARISON_CATALOG_INVALID");
        const initial = parseRamComparisonQuery(location.search, catalog.products);
        const selected = initial.products.map((product) => product.publicSlug);
        form.elements.namedItem("productA").innerHTML = options(catalog.products, selected[0]);
        form.elements.namedItem("productB").innerHTML = options(catalog.products, selected[1]);
        const render = () => {
            const slugs = [form.elements.namedItem("productA").value, form.elements.namedItem("productB").value].filter(Boolean);
            const state = slugs.length ? parseRamComparisonQuery(`?products=${slugs.join(",")}`, catalog.products) : parseRamComparisonQuery("", catalog.products);
            const sharePath = state.status === "READY" ? buildRamComparisonPath(state.products) : slugs.length === 1 ? `/ram/compare/?products=${slugs[0]}` : "/ram/compare/";
            history.replaceState(null, "", sharePath);
            status.textContent = state.status === "READY" ? "Two products selected for factual comparison." : state.status === "INVALID" ? "Comparison input is invalid." : "Two products are required.";
            renderComparison(catalog.products, output, state);
        };
        form.addEventListener("change", render);
        if (initial.status === "INVALID") { status.textContent = `Comparison input is invalid: ${initial.reasons.join(", ")}.`; renderComparison(catalog.products, output, initial); }
        else render();
    } catch {
        status.textContent = "RAM comparison unavailable.";
        output.innerHTML = `<section class="ram-comparison-empty" role="alert"><h2>RAM comparison unavailable</h2><p>The comparison remains hidden when its governed Atlas catalog cannot be loaded.</p></section>`;
    }
}
