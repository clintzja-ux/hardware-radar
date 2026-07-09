 import { loadCategory } from "../loadCategory.js";
 import { renderRecommendation } from "../renderRecommendation.js";
 
 import { renderExpandableComparison } from "../renderExpandableComparison.js";
 import { renderDecisionPaths } from "../renderDecisionPaths.js";
 import { renderBuyingAdvice } from "../renderBuyingAdvice.js";
 import { renderFAQ } from "../renderFAQ.js";
 
 async function init() {
 
     const deals = await loadCategory("data/ram/sodimm.json");
      const decisionPaths = [
    {
        icon: "💻",
        title: "Need a laptop upgrade?",
        description: "Reliable, affordable memory upgrades for everyday laptops.",
        cta: "Explore Upgrade Picks",
        link: "#"
    },
    {
        icon: "🎮",
        title: "Gaming on a laptop?",
        description: "High-performance SODIMM memory selected for gaming laptops.",
        cta: "Explore Gaming Picks",
        link: "#"
    },
    {
        icon: "💼",
        title: "Buying for work?",
        description: "Stable, dependable memory for productivity and business laptops.",
        cta: "Explore Business Picks",
        link: "#"
    }
];
 
     const buyingAdvice = {
         title: "Should you buy today's cheapest Laptop RAM?",
         summary: "For most people, yes. Today's cheapest verified Laptop RAM pick offers strong everyday performance at the lowest price we found from trusted retailers.",
         points: [
          "Choose the cheapest pick if you want the best value today.",
          "Choose Gaming DDR5 if low latency matters more than lowest price.",
          "Choose RGB DDR5 if appearance matters for your build.",
          "Choose Workstation DDR5 if capacity and stability matter most."
         ]
     };
 
     const faq = [
 
         {
             question: "Is today's cheapest Laptop RAM good enough?",
             answer: "Yes. For most people, today's cheapest verified Laptop RAM delivers excellent value and performance for everyday use, gaming, and productivity."
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