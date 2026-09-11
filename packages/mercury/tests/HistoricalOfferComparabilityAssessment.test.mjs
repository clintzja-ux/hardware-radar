import assert from "node:assert/strict";
import { assessHistoricalOfferComparability, HISTORICAL_OFFER_COMPARABILITY } from "../index.js";

const base = {
  evidenceId: "dfev_fixture_comparability",
  candidate: { marketEvidence: {
    pricing: { basePrice: 100, totalPrice: 100, shippingPrice: null, tax: null, currency: "USD" },
    offer: { details: "Exact standalone RAM module available to every purchaser", condition: null, availability: "in_stock" },
    productEvidence: { title: "Fixture RAM EXACT-MPN" }
  } }
};
const assess = overrides => {
  const record = structuredClone(base);
  if (overrides?.details !== undefined) record.candidate.marketEvidence.offer.details = overrides.details;
  if (overrides?.title !== undefined) record.candidate.marketEvidence.productEvidence.title = overrides.title;
  if (overrides?.basePrice !== undefined) record.candidate.marketEvidence.pricing.basePrice = overrides.basePrice;
  if (overrides?.totalPrice !== undefined) record.candidate.marketEvidence.pricing.totalPrice = overrides.totalPrice;
  if (overrides?.shippingPrice !== undefined) record.candidate.marketEvidence.pricing.shippingPrice = overrides.shippingPrice;
  return { record, result: assessHistoricalOfferComparability({ record }) };
};

let cases = 0;
const ordinary = assess();
assert.equal(ordinary.result.classification, HISTORICAL_OFFER_COMPARABILITY.STANDALONE_COMPARABLE); cases++;
assert.equal(ordinary.result.historicalStandaloneEligible, true); cases++;
assert.deepEqual(ordinary.result.reasons, []); cases++;

for (const fixture of [
  { details: "RAM and motherboard bundle", reason: "HISTORICAL_OFFER_BUNDLE_NOT_COMPARABLE" },
  { details: "RAM and motherboard bundle", basePrice: 1, totalPrice: 1, reason: "HISTORICAL_OFFER_BUNDLE_NOT_COMPARABLE" }
]) {
  const { result } = assess(fixture);
  assert.equal(result.classification, HISTORICAL_OFFER_COMPARABILITY.BUNDLE); cases++;
  assert.equal(result.historicalStandaloneEligible, false); cases++;
  assert.deepEqual(result.reasons, [fixture.reason]); cases++;
}

for (const details of ["Coupon code required", "Member price only", "Trade-in required", "Special financing required"]) {
  const { result } = assess({ details });
  assert.equal(result.classification, HISTORICAL_OFFER_COMPARABILITY.CONDITIONAL); cases++;
  assert.deepEqual(result.reasons, ["HISTORICAL_OFFER_CONDITIONAL_NOT_COMPARABLE"]); cases++;
}

const sale = assess({ details: "Public sale applies automatically to every purchaser" }).result;
assert.equal(sale.classification, HISTORICAL_OFFER_COMPARABILITY.STANDALONE_COMPARABLE); cases++;

const unknown = assess({ details: null, title: null }).result;
assert.equal(unknown.classification, HISTORICAL_OFFER_COMPARABILITY.UNKNOWN_COMPARABILITY); cases++;
assert.deepEqual(unknown.reasons, ["HISTORICAL_OFFER_COMPARABILITY_UNKNOWN"]); cases++;

assert.equal(ordinary.result.priceSemantics.shipping.known, false); cases++;
assert.equal(ordinary.result.priceSemantics.shipping.value, null); cases++;
assert.equal(ordinary.result.priceSemantics.deliveredPriceComparability, "ITEM_PRICE_ONLY"); cases++;
const zeroShipping = assess({ shippingPrice: 0 }).result;
assert.deepEqual(zeroShipping.priceSemantics.shipping, { known: true, value: 0 }); cases++;
assert.deepEqual(ordinary.result.priceSemantics.fees, { supportedByRetainedEvidenceModel: false, known: false, value: null }); cases++;
assert.deepEqual(ordinary.result.priceSemantics.providerTotal, { value: 100, semantics: "PROVIDER_REPORTED_TOTAL_UNVERIFIED_COMPOSITION", actionableAcquisitionCost: false }); cases++;

assert.deepEqual(assessHistoricalOfferComparability({ record: ordinary.record }), ordinary.result); cases++;
assert.deepEqual(ordinary.record, base); cases++;
assert.equal(Object.isFrozen(ordinary.result), true); cases++;
assert.equal(Object.isFrozen(ordinary.result.priceSemantics), true); cases++;

console.log(`Historical offer comparability assessment tests passed (${cases} cases).`);
