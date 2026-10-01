import crypto from "node:crypto";
import { validateProduct } from "./ProductValidator.js";

export const ATLAS_BATCH_REVIEW_POLICY_VERSION = "ATLAS-ACTIVATION-001-1.0";
export const ATLAS_EXPANSION_REVIEW_SOURCE = "system:atlas-ram-expansion-002";

const stable = value => Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value && typeof value === "object"
        ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`
        : JSON.stringify(value);
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const clone = value => structuredClone(value);
const freeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
};
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const iso = value => nonBlank(value) && Number.isFinite(Date.parse(value));

function reviewBlockers(product, registeredBrands) {
    const blockers = [];
    if (!product?.identity?.atlasProductId) blockers.push("ATLAS_PRODUCT_ID_MISSING");
    if (product?.identity?.createdBy !== ATLAS_EXPANSION_REVIEW_SOURCE) blockers.push("PRODUCT_NOT_IN_AUTHORIZED_EXPANSION_SET");
    if (!registeredBrands.has(product?.identity?.brand)) blockers.push("MANUFACTURER_NOT_REGISTERED");
    if (!nonBlank(product?.identity?.manufacturerPartNumber)) blockers.push("MANUFACTURER_PART_NUMBER_MISSING");
    if (product?.governance?.engineeringValidationStatus !== "PASS") blockers.push("ENGINEERING_VALIDATION_NOT_PASS");
    if (product?.governance?.lifecycleStatus !== "DRAFT" || product?.governance?.publicationStatus !== "PENDING" || product?.governance?.humanReviewRequired !== true) blockers.push("LIFECYCLE_NOT_REVIEW_ELIGIBLE");
    const capacity = product?.extension?.data?.capacity;
    if (!capacity || capacity.capacityGb !== capacity.moduleCount * capacity.capacityPerModuleGb) blockers.push("CAPACITY_INVARIANT_FAILED");
    if (!validateProduct(product).valid) blockers.push("ATLAS_SCHEMA_INVALID");
    return [...new Set(blockers)];
}

export function reviewAtlasExpansionBatch({ products, brands, reviewedBy, reviewedAt, reason } = {}) {
    if (!Array.isArray(products) || !Array.isArray(brands) || !nonBlank(reviewedBy) || !iso(reviewedAt) || !nonBlank(reason)) throw new TypeError("ATLAS_BATCH_REVIEW_INPUT_INVALID");
    const registeredBrands = new Set(brands.map(brand => brand?.displayName).filter(nonBlank));
    const reviewSet = products.filter(product => product?.identity?.createdBy === ATLAS_EXPANSION_REVIEW_SOURCE).sort((a, b) => a.identity.atlasProductId.localeCompare(b.identity.atlasProductId));
    if (reviewSet.length !== 77 || new Set(reviewSet.map(product => product.identity.atlasProductId)).size !== 77) throw new Error("ATLAS_EXPANSION_REVIEW_SET_INVALID");

    const outcomes = reviewSet.map(product => {
        const blockers = reviewBlockers(product, registeredBrands);
        if (blockers.length) return { atlasProductId: product.identity.atlasProductId, status: "BLOCKED", blockers, product: clone(product) };
        return {
            atlasProductId: product.identity.atlasProductId,
            status: "ACTIVATED",
            blockers: [],
            product: {
                ...clone(product),
                identity: { ...clone(product.identity), recordRevision: product.identity.recordRevision + 1, updatedAt: reviewedAt, updatedBy: reviewedBy },
                governance: {
                    ...clone(product.governance),
                    lifecycleStatus: "ACTIVE",
                    publicationStatus: "READY",
                    humanReviewRequired: false,
                    reviewedBy,
                    reviewedAt,
                    changeReason: reason
                }
            }
        };
    });
    const auditMaterial = {
        policyVersion: ATLAS_BATCH_REVIEW_POLICY_VERSION,
        subjectType: "ATLAS_PRODUCT_LIFECYCLE_BATCH",
        sourceSet: ATLAS_EXPANSION_REVIEW_SOURCE,
        reviewedBy,
        reviewedAt,
        reason,
        products: outcomes.map(({ atlasProductId, status, blockers, product }) => ({ atlasProductId, status, blockers, priorRevision: status === "ACTIVATED" ? product.identity.recordRevision - 1 : product.identity.recordRevision, resultingRevision: product.identity.recordRevision }))
    };
    const decision = {
        schemaVersion: "1.0",
        decisionId: `atlas_batchreview_${hash(auditMaterial).slice(0, 24)}`,
        ...auditMaterial,
        counts: { requested: reviewSet.length, activated: outcomes.filter(item => item.status === "ACTIVATED").length, blocked: outcomes.filter(item => item.status === "BLOCKED").length },
        downstreamAuthority: { acquisition: false, historical: false, canonical: false, review: false, publication: false, currentPrice: false, cheapest: false, pick: false, affiliate: false },
        providerOperations: 0,
        actualSpendUsd: 0
    };
    return freeze({ decision, outcomes });
}
