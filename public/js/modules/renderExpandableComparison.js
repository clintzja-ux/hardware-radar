 export function renderExpandableComparison(products, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;

    const comparisonRows = products
        .slice(1)   // Skip today's winner
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
                            +$${difference}
                        </span>

                    </div>

                </div>
            `;

        })
        .join("");

    container.innerHTML = `
        <section class="comparison">

           <button class="comparison-toggle">

             <span>
             🔍 Compare today's winner with the next 10 cheapest
            </span>

            <span class="comparison-arrow">
        ▼
            </span>

        </button>

            <div class="comparison-content">

                ${comparisonRows}

            </div>

        </section>
    `;

    const button = container.querySelector(".comparison-toggle");
    const content = container.querySelector(".comparison-content");
    const arrow = container.querySelector(".comparison-arrow");

    content.style.display = "none";

    button.addEventListener("click", () => {

        const isOpen = content.style.display === "block";

        content.style.display = isOpen ? "none" : "block";

        arrow.textContent = isOpen ? "▼" : "▲";

});
}