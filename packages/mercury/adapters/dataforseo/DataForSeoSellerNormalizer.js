function requireObject(value, field) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError(`DataForSEO ${field} must be an object.`);
    }
    return value;
}

function requireString(value, field) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new TypeError(`DataForSEO seller evidence requires ${field}.`);
    }
    return value.trim();
}

function requirePositiveNumber(value, field) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        throw new TypeError(`DataForSEO seller evidence requires positive ${field}.`);
    }
    return value;
}

function optionalNonNegativeNumber(value, field) {
    if (value === undefined || value === null) return null;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new TypeError(`DataForSEO seller evidence requires non-negative ${field} when present.`);
    }
    return value;
}

function optionalString(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string") throw new TypeError("Optional DataForSEO seller text must be a string when present.");
    return value;
}

function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
}

/**
 * Normalize a DataForSEO Google Shopping `shops_list` item into lossless
 * provider-neutral market evidence. This is intentionally NOT yet a canonical
 * Mercury observation: Atlas/retailer resolution and persistence belong to
 * later DF003 increments.
 */
export function normalizeDataForSeoSellerEvidence(input, context) {
    requireObject(input, "seller input");
    requireObject(context, "normalization context");

    if (input.type !== "shops_list") {
        throw new TypeError("DataForSEO seller evidence requires type shops_list.");
    }

    const currency = requireString(input.currency, "currency").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError("DataForSEO seller evidence requires ISO-4217 currency.");

    const sourceUrl = requireString(input.url, "url");
    try {
        new URL(sourceUrl);
    } catch {
        throw new TypeError("DataForSEO seller evidence requires a valid url.");
    }

    const basePrice = requirePositiveNumber(input.base_price, "base_price");
    const shippingPrice = optionalNonNegativeNumber(input.shipping_price, "shipping_price");
    const tax = optionalNonNegativeNumber(input.tax, "tax");
    const totalPrice = optionalNonNegativeNumber(input.total_price, "total_price");

    return freeze({
        evidenceVersion: "1.0",
        provider: "DATAFORSEO",
        source: "DATAFORSEO_GOOGLE_SHOPPING",
        sourceMethod: "API",
        seller: {
            name: requireString(input.seller_name ?? input.title, "seller_name"),
            domain: requireString(input.domain, "domain"),
            url: sourceUrl
        },
        pricing: {
            basePrice,
            shippingPrice,
            tax,
            totalPrice,
            currency
        },
        offer: {
            condition: optionalString(input.product_condition),
            details: optionalString(input.details),
            availability: optionalString(input.product_availability)
        },
        productEvidence: {
            title: optionalString(context.productTitle),
            dataDocId: optionalString(context.dataDocId),
            productId: optionalString(context.productId),
            gid: optionalString(context.gid)
        },
        provenance: {
            sourceTaskId: requireString(context.sourceTaskId, "context.sourceTaskId"),
            observedAt: requireString(context.observedAt, "context.observedAt"),
            rawPayloadReference: optionalString(context.rawPayloadReference)
        }
    });
}

export default normalizeDataForSeoSellerEvidence;
