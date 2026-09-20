 export function renderOverall(items) {
    const product = items.find(item => item.section === "overall");
    const container = document.getElementById("overallSection");

    if (!product || !container) return;
    container.setAttribute("aria-live", "polite");

    container.innerHTML = `
        <article class="overall-answer">
            <div class="overall-topline">

                <p class="eyebrow">
                    🏆 CHEAPEST RAM TODAY
                </p>

            </div>

            <h2>${product.displayName || `${product.brand} ${product.model}`}</h2>

            <p class="specs">${product.memoryType} • ${product.capacity} • ${product.formFactor === "SO_DIMM" ? "SO-DIMM • " : ""}${product.speed}</p>

            <div class="price-row">
                <span class="price">$${product.price}</span>
                <span class="retailer">${product.retailer}</span>
            </div>

            <a class="price-button" href="${product.offerUrl}" target="_blank" rel="noopener noreferrer">
                View retailer listing →
            </a>

            <p class="verified-time">Price checked ${product.lastVerifiedTime || product.verified}</p>
        </article>
    `;
}
export function renderOverallUnavailable(containerId = "overallSection") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.setAttribute("aria-live", "polite");
    container.innerHTML = `
        <article class="overall-answer market-unavailable" role="status">
            <p class="eyebrow">SHOP RAM</p>
            <h2>Compare RAM by type, capacity and speed</h2>
            <p class="best-for">Current prices are temporarily unavailable.</p>
            <p class="specs">Browse the catalog and product specifications while we refresh retailer prices.</p>
            <a class="price-button" href="/ram/">Browse RAM products →</a>
        </article>`;
}
