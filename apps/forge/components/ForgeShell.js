const pageDefinitions = [
    ["overview", "Overview", "A clear view of catalog coverage and work that needs attention."],
    ["products", "Products", "Find a product and understand its canonical and market state."],
    ["links", "Retailer & Affiliate Links", "Inspect governed retailer destinations and affiliate routing."],
    ["operations", "Market Operations", "Monitor refreshes, freshness, and bounded market operations."],
    ["reviews", "Reviews & Exceptions", "Resolve only the work that genuinely needs human judgment."],
    ["diagnostics", "Settings / Diagnostics", "Fallback imports, technical identifiers, and legacy authoring tools."]
];

const icon = name => ({ overview: "⌂", products: "▦", links: "↗", operations: "◫", reviews: "!", diagnostics: "⚙" })[name];
const node = (tag, className, text) => { const result = document.createElement(tag); if (className) result.className = className; if (text !== undefined) result.textContent = text; return result; };

export class ForgeShell {
    constructor(root) {
        this.root = root;
        this.pages = new Map();
        this.build();
        this.route(location.hash.slice(1) || "overview", false);
        window.addEventListener("hashchange", () => this.route(location.hash.slice(1) || "overview", false));
        window.addEventListener("forge:product-manager-loaded", event => this.renderProductProjection(event.detail));
        window.addEventListener("forge:product-selected", event => this.renderSelection(event.detail));
        window.addEventListener("forge:operations-loaded", event => this.renderOperations(event.detail));
        window.addEventListener("forge:trusted-session", event => this.renderTrustedSession(event.detail));
    }

    build() {
        document.body.classList.add("forge-modern");
        const legacyHeader = this.root.querySelector(".forge-header");
        const productManager = document.getElementById("productManagerPanel");
        const form = document.getElementById("forgeForm");
        const operations = document.getElementById("certifiedMercuryOperationsPanel");
        const reviews = document.getElementById("observationReviewPanel");
        const acquisition = document.getElementById("acquisitionOperationsPanel");
        const productFallback = productManager?.querySelector("#productManagerFileFallback");
        const certifiedFallback = operations?.querySelector("#certifiedMercuryFileFallback");

        const app = node("div", "operator-app");
        const sidebar = node("aside", "operator-sidebar");
        sidebar.setAttribute("aria-label", "Forge navigation");
        const brand = node("div", "operator-brand");
        brand.innerHTML = `<span class="operator-brand-mark">HR</span><span><strong>Hardware Radar</strong><small>Forge operations</small></span>`;
        const close = node("button", "sidebar-close", "Close menu"); close.type = "button"; close.addEventListener("click", () => this.toggleMenu(false));
        brand.append(close); sidebar.append(brand);
        const nav = node("nav", "operator-nav");
        for (const [id, label] of pageDefinitions) {
            const link = node("a", "operator-nav-link"); link.href = `#${id}`; link.dataset.page = id;
            link.innerHTML = `<span aria-hidden="true">${icon(id)}</span><span>${label}</span>`;
            nav.append(link);
        }
        sidebar.append(nav);
        const safety = node("div", "operator-safety");
        safety.innerHTML = `<span class="status-dot"></span><div><strong>Read-only workspace</strong><small>No provider or canonical writes</small></div>`;
        sidebar.append(safety);

        const workspace = node("div", "operator-workspace");
        const topbar = node("header", "operator-topbar");
        const menu = node("button", "menu-toggle", "Menu"); menu.type = "button"; menu.setAttribute("aria-label", "Open navigation"); menu.addEventListener("click", () => this.toggleMenu(true));
        const heading = node("div", "operator-page-heading");
        heading.innerHTML = `<p id="operatorBreadcrumb">Forge / Overview</p><h1 id="operatorPageTitle">Overview</h1><span id="operatorPageDescription"></span>`;
        const status = node("div", "operator-top-status"); status.innerHTML = `<span class="status-dot"></span><span>Certified local data</span>`;
        topbar.append(menu, heading, status); workspace.append(topbar);
        const content = node("div", "operator-content"); workspace.append(content);

        for (const [id] of pageDefinitions) {
            const page = node("section", "operator-page"); page.id = `operator-page-${id}`; page.dataset.page = id; page.hidden = true; content.append(page); this.pages.set(id, page);
        }

        this.pages.get("overview").append(this.createOverview());
        if (productManager) this.pages.get("products").append(productManager);
        this.pages.get("links").append(this.createLinksView());
        this.pages.get("operations").append(this.createOperationsSummary());
        if (operations) this.pages.get("operations").append(operations);
        if (acquisition) this.pages.get("operations").append(acquisition);
        this.pages.get("reviews").append(this.createReviewsSummary());
        if (reviews) this.pages.get("reviews").append(reviews);
        if (legacyHeader) legacyHeader.classList.add("diagnostic-legacy-header");
        if (form) this.pages.get("diagnostics").append(this.createDiagnosticsIntro(), legacyHeader, form);

        const imports = this.pages.get("diagnostics").querySelector(".diagnostic-imports");
        for (const fallback of [productFallback, certifiedFallback]) if (fallback) imports.append(fallback);

        app.append(sidebar, workspace); this.root.replaceChildren(app);
        const overlay = node("button", "sidebar-overlay", "Close navigation"); overlay.type = "button"; overlay.addEventListener("click", () => this.toggleMenu(false)); document.body.append(overlay);
        this.sidebar = sidebar; this.overlay = overlay;
        this.safety = safety; this.topStatus = status;
    }

