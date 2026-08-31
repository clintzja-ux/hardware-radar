 export function renderRecommendation(product, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.setAttribute("aria-live", "polite");

    if (!product) {
        container.innerHTML = `<article class="overall-answer market-unavailable" role="status"><p class="eyebrow">CURRENT MARKET STATUS</p><h2>No qualifying listed price is available</h2><p class="best-for">No monitored offer currently meets Hardware Radar's publication requirements for this category.</p><p class="specs">Unavailable or stale observations remain hidden rather than being replaced with estimates.</p></article>`;
        return;
    }

    container.innerHTML = `
        <article class="overall-answer">

            <p class="eyebrow">LOWEST QUALIFYING LISTED PRICE</p>

            <h2>${product.brand} ${product.model}</h2>

            <p class="best-for">
                Best for: ${product.bestFor}
            </p>

            <p class="specs">
                ${product.capacity} • ${product.memoryType} • ${product.speed}
            </p>

            <div class="price-row">
                <span class="price">$${product.price}</span>
                <span class="retailer">${product.retailer}</span>
            </div>

            <p class="price-basis">
                ${product.priceBasis}. ${product.shippingMessage}. Taxes and other mandatory fees may apply.
            </p>

            <p class="insight-badge">
                ${product.insight}
            </p>

            <a
                class="price-button"
                href="${product.affiliateUrl}"
                target="_blank"
                rel="noopener noreferrer">

                View retailer listing →

            </a>

        </article>
    `;

}

export function renderRecommendationError(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.setAttribute("aria-live", "assertive");
    container.innerHTML = `<article class="overall-answer market-unavailable" role="alert"><p class="eyebrow">MARKET DATA UNAVAILABLE</p><h2>Pricing could not be loaded</h2><p class="best-for">Hardware Radar could not load the governed market snapshot.</p><p class="specs">No fallback or estimated price is shown. Please try again later.</p></article>`;
}
