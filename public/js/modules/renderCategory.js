 export function renderCategory(items, sectionName, containerId, moreLinkText) {
    const product = items.find(item => item.section === sectionName);
    const container = document.getElementById(containerId);

    if (!product || !container) return;

    container.innerHTML = `
        <article class="category-card">
            <p class="category-title">${product.title}</p>

            <h3>${product.brand} ${product.model}</h3>

            <p class="best-for">Best for: ${product.bestFor}</p>

            <p class="category-specs">${product.capacity} • ${product.memoryType}</p>

            <div class="category-footer">
                <div class="category-price-row">
                    <strong>$${product.price}</strong>
                    <span>${product.retailer}</span>
                </div>

                <p class="mini-verified">✓ Verified ${product.verified}</p>

                <a class="more-link" href="#">${moreLinkText} →</a>
            </div>
        </article>
    `;
}