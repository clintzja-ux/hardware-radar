import crypto from "node:crypto";
import { validateProduct } from "./ProductValidator.js";

export const ATLAS_PRE_EXPANSION_REVIEW_POLICY_VERSION = "ATLAS-ACTIVATION-002-1.0";
export const ATLAS_PRE_EXPANSION_REVIEW_SOURCE = "system:d002-fixture-certification";
export const ATLAS_PRE_EXPANSION_PRODUCT_IDS = Object.freeze([
    "ram_corsair_cmk32gx4m2e3200c16", "ram_corsair_cmk96gx5m2b6000c30", "ram_corsair_cmsx32gx5m1a5600c48",
    "ram_crucial_cp2k32g56c46u5", "ram_crucial_ct16g4dfra32a", "ram_crucial_ct32g56c46u5", "ram_crucial_ct8g4sfra32a",
    "ram_g_skill_f4_3200c22d_32grs", "ram_g_skill_f5_6000j3038f16gx2_fx5", "ram_g_skill_f5_6000j3040g32gx2_tz5n",
    "ram_kingston_kf432c16bbk2_16", "ram_kingston_kf436c16rb12k2_32", "ram_kingston_kf556s40ibk2_64",
    "ram_kingston_kf572c38rsk2_32", "ram_kingston_kvr32s22s8_16"
]);

const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const iso = value => nonBlank(value) && Number.isFinite(Date.parse(value));
const freeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
};

function blockers(product, registeredBrands) {
    const result = [];
    if (!ATLAS_PRE_EXPANSION_PRODUCT_IDS.includes(product?.identity?.atlasProductId)) result.push("PRODUCT_NOT_IN_AUTHORIZED_SET");
    if (product?.identity?.createdBy !== ATLAS_PRE_EXPANSION_REVIEW_SOURCE) result.push("SOURCE_SET_MISMATCH");
    if (!registeredBrands.has(product?.identity?.brand)) result.push("MANUFACTURER_NOT_REGISTERED");
    if (!nonBlank(product?.identity?.manufacturerPartNumber)) result.push("MANUFACTURER_PART_NUMBER_MISSING");
    if (product?.governance?.engineeringValidationStatus !== "PASS") result.push("ENGINEERING_VALIDATION_NOT_PASS");
    if (product?.governance?.lifecycleStatus !== "DRAFT" || product?.governance?.publicationStatus !== "PENDING" || product?.governance?.humanReviewRequired !== true) result.push("LIFECYCLE_NOT_REVIEW_ELIGIBLE");
    const capacity = product?.extension?.data?.capacity;
    if (!capacity || capacity.capacityGb !== capacity.moduleCount * capacity.capacityPerModuleGb) result.push("CAPACITY_INVARIANT_FAILED");
    const sources = Object.values(product?.provenance?.fieldSources ?? {}).flat();
    if (!sources.length || sources.some(source => !source?.sourceType?.startsWith("MANUFACTURER_") || source?.verificationStatus !== "VERIFIED")) result.push("MANUFACTURER_EVIDENCE_NOT_VERIFIED");
    if (product?.validation?.errors?.length || product?.validation?.warnings?.length) result.push("MATERIAL_VALIDATION_ISSUES_PRESENT");
    if (!validateProduct(product).valid) result.push("ATLAS_SCHEMA_INVALID");
    return [...new Set(result)];
}

export function reviewAtlasPreExpansionBatch({ products, brands, reviewedBy, reviewedAt, reason } = {}) {
    if (!Array.isArray(products) || !Array.isArray(brands) || !nonBlank(reviewedBy) || !iso(reviewedAt) || !nonBlank(reason)) throw new TypeError("ATLAS_PRE_EXPANSION_REVIEW_INPUT_INVALID");
    const byId = new Map(products.map(product => [product?.identity?.atlasProductId, product]));
    const reviewSet = ATLAS_PRE_EXPANSION_PRODUCT_IDS.map(id => byId.get(id));
    if (reviewSet.some(product => !product) || new Set(reviewSet).size !== 15) throw new Error("ATLAS_PRE_EXPANSION_REVIEW_SET_INVALID");
    const registeredBrands = new Set(brands.map(brand => brand?.displayName).filter(nonBlank));
    const outcomes = reviewSet.map(product => {
        const productBlockers = blockers(product, registeredBrands);
        if (productBlockers.length) return { atlasProductId: product.identity.atlasProductId, status: "BLOCKED", blockers: productBlockers, product: structuredClone(product) };
        const activated = structuredClone(product);
        activated.identity = { ...activated.identity, recordRevision: activated.identity.recordRevision + 1, updatedAt: reviewedAt, updatedBy: reviewedBy };
        activated.governance = { ...activated.governance, lifecycleStatus: "ACTIVE", publicationStatus: "READY", humanReviewRequired: false, reviewedBy, reviewedAt, changeReason: reason };
        return { atlasProductId: product.identity.atlasProductId, status: "ACTIVATED", blockers: [], product: activated };
    });
    const auditMaterial = {
        policyVersion: ATLAS_PRE_EXPANSION_REVIEW_POLICY_VERSION, subjectType: "ATLAS_PRODUCT_LIFECYCLE_BATCH",
        sourceSet: ATLAS_PRE_EXPANSION_REVIEW_SOURCE, authorizedProductIds: [...ATLAS_PRE_EXPANSION_PRODUCT_IDS], reviewedBy, reviewedAt, reason,
        products: outcomes.map(({ atlasProductId, status, blockers: itemBlockers, product }) => ({ atlasProductId, status, blockers: itemBlockers, priorRevision: status === "ACTIVATED" ? product.identity.recordRevision - 1 : product.identity.recordRevision, resultingRevision: product.identity.recordRevision }))
    };
    return freeze({
        decision: { schemaVersion: "1.0", decisionId: `atlas_batchreview_${hash(auditMaterial).slice(0, 24)}`, ...auditMaterial, counts: { requested: 15, activated: outcomes.filter(item => item.status === "ACTIVATED").length, blocked: outcomes.filter(item => item.status === "BLOCKED").length }, downstreamAuthority: { acquisition: false, historical: false, canonical: false, review: false, publication: false, currentPrice: false, cheapest: false, pick: false, affiliate: false }, providerOperations: 0, actualSpendUsd: 0 },
        outcomes
    });
}
