import crypto from "node:crypto";

export const RETAILER_DESTINATION_SCHEMA_VERSION = "1.0";
export const RETAILER_DESTINATION_TYPE = "PRODUCT_PAGE";
export const RETAILER_DESTINATION_BINDING_METHOD = "OPERATOR_EXACT_PRODUCT_REVIEW";
export const RETAILER_DESTINATION_SOURCE_TYPE = "OPERATOR_INSPECTED_PUBLIC_PAGE";
export const RETAILER_DESTINATION_STATUSES = Object.freeze(["ACTIVE", "RETIRED"]);
export const RETAILER_DESTINATION_NAVIGATION_AUTHORITY = "DESTINATION_NAVIGATION_ELIGIBLE";

const SHORTENER_HOSTS = new Set(["bit.ly", "buff.ly", "cutt.ly", "goo.gl", "ow.ly", "t.co", "tinyurl.com"]);
const TRACKING_PARAMETERS = new Set(["fbclid", "gclid", "msclkid", "srsltid"]);
const PROHIBITED_KEYS = new Set(["price", "currency", "availability", "condition", "shipping", "tax", "discount", "promotion", "cheapest", "currentprice", "recommendation", "pick", "rank", "score", "affiliate", "affiliateenabled", "affiliateurl", "isaffiliatelink"]);
const TOP_LEVEL_KEYS = new Set(["schemaVersion", "destinationId", "atlasProductId", "retailerId", "marketplace", "destinationType", "destinationUrl", "retailerListingId", "binding", "provenance", "reviewedBy", "reviewedAt", "status", "supersedesDestinationId", "retirementReason", "createdAt", "createdBy", "materialFingerprint"]);
const BINDING_KEYS = new Set(["manufacturerPartNumber", "method", "scope", "evidenceReferences"]);
const PROVENANCE_KEYS = new Set(["sourceType"]);
const INPUT_KEYS = new Set(["atlasProductId", "retailerId", "marketplace", "destinationType", "destinationUrl", "retailerListingId", "binding", "provenance", "reviewedBy", "reviewedAt", "status", "supersedesDestinationId", "retirementReason", "createdAt", "createdBy"]);

const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(typeof value === "string" ? value : stable(value)).digest("hex");
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const validTime = value => nonBlank(value) && Number.isFinite(Date.parse(value));
const normalizedHost = value => String(value ?? "").trim().toLowerCase().replace(/^www\./, "");
const deepFreeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child); } return value; };
const optionalString = value => value == null || value === "" ? null : String(value).trim();
const hasOnly = (value, allowed) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every(key => allowed.has(key));

function prohibitedFields(value, path = "", found = []) {
    if (!value || typeof value !== "object") return found;
    for (const [key, child] of Object.entries(value)) {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (PROHIBITED_KEYS.has(normalized)) found.push(path ? `${path}.${key}` : key);
        prohibitedFields(child, path ? `${path}.${key}` : key, found);
    }
    return found;
}

export function canonicalizeRetailerDestinationUrl(value) {
    if (!nonBlank(value)) throw new TypeError("RETAILER_DESTINATION_URL_REQUIRED");
    let url;
    try { url = new URL(value); } catch { throw new TypeError("RETAILER_DESTINATION_URL_INVALID"); }
    if (url.protocol !== "https:" || url.username || url.password || url.port) throw new TypeError("RETAILER_DESTINATION_URL_INVALID");
    const host = normalizedHost(url.hostname);
    if (!host || SHORTENER_HOSTS.has(host)) throw new TypeError("RETAILER_DESTINATION_URL_HOST_INVALID");
    for (const key of [...url.searchParams.keys()]) {
        const lower = key.toLowerCase();
        if (lower.startsWith("utm_") || TRACKING_PARAMETERS.has(lower)) url.searchParams.delete(key);
    }
    if ([...url.searchParams.keys()].length) throw new TypeError("RETAILER_DESTINATION_QUERY_UNSUPPORTED");
    const path = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    if (path === "/") throw new TypeError("RETAILER_DESTINATION_PRODUCT_PATH_REQUIRED");
    return `https://${host}${path}`;
}

function identityMaterial(record) {
    return {
        atlasProductId: record.atlasProductId,
        retailerId: record.retailerId,
        marketplace: record.marketplace,
        destinationType: record.destinationType,
        destinationUrl: record.destinationUrl,
        status: record.status,
        supersedesDestinationId: record.supersedesDestinationId
    };
}

function fingerprintMaterial(record) {
    const copy = structuredClone(record);
    delete copy.destinationId;
    delete copy.materialFingerprint;
    return copy;
}

export const createRetailerDestinationId = record => `mer_dest_${digest(identityMaterial(record)).slice(0, 24)}`;
export const retailerDestinationMaterialFingerprint = record => digest(fingerprintMaterial(record));
export const retailerDestinationKey = record => `${record.atlasProductId}|${record.retailerId}|${record.marketplace}`;

