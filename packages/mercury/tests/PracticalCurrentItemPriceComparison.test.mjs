import assert from "node:assert/strict";
import { assessCurrentDisplayItemPriceEligibility } from "../current-display/CurrentDisplayEligibility.js";

let cases=0;const eq=(a,b)=>{assert.deepEqual(a,b);cases++;};
const assess=(overrides={})=>assessCurrentDisplayItemPriceEligibility({condition:null,conditionReasons:["CONDITION_UNKNOWN"],availability:"AVAILABLE",destinationId:"mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa",publicDisplayAllowed:true,comparisonAllowed:true,weakItemPriceAllowed:true,...overrides});
eq(assess().comparisonEligible,true);
eq(assess().deliveredCostEligible,false);
eq(assess().deliveredCostReasons,["SHIPPING_COST_UNKNOWN","FEES_UNKNOWN"]);
for(const condition of ["USED","REFURBISHED","OPEN_BOX"]){eq(assess({condition}).comparisonEligible,false);}
eq(assess({availability:"OUT_OF_STOCK"}).comparisonEligible,false);
eq(assess({destinationId:null}).comparisonEligible,false);
eq(assess({publicDisplayAllowed:false}).comparisonEligible,false);
eq(assess({comparisonAllowed:false}).comparisonEligible,false);
eq(assess({condition:"NEW"}).comparisonEligible,true);
eq(assess({condition:null,weakItemPriceAllowed:false}).comparisonEligible,false);
console.log(`Practical current item-price comparison tests passed: ${cases} cases.`);
