import { createProvenance } from "../../Provenance.js";

function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
}
function requiredString(value, field) {
    if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string.`);
    return value.trim();
}
function canonicalDateTime(value, field) {
    const source = requiredString(value, field);
    const instant = Date.parse(source);
    if (!Number.isFinite(instant)) throw new TypeError(`${field} must identify a valid date-time instant.`);
    return new Date(instant).toISOString();
}
function normalizeAvailability(value) {
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (normalized === "in_stock") return "IN_STOCK";
    if (normalized === "out_of_stock") return "OUT_OF_STOCK";
    if (normalized === "preorder" || normalized === "pre_order") return "PREORDER";
    if (normalized === "backorder" || normalized === "back_order") return "BACKORDER";
    return "UNKNOWN";
}
function normalizeCondition(value) {
    if (value == null || value === "") return "UNKNOWN";
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "new") return "NEW";
    if (normalized === "used") return "USED";
    if (normalized.includes("open") && normalized.includes("box")) return "OPEN_BOX";
    if (normalized.includes("manufacturer") && normalized.includes("refurb")) return "MANUFACTURER_REFURBISHED";
    if (normalized.includes("seller") && normalized.includes("refurb")) return "SELLER_REFURBISHED";
    return "UNKNOWN";
}

export function createDataForSeoCanonicalObservation({
    observationId,
    candidate,
    merchantResolution,
    createdAt,
    createdBy,
    normalizedAt = createdAt,
    validatorVersion = "mercury-observation-validator-1.0.0",
    complianceRuleSetVersion = "sentinel-mercury-draft-0.1"
} = {}) {
    const evidence = candidate?.marketEvidence;
    if (!evidence || evidence.source !== "DATAFORSEO_GOOGLE_SHOPPING") throw new TypeError("Canonical observation requires DataForSEO Google Shopping market evidence.");
    if (candidate?.identity?.outcome !== "CONFIRMED" || candidate?.governance?.canonicalObservationEligible !== true) {
        throw new Error("DATAFORSEO_PRODUCT_IDENTITY_NOT_CONFIRMED");
    }
    if (merchantResolution?.outcome !== "RESOLVED" || !merchantResolution?.retailerId) {
        throw new Error("DATAFORSEO_MERCHANT_IDENTITY_NOT_RESOLVED");
    }

    const observedAt = canonicalDateTime(evidence.provenance?.observedAt, "marketEvidence.provenance.observedAt");
    const marketplace = requiredString(merchantResolution.canonicalDomain, "merchantResolution.canonicalDomain");
    const sourceUrl = requiredString(evidence.seller?.url, "marketEvidence.seller.url");
    const currency = requiredString(evidence.pricing?.currency, "marketEvidence.pricing.currency");
    const basePrice = evidence.pricing?.basePrice;
    if (!Number.isFinite(basePrice) || basePrice <= 0) throw new TypeError("marketEvidence.pricing.basePrice must be a positive finite number.");

    return freeze({
        observationId: requiredString(observationId, "observationId"),
        schemaVersion: "1.1",
        atlasProductId: requiredString(candidate.identity.atlasProductId, "candidate.identity.atlasProductId"),
        retailerId: requiredString(merchantResolution.retailerId, "merchantResolution.retailerId"),
        marketplace,
        observationTime: observedAt,
        sourceMethod: "API",
        lifecycleStatus: "RETRIEVED",
        validationStatus: "PASS",
        supersedesObservationId: null,
        expiresAt: null,
        offer: {
            price: basePrice,
            currency,
            availability: normalizeAvailability(evidence.offer?.availability),
            condition: normalizeCondition(evidence.offer?.condition),
            sellerType: "UNKNOWN",
            sourceUrl,
            shipping: {
                costKnown: evidence.pricing.shippingPrice != null,
                cost: evidence.pricing.shippingPrice ?? null,
                currency: evidence.pricing.shippingPrice != null ? currency : null,
                notes: null
            },
            discount: null,
            affiliate: { isAffiliateLink: false, network: null, trackingCodePresent: false }
        },
        provenance: createProvenance({
            source: {
                name: "DataForSEO Google Shopping",
                uri: sourceUrl,
                marketplace
            },
            acquisition: {
                method: "API",
                retrievedAt: observedAt,
                retrievedBy: "dataforseo",
                requestId: requiredString(evidence.provenance?.sourceTaskId, "marketEvidence.provenance.sourceTaskId"),
                rawPayloadReference: evidence.provenance?.rawPayloadReference ?? null
            },
            transformation: {
                adapterId: "mer_adapter_dataforseo_google_shopping",
                adapterVersion: "1.0.0",
                normalizedAt: requiredString(normalizedAt, "normalizedAt")
            },
            validation: {
                validatorVersion: requiredString(validatorVersion, "validatorVersion"),
                complianceRuleSetVersion: requiredString(complianceRuleSetVersion, "complianceRuleSetVersion")
            }
        }),
        compliance: {
            licenseContext: "DATAFORSEO_GOOGLE_SHOPPING",
            requiredDisclosureShown: false,
            requiredPriceDisclaimerShown: false,
            retailerContentDisclaimerShown: false
        },
        metadata: {
            createdAt: requiredString(createdAt, "createdAt"),
            createdBy: requiredString(createdBy, "createdBy"),
            observationHash: null,
            notes: `Promoted from durable DataForSEO market evidence; source total price ${evidence.pricing.totalPrice ?? "unknown"}, tax ${evidence.pricing.tax ?? "unknown"}.`
        }
    });
}

export default createDataForSeoCanonicalObservation;
