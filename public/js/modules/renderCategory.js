 export function renderCategory(
    items,
    sectionName,
    containerId,
    moreLinkText
) {
    const products = items.filter(item => item.section === sectionName);
    const product = products[0];

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
            <p class="category-title">${sectionName === "sodimm" ? "Laptop RAM" : sectionName.toUpperCase() + " RAM"}</p>
            <p class="category-price-label">Lowest current item price</p>

            <h3><a class="category-product-link" href="${product.publicPath}">${product.displayName || `${product.brand} ${product.model}`}</a></h3>

            <p class="category-specs">
                ${product.memoryType} • ${product.capacity} • ${product.formFactor === "SO_DIMM" ? "SO-DIMM • " : ""}${product.speed}
            </p>

            <div class="category-footer">
                <div class="category-price-row">
                    <strong>$${product.price}</strong>
                    <span>${product.retailer}</span>
                </div>

                <p class="mini-verified">
                    Price checked ${product.verified}
                </p>

                ${products.length > 1 ? `<div class="category-more-prices"><p>More current prices</p><ul>${products.slice(1, 4).map(item => `<li><a href="${item.publicPath}"><span>${item.displayName}</span><strong>$${item.price}</strong><small>${item.retailer}</small></a></li>`).join("")}</ul></div>` : ""}

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
export function renderCategoryUnavailable(containerId, title, sectionName = title.toLowerCase()) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const categoryPages = { ddr5: "/ddr5.html", ddr4: "/ddr4.html", sodimm: "/sodimm.html" };
    const pageUrl = categoryPages[sectionName] ?? "/ram/";
    container.innerHTML = `
        <article class="card category-card market-unavailable">
            <p class="category-title">${title}</p>
            <h3>Browse ${title}</h3>
            <p class="best-for">Compare products, specifications and available retailer links.</p>
            <div class="category-footer"><a class="more-link" href="${pageUrl}">Browse ${title} →</a></div>
        </article>`;
}
