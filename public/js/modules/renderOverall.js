 import { pluralize } from "../utils/text.js";
 
 export function renderOverall(items) {
    const product = items.find(item => item.section === "overall");
    const container = document.getElementById("overallSection");

    if (!product || !container) return;
    container.setAttribute("aria-live", "polite");

    container.innerHTML = `
        <article class="overall-answer">
            <div class="overall-topline">

                <p class="eyebrow">
                    🏆 TODAY'S CHEAPEST RAM
                </p>

                 <div class="verification-block">

                    <p class="verified-time">
                         Observed ${product.lastVerifiedTime || product.verified}
                    </p>

                    <p class="verification-details">
                        ${pluralize(product.pricesChecked, "price")} checked •
                         ${pluralize(product.retailersMonitored, "trusted retailer")}
                    </p>

                 </div>

            </div>

            <h2>${product.brand} ${product.model} ${product.capacity}</h2>

            <p class="best-for">Comparison note: ${product.bestFor}</p>

            <p class="specs">${product.memoryType} • ${product.speed}</p>

            <div class="price-row">
                <span class="price">$${product.price}</span>
                <span class="retailer">${product.retailer}</span>
            </div>

            <p class="price-basis">${product.priceBasis}. ${product.shippingMessage}. Taxes and other mandatory fees may apply.</p>

            ${product.insight ? `<p class="insight-badge">${product.insight}</p>` : ""}

            <a class="price-button" href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer">
                View retailer listing →
            </a>
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
            <h2>No qualifying listed price is available</h2>
            <p class="best-for">Hardware Radar shows only monitored offers that satisfy its publication requirements.</p>
            <p class="specs">Unavailable or stale observations remain hidden rather than being replaced with estimates.</p>
        </article>`;
}
