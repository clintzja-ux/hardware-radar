import { createProvenance } from "../../Provenance.js";
function required(value, field) {
    if (value === undefined || value === null || value === "") throw new TypeError(`Amazon input requires ${field}.`);
    return value;
}

function optional(value, fallback = null) {
    return value === undefined ? fallback : value;
}

/**
 * Normalize already-collected Amazon offer data. This function performs no
 * network access and makes no trust, freshness, or confidence decisions.
 */
export function normalizeAmazonOffer(input, context) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Amazon input must be an object.");
    if (!context || typeof context !== "object" || Array.isArray(context)) throw new TypeError("Normalization context must be an object.");

    const observationTime = required(context.observationTime, "context.observationTime");
    const sourceMethod = required(context.sourceMethod, "context.sourceMethod");

    return {
        observationId: required(context.observationId, "context.observationId"),
        schemaVersion: "1.1",
        atlasProductId: required(context.atlasProductId, "context.atlasProductId"),
        retailerId: "RETAILER-0001",
        marketplace: "amazon.com",
        observationTime,
        sourceMethod,
        lifecycleStatus: optional(context.lifecycleStatus, "RETRIEVED"),
        validationStatus: optional(context.validationStatus, "PASS"),
        supersedesObservationId: optional(context.supersedesObservationId),
        expiresAt: optional(context.expiresAt),
        offer: {
            price: required(input.price, "price"),
            currency: optional(input.currency, "USD"),
            availability: optional(input.availability, "UNKNOWN"),
            condition: optional(input.condition, "NEW"),
            sellerType: optional(input.sellerType, "UNKNOWN"),
            sourceUrl: required(input.sourceUrl, "sourceUrl"),
            shipping: {
                costKnown: optional(input.shipping?.costKnown, false),
                cost: optional(input.shipping?.cost),
                currency: optional(input.shipping?.currency),
                notes: optional(input.shipping?.notes)
            },
            discount: input.discount === null ? null : {
                originalPrice: optional(input.discount?.originalPrice),
                amount: optional(input.discount?.amount),
                percentage: optional(input.discount?.percentage),
                label: optional(input.discount?.label)
            },
            affiliate: {
                isAffiliateLink: optional(input.affiliate?.isAffiliateLink, false),
                network: optional(input.affiliate?.network),
                trackingCodePresent: optional(input.affiliate?.trackingCodePresent)
            }
        },
        provenance: createProvenance({
            source: {
                name: optional(context.retrievalSource, "Amazon normalized input"),
                uri: optional(context.sourceUri, input.sourceUrl),
                marketplace: "amazon.com"
            },
            acquisition: {
                method: sourceMethod,
                retrievedAt: observationTime,
                retrievedBy: required(context.retrievedBy, "context.retrievedBy"),
                requestId: optional(context.requestId),
                rawPayloadReference: optional(context.rawPayloadReference)
            },
            transformation: {
                adapterId: "mer_adapter_amazon_us",
                adapterVersion: "mer_adapter_amazon_us@1.1.0",
                normalizedAt: optional(context.normalizedAt, observationTime)
            },
            validation: {
                validatorVersion: optional(context.validatorVersion, "mercury-observation-validator-1.0.0"),
                complianceRuleSetVersion: optional(context.complianceRuleSetVersion, "sentinel-mercury-draft-0.1")
            }
        }),
        compliance: {
            licenseContext: optional(context.licenseContext, "MANUAL_PUBLIC_PAGE_OBSERVATION"),
            requiredDisclosureShown: optional(context.requiredDisclosureShown, false),
            requiredPriceDisclaimerShown: optional(context.requiredPriceDisclaimerShown, false),
            retailerContentDisclaimerShown: optional(context.retailerContentDisclaimerShown, false)
        },
        metadata: {
            createdAt: optional(context.createdAt, observationTime),
            createdBy: required(context.createdBy, "context.createdBy"),
            observationHash: optional(context.observationHash),
            notes: optional(context.notes)
        }
    };
}
