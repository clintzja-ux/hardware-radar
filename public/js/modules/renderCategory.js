 export function renderCategory(
    items,
    sectionName,
    containerId,
    moreLinkText
) {
    const product = items.find(
        item => item.section === sectionName
    );

    const container = document.getElementById(containerId);

    if (!product || !container) return;

    const categoryPages = {
        ddr5: "ddr5.html",
        ddr4: "ddr4.html",
        sodimm: "sodimm.html"
    };

    const pageUrl = categoryPages[sectionName];

    container.innerHTML = `
        <article class="card category-card">
            <p class="category-title">${product.title}</p>

            <h3>${product.brand} ${product.model}</h3>

            <p class="best-for">
                Comparison note: ${product.bestFor}
            </p>

            <p class="category-specs">
                ${product.capacity} • ${product.memoryType}
            </p>

            <div class="category-footer">
                <div class="category-price-row">
                    <strong>$${product.price}</strong>
                    <span>${product.retailer}</span>
                </div>

                <p class="mini-verified">
                    Observed ${product.verified}
                </p>

                ${
                    pageUrl
                        ? `<a class="more-link" href="${pageUrl}">
                               ${moreLinkText} →
                           </a>`
                        : ""
                }
            </div>
        </article>
    `;
}
export function renderCategoryUnavailable(containerId, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <article class="card category-card market-unavailable">
            <p class="category-title">${title}</p>
            <h3>Qualifying pricing unavailable</h3>
            <p class="best-for">No current observation meets Hardware Radar's publication requirements.</p>
            <div class="category-footer"><p class="mini-verified">Awaiting qualifying market data</p></div>
        </article>`;
}
