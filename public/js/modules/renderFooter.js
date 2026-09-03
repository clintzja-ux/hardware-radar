export function renderFooter(containerId, { basePath = "" } = {}) {
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = `
        <div class="site-footer">

            <div class="footer-grid">

                <div>
                    <h3>Hardware Radar</h3>

                    <p>
                        Independent hardware price tracking.
                        Compare qualifying listed RAM prices from
                        the retailers and products we monitor.
                    </p>
                </div>

                <div>
                    <h4>Browse</h4>

                    <a href="${basePath}ddr5.html">DDR5</a>
                    <a href="${basePath}ddr4.html">DDR4</a>
                    <a href="${basePath}sodimm.html">Laptop RAM</a>
                    <a href="${basePath}ram/">RAM Catalog</a>
                    <a href="${basePath}guides/">Guides</a>
                </div>

                <div>
                    <h4>Company</h4>

                    <a href="${basePath}about.html">About</a>
                    <a href="${basePath}how-we-choose.html">How We Choose</a>
                    <a href="${basePath}contact.html">Contact</a>
                </div>

                <div>
                    <h4>Legal</h4>

                    <a href="${basePath}affiliate-disclosure.html">
                        Affiliate Disclosure
                    </a>

                    <a href="${basePath}privacy-policy.html">
                        Privacy Policy
                    </a>

                    <a href="${basePath}terms.html">
                        Terms of Use
                    </a>
                </div>

            </div>

            <div class="footer-bottom">

                <p>© 2026 Hardware Radar</p>

                <p>A Mirabelle Labs Product</p>

            </div>

        </div>
    `;
}
