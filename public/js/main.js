import { loadAtlasOverallProduct } from "./atlasAdapter.js";

import { loadRAMData } from "./modules/data.js";
import { renderOverall } from "./modules/renderOverall.js";
import { renderCategory } from "./modules/renderCategory.js";
import { renderTrust } from "./modules/renderTrust.js";
import { renderFooter } from "./modules/renderFooter.js";

import { renderHeader } from "./modules/renderHeader.js";
async function init() {
    try {
        const ramData = await loadRAMData();

        renderOverall(ramData);

        renderCategory(ramData, "ddr5", "ddr5Section", "More DDR5 Deals");
        renderCategory(ramData, "ddr4", "ddr4Section", "More DDR4 Deals");
        renderCategory(ramData, "sodimm", "sodimmSection", "More Laptop RAM Deals");
        renderCategory(ramData, "ecc", "eccSection", "More Server RAM Deals");

        const atlasOverallProduct = await loadAtlasOverallProduct();
        renderOverall([atlasOverallProduct]);

        renderTrust();
    } catch (error) {
        console.error(error);
    }
    renderHeader("headerContainer");
    renderFooter("footerContainer");
}

init();