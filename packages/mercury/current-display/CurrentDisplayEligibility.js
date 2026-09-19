const freeze = value => Object.freeze(value);

export function assessCurrentDisplayItemPriceEligibility({ condition, conditionReasons = [], availability, destinationId, publicDisplayAllowed = true, comparisonAllowed = true, weakItemPriceAllowed = false } = {}) {
    const sharedReasons = [];
    if (!destinationId) sharedReasons.push("DESTINATION_UNRESOLVED");
    if (availability !== "AVAILABLE") sharedReasons.push("AVAILABILITY_NOT_ELIGIBLE");
    if (publicDisplayAllowed !== true) sharedReasons.push("SOURCE_PUBLIC_DISPLAY_NOT_ALLOWED");
    const conditionBlocked = condition !== "NEW";
    const itemPriceReasons = [...sharedReasons];
    if (conditionBlocked && weakItemPriceAllowed !== true) itemPriceReasons.push(...(conditionReasons.length ? conditionReasons : ["CONDITION_NOT_ELIGIBLE"]));
    const comparisonReasons = [...sharedReasons];
    if (conditionBlocked) comparisonReasons.push(...(conditionReasons.length ? conditionReasons : ["CONDITION_NOT_ELIGIBLE"]));
    if (comparisonAllowed !== true) comparisonReasons.push("SOURCE_COMPARISON_NOT_ALLOWED");
    const uniqueItemPriceReasons = [...new Set(itemPriceReasons)];
    const uniqueComparisonReasons = [...new Set(comparisonReasons)];
    const itemPriceEligible = uniqueItemPriceReasons.length === 0;
    const comparisonEligible = uniqueComparisonReasons.length === 0;
    return freeze({
        itemPriceEligible,
        comparisonEligible,
        comparisonReasons: uniqueComparisonReasons,
        deliveredCostEligible: false,
        deliveredCostReasons: comparisonEligible ? ["SHIPPING_COST_UNKNOWN", "FEES_UNKNOWN"] : uniqueComparisonReasons
    });
}
