export const STANDARD_RETAIL_NEW_CONDITION_POLICY_VERSION = "RETAIL-DISPLAY-002-1.0";

const BLOCKED = Object.freeze([
    ["REFURBISHED", /\brefurb(?:ished)?\b/i],
    ["RENEWED", /\brenewed\b/i],
    ["OPEN_BOX", /\bopen[ -]?box\b/i],
    ["USED", /\bused\b/i],
    ["PRE_OWNED", /\bpre[ -]?owned\b/i],
    ["REPLACEMENT_ONLY", /\breplacement(?: only)?\b/i],
    ["MIXED_OR_AMBIGUOUS_CONDITION", /\b(?:mixed condition|marketplace ambiguity|unclear condition|alternate condition)\b/i]
]);
const EXACT_PAGE = /^EXACT_PRODUCT_PAGE(?:_|$)/;
const supportedRetailer = value => value === "AMAZON" || value === "NEWEGG";
const freeze = value => Object.freeze(value);

export function assessStandardRetailNewCondition({ retailer, researchUrl, matchStatus, evidenceText = "", contradictoryCondition = false } = {}) {
    const context = [researchUrl, matchStatus, evidenceText].filter(Boolean).join(" ");
    if (contradictoryCondition) return freeze({ condition: null, eligible: false, reasons: ["CONDITION_CONTRADICTION"], policyVersion: STANDARD_RETAIL_NEW_CONDITION_POLICY_VERSION });
    if (!supportedRetailer(retailer)) return freeze({ condition: null, eligible: false, reasons: ["CONDITION_RETAILER_UNSUPPORTED"], policyVersion: STANDARD_RETAIL_NEW_CONDITION_POLICY_VERSION });
    if (!researchUrl || !EXACT_PAGE.test(matchStatus ?? "")) return freeze({ condition: null, eligible: false, reasons: ["CONDITION_STANDARD_PRODUCT_PAGE_NOT_ESTABLISHED"], policyVersion: STANDARD_RETAIL_NEW_CONDITION_POLICY_VERSION });
    for (const [label, pattern] of BLOCKED) {
        if (pattern.test(context)) return freeze({ condition: null, eligible: false, reasons: [`CONDITION_${label}`], policyVersion: STANDARD_RETAIL_NEW_CONDITION_POLICY_VERSION });
    }
    return freeze({ condition: "NEW", eligible: true, reasons: [], policyVersion: STANDARD_RETAIL_NEW_CONDITION_POLICY_VERSION });
}
