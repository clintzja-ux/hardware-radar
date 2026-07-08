 export function renderBuyingAdvice(advice, containerId) {
    const container = document.getElementById(containerId);

    if (!container || !advice) return;

    const points = advice.points.map(point => `
        <li>${point}</li>
    `).join("");

    container.innerHTML = `
        <section class="buying-advice">
            <h2>${advice.title}</h2>

            <p class="buying-advice-summary">
                ${advice.summary}
            </p>

            <ul class="buying-advice-list">
                ${points}
            </ul>
        </section>
    `;
}