export const EMPTY_RAM_CATALOG_FILTERS = Object.freeze({
    query: "", brand: "", memoryType: "", capacityGb: "", formFactor: "", moduleCount: "", dataRateMtps: ""
});

export function normalizeCatalogSearch(value) {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function filterRamCatalogProducts(products, filters = {}) {
    const query = normalizeCatalogSearch(filters.query);
    const exact = (item, field) => !filters[field] || String(item[field]) === String(filters[field]);
    return products.filter((item) => {
        const searchable = normalizeCatalogSearch([
            item.brand, item.productFamily, item.modelName, item.manufacturerPartNumber
        ].filter(Boolean).join(" "));
        return (!query || searchable.includes(query)) &&
            exact(item, "brand") && exact(item, "memoryType") && exact(item, "capacityGb") &&
            exact(item, "formFactor") && exact(item, "moduleCount") && exact(item, "dataRateMtps");
    });
}

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const displayFormFactor = (value) => value === "SO_DIMM" ? "SO-DIMM" : value;
const option = (value, label = value) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;

function populateFilters(catalog, form) {
    const definitions = [
        ["brand", catalog.filters.brands, (value) => value],
        ["memoryType", catalog.filters.memoryTypes, (value) => value],
        ["capacityGb", catalog.filters.capacitiesGb, (value) => `${value}GB`],
        ["formFactor", catalog.filters.formFactors, displayFormFactor],
        ["moduleCount", catalog.filters.moduleCounts, (value) => `${value} module${value === 1 ? "" : "s"}`],
        ["dataRateMtps", catalog.filters.dataRatesMtps, (value) => `${value} MT/s`]
    ];
    for (const [name, values, label] of definitions) {
        const select = form.elements.namedItem(name);
        select.insertAdjacentHTML("beforeend", values.map((value) => option(value, label(value))).join(""));
    }
}

function card(item) {
    const details = [
        ["Memory", `${item.memoryType} · ${displayFormFactor(item.formFactor)}`],
        ["Capacity", `${item.capacityGb}GB (${item.moduleCount} × ${item.capacityPerModuleGb}GB)`],
        ["Speed", `${item.dataRateMtps} MT/s`],
        ...(item.casLatency ? [["CAS latency", `CL${item.casLatency}`]] : []),
        ...(item.primaryTimings ? [["Timings", item.primaryTimings]] : []),
        ...(item.ratedVoltage ? [["Voltage", `${item.ratedVoltage}V`]] : []),
        ["ECC", item.eccType.replaceAll("_", " ").toLowerCase()],
        ["Buffering", item.buffering.toLowerCase()]
    ];
    return `<li class="ram-catalog-card" data-atlas-product-id="${escapeHtml(item.atlasProductId)}">
        <p class="ram-catalog-card__brand">${escapeHtml(item.brand)}</p>
        <h2>${escapeHtml(item.productFamily || item.modelName)}</h2>
        <p class="ram-catalog-card__model">${escapeHtml(item.modelName)}</p>
        <p class="ram-catalog-card__mpn"><span>MPN</span> <code>${escapeHtml(item.manufacturerPartNumber)}</code></p>
        <dl>${details.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>
    </li>`;
}

function values(form) {
    return Object.fromEntries(Object.keys(EMPTY_RAM_CATALOG_FILTERS).map((key) => [key, form.elements.namedItem(key).value]));
}

export async function initializeRamCatalog({ fetchCatalog = () => fetch("/data/ram-catalog.json", { cache: "no-store" }) } = {}) {
    const form = document.getElementById("ramCatalogControls");
    const results = document.getElementById("ramCatalogResults");
    const status = document.getElementById("ramCatalogStatus");
    const reset = document.getElementById("ramCatalogReset");
    if (!form || !results || !status || !reset) return;
    try {
        const response = await fetchCatalog();
        if (!response.ok) throw new Error("RAM_CATALOG_LOAD_FAILED");
        const catalog = await response.json();
        if (catalog?.schemaVersion !== "1.0" || catalog?.catalogType !== "ATLAS_RAM_PRODUCT_CATALOG" || !Array.isArray(catalog.products)) throw new Error("RAM_CATALOG_INVALID");
        populateFilters(catalog, form);
        const render = () => {
            const matches = filterRamCatalogProducts(catalog.products, values(form));
            status.textContent = `${matches.length} RAM product${matches.length === 1 ? "" : "s"} shown.`;
            results.innerHTML = matches.length ? matches.map(card).join("") : `<li class="ram-catalog-empty"><h2>No RAM products match these filters.</h2><p>Clear the search and filters to browse the complete catalog.</p></li>`;
        };
        form.addEventListener("input", render);
        form.addEventListener("change", render);
        reset.addEventListener("click", () => { form.reset(); render(); form.elements.namedItem("query").focus(); });
        render();
    } catch {
        status.textContent = "RAM catalog unavailable.";
        results.innerHTML = `<li class="ram-catalog-empty"><h2>RAM catalog unavailable.</h2><p>The catalog stays hidden when its governed Atlas projection cannot be loaded.</p></li>`;
    }
}