    renderTrustedSession({ operatorId }) {
        this.safety.innerHTML = `<span class="status-dot"></span><div><strong>Trusted operator</strong><small>${operatorId} · governed changes enabled</small></div>`;
        this.topStatus.innerHTML = `<span class="status-dot"></span><span>Authenticated local session</span>`;
    }

    createOverview() {
        const wrapper = node("div", "overview-layout");
        const hero = node("section", "overview-hero");
        hero.innerHTML = `<div><p class="pane-kicker">TODAY</p><h2>Know what is healthy. Act only where needed.</h2><p>Forge brings product coverage, market operations, and governed exceptions into one calm operator workspace.</p></div><button type="button" class="primary-button" data-go="products">Browse products</button>`;
        hero.querySelector("button").addEventListener("click", () => this.route("products"));
        const metrics = node("div", "overview-metrics"); metrics.id = "overviewMetrics";
        for (const [label, value, note] of [["Products", "—", "Loading certified catalog"], ["Retailer destinations", "—", "Amazon and Newegg"], ["Current coverage", "—", "Governed Current state"], ["Needs attention", "—", "Missing retailer destinations"]]) {
            const card = node("article", "metric-card"); card.innerHTML = `<span>${label}</span><strong>${value}</strong><small>${note}</small>`; metrics.append(card);
        }
        const shortcuts = node("section", "overview-shortcuts"); shortcuts.innerHTML = `<div class="section-title"><div><p class="pane-kicker">QUICK START</p><h2>Common operator tasks</h2></div></div>`;
        const grid = node("div", "shortcut-grid");
        for (const [page, title, description] of [["products", "Find a product", "Search by brand, MPN, name, or canonical ID."], ["links", "Inspect retailer links", "Review destinations and affiliate precedence."], ["operations", "Check market operations", "Understand refresh health and current-price freshness."], ["reviews", "Review exceptions", "See work that requires a human decision."]]) {
            const button = node("button", "shortcut-card"); button.type = "button"; button.innerHTML = `<strong>${title}</strong><span>${description}</span><b>Open →</b>`; button.addEventListener("click", () => this.route(page)); grid.append(button);
        }
        shortcuts.append(grid); wrapper.append(hero, metrics, shortcuts); return wrapper;
    }

