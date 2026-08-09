 export function renderRecommendation(product, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;

    if (!product) {
        container.innerHTML = `<article class="overall-answer market-unavailable"><p class="eyebrow">CURRENT MARKET STATUS</p><h2>Verified pricing unavailable</h2><p class="best-for">No current observation meets Hardware Radar's publication requirements for this category.</p></article>`;
        return;
    }

    container.innerHTML = `
        <article class="overall-answer">

            <p class="eyebrow">🏆 Our Recommendation</p>

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

            <p class="insight-badge">
                ${product.insight}
            </p>

            <a
                class="price-button"
                href="${product.affiliateUrl}"
                target="_blank">

                View Best Price →

            </a>

        </article>
    `;

}