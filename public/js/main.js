import { loadMarketSnapshot, scopeToDisplayProduct } from "./modules/marketData.js";
import { renderOverall, renderOverallUnavailable } from "./modules/renderOverall.js";
import { renderCategory, renderCategoryUnavailable } from "./modules/renderCategory.js";
import { renderTrust } from "./modules/renderTrust.js";
import { renderFooter } from "./modules/renderFooter.js";
import { renderHeader } from "./modules/renderHeader.js";

async function init() {
    try {
        const snapshot = await loadMarketSnapshot();
        const overall = scopeToDisplayProduct(snapshot.scopes.overall, "overall", "Cheapest RAM we're tracking");
        if (overall) renderOverall([overall]); else renderOverallUnavailable("overallSection");

        const categories = [
            ["ddr5", "ddr5Section", "Cheapest DDR5 we're tracking", "More DDR5 Deals"],
            ["ddr4", "ddr4Section", "Cheapest DDR4 we're tracking", "More DDR4 Deals"],
            ["sodimm", "sodimmSection", "Cheapest Laptop RAM we're tracking", "More Laptop RAM Deals"]
        ];
        for (const [section, containerId, title, linkText] of categories) {
            const product = scopeToDisplayProduct(snapshot.scopes[section], section, title);
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
