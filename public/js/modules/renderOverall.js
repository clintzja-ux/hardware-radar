 export function renderOverall(items) {
    const product = items.find(item => item.section === "overall");
    const container = document.getElementById("overallSection");

    if (!product || !container) return;

    container.innerHTML = `
        <article class="overall-answer" itemscope itemtype="https://schema.org/Product">
            <div class="overall-topline">

                <p class="eyebrow">
                    🏆 TODAY'S CHEAPEST RAM
                </p>

                 <div class="verification-block">

                    <p class="verified-time">
                         ✓ Verified ${product.lastVerifiedTime || product.verified}
                    </p>

                     <p class="verification-details">
                         ${product.pricesChecked} prices checked •
                        ${product.retailersMonitored} trusted retailers
                     </p>

                 </div>

            </div>

            <h2 itemprop="name">${product.brand} ${product.model} ${product.capacity}</h2>

            <p class="best-for">Best for: ${product.bestFor}</p>

            <p class="specs">${product.memoryType} • ${product.speed}</p>

            <div class="price-row" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                <span class="price" itemprop="price" content="${product.price}">$${product.price}</span>
                <span class="retailer">${product.retailer}</span>
                <meta itemprop="priceCurrency" content="${product.currency}">
            </div>

            ${product.insight ? `<p class="insight-badge">${product.insight}</p>` : ""}

            <a class="price-button" href="${product.affiliateUrl}">
                Go to Cheapest Price →
            </a>
        </article>
    `;
}