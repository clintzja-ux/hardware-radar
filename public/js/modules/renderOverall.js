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
            <p class="eyebrow">CURRENT MARKET STATUS</p>
            <h2>No tracked RAM price is available right now</h2>
            <p class="best-for">We don't currently have an offer that qualifies for comparison.</p>
            <p class="specs">Unavailable or stale prices stay hidden rather than being replaced with estimates. Check again later.</p>
        </article>`;
}
