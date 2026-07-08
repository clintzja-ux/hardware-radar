 export function renderFAQ(items, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;

    const faqItems = items.map((item, index) => `

        <article class="faq-item">

            <button class="faq-question">

                <span>${item.question}</span>

                <span class="faq-arrow">▼</span>

            </button>

            <div class="faq-answer">

                <p>${item.answer}</p>

            </div>

        </article>

    `).join("");

    container.innerHTML = `

        <section class="faq">

            <h2>Frequently Asked Questions</h2>

            <div class="faq-list">

                ${faqItems}

            </div>

        </section>

    `;

    container.querySelectorAll(".faq-item").forEach(item => {

        const button = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        const arrow = item.querySelector(".faq-arrow");

        answer.style.display = "none";

        button.addEventListener("click", () => {

            const open = answer.style.display === "block";

            answer.style.display = open ? "none" : "block";

            arrow.textContent = open ? "▼" : "▲";

        });

    });

}