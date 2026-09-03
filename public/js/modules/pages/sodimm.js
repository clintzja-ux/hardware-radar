 import { loadCategory } from "../loadCategory.js";
 import { renderRecommendation, renderRecommendationError } from "../renderRecommendation.js";
 
 import { renderExpandableComparison } from "../renderExpandableComparison.js";
 import { renderBuyingAdvice } from "../renderBuyingAdvice.js";
 import { renderFAQ } from "../renderFAQ.js";
 import { renderFooter } from "../renderFooter.js";
 import { renderHeader } from "../renderHeader.js";
 
 async function init() {
 
     const buyingAdvice = {
         title: "Should you buy the cheapest qualifying Laptop RAM?",
         summary: "A qualifying listed price can be a useful starting point. Confirm laptop compatibility and the retailer's final checkout amount before buying.",
         points: [
          "Confirm the memory generation, form factor, capacity limit, and slot availability for your laptop.",
          "Treat the displayed amount as a listed price unless shipping and fees are explicitly verified.",
          "Compare the retailer's final checkout amount before buying."
         ]
     };
 
     const faq = [
 
         {
             question: "Is the cheapest qualifying Laptop RAM good enough?",
             answer: "It can be, provided its generation, capacity, module layout, and compatibility fit the laptop. Compare the qualifying listed offers and specifications before buying."
         },
 
         {
             question: "Is 32GB enough for gaming?",
              answer: "Yes. For modern games and multitasking, 32GB is an excellent choice and offers plenty of room for future titles."
         },
 
         {
             question: "Does RAM speed matter?",
             answer: "It can, but capacity and compatibility usually matter more than small speed differences. Compare the qualifying listed prices and specifications before paying extra for speed."
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
         const deals = await loadCategory("sodimm");
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
