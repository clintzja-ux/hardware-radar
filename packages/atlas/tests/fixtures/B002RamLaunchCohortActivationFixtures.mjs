export const B002_ACTIVATION_REVIEWED_AT = "2026-09-01T16:18:29.377Z";
export const B002_ACTIVATION_REVIEWER = "human:Clinton_Ramsook";

export const B002_ACTIVATION_PRODUCT_IDS = Object.freeze([
    "ram_crucial_cp2k16g56c46u5",
    "ram_teamgroup_ctced532g6000hc30dc01",
    "ram_g_skill_f4_3200c16d_32gvk",
    "ram_kingston_kvr32n22d8_32",
    "ram_crucial_ct16g56c46s5",
    "ram_g_skill_f5_5600s4040a16gx2_rs"
]);

export function createB002ActivationFixture(product) {
    if (!B002_ACTIVATION_PRODUCT_IDS.includes(product?.identity?.atlasProductId)) {
        throw new Error("B002_PRODUCT_NOT_IN_AUTHORIZED_FIXTURE_BATCH");
    }
    if (product.governance?.lifecycleStatus !== "DRAFT" ||
        product.governance?.publicationStatus !== "PENDING" ||
        product.governance?.engineeringValidationStatus !== "PASS" ||
        product.governance?.humanReviewRequired !== true) {
        throw new Error("B002_PRODUCT_NOT_READY_FOR_ACTIVATION_REVIEW");
    }

    return structuredClone({
        ...product,
        identity: {
            ...product.identity,
            recordRevision: product.identity.recordRevision + 1,
            updatedAt: B002_ACTIVATION_REVIEWED_AT,
            updatedBy: B002_ACTIVATION_REVIEWER
        },
        governance: {
            ...product.governance,
            publicationStatus: "READY",
            lifecycleStatus: "ACTIVE",
            humanReviewRequired: false,
            reviewedBy: B002_ACTIVATION_REVIEWER,
            reviewedAt: B002_ACTIVATION_REVIEWED_AT,
            changeReason: "B-002A authorized lifecycle activation for the representative Mercury launch cohort; no market or publication authority implied."
        }
    });
}
