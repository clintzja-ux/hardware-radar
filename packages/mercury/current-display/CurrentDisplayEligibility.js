const freeze = value => Object.freeze(value);

export function assessCurrentDisplayItemPriceEligibility({ condition, conditionReasons = [], availability, destinationId, publicDisplayAllowed = true, comparisonAllowed = true } = {}) {
    const reasons = [];
    if (condition !== "NEW") reasons.push(...(conditionReasons.length ? conditionReasons : ["CONDITION_NOT_ELIGIBLE"]));
    if (!destinationId) reasons.push("DESTINATION_UNRESOLVED");
    if (availability !== "AVAILABLE") reasons.push("AVAILABILITY_NOT_ELIGIBLE");
    if (publicDisplayAllowed !== true) reasons.push("SOURCE_PUBLIC_DISPLAY_NOT_ALLOWED");
    if (comparisonAllowed !== true) reasons.push("SOURCE_COMPARISON_NOT_ALLOWED");
    const comparisonReasons = [...new Set(reasons)];
    const itemPriceEligible = comparisonReasons.length === 0;
    return freeze({
        itemPriceEligible,
        comparisonEligible: itemPriceEligible,
        comparisonReasons,
        deliveredCostEligible: false,
        deliveredCostReasons: itemPriceEligible ? ["SHIPPING_COST_UNKNOWN", "FEES_UNKNOWN"] : comparisonReasons
    });
}
