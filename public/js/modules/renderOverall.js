 import { pluralize } from "../utils/text.js";
 
 export function renderOverall(items) {
    const product = items.find(item => item.section === "overall");
    const container = document.getElementById("overallSection");

    if (!product || !container) return;

    container.innerHTML = `
        <article class="overall-answer">
            <div class="overall-topline">

                <p class="eyebrow">
                    🏆 TODAY'S CHEAPEST RAM
                </p>

                 <div class="verification-block">

                    <p class="verified-time">
                         ✓ Verified ${product.lastVerifiedTime || product.verified}
                    </p>

                    <p class="verification-details">
                        ${pluralize(product.pricesChecked, "price")} checked •
                         ${pluralize(product.retailersMonitored, "trusted retailer")}
                    </p>

                 </div>

            </div>

            <h2>${product.brand} ${product.model} ${product.capacity}</h2>

            <p class="best-for">Best for: ${product.bestFor}</p>

            <p class="specs">${product.memoryType} • ${product.speed}</p>

            <div class="price-row">
                <span class="price">$${product.price}</span>
                <span class="retailer">${product.retailer}</span>
            </div>

            ${product.insight ? `<p class="insight-badge">${product.insight}</p>` : ""}

            <a class="price-button" href="${product.affiliateUrl}">
                Go to Cheapest Price →
            </a>
        </article>
    `;
}
export function renderOverallUnavailable(containerId = "overallSection") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <article class="overall-answer market-unavailable">
            <p class="eyebrow">TODAY'S CHEAPEST RAM</p>
            <h2>Current verified pricing is temporarily unavailable.</h2>
            <p class="best-for">Hardware Radar only publishes prices that satisfy the platform's validation, freshness, and confidence requirements.</p>
            <p class="specs">No qualifying current market observation is available right now.</p>
        </article>`;
}
