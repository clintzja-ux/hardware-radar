 export function renderTrust() {
    const container = document.getElementById("trustSection");

    if (!container) return;

    container.innerHTML = `
        <section class="trust-panel">
            <h2>Why Trust Hardware Radar?</h2>

            <div class="trust-grid">
                <p>✓ Independent recommendations</p>
                <p>✓ Transparent methodology</p>
                <p>✓ Prices verified throughout the day</p>
                <p>✓ Trusted retailers only</p>
            </div>
        </section>
    `;
}