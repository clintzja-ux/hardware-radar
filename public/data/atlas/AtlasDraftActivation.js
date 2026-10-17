import { validateProduct, validateRepository } from "./ProductValidator.js";

export const ATLAS_DRAFT_ACTIVATION_POLICY_VERSION = "ATLAS-DRAFT-ACTIVATION-1.0";

const clone = value => structuredClone(value);
const freeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
};
const nonBlank = value => typeof value === "string" && value.trim().length > 0;
const manufacturerEvidence = product => product?.provenance?.fieldSources?.["identity.manufacturerPartNumber"] ?? [];
const validEvidence = source => {
    try {
        const url = new URL(source?.sourceLocator);
        return url.protocol === "https:" && !url.username && !url.password && String(source?.sourceType ?? "").startsWith("MANUFACTURER_") && source?.verificationStatus === "VERIFIED";
    } catch { return false; }
};

export function assessAtlasDraftActivationReadiness({ product, products, brands } = {}) {
    if (!product || !Array.isArray(products) || !Array.isArray(brands)) throw new TypeError("ATLAS_DRAFT_ACTIVATION_INPUT_INVALID");
    const checks = [], blockers = [], reviews = [];
    const check = (code, passed, detail) => { checks.push({ code, passed, detail }); if (!passed) blockers.push(code); };
    const alreadyActive = product.governance?.lifecycleStatus === "ACTIVE" && product.governance?.publicationStatus === "READY";
    if (alreadyActive) return freeze({ policyVersion: ATLAS_DRAFT_ACTIVATION_POLICY_VERSION, status: "ALREADY_ACTIVE", eligible: false, atlasProductId: product.identity.atlasProductId, recordRevision: product.identity.recordRevision, checks: [], reviews: [], blockers: [] });
    check("DRAFT_PENDING_PREDECESSOR", product.governance?.lifecycleStatus === "DRAFT" && product.governance?.publicationStatus === "PENDING" && product.governance?.humanReviewRequired === true, "Activation requires DRAFT / PENDING with human review outstanding.");
    check("ENGINEERING_VALIDATION_PASS", product.governance?.engineeringValidationStatus === "PASS", "Engineering validation must be PASS.");
    check("CANONICAL_IDENTITY_PRESENT", nonBlank(product.identity?.atlasProductId) && nonBlank(product.identity?.manufacturer) && nonBlank(product.identity?.manufacturerPartNumber), "Canonical product ID, manufacturer, and MPN are required.");
    check("MANUFACTURER_REGISTERED", brands.some(brand => [brand.displayName, ...(brand.aliases ?? [])].some(name => String(name).toLowerCase() === String(product.identity?.manufacturer).toLowerCase())), "Manufacturer must be registered in Atlas.");
    check("MANUFACTURER_EVIDENCE_VERIFIED", manufacturerEvidence(product).some(validEvidence), "At least one verified HTTPS manufacturer source must support the MPN.");
    const capacity = product.extension?.data?.capacity;
    check("CAPACITY_INVARIANT_VALID", Boolean(capacity) && capacity.capacityGb === capacity.moduleCount * capacity.capacityPerModuleGb, "Total capacity must equal module count × per-module capacity.");
    check("PRODUCT_SCHEMA_VALID", validateProduct(product).valid, "The canonical product must pass the Atlas product schema.");
    check("REPOSITORY_IDENTITY_UNIQUE", validateRepository(products).valid, "The Atlas repository must have unique IDs, slugs, and manufacturer/MPN identities.");
    if (product.governance?.humanReviewRequired === true) reviews.push("OPERATOR_ACTIVATION_REVIEW_REQUIRED");
    return freeze({ policyVersion: ATLAS_DRAFT_ACTIVATION_POLICY_VERSION, status: blockers.length ? "BLOCKED" : "READY_TO_ACTIVATE", eligible: blockers.length === 0, atlasProductId: product.identity.atlasProductId, recordRevision: product.identity.recordRevision, checks, reviews, blockers: [...new Set(blockers)] });
}

export function createActivatedAtlasProduct({ product, reviewedBy, reviewedAt, reason = "Governed Forge operator DRAFT activation." } = {}) {
    if (!product || !nonBlank(reviewedBy) || !Number.isFinite(Date.parse(reviewedAt)) || !nonBlank(reason)) throw new TypeError("ATLAS_DRAFT_ACTIVATION_DECISION_INVALID");
    const activated = clone(product);
    activated.identity.recordRevision += 1;
    activated.identity.updatedAt = reviewedAt;
    activated.identity.updatedBy = reviewedBy;
    activated.governance = { ...activated.governance, lifecycleStatus: "ACTIVE", publicationStatus: "READY", humanReviewRequired: false, reviewedBy, reviewedAt, changeReason: reason };
    activated.validation = { ...activated.validation, validatedAt: reviewedAt };
    return freeze(activated);
}
