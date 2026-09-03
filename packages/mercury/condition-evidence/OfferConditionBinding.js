import { canonicalizeOfferUrl, supplementalConditionStableHash } from "./SupplementalConditionEvidence.js";
const norm = value => String(value ?? "").trim().toLowerCase().replace(/^www\./, "");
const freeze = value => Object.freeze(value);
export function validateSupplementalOfferBinding({ record, canonicalObservation, primaryEvidence, atlasProduct, primaryOfferIdentity } = {}) {
    const reasons = [];
    const market = primaryEvidence?.candidate?.marketEvidence, identity = primaryEvidence?.candidate?.identity;
    if (!record || !canonicalObservation || !market || !atlasProduct || !primaryOfferIdentity) return freeze({ valid: false, reasons: ["SUPPLEMENTAL_OFFER_BINDING_INPUT_INCOMPLETE"], bindingDigest: null });
    if (record.binding.canonicalObservationId !== canonicalObservation.observationId || record.binding.primaryEvidenceId !== primaryEvidence.evidenceId) reasons.push("SUPPLEMENTAL_OFFER_LINEAGE_MISMATCH");
    if (record.product.atlasProductId !== canonicalObservation.atlasProductId || record.product.atlasProductId !== identity?.atlasProductId || record.product.atlasProductId !== atlasProduct.identity?.atlasProductId) reasons.push("SUPPLEMENTAL_OFFER_PRODUCT_MISMATCH");
    if (norm(record.product.manufacturerPartNumber) !== norm(atlasProduct.identity?.manufacturerPartNumber)) reasons.push("SUPPLEMENTAL_OFFER_MPN_MISMATCH");
    if (record.merchant.retailerId !== canonicalObservation.retailerId) reasons.push("SUPPLEMENTAL_OFFER_RETAILER_MISMATCH");
    if (norm(record.merchant.marketplace) !== norm(canonicalObservation.marketplace) || norm(record.merchant.marketplace) !== norm(market.seller?.domain)) reasons.push("SUPPLEMENTAL_OFFER_MARKETPLACE_MISMATCH");
    if (norm(record.merchant.sellerName) !== norm(market.seller?.name)) reasons.push("SUPPLEMENTAL_OFFER_SELLER_MISMATCH");
    try { const primaryUrls = [canonicalObservation.offer?.sourceUrl, market.seller?.url].map(canonicalizeOfferUrl); if (!primaryUrls.every(url => url === record.offer.canonicalUrl)) reasons.push("SUPPLEMENTAL_OFFER_URL_MISMATCH"); } catch { reasons.push("SUPPLEMENTAL_OFFER_URL_MISMATCH"); }
    for (const field of ["retailerListingId", "sourceListingId"]) if (record.offer[field] !== null && record.offer[field] !== primaryOfferIdentity[field]) reasons.push(`SUPPLEMENTAL_OFFER_${field === "retailerListingId" ? "RETAILER_LISTING" : "SOURCE_LISTING"}_MISMATCH`);
    if (record.offer.variantClass !== primaryOfferIdentity.variantClass) reasons.push("SUPPLEMENTAL_OFFER_VARIANT_MISMATCH");
    if (record.offer.bundleClass !== primaryOfferIdentity.bundleClass) reasons.push("SUPPLEMENTAL_OFFER_BUNDLE_MISMATCH");
    const binding = { canonicalObservationId: canonicalObservation.observationId, primaryEvidenceId: primaryEvidence.evidenceId, atlasProductId: record.product.atlasProductId, manufacturerPartNumber: record.product.manufacturerPartNumber, retailerId: record.merchant.retailerId, marketplace: record.merchant.marketplace, sellerName: record.merchant.sellerName, canonicalUrl: record.offer.canonicalUrl, retailerListingId: record.offer.retailerListingId, sourceListingId: record.offer.sourceListingId, variantClass: record.offer.variantClass, bundleClass: record.offer.bundleClass };
    return freeze({ valid: reasons.length === 0, reasons: [...new Set(reasons)], bindingDigest: supplementalConditionStableHash(binding) });
}