export function validateRetailerDestination(value) {
    const errors = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) return deepFreeze({ valid: false, errors: ["RETAILER_DESTINATION_RECORD_REQUIRED"] });
    if (prohibitedFields(value).length) errors.push("RETAILER_DESTINATION_PROHIBITED_FIELD");
    if (!hasOnly(value, TOP_LEVEL_KEYS) || !hasOnly(value.binding, BINDING_KEYS) || !hasOnly(value.provenance, PROVENANCE_KEYS)) errors.push("RETAILER_DESTINATION_SCHEMA_INVALID");
    if (value.schemaVersion !== RETAILER_DESTINATION_SCHEMA_VERSION) errors.push("RETAILER_DESTINATION_SCHEMA_VERSION_INVALID");
    if (!/^mer_dest_[a-f0-9]{24}$/.test(value.destinationId ?? "") || !/^[a-f0-9]{64}$/.test(value.materialFingerprint ?? "")) errors.push("RETAILER_DESTINATION_IDENTITY_INVALID");
    if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(value.atlasProductId ?? "")) errors.push("RETAILER_DESTINATION_PRODUCT_ID_INVALID");
    if (!/^RETAILER-\d{4}$/.test(value.retailerId ?? "")) errors.push("RETAILER_DESTINATION_RETAILER_ID_INVALID");
    if (!/^[a-z0-9.-]+$/.test(value.marketplace ?? "") || value.marketplace !== normalizedHost(value.marketplace)) errors.push("RETAILER_DESTINATION_MARKETPLACE_INVALID");
    if (value.destinationType !== RETAILER_DESTINATION_TYPE) errors.push("RETAILER_DESTINATION_TYPE_UNSUPPORTED");
    try { if (canonicalizeRetailerDestinationUrl(value.destinationUrl) !== value.destinationUrl) errors.push("RETAILER_DESTINATION_URL_NOT_CANONICAL"); } catch (error) { errors.push(error.message); }
    if (value.retailerListingId !== null && !nonBlank(value.retailerListingId)) errors.push("RETAILER_DESTINATION_LISTING_ID_INVALID");
    if (!nonBlank(value.binding?.manufacturerPartNumber) || value.binding?.method !== RETAILER_DESTINATION_BINDING_METHOD || value.binding?.scope !== "EXACT_STANDALONE_PRODUCT" || !Array.isArray(value.binding?.evidenceReferences) || value.binding.evidenceReferences.length === 0 || value.binding.evidenceReferences.some(reference => !nonBlank(reference))) errors.push("RETAILER_DESTINATION_BINDING_INVALID");
    if (new Set(value.binding?.evidenceReferences ?? []).size !== (value.binding?.evidenceReferences ?? []).length) errors.push("RETAILER_DESTINATION_EVIDENCE_REFERENCES_INVALID");
    if (value.provenance?.sourceType !== RETAILER_DESTINATION_SOURCE_TYPE) errors.push("RETAILER_DESTINATION_PROVENANCE_INVALID");
    if (!nonBlank(value.reviewedBy) || !validTime(value.reviewedAt) || !validTime(value.createdAt) || !nonBlank(value.createdBy)) errors.push("RETAILER_DESTINATION_AUDIT_INVALID");
    if (!RETAILER_DESTINATION_STATUSES.includes(value.status)) errors.push("RETAILER_DESTINATION_STATUS_INVALID");
    if (value.supersedesDestinationId !== null && !/^mer_dest_[a-f0-9]{24}$/.test(value.supersedesDestinationId ?? "")) errors.push("RETAILER_DESTINATION_SUPERSESSION_ID_INVALID");
    if (value.status === "ACTIVE" && value.retirementReason !== null) errors.push("RETAILER_DESTINATION_ACTIVE_RETIREMENT_INVALID");
    if (value.status === "RETIRED" && (!nonBlank(value.retirementReason) || value.supersedesDestinationId === null)) errors.push("RETAILER_DESTINATION_RETIREMENT_INVALID");
    if (value.destinationId !== createRetailerDestinationId(value)) errors.push("RETAILER_DESTINATION_ID_INVALID");
    if (value.materialFingerprint !== retailerDestinationMaterialFingerprint(value)) errors.push("RETAILER_DESTINATION_FINGERPRINT_INVALID");
    return deepFreeze({ valid: errors.length === 0, errors: [...new Set(errors)] });
}

