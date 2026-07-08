import { loadCategory } from "../loadCategory.js";
import { renderRecommendation } from "../renderRecommendation.js";

import { renderExpandableComparison } from "../renderExpandableComparison.js";
import { renderDecisionPaths } from "../renderDecisionPaths.js";

async function init() {

    const deals = await loadCategory("data/ram/ddr5.json");
     const decisionPaths = [

        {
            icon: "🎮",
            title: "Need maximum gaming performance?",
            description: "Lowest-latency DDR5 kits selected for high-FPS gaming.",
            cta: "Explore Gaming Picks",
            link: "#"
        },

        {
            icon: "✨",
            title: "Building a showcase PC?",
            description: "The best RGB memory available today.",
            cta: "Explore RGB Picks",
            link: "#"
        },

        {
            icon: "🖥️",
            title: "Need reliability for work?",
            description: "High-capacity memory for creators and professionals.",
            cta: "Explore Workstation Picks",
            link: "#"
        }

    ];

    renderRecommendation(
        deals[0],
        "recommendationSection"
    );
    renderExpandableComparison(
    deals,
    "comparisonSection"
    );
     renderDecisionPaths(
        decisionPaths,
        "decisionPaths"
    );

}

init();