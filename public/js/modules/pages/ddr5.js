import { loadCategory } from "../loadCategory.js";
import { renderRecommendation, renderRecommendationError } from "../renderRecommendation.js";

import { renderExpandableComparison } from "../renderExpandableComparison.js";
import { renderBuyingAdvice } from "../renderBuyingAdvice.js";
import { renderFAQ } from "../renderFAQ.js";
import { renderFooter } from "../renderFooter.js";
import { renderHeader } from "../renderHeader.js";

async function init() {

    const buyingAdvice = {
        title: "Should you buy the cheapest qualifying DDR5?",
        summary: "When qualifying current pricing is available, Hardware Radar highlights the lowest eligible offer from trusted retailers. Compare capacity, compatibility, and performance before buying.",
        points: [
         "Check that capacity, speed, and motherboard compatibility fit your system.",
         "Treat the displayed amount as a listed price unless shipping and fees are explicitly verified.",
         "Compare the retailer's final checkout amount before buying."
        ]
    };

    const faq = [

        {
            question: "Is the cheapest qualifying DDR5 RAM good enough?",
            answer: "The cheapest qualifying DDR5 option can be a strong value, provided its capacity, speed, and compatibility fit your system."
        },

        {
            question: "Is 32GB enough for gaming?",
             answer: "Yes. For modern games and multitasking, 32GB is an excellent choice and offers plenty of room for future titles."
        },

        {
            question: "Does RAM speed matter?",
            answer: "It can, but for most users capacity matters more than small speed differences. Compare capacity, compatibility, timings, and the qualifying listed prices before paying extra for speed."
        },

        {
             question: "Should I buy RGB RAM?",
            answer: "Choose RGB RAM if appearance is important to your build. Performance is generally similar to non-RGB kits at the same specifications."
        },

        {
             question: "How often does Hardware Radar update prices?",
            answer: "Hardware Radar publishes retailer observations only when they meet the platform's validation, freshness, and confidence requirements."
        }

];

    try {
        const deals = await loadCategory("ddr5");
        renderRecommendation(deals[0], "recommendationSection");
        renderExpandableComparison(deals, "comparisonSection");
    } catch (error) {
        console.error(error);
        renderRecommendationError("recommendationSection");
        renderExpandableComparison([], "comparisonSection");
    }
    renderBuyingAdvice(
        buyingAdvice,
         "buyingAdviceSection"
    );
    renderFAQ(
        faq,
        "faqSection"
    );

    renderHeader("headerContainer");

    renderFooter("footerContainer");


}

init();
