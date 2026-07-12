 export function renderHeader(containerId) {
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = `
        <div class="site-header">
            <div class="header-inner">

                <a class="header-brand" href="index.html">
                   <img
                    class="header-logo-image"
                    src="images/branding/hardware-radar-icon.svg"
                     alt=""
                    aria-hidden="true"
                   >

                    <span class="header-brand-text">
                        Hardware Radar
                    </span>
                </a>

                <nav class="header-nav" aria-label="Primary navigation">
                    <a href="ddr5.html">DDR5</a>
                    <a href="ddr4.html">DDR4</a>
                    <a href="sodimm.html">Laptop RAM</a>
                    <a href="about.html">About</a>
                </nav>

            </div>
        </div>
    `;
}