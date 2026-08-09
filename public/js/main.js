import { loadMarketSnapshot, scopeToDisplayProduct } from "./modules/marketData.js";
import { renderOverall, renderOverallUnavailable } from "./modules/renderOverall.js";
import { renderCategory, renderCategoryUnavailable } from "./modules/renderCategory.js";
import { renderTrust } from "./modules/renderTrust.js";
import { renderFooter } from "./modules/renderFooter.js";
import { renderHeader } from "./modules/renderHeader.js";

async function init() {
    try {
        const snapshot = await loadMarketSnapshot();
        const overall = scopeToDisplayProduct(snapshot.scopes.overall, "overall", "TODAY'S CHEAPEST RAM");
        if (overall) renderOverall([overall]); else renderOverallUnavailable("overallSection");

        const categories = [
            ["ddr5", "ddr5Section", "Cheapest DDR5", "More DDR5 Deals"],
            ["ddr4", "ddr4Section", "Cheapest DDR4", "More DDR4 Deals"],
            ["sodimm", "sodimmSection", "Cheapest SODIMM", "More Laptop RAM Deals"]
        ];
        for (const [section, containerId, title, linkText] of categories) {
            const product = scopeToDisplayProduct(snapshot.scopes[section], section, title);
            if (product) renderCategory([product], section, containerId, linkText);
            else renderCategoryUnavailable(containerId, title);
        }
        renderCategoryUnavailable("eccSection", "Server / ECC RAM");
        renderTrust();
    } catch (error) {
        console.error(error);
        renderOverallUnavailable("overallSection");
    }
    renderHeader("headerContainer");
    renderFooter("footerContainer");
}
init();
