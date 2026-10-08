const value = (input, fallback = "Not specified") => input === null || input === undefined || input === "" ? fallback : String(input);
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };

export function filterForgeProducts(products, { query = "", memory = "", formFactor = "", capacity = "", lifecycle = "", retailer = "" } = {}) {
    const normalized = query.trim().toLowerCase();
    return products.filter(product => {
        const haystack = [product.brand, product.manufacturerPartNumber, product.displayName, product.atlasProductId].join(" ").toLowerCase();
        return (!normalized || haystack.includes(normalized)) && (!memory || product.facets.memoryType === memory) && (!formFactor || product.facets.formFactor === formFactor) && (!capacity || String(product.facets.capacityGb) === String(capacity)) && (!lifecycle || product.lifecycleStatus === lifecycle) && (!retailer || (retailer === "MISSING" ? product.destinations.length === 0 : product.retailerCoverage.includes(retailer)));
    });
}

export class ProductManagerPanel {
    constructor(root) {
        this.root = root; this.products = []; this.selected = null;
        this.file = root.querySelector("#productManagerFile"); this.badge = root.querySelector("#productManagerBadge"); this.summary = root.querySelector("#productManagerSummary"); this.results = root.querySelector("#productManagerResults"); this.details = root.querySelector("#productManagerDetails");
        this.filters = {
            search: root.querySelector("#productManagerSearch"), memory: root.querySelector("#productManagerMemory"), formFactor: root.querySelector("#productManagerFormFactor"), capacity: root.querySelector("#productManagerCapacity"), lifecycle: root.querySelector("#productManagerLifecycle"), retailer: root.querySelector("#productManagerRetailer")
        };
        this.file.addEventListener("change", () => this.load());
        Object.values(this.filters).forEach(control => control.addEventListener("input", () => this.renderResults()));
    }
    validate(model) {
        if (model?.schemaVersion !== "1.0" || model?.projectionType !== "FORGE_PRODUCT_MANAGER" || model?.readOnly !== true || model?.mutationAuthorized !== false || model?.networkOperation !== "NONE" || !Array.isArray(model.products) || model.semantics?.atlasCanonical !== true || model.semantics?.browserMutationProhibited !== true) throw new Error("Not a certified read-only Product Manager projection.");
        return model;
    }
    async load() {
        const file = this.file.files?.[0]; if (!file) return;
        try {
            const model = this.validate(JSON.parse(await file.text())); this.products = model.products;
            const capacities = [...new Set(this.products.map(product => product.facets.capacityGb).filter(Number.isFinite))].sort((a, b) => a - b);
            this.filters.capacity.replaceChildren(element("option", "", "All"), ...capacities.map(capacity => { const option = element("option", "", `${capacity} GB`); option.value = String(capacity); return option; }));
            this.badge.textContent = "CERTIFIED READ-ONLY"; this.badge.className = "status-badge ready";
            this.summary.textContent = `As of ${model.asOf} · ${model.summary.productCount} products · ${model.summary.destinationCount} destinations · ${model.summary.productsWithCurrent} with Current · ${model.summary.productsWithHistory} with History`;
            this.renderResults();
        } catch (error) { this.products = []; this.badge.textContent = "UNAVAILABLE"; this.badge.className = "status-badge blocked"; this.summary.textContent = error.message; this.renderResults(); }
    }
    filtered() {
        const query = this.filters.search.value.trim().toLowerCase(), memory = this.filters.memory.value, formFactor = this.filters.formFactor.value, capacity = this.filters.capacity.value, lifecycle = this.filters.lifecycle.value, retailer = this.filters.retailer.value;
        return filterForgeProducts(this.products, { query, memory, formFactor, capacity, lifecycle, retailer });
    }
    renderResults() {
        const products = this.filtered(); this.results.replaceChildren();
        const count = element("p", "product-manager-count", `${products.length} product${products.length === 1 ? "" : "s"}`); this.results.append(count);
        for (const product of products) {
            const button = element("button", "product-manager-row"); button.type = "button";
            button.append(element("strong", "", product.displayName), element("span", "", `${product.brand} · ${product.manufacturerPartNumber}`), element("span", "", `${value(product.facets.memoryType)} · ${value(product.facets.formFactor)} · ${value(product.facets.capacityGb)} GB · ${product.destinations.length} link${product.destinations.length === 1 ? "" : "s"}`));
            if (product.issues.length) button.append(element("span", "product-manager-warning", product.issues.join(" · ")));
            button.addEventListener("click", () => { this.selected = product.atlasProductId; this.renderDetails(product); }); this.results.append(button);
        }
    }
    field(label, content) { const row = element("div", "product-manager-field"); row.append(element("strong", "", label), element("span", "", value(content))); return row; }
    renderDetails(product) {
        this.details.replaceChildren(element("h3", "", product.displayName));
        const overview = element("section", "product-manager-detail-section"); overview.append(element("h4", "", "Canonical Atlas product"), this.field("Canonical ID", product.atlasProductId), this.field("Brand", product.brand), this.field("MPN", product.manufacturerPartNumber), this.field("Lifecycle", product.lifecycleStatus), this.field("Publication", product.publicationStatus), this.field("Revision", product.recordRevision), this.field("Capacity", `${product.facets.moduleCount} × ${product.facets.capacityPerModuleGb} GB = ${product.facets.capacityGb} GB`), this.field("Capacity check", product.capacityInvariantValid ? "PASS" : "FAIL"), this.field("Current", product.current.available ? "AVAILABLE" : "NOT AVAILABLE"), this.field("History", product.history.available ? `${product.history.observationCount} observations` : "NOT AVAILABLE"));
        const specifications = element("details", "product-manager-specs"), specSummary = element("summary", "", "Complete canonical specifications"), pre = element("pre", "", JSON.stringify(product.specifications, null, 2)); specifications.append(specSummary, pre);
        const links = element("section", "product-manager-detail-section"); links.append(element("h4", "", "Retailer destinations and affiliate routing"));
        if (!product.destinations.length) links.append(element("p", "product-manager-warning", "No active governed retailer destination."));
        for (const destination of product.destinations) {
            const card = element("article", "product-manager-link"), anchor = element("a", "", `Open ${destination.marketplace}`); anchor.href = destination.url; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
            card.append(this.field("Retailer", destination.marketplace), this.field("Listing", destination.listingId), anchor, this.field("Review", `${value(destination.reviewMethod)} · ${value(destination.reviewedAt)}`), this.field("Versions", destination.versionCount), this.field("Link health", destination.linkHealth.status));
            if (destination.affiliate.url) { const affiliate = element("a", "", "Open operator-supplied affiliate link"); affiliate.href = destination.affiliate.url; affiliate.target = "_blank"; affiliate.rel = "noopener noreferrer"; card.append(this.field("Affiliate", `${destination.affiliate.status}${destination.affiliate.publicActionPrecedence ? " · public action precedence" : ""}`), affiliate); }
            const check = element("button", "", "Check Link"); check.type = "button"; check.disabled = true; check.title = "Authenticated trusted operator runtime is not connected."; card.append(check); links.append(card);
        }
        const actions = element("section", "product-manager-detail-section"); actions.append(element("h4", "", "Governed changes"), element("p", "", "Create, edit, activate, retire, destination replacement, affiliate changes, and live link checks are intentionally unavailable in this static UI until the authenticated operator runtime invokes the canonical owners."));
        for (const label of ["Create product draft", "Edit permitted attributes", "Change lifecycle", "Add or replace destination", "Manage affiliate link"]) { const button = element("button", "", label); button.type = "button"; button.disabled = true; actions.append(button); }
        this.details.append(overview, specifications, links, actions);
    }
}

export default ProductManagerPanel;
