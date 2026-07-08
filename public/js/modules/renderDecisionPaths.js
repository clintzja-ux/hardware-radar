 export function renderDecisionPaths(paths, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;

    const cards = paths.map(path => `
        <article class="decision-card">

            <div class="decision-icon">
                ${path.icon}
            </div>

            <h3>${path.title}</h3>

            <p>${path.description}</p>

            <a class="decision-link" href="${path.link}">
                ${path.cta} →
            </a>

        </article>
    `).join("");

    container.innerHTML = `
        <section class="decision-section">

            <h2>Different priorities?</h2>

            <p class="decision-intro">
                The cheapest RAM isn't always the right RAM.
                Explore recommendations based on what matters most to you.
            </p>

            <div class="decision-grid">

                ${cards}

            </div>

        </section>
    `;
}