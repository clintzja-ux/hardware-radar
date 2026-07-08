import { loadCategory } from "../loadCategory.js";
import { renderRecommendation } from "../renderRecommendation.js";

import { renderExpandableComparison } from "../renderExpandableComparison.js";
async function init() {

    const deals = await loadCategory("data/ram/ddr5.json");

    renderRecommendation(
        deals[0],
        "recommendationSection"
    );
    renderExpandableComparison(
    deals,
    "comparisonSection"
    );

}

init();