    createLinksView() {
        const section = node("section", "links-workspace"); section.innerHTML = `<div class="section-title"><div><p class="pane-kicker">DESTINATIONS</p><h2>Retailer &amp; Affiliate Links</h2><p>Canonical retailer destinations remain separate from operator-supplied affiliate routing.</p></div></div><div class="links-toolbar"><label><span>Search links</span><input id="linkSearch" type="search" placeholder="Product, MPN, retailer, or listing"></label><label><span>Coverage</span><select id="linkCoverage"><option value="">All destinations</option><option value="AFFILIATE">Affiliate present</option><option value="MISSING">Missing destinations</option><option value="ISSUE">Needs attention</option></select></label></div><div id="linksSummary" class="table-summary">Loading certified product projection…</div><div id="linksTable" class="responsive-table"></div>`;
        section.querySelector("#linkSearch").addEventListener("input", () => this.renderLinks());
        section.querySelector("#linkCoverage").addEventListener("change", () => this.renderLinks());
        return section;
    }

    createOperationsSummary() {
        const section = node("section", "operations-summary");
        section.innerHTML = `<div class="section-title"><div><p class="pane-kicker">MARKET HEALTH</p><h2>Routine operations at a glance</h2><p>Plain-language status from the certified Mercury operations projection.</p></div></div><div class="overview-metrics" id="operationsMetrics"><article class="metric-card"><span>Last successful refresh</span><strong>Loading…</strong><small>Newegg routine</small></article><article class="metric-card"><span>Retailer status</span><strong>Loading…</strong><small>Routine market operation</small></article><article class="metric-card"><span>Current freshness</span><strong>Loading…</strong><small>36-hour policy</small></article><article class="metric-card"><span>Blocked work</span><strong>Loading…</strong><small>Pending or due supervision</small></article></div>`;
        return section;
    }

    createReviewsSummary() {
        const section = node("section", "reviews-summary");
        section.innerHTML = `<div class="section-title"><div><p class="pane-kicker">HUMAN JUDGMENT</p><h2>Reviews &amp; exceptions</h2><p>Routine success stays automated. Only governed exceptions belong here.</p></div></div><div class="review-summary-grid" id="reviewSummaryGrid"><article><span>Pending destination reviews</span><strong>Loading…</strong></article><article><span>Stale or blocked reviews</span><strong>Loading…</strong></article><article><span>Provider tasks needing attention</span><strong>Loading…</strong></article></div><p id="reviewSummaryMessage" class="review-workflow-note">Loading certified review state…</p>`;
        return section;
    }

    createDiagnosticsIntro() {
        const section = node("section", "diagnostics-intro");
        section.innerHTML = `<div class="section-title"><div><p class="pane-kicker">ADVANCED</p><h2>Settings &amp; Diagnostics</h2><p>Fallback imports and legacy authoring remain available here. Normal read-only operation loads certified local projections automatically.</p></div></div><div class="diagnostic-imports"><h3>Manual projection fallback</h3><p>Use only when the local preview cannot load a certified projection automatically.</p></div>`;
        return section;
    }

