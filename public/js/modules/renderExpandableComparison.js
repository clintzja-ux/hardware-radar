 export function renderExpandableComparison(products, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;
    container.setAttribute("aria-live", "polite");
    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = `<section class="comparison" role="status"><p class="best-for">Comparable monitored offers will appear when qualifying observations are available.</p></section>`;
        return;
    }
    if (products.length === 1) {
        container.innerHTML = `<section class="comparison" role="status"><p class="best-for">No additional qualifying monitored offers are available for comparison right now.</p></section>`;
        return;
    }

    const comparisonRows = products
        .slice(1)   // Skip the lowest qualifying offer already shown above
        .map(product => {

            const difference = (
                product.price - products[0].price
            ).toFixed(2);

            return `
                <div class="comparison-item">

                    <div class="comparison-rank">
                        #${product.rank}
                    </div>

                    <div class="comparison-info">

                        <strong>
                            ${product.brand} ${product.model}
                        </strong>

                        <span>
                            ${product.retailer}
                        </span>

                    </div>

                    <div class="comparison-price">

                        <strong>
                            $${product.price}
                        </strong>

                        <span>
                            $${difference} more than the lowest qualifying offer
                        </span>

                        <span>
                            ${product.shippingMessage}
                        </span>

                    </div>

                    <a href="${product.offerUrl}" target="_blank" rel="noopener noreferrer" aria-label="View ${product.brand} ${product.model} at ${product.retailer}">View retailer listing →</a>

                </div>
            `;

        })
        .join("");

    const contentId = `${containerId}-comparison-content`;

    container.innerHTML = `
        <section class="comparison">

           <button type="button" class="comparison-toggle" aria-expanded="false" aria-controls="${contentId}">

             <span>
             🔍 Compare qualifying monitored offers
            </span>

            <span class="comparison-arrow">
        ▼
            </span>

        </button>

            <div class="comparison-content" id="${contentId}" hidden>

                ${comparisonRows}

            </div>

        </section>
    `;

    const button = container.querySelector(".comparison-toggle");
    const content = container.querySelector(".comparison-content");
    const arrow = container.querySelector(".comparison-arrow");

    button.addEventListener("click", () => {

        const isOpen = button.getAttribute("aria-expanded") === "true";

        button.setAttribute("aria-expanded", String(!isOpen));
        content.hidden = isOpen;
        arrow.textContent = isOpen ? "▼" : "▲";

});
}
