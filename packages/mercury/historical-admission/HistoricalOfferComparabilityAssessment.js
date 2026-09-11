import crypto from "node:crypto";

export const HISTORICAL_OFFER_COMPARABILITY_POLICY_VERSION = "MERCURY-HISTORY-018-1.0";
export const HISTORICAL_OFFER_COMPARABILITY = Object.freeze({
  STANDALONE_COMPARABLE: "STANDALONE_COMPARABLE",
  BUNDLE: "BUNDLE",
  CONDITIONAL: "CONDITIONAL",
  UNKNOWN_COMPARABILITY: "UNKNOWN_COMPARABILITY"
});

const BUNDLE_PATTERNS = Object.freeze([
  /\bBUNDLE\b/i,
  /\bCOMBO\b/i,
  /\bWITH\s+(?:A\s+)?(?:CPU|PROCESSOR|MOTHERBOARD|COOLER|HEADSET|KEYBOARD|MOUSE|ACCESSORY)\b/i,
  /\bINCLUDES?\s+(?:A\s+)?(?:CPU|PROCESSOR|MOTHERBOARD|COOLER|HEADSET|KEYBOARD|MOUSE|ACCESSORY)\b/i
]);
const CONDITIONAL_PATTERNS = Object.freeze([
  /\bCOUPON\b/i,
  /\bPROMO(?:TIONAL)?\s+CODE\b/i,
  /\bMEMBER(?:SHIP)?(?:S|\s+ONLY|\s+PRICE)?\b/i,
  /\bSUBSCRI(?:BE|PTION)\b/i,
  /\bTRADE[ -]?IN\b/i,
  /\bFINANC(?:E|ING)\b/i,
  /\bLOYALTY\b/i,
  /\bQUANTITY\s+(?:DISCOUNT|MINIMUM|THRESHOLD)\b/i,
  /\bBUY\s+\d+\s+(?:OR\s+MORE|GET\s+\d+)\b/i
]);

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const text = value => typeof value === "string" && value.trim() ? value.trim() : null;
const finiteNonNegative = value => typeof value === "number" && Number.isFinite(value) && value >= 0;

function signalsFor(evidence) {
  const values = [
    ["offer.details", text(evidence?.offer?.details)],
    ["productEvidence.title", text(evidence?.productEvidence?.title)]
  ].filter(([, value]) => value !== null);
  const matches = (patterns) => values.flatMap(([field, value]) => patterns.filter(pattern => pattern.test(value)).map(pattern => ({ field, value, pattern: pattern.source })));
  return { descriptiveEvidence: values.map(([field]) => field), bundle: matches(BUNDLE_PATTERNS), conditional: matches(CONDITIONAL_PATTERNS) };
}

export function assessHistoricalOfferComparability({ record } = {}) {
  const evidence = record?.candidate?.marketEvidence;
  if (!record || typeof record !== "object" || !evidence || typeof evidence !== "object") {
    const material = { policyVersion: HISTORICAL_OFFER_COMPARABILITY_POLICY_VERSION, evidenceId: record?.evidenceId ?? null, classification: HISTORICAL_OFFER_COMPARABILITY.UNKNOWN_COMPARABILITY, reasons: ["HISTORICAL_OFFER_COMPARABILITY_UNKNOWN"] };
    return freeze({ schemaVersion: "1.0", assessmentType: "HISTORICAL_OFFER_COMPARABILITY", ...material, assessmentId: `mer_histcompare_${digest(material).slice(0,24)}`, historicalStandaloneEligible: false, evidenceSignals: { descriptiveEvidence: [], bundle: [], conditional: [] }, priceSemantics: null });
  }

  const signals = signalsFor(evidence);
  let classification = HISTORICAL_OFFER_COMPARABILITY.STANDALONE_COMPARABLE;
  let reasons = [];
  if (signals.bundle.length) {
    classification = HISTORICAL_OFFER_COMPARABILITY.BUNDLE;
    reasons = ["HISTORICAL_OFFER_BUNDLE_NOT_COMPARABLE"];
  } else if (signals.conditional.length) {
    classification = HISTORICAL_OFFER_COMPARABILITY.CONDITIONAL;
    reasons = ["HISTORICAL_OFFER_CONDITIONAL_NOT_COMPARABLE"];
  } else if (!signals.descriptiveEvidence.length) {
    classification = HISTORICAL_OFFER_COMPARABILITY.UNKNOWN_COMPARABILITY;
    reasons = ["HISTORICAL_OFFER_COMPARABILITY_UNKNOWN"];
  }

  const pricing = evidence.pricing ?? {};
  const shippingKnown = finiteNonNegative(pricing.shippingPrice);
  const taxKnown = finiteNonNegative(pricing.tax);
  const priceSemantics = {
    itemPrice: pricing.basePrice ?? null,
    itemPriceComparable: classification === HISTORICAL_OFFER_COMPARABILITY.STANDALONE_COMPARABLE,
    shipping: { known: shippingKnown, value: shippingKnown ? pricing.shippingPrice : null },
    tax: { known: taxKnown, value: taxKnown ? pricing.tax : null },
    fees: { supportedByRetainedEvidenceModel: false, known: false, value: null },
    providerTotal: { value: pricing.totalPrice ?? null, semantics: "PROVIDER_REPORTED_TOTAL_UNVERIFIED_COMPOSITION", actionableAcquisitionCost: false },
    deliveredPriceComparability: "ITEM_PRICE_ONLY"
  };
  const material = { policyVersion: HISTORICAL_OFFER_COMPARABILITY_POLICY_VERSION, evidenceId: record.evidenceId ?? null, classification, reasons, evidenceSignals: signals, priceSemantics };
  return freeze({ schemaVersion: "1.0", assessmentType: "HISTORICAL_OFFER_COMPARABILITY", ...material, assessmentId: `mer_histcompare_${digest(material).slice(0,24)}`, historicalStandaloneEligible: classification === HISTORICAL_OFFER_COMPARABILITY.STANDALONE_COMPARABLE });
}

export default assessHistoricalOfferComparability;