    route(requested, updateHash = true) {
        const id = this.pages.has(requested) ? requested : "overview";
        for (const [pageId, page] of this.pages) page.hidden = pageId !== id;
        document.querySelectorAll(".operator-nav-link").forEach(link => { const active = link.dataset.page === id; link.classList.toggle("active", active); if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current"); });
        const [, label, description] = pageDefinitions.find(([pageId]) => pageId === id);
        document.getElementById("operatorBreadcrumb").textContent = `Forge / ${label}`;
        document.getElementById("operatorPageTitle").textContent = label;
        document.getElementById("operatorPageDescription").textContent = description;
        if (updateHash && location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
        this.toggleMenu(false); window.scrollTo({ top: 0, behavior: "instant" });
    }

    toggleMenu(open) { this.sidebar?.classList.toggle("open", open); this.overlay?.classList.toggle("visible", open); }

    renderProductProjection(model) {
        this.productModel = model;
        const values = [model.summary.productCount, model.summary.destinationCount, model.summary.productsWithCurrent, model.summary.productsMissingDestinations];
        document.querySelectorAll("#overviewMetrics .metric-card strong").forEach((item, index) => { item.textContent = values[index] ?? "0"; });
        document.querySelector(".operator-top-status span:last-child").textContent = `Certified · ${model.summary.productCount} products`;
        this.renderLinks();
    }

    renderSelection(product) {
        const count = product.destinations.length;
        document.querySelector("#linksSummary")?.setAttribute("data-selected-product", product.atlasProductId);
        if (count === 0) return;
    }

    renderOperations(model) {
        const routine = model.neweggRoutineOperations, supervision = model.existingTaskSupervisionOperations, reviews = model.amazonDestinationReviewOperations;
        const metricValues = [routine?.full?.observedAt ?? routine?.asOf ?? "See details", routine?.status ?? "Not available", routine?.current?.expiresAt ?? "See details", (supervision?.due ?? 0) + (supervision?.reviewRequired ?? 0) + (supervision?.providerTerminalFailures ?? 0)];
        document.querySelectorAll("#operationsMetrics .metric-card strong").forEach((item, index) => { item.textContent = String(metricValues[index]); item.classList.toggle("state-attention", index === 3 && Number(metricValues[index]) > 0); });
        const reviewValues = [reviews?.counts?.AWAITING_OPERATOR_REVIEW ?? 0, (reviews?.counts?.STALE ?? 0) + (reviews?.counts?.BLOCKED ?? 0), (supervision?.reviewRequired ?? 0) + (supervision?.providerTerminalFailures ?? 0)];
        document.querySelectorAll("#reviewSummaryGrid strong").forEach((item, index) => { item.textContent = String(reviewValues[index]); });
        const total = reviewValues.reduce((sum, current) => sum + Number(current), 0), message = document.getElementById("reviewSummaryMessage");
        if (message) message.textContent = total === 0 ? "No governed reviews or task exceptions currently require operator action." : `${total} governed item${total === 1 ? "" : "s"} require operator attention. Inspect the certified detail below before acting.`;
    }

    renderLinks() {
        const model = this.productModel, table = document.getElementById("linksTable"), summary = document.getElementById("linksSummary"); if (!model || !table) return;
        const query = document.getElementById("linkSearch").value.trim().toLowerCase(); const coverage = document.getElementById("linkCoverage").value;
        const rows = model.products.flatMap(product => product.destinations.length ? product.destinations.map(destination => ({ product, destination })) : [{ product, destination: null }]).filter(({ product, destination }) => {
            const haystack = [product.displayName, product.brand, product.manufacturerPartNumber, destination?.marketplace, destination?.listingId].join(" ").toLowerCase();
            return (!query || haystack.includes(query)) && (!coverage || (coverage === "AFFILIATE" && destination?.affiliate?.url) || (coverage === "MISSING" && !destination) || (coverage === "ISSUE" && (!destination || destination.linkHealth.status !== "WORKING")));
        });
        summary.textContent = `${rows.length} retailer record${rows.length === 1 ? "" : "s"} · ${model.summary.productsMissingDestinations} products missing a destination`;
        const header = node("div", "table-row table-header"); for (const text of ["Product", "Retailer", "Destination", "Affiliate", "Link health"]) header.append(node("span", "", text));
        table.replaceChildren(header, ...rows.slice(0, 100).map(({ product, destination }) => {
            const row = node("div", "table-row");
            const productCell = node("span"); productCell.innerHTML = `<strong>${product.displayName}</strong><small>${product.manufacturerPartNumber}</small>`;
            row.append(productCell, node("span", "", destination?.marketplace ?? "Missing"), node("span", "", destination?.listingId ?? "No governed destination"), node("span", "", destination?.affiliate?.url ? `${destination.affiliate.status}${destination.affiliate.publicActionPrecedence ? " · precedence" : ""}` : "Not present"), node("span", destination?.linkHealth.status === "WORKING" ? "state-positive" : "state-attention", destination?.linkHealth.status ?? "Action needed")); return row;
        }));
    }
}

export default ForgeShell;
