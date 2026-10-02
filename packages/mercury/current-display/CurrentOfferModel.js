import crypto from "node:crypto";

export const CURRENT_OFFER_SCHEMA_VERSION = "1.1";
export const CURRENT_OFFER_POLICY_VERSION = "MERCURY-COMMERCE-CHANNEL-MULTI-SELLER-OFFER-MODEL-P1-1.0";
export const SELLER_IDENTITY_STATES = Object.freeze(["KNOWN", "UNKNOWN"]);
export const OFFER_ACTIONABILITY_STATES = Object.freeze(["CHANNEL_PRODUCT_DESTINATION", "OFFER_SPECIFIC_DESTINATION", "SELLER_PROFILE_ONLY", "NO_ACTIONABLE_DESTINATION"]);

const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const token = value => nonBlank(value) ? value.trim().toUpperCase().replace(/\s+/g, " ") : null;
const validHttps = value => { try { return value === null || (nonBlank(value) && new URL(value).protocol === "https:"); } catch { return false; } };
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };

export function normalizeSellerAttribution({ sellerName = null, sourceLocalSellerId = null, sellerProfileUrl = null } = {}) {
    const normalizedName = nonBlank(sellerName) ? sellerName.trim() : null;
    const normalizedId = nonBlank(sourceLocalSellerId) ? sourceLocalSellerId.trim() : null;
    if (!validHttps(sellerProfileUrl)) throw new TypeError("CURRENT_OFFER_SELLER_PROFILE_URL_INVALID");
    return freeze({
        identityState: normalizedName || normalizedId ? "KNOWN" : "UNKNOWN",
        sellerName: normalizedName,
        sourceLocalSellerId: normalizedId,
        sellerProfileUrl: sellerProfileUrl ?? null
    });
}

export function deriveOfferActionability({ offerSpecificDestination = null, channelProductDestination = null, sellerProfileUrl = null } = {}) {
    if (![offerSpecificDestination, channelProductDestination, sellerProfileUrl].every(validHttps)) throw new TypeError("CURRENT_OFFER_DESTINATION_INVALID");
    if (offerSpecificDestination) return "OFFER_SPECIFIC_DESTINATION";
    if (channelProductDestination) return "CHANNEL_PRODUCT_DESTINATION";
    if (sellerProfileUrl) return "SELLER_PROFILE_ONLY";
    return "NO_ACTIONABLE_DESTINATION";
}

function identityMaterial({ atlasProductId, commerceChannelId, listingIdentity, seller, condition }) {
    if (!nonBlank(atlasProductId) || !nonBlank(commerceChannelId)) throw new TypeError("CURRENT_OFFER_IDENTITY_INPUT_INVALID");
    const listing = token(listingIdentity);
    const sellerKey = token(seller?.sourceLocalSellerId) ?? token(seller?.sellerName);
    if (!listing && !sellerKey) throw new TypeError("CURRENT_OFFER_IDENTITY_EVIDENCE_INSUFFICIENT");
    if (seller?.identityState === "UNKNOWN" && !listing) throw new TypeError("CURRENT_OFFER_UNKNOWN_SELLER_LISTING_REQUIRED");
    return {
        atlasProductId,
        commerceChannelId,
        listingIdentity: listing,
        sellerIdentity: sellerKey,
        sellerIdentityState: seller?.identityState ?? "UNKNOWN",
        condition: condition ?? "UNKNOWN"
    };
}

export function createCurrentOfferIdentity(input) {
    return `mer_offer_${digest(identityMaterial(input)).slice(0, 24)}`;
}

export function createLegacyCompatibilityOfferIdentity({ atlasProductId, retailerId, retailer } = {}) {
    const commerceChannelId = retailerId ?? retailer;
    if (!nonBlank(atlasProductId) || !nonBlank(commerceChannelId)) throw new TypeError("CURRENT_OFFER_LEGACY_IDENTITY_INPUT_INVALID");
    return `mer_offer_${digest({ compatibility: "LEGACY_PRODUCT_CHANNEL", atlasProductId, commerceChannelId }).slice(0, 24)}`;
}

export function projectLegacyCurrentOffer(offer) {
    if (!offer || typeof offer !== "object") throw new TypeError("CURRENT_OFFER_LEGACY_REQUIRED");
    const seller = normalizeSellerAttribution({ sellerName: offer.sellerName ?? null });
    return freeze({
        ...structuredClone(offer),
        offerSchemaVersion: CURRENT_OFFER_SCHEMA_VERSION,
        offerIdentity: createLegacyCompatibilityOfferIdentity(offer),
        identityMode: "LEGACY_PRODUCT_CHANNEL",
        commerceChannel: { retailer: offer.retailer, retailerId: offer.retailerId ?? null, marketplace: offer.marketplace ?? null },
        seller,
        actionability: offer.destinationId ? "CHANNEL_PRODUCT_DESTINATION" : "NO_ACTIONABLE_DESTINATION"
    });
}

