export const DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES = Object.freeze({
    RESOLVED: "RESOLVED",
    DISCOVERED: "DISCOVERED",
    CONFLICT: "CONFLICT"
});

function requireObject(value, field) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError(`${field} must be an object.`);
    }
    return value;
}

function requireString(value, field) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new TypeError(`${field} must be a non-empty string.`);
    }
    return value.trim();
}

function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
}

/**
 * Canonicalize a merchant hostname without collapsing arbitrary subdomains.
 * `www.` is treated as presentation noise; all other labels remain identity
 * significant until Atlas explicitly records aliases in a future contract.
 */
export function canonicalizeMerchantDomain(value) {
    const raw = requireString(value, "merchant domain").toLowerCase();
    let hostname;
    try {
        const parsed = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
        hostname = parsed.hostname.toLowerCase();
    } catch {
        throw new TypeError("merchant domain must be a valid hostname or URL.");
    }
    if (!hostname || hostname.includes(" ")) throw new TypeError("merchant domain must resolve to a hostname.");
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

function retailerDomain(retailer) {
    try {
        return canonicalizeMerchantDomain(retailer.websiteUrl);
    } catch {
        return null;
    }
}

/**
 * Resolve normalized DataForSEO seller evidence against Atlas retailer
 * identity. Unknown merchants remain DISCOVERED evidence and are never given a
 * synthetic RETAILER id.
 */
export function resolveDataForSeoMerchantIdentity({ marketEvidence, retailers = [] } = {}) {
    requireObject(marketEvidence, "marketEvidence");
    if (!Array.isArray(retailers)) throw new TypeError("retailers must be an array.");
    if (marketEvidence.provider !== "DATAFORSEO" || marketEvidence.source !== "DATAFORSEO_GOOGLE_SHOPPING") {
        throw new TypeError("Merchant resolution requires normalized DataForSEO Google Shopping market evidence.");
    }

    const seller = requireObject(marketEvidence.seller, "marketEvidence.seller");
    const sellerName = requireString(seller.name, "marketEvidence.seller.name");
    const suppliedDomain = canonicalizeMerchantDomain(seller.domain);
    const urlDomain = canonicalizeMerchantDomain(seller.url);

    if (suppliedDomain !== urlDomain) {
        return freeze({
            resolutionVersion: "1.0",
            outcome: DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.CONFLICT,
            retailerId: null,
            merchantKey: null,
            sellerName,
            canonicalDomain: null,
            suppliedDomain,
            urlDomain,
            requiresRegistration: false,
            evidence: [
                { field: "seller.domain", value: suppliedDomain },
                { field: "seller.url.hostname", value: urlDomain }
            ],
            reason: "SELLER_DOMAIN_URL_CONFLICT"
        });
    }

    const matches = retailers.filter((retailer) => retailer && retailerDomain(retailer) === suppliedDomain);

    if (matches.length > 1) {
        return freeze({
            resolutionVersion: "1.0",
            outcome: DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.CONFLICT,
            retailerId: null,
            merchantKey: `domain:${suppliedDomain}`,
            sellerName,
            canonicalDomain: suppliedDomain,
            suppliedDomain,
            urlDomain,
            requiresRegistration: false,
            evidence: matches.map((retailer) => ({ field: "atlas.retailer", value: retailer.id ?? null })),
            reason: "MULTIPLE_ATLAS_RETAILERS_FOR_DOMAIN"
        });
    }

    if (matches.length === 1) {
        const retailer = matches[0];
        return freeze({
            resolutionVersion: "1.0",
            outcome: DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.RESOLVED,
            retailerId: requireString(retailer.id, "retailer.id"),
            merchantKey: `domain:${suppliedDomain}`,
            sellerName,
            canonicalDomain: suppliedDomain,
            suppliedDomain,
            urlDomain,
            requiresRegistration: false,
            evidence: [
                { field: "seller.domain", value: suppliedDomain },
                { field: "atlas.websiteUrl", value: retailer.websiteUrl }
            ],
            reason: "ATLAS_RETAILER_DOMAIN_MATCH"
        });
    }

    return freeze({
        resolutionVersion: "1.0",
        outcome: DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.DISCOVERED,
        retailerId: null,
        merchantKey: `domain:${suppliedDomain}`,
        sellerName,
        canonicalDomain: suppliedDomain,
        suppliedDomain,
        urlDomain,
        requiresRegistration: true,
        evidence: [
            { field: "seller.domain", value: suppliedDomain },
            { field: "seller.url.hostname", value: urlDomain }
        ],
        reason: "ATLAS_RETAILER_NOT_FOUND"
    });
}
