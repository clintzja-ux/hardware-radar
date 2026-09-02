import crypto from "node:crypto";

export const SUPPLEMENTAL_CONDITION_EVIDENCE_SCHEMA_VERSION = "1.0";
export const SUPPLEMENTAL_CONDITION_EVIDENCE_STATUSES = Object.freeze(["ACTIVE", "SUPERSEDING"]);
export const CANONICAL_CONDITIONS = Object.freeze(["NEW", "USED", "OPEN_BOX", "MANUFACTURER_REFURBISHED", "SELLER_REFURBISHED", "UNKNOWN"]);
export const SUPPLEMENTAL_CONDITION_SOURCE_TYPES = Object.freeze(["PROVIDER", "RETAILER_API", "RETAILER_FEED", "RETAILER_PAGE", "OPERATOR_CURATED", "OTHER_GOVERNED"]);
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const hash = value => crypto.createHash("sha256").update(typeof value === "string" ? value : stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const optional = value => value == null || value === "" ? null : String(value).trim();
const validTime = value => nonBlank(value) && Number.isFinite(Date.parse(value));

export function normalizeExplicitCondition(value) {
    if (!nonBlank(value)) return "UNKNOWN";
    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    const aliases = { NEW: "NEW", BRAND_NEW: "NEW", USED: "USED", PRE_OWNED: "USED", OPEN_BOX: "OPEN_BOX", OPENED_BOX: "OPEN_BOX", MANUFACTURER_REFURBISHED: "MANUFACTURER_REFURBISHED", FACTORY_REFURBISHED: "MANUFACTURER_REFURBISHED", SELLER_REFURBISHED: "SELLER_REFURBISHED" };
    return aliases[normalized] ?? "UNKNOWN";
}

export function canonicalizeOfferUrl(value) {
    if (!nonBlank(value)) throw new TypeError("SUPPLEMENTAL_CONDITION_OFFER_URL_REQUIRED");
    let url; try { url = new URL(value); } catch { throw new TypeError("SUPPLEMENTAL_CONDITION_OFFER_URL_INVALID"); }
    if (!["http:", "https:"].includes(url.protocol)) throw new TypeError("SUPPLEMENTAL_CONDITION_OFFER_URL_INVALID");
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const tracking = new Set(["fbclid", "gclid", "msclkid", "srsltid", "fc"]);
    for (const key of [...url.searchParams.keys()]) if (key.toLowerCase().startsWith("utm_") || tracking.has(key.toLowerCase())) url.searchParams.delete(key);
    url.searchParams.sort();
    const path = (url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/");
    const query = url.searchParams.toString();
    return `https://${host}${path}${query ? `?${query}` : ""}`;
}

function material(record) {
    const copy = structuredClone(record); delete copy.supplementalEvidenceId; delete copy.materialFingerprint; delete copy.audit;
    return copy;
}
export const supplementalConditionMaterialFingerprint = record => hash(material(record));
export const supplementalConditionAcquisitionIdentity = record => `${record.source.sourceId}|${record.provenance.rawReference}`;

export function validateSupplementalConditionEvidence(value) {
    const errors = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) return freeze({ valid: false, errors: ["SUPPLEMENTAL_CONDITION_RECORD_REQUIRED"] });
    if (value.schemaVersion !== SUPPLEMENTAL_CONDITION_EVIDENCE_SCHEMA_VERSION || value.evidenceType !== "SUPPLEMENTAL_OFFER_CONDITION") errors.push("SUPPLEMENTAL_CONDITION_SCHEMA_INVALID");
    if (!/^mer_cond_[a-f0-9]{24}$/.test(value.supplementalEvidenceId ?? "") || !/^[a-f0-9]{64}$/.test(value.materialFingerprint ?? "")) errors.push("SUPPLEMENTAL_CONDITION_IDENTITY_INVALID");
    if (!nonBlank(value.product?.atlasProductId) || !nonBlank(value.product?.manufacturerPartNumber)) errors.push("SUPPLEMENTAL_CONDITION_PRODUCT_BINDING_INVALID");
    if (!/^RETAILER-\d{4}$/.test(value.merchant?.retailerId ?? "") || !/^[a-z0-9.-]+$/.test(value.merchant?.marketplace ?? "") || !nonBlank(value.merchant?.sellerName)) errors.push("SUPPLEMENTAL_CONDITION_MERCHANT_BINDING_INVALID");
    try { if (canonicalizeOfferUrl(value.offer?.canonicalUrl) !== value.offer?.canonicalUrl) errors.push("SUPPLEMENTAL_CONDITION_URL_NOT_CANONICAL"); } catch { errors.push("SUPPLEMENTAL_CONDITION_URL_INVALID"); }
    if (!nonBlank(value.offer?.variantClass) || !["STANDALONE", "BUNDLE"].includes(value.offer?.bundleClass)) errors.push("SUPPLEMENTAL_CONDITION_OFFER_CLASS_INVALID");
    if (!(value.condition?.rawAssertion === null || typeof value.condition?.rawAssertion === "string") || !CANONICAL_CONDITIONS.includes(value.condition?.normalized) || normalizeExplicitCondition(value.condition?.rawAssertion) !== value.condition?.normalized) errors.push("SUPPLEMENTAL_CONDITION_ASSERTION_INVALID");
    if (!validTime(value.temporal?.observedAt) || !validTime(value.temporal?.retrievedAt) || Date.parse(value.temporal.retrievedAt) < Date.parse(value.temporal.observedAt)) errors.push("SUPPLEMENTAL_CONDITION_TEMPORAL_INVALID");
    if (!nonBlank(value.source?.sourceId) || !SUPPLEMENTAL_CONDITION_SOURCE_TYPES.includes(value.source?.sourceType)) errors.push("SUPPLEMENTAL_CONDITION_SOURCE_INVALID");
    if (!["rawReference", "collectorId", "adapterId", "adapterVersion"].every(key => nonBlank(value.provenance?.[key]))) errors.push("SUPPLEMENTAL_CONDITION_PROVENANCE_INVALID");
    if (!nonBlank(value.rights?.sourceRightsId) || !/^[a-f0-9]{64}$/.test(value.rights?.profileHash ?? "")) errors.push("SUPPLEMENTAL_CONDITION_RIGHTS_INVALID");
    if (!/^dfev_[a-f0-9]{24}$/.test(value.binding?.primaryEvidenceId ?? "") || !/^mer_obs_\d{9}$/.test(value.binding?.canonicalObservationId ?? "")) errors.push("SUPPLEMENTAL_CONDITION_LINEAGE_INVALID");
    if (value.validation?.status !== "PASS" || !nonBlank(value.validation?.validatorVersion) || !validTime(value.audit?.createdAt) || !nonBlank(value.audit?.createdBy)) errors.push("SUPPLEMENTAL_CONDITION_AUDIT_INVALID");
    if (!SUPPLEMENTAL_CONDITION_EVIDENCE_STATUSES.includes(value.lifecycle?.status) || (value.lifecycle?.supersedesEvidenceId !== null && !/^mer_cond_[a-f0-9]{24}$/.test(value.lifecycle?.supersedesEvidenceId ?? ""))) errors.push("SUPPLEMENTAL_CONDITION_LIFECYCLE_INVALID");
    if (value.materialFingerprint !== supplementalConditionMaterialFingerprint(value)) errors.push("SUPPLEMENTAL_CONDITION_FINGERPRINT_INVALID");
    if (value.supplementalEvidenceId !== `mer_cond_${hash(supplementalConditionAcquisitionIdentity(value)).slice(0,24)}`) errors.push("SUPPLEMENTAL_CONDITION_ID_INVALID");
    return freeze({ valid: errors.length === 0, errors: [...new Set(errors)] });
}

export function createSupplementalConditionEvidence(input = {}) {
    const rawAssertion = nonBlank(input.condition?.rawAssertion) ? input.condition.rawAssertion.trim() : null;
    const record = {
        schemaVersion: SUPPLEMENTAL_CONDITION_EVIDENCE_SCHEMA_VERSION, evidenceType: "SUPPLEMENTAL_OFFER_CONDITION",
        supplementalEvidenceId: "", materialFingerprint: "",
        product: { atlasProductId: input.product?.atlasProductId, manufacturerPartNumber: input.product?.manufacturerPartNumber },
        merchant: { retailerId: input.merchant?.retailerId, marketplace: String(input.merchant?.marketplace ?? "").toLowerCase().replace(/^www\./, ""), sellerName: input.merchant?.sellerName },
        offer: { canonicalUrl: canonicalizeOfferUrl(input.offer?.url ?? input.offer?.canonicalUrl), retailerListingId: optional(input.offer?.retailerListingId), sourceListingId: optional(input.offer?.sourceListingId), variantClass: input.offer?.variantClass, bundleClass: input.offer?.bundleClass },
        condition: { rawAssertion, normalized: normalizeExplicitCondition(rawAssertion) },
        temporal: { observedAt: input.temporal?.observedAt, retrievedAt: input.temporal?.retrievedAt },
        source: { sourceId: input.source?.sourceId, sourceType: input.source?.sourceType },
        provenance: { rawReference: input.provenance?.rawReference, collectorId: input.provenance?.collectorId, adapterId: input.provenance?.adapterId, adapterVersion: input.provenance?.adapterVersion },
        rights: { sourceRightsId: input.rights?.sourceRightsId, profileHash: input.rights?.profileHash },
        binding: { primaryEvidenceId: input.binding?.primaryEvidenceId, canonicalObservationId: input.binding?.canonicalObservationId },
        validation: { status: input.validation?.status, validatorVersion: input.validation?.validatorVersion },
        lifecycle: { status: input.lifecycle?.supersedesEvidenceId ? "SUPERSEDING" : "ACTIVE", supersedesEvidenceId: input.lifecycle?.supersedesEvidenceId ?? null },
        audit: { createdAt: input.audit?.createdAt, createdBy: input.audit?.createdBy }
    };
    record.supplementalEvidenceId = `mer_cond_${hash(supplementalConditionAcquisitionIdentity(record)).slice(0,24)}`;
    record.materialFingerprint = supplementalConditionMaterialFingerprint(record);
    const report = validateSupplementalConditionEvidence(record); if (!report.valid) throw new TypeError(report.errors.join(","));
    return freeze(record);
}

export const supplementalConditionStableHash = hash;