export function createRetailerDestination(input = {}) {
    if (!hasOnly(input, INPUT_KEYS)) throw new TypeError(prohibitedFields(input).length ? "RETAILER_DESTINATION_PROHIBITED_FIELD" : "RETAILER_DESTINATION_SCHEMA_INVALID");
    const record = {
        schemaVersion: RETAILER_DESTINATION_SCHEMA_VERSION,
        destinationId: "",
        atlasProductId: String(input.atlasProductId ?? "").trim(),
        retailerId: String(input.retailerId ?? "").trim(),
        marketplace: normalizedHost(input.marketplace),
        destinationType: input.destinationType,
        destinationUrl: canonicalizeRetailerDestinationUrl(input.destinationUrl),
        retailerListingId: optionalString(input.retailerListingId),
        binding: {
            manufacturerPartNumber: String(input.binding?.manufacturerPartNumber ?? "").trim(),
            method: input.binding?.method,
            scope: input.binding?.scope,
            evidenceReferences: Array.isArray(input.binding?.evidenceReferences) ? [...input.binding.evidenceReferences] : input.binding?.evidenceReferences
        },
        provenance: { sourceType: input.provenance?.sourceType },
        reviewedBy: String(input.reviewedBy ?? "").trim(),
        reviewedAt: input.reviewedAt,
        status: input.status,
        supersedesDestinationId: optionalString(input.supersedesDestinationId),
        retirementReason: optionalString(input.retirementReason),
        createdAt: input.createdAt,
        createdBy: String(input.createdBy ?? "").trim(),
        materialFingerprint: ""
    };
    record.destinationId = createRetailerDestinationId(record);
    record.materialFingerprint = retailerDestinationMaterialFingerprint(record);
    const report = validateRetailerDestination(record);
    if (!report.valid) throw new TypeError(report.errors.join(","));
    return deepFreeze(record);
}

export function assessRetailerDestinationBinding({ destination, product, retailer } = {}) {
    const reasons = [];
    const structural = validateRetailerDestination(destination);
    if (!structural.valid) reasons.push(...structural.errors);
    if (!product || product.identity?.atlasProductId !== destination?.atlasProductId) reasons.push("RETAILER_DESTINATION_ATLAS_PRODUCT_UNKNOWN");
    else {
        if (product.governance?.lifecycleStatus !== "ACTIVE" || product.governance?.publicationStatus !== "READY") reasons.push("RETAILER_DESTINATION_ATLAS_PRODUCT_NOT_ACTIVE_READY");
        if (product.identity?.manufacturerPartNumber !== destination.binding?.manufacturerPartNumber) reasons.push("RETAILER_DESTINATION_MPN_MISMATCH");
    }
    if (!retailer || retailer.id !== destination?.retailerId) reasons.push("RETAILER_DESTINATION_ATLAS_RETAILER_UNKNOWN");
    else {
        if (retailer.status !== "active") reasons.push("RETAILER_DESTINATION_ATLAS_RETAILER_INACTIVE");
        try {
            const retailerHost = normalizedHost(new URL(retailer.websiteUrl).hostname);
            const destinationHost = normalizedHost(new URL(destination.destinationUrl).hostname);
            if (retailerHost !== destination.marketplace || destinationHost !== destination.marketplace) reasons.push("RETAILER_DESTINATION_MARKETPLACE_MISMATCH");
        } catch { reasons.push("RETAILER_DESTINATION_MARKETPLACE_MISMATCH"); }
    }
    const unique = [...new Set(reasons)];
    return deepFreeze({
        authority: RETAILER_DESTINATION_NAVIGATION_AUTHORITY,
        eligible: unique.length === 0 && destination?.status === "ACTIVE",
        reasons: unique.length ? unique : destination?.status === "ACTIVE" ? [] : ["RETAILER_DESTINATION_RETIRED"],
        destinationId: destination?.destinationId ?? null,
        atlasProductId: destination?.atlasProductId ?? null,
        retailerId: destination?.retailerId ?? null,
        marketplace: destination?.marketplace ?? null,
        affiliateRequired: false,
        sourceRightsProfileRequired: false,
        observationCreated: false,
        historicalAuthority: false,
        canonicalObservationAuthority: false,
        reviewAuthority: false,
        currentMarketAuthority: false,
        publicationAuthority: false,
        currentPriceAuthority: false,
        cheapestAuthority: false,
        pickAuthority: false,
        networkOperation: "NONE",
        actualSpendUsd: 0
    });
}

export function projectRetailerDestinationForBeacon(destination) {
    const report = validateRetailerDestination(destination);
    if (!report.valid) throw new TypeError(report.errors.join(","));
    return deepFreeze({ destinationId: destination.destinationId, atlasProductId: destination.atlasProductId, retailerId: destination.retailerId, marketplace: destination.marketplace });
}

export function orderRetailerDestinations(destinations, retailers) {
    const names = new Map(retailers.map(retailer => [retailer.id, retailer.name]));
    return deepFreeze([...destinations].sort((left, right) => String(names.get(left.retailerId) ?? "").localeCompare(String(names.get(right.retailerId) ?? ""), "en", { sensitivity: "base" }) || left.retailerId.localeCompare(right.retailerId)));
}
