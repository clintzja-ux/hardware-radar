import { loadCurrentRetailSnapshot, winnerToDisplayProduct } from "./modules/marketData.js";
import { renderOverall, renderOverallUnavailable } from "./modules/renderOverall.js";
import { renderCategory, renderCategoryUnavailable } from "./modules/renderCategory.js";
import { renderTrust } from "./modules/renderTrust.js";
import { renderFooter } from "./modules/renderFooter.js";
import { renderHeader } from "./modules/renderHeader.js";

async function init() {
    try {
        const snapshot = await loadCurrentRetailSnapshot();
        const overall = winnerToDisplayProduct(snapshot, "overall", "overall", "Cheapest RAM Today");
        if (overall) renderOverall([overall]); else renderOverallUnavailable("overallSection");

        const categories = [
            ["ddr5", "ddr5Section", "Cheapest DDR5 Today", "Browse DDR5 RAM"],
            ["ddr4", "ddr4Section", "Cheapest DDR4 Today", "Browse DDR4 RAM"],
            ["laptop", "sodimmSection", "Cheapest Laptop RAM Today", "Browse Laptop RAM"]
        ];
        for (const [scope, containerId, title, linkText] of categories) {
            const section = scope === "laptop" ? "sodimm" : scope;
            const product = winnerToDisplayProduct(snapshot, scope, section, title);
            if (product) renderCategory([product], section, containerId, linkText);
            else renderCategoryUnavailable(containerId, title);
        }
        renderTrust();
    } catch (error) {
        console.error(error);
        renderOverallUnavailable("overallSection");
        renderCategoryUnavailable("ddr5Section", "DDR5");
        renderCategoryUnavailable("ddr4Section", "DDR4");
        renderCategoryUnavailable("sodimmSection", "Laptop RAM");
    }
    renderHeader("headerContainer");
    renderFooter("footerContainer");
}
init();
