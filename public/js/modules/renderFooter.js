 export function renderFooter(containerId) {
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = `
        <div class="site-footer">
            <div class="footer-grid">
                <div>
                    <h3>Hardware Radar</h3>
                    <p>
                        Independent hardware price tracking.
                        Find today's cheapest verified computer hardware
                        from trusted retailers.
                    </p>
                </div>

                <div>
                    <h4>Browse</h4>
                    <a href="ddr5.html">DDR5</a>
                    <a href="ddr4.html">DDR4</a>
                    <a href="sodimm.html">Laptop RAM</a>
                </div>

                <div>
                    <h4>Company</h4>
                    <a href="about.html">About</a>
                    <a href="how-we-choose.html">How We Choose</a>
                    <a href="contact.html">Contact</a>
                </div>

                <div>
                    <h4>Legal</h4>
                    <a href="affiliate-disclosure.html">Affiliate Disclosure</a>
                </div>
            </div>

            <div class="footer-bottom">
                <p>© 2026 Hardware Radar</p>
                <p>A Mirabelle Labs Product</p>
            </div>
        </div>
    `;
}