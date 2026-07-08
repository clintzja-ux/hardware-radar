import { loadCategory } from "../loadCategory.js";
import { renderRecommendation } from "../renderRecommendation.js";

import { renderExpandableComparison } from "../renderExpandableComparison.js";
import { renderDecisionPaths } from "../renderDecisionPaths.js";
import { renderBuyingAdvice } from "../renderBuyingAdvice.js";
import { renderFAQ } from "../renderFAQ.js";

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

    const buyingAdvice = {
        title: "Should you buy today's cheapest DDR5?",
        summary: "For most people, yes. Today's cheapest verified DDR5 pick offers strong everyday performance at the lowest price we found from trusted retailers.",
        points: [
         "Choose the cheapest pick if you want the best value today.",
         "Choose Gaming DDR5 if low latency matters more than lowest price.",
         "Choose RGB DDR5 if appearance matters for your build.",
         "Choose Workstation DDR5 if capacity and stability matter most."
        ]
    };

    const faq = [

        {
            question: "Is today's cheapest DDR5 RAM good enough?",
            answer: "Yes. For most people, today's cheapest verified DDR5 delivers excellent value and performance for everyday use, gaming, and productivity."
        },

        {
            question: "Is 32GB enough for gaming?",
             answer: "Yes. For modern games and multitasking, 32GB is an excellent choice and offers plenty of room for future titles."
        },

        {
            question: "Does RAM speed matter?",
            answer: "It can, but for most users capacity matters more than small speed differences. Start with the best value kit before paying extra for faster speeds."
        },

        {
             question: "Should I buy RGB RAM?",
            answer: "Choose RGB RAM if appearance is important to your build. Performance is generally similar to non-RGB kits at the same specifications."
        },

        {
             question: "How often does Hardware Radar update prices?",
            answer: "Hardware Radar regularly checks trusted retailers to help you find today's cheapest verified prices."
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
    renderBuyingAdvice(
        buyingAdvice,
         "buyingAdviceSection"
    );
    renderFAQ(
        faq,
        "faqSection"
    );


}

init();