export function createCurrentOfferProjection({ offer, listingIdentity, sourceLocalSellerId = null, sellerProfileUrl = null, offerSpecificDestination = null } = {}) {
    if (!offer || typeof offer !== "object") throw new TypeError("CURRENT_OFFER_REQUIRED");
    const seller = normalizeSellerAttribution({ sellerName: offer.sellerName ?? null, sourceLocalSellerId, sellerProfileUrl });
    const commerceChannelId = offer.retailerId ?? offer.retailer;
    const offerIdentity = createCurrentOfferIdentity({ atlasProductId: offer.atlasProductId, commerceChannelId, listingIdentity, seller, condition: offer.condition });
    return freeze({
        ...structuredClone(offer),
        offerSchemaVersion: CURRENT_OFFER_SCHEMA_VERSION,
        offerIdentity,
        identityMode: "EVIDENCE_GROUNDED",
        listingIdentity: listingIdentity.trim(),
        commerceChannel: { retailer: offer.retailer, retailerId: offer.retailerId ?? null, marketplace: offer.marketplace ?? null },
        seller,
        actionability: deriveOfferActionability({ offerSpecificDestination, channelProductDestination: offer.researchUrl ?? null, sellerProfileUrl })
    });
}

export function validateCurrentOfferProjection(offer) {
    const errors = [];
    if (offer?.offerSchemaVersion !== CURRENT_OFFER_SCHEMA_VERSION) errors.push("CURRENT_OFFER_SCHEMA_VERSION_INVALID");
    if (!/^mer_offer_[a-f0-9]{24}$/.test(offer?.offerIdentity ?? "")) errors.push("CURRENT_OFFER_IDENTITY_INVALID");
    if (!["EVIDENCE_GROUNDED", "LEGACY_PRODUCT_CHANNEL"].includes(offer?.identityMode)) errors.push("CURRENT_OFFER_IDENTITY_MODE_INVALID");
    if (!nonBlank(offer?.commerceChannel?.retailer) || (offer.commerceChannel.retailerId !== null && !nonBlank(offer.commerceChannel.retailerId))) errors.push("CURRENT_OFFER_CHANNEL_INVALID");
    if (!SELLER_IDENTITY_STATES.includes(offer?.seller?.identityState)) errors.push("CURRENT_OFFER_SELLER_STATE_INVALID");
    if (offer?.seller?.identityState === "UNKNOWN" && (offer.seller.sellerName !== null || offer.seller.sourceLocalSellerId !== null)) errors.push("CURRENT_OFFER_UNKNOWN_SELLER_CONTRADICTORY");
    if (!validHttps(offer?.seller?.sellerProfileUrl ?? null)) errors.push("CURRENT_OFFER_SELLER_PROFILE_URL_INVALID");
    if (!OFFER_ACTIONABILITY_STATES.includes(offer?.actionability)) errors.push("CURRENT_OFFER_ACTIONABILITY_INVALID");
    if (offer?.actionability === "SELLER_PROFILE_ONLY" && offer?.seller?.sellerProfileUrl === null) errors.push("CURRENT_OFFER_ACTIONABILITY_INVALID");
    return freeze({ valid: errors.length === 0, errors: [...new Set(errors)] });
}

export function reconcileCurrentOffers({ existingOffers = [], incomingOffer, withdrawOfferIdentity = null } = {}) {
    const offers = new Map(existingOffers.map(offer => [offer.offerIdentity, structuredClone(offer)]));
    if (withdrawOfferIdentity !== null) {
        offers.delete(withdrawOfferIdentity);
        return freeze([...offers.values()].sort((a, b) => a.offerIdentity.localeCompare(b.offerIdentity)));
    }
    const report = validateCurrentOfferProjection(incomingOffer);
    if (!report.valid) throw new TypeError(report.errors.join(","));
    const predecessor = offers.get(incomingOffer.offerIdentity);
    if (predecessor?.sourceIdentity?.sourceId && incomingOffer.sourceIdentity?.sourceId && predecessor.sourceIdentity.sourceId !== incomingOffer.sourceIdentity.sourceId) throw new Error("CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED");
    offers.set(incomingOffer.offerIdentity, structuredClone(incomingOffer));
    return freeze([...offers.values()].sort((a, b) => a.offerIdentity.localeCompare(b.offerIdentity)));
}

export function simulateLegacyCurrentOfferMigration(offers = []) {
    const identities = new Set();
    let collisions = 0;
    let ambiguousRows = 0;
    let sellerKnown = 0;
    for (const offer of offers) {
        try {
            const projected = projectLegacyCurrentOffer(offer);
            if (identities.has(projected.offerIdentity)) collisions += 1;
            identities.add(projected.offerIdentity);
            if (projected.seller.identityState === "KNOWN") sellerKnown += 1;
        } catch { ambiguousRows += 1; }
    }
    return freeze({ legacyOffers: offers.length, derivedCompatibilityOfferIds: identities.size, collisions, ambiguousRows, sellerKnown, sellerUnknown: offers.length - sellerKnown - ambiguousRows });
}
