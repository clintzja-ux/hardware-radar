 export function renderHeader(containerId, { basePath = "" } = {}) {
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = `
        <div class="site-header">
            <div class="header-inner">

                <a class="header-brand" href="${basePath}index.html">
                   <img
                    class="header-logo-image"
                    src="${basePath}images/branding/hardware-radar-icon.svg"
                     alt=""
                    aria-hidden="true"
                   >

                    <span class="header-brand-text">
                        Hardware Radar
                    </span>
                </a>

                <nav class="header-nav" aria-label="Primary navigation">
                    <a href="${basePath}ddr5.html">DDR5</a>
                    <a href="${basePath}ddr4.html">DDR4</a>
                    <a href="${basePath}sodimm.html">Laptop RAM</a>
                    <a href="${basePath}guides/">Guides</a>
                    <a href="${basePath}about.html">About</a>
                </nav>

            </div>
        </div>
    `;
}
