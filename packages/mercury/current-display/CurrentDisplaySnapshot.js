import crypto from "node:crypto";

export const CURRENT_DISPLAY_SNAPSHOT_SCHEMA_VERSION = "1.0";
export const CURRENT_DISPLAY_RETAILERS = Object.freeze(["AMAZON", "NEWEGG"]);

const stable = value => Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value && typeof value === "object"
        ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`
        : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const validTime = value => nonBlank(value) && Number.isFinite(Date.parse(value));
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };

function material(snapshot) {
    return {
        observedAt: snapshot.observedAt,
        source: snapshot.source,
        offers: snapshot.offers
    };
}

export const currentDisplaySnapshotFingerprint = snapshot => digest(material(snapshot));
export const createCurrentDisplaySnapshotId = snapshot => `mer_display_${currentDisplaySnapshotFingerprint(snapshot).slice(0, 24)}`;

export function validateCurrentDisplaySnapshot(snapshot) {
    const errors = [];
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return freeze({ valid: false, errors: ["CURRENT_DISPLAY_SNAPSHOT_REQUIRED"] });
    if (snapshot.schemaVersion !== CURRENT_DISPLAY_SNAPSHOT_SCHEMA_VERSION) errors.push("CURRENT_DISPLAY_SCHEMA_VERSION_INVALID");
    if (!/^mer_display_[a-f0-9]{24}$/.test(snapshot.snapshotId ?? "") || !/^[a-f0-9]{64}$/.test(snapshot.materialFingerprint ?? "")) errors.push("CURRENT_DISPLAY_IDENTITY_INVALID");
    if (!validTime(snapshot.observedAt) || !validTime(snapshot.importedAt)) errors.push("CURRENT_DISPLAY_TIME_INVALID");
    if (!nonBlank(snapshot.source?.workbook) || !nonBlank(snapshot.source?.sheet) || !/^[a-f0-9]{64}$/.test(snapshot.source?.digest ?? "")) errors.push("CURRENT_DISPLAY_SOURCE_INVALID");
    if (!Array.isArray(snapshot.offers)) errors.push("CURRENT_DISPLAY_OFFERS_INVALID");
    const keys = new Set();
    for (const offer of snapshot.offers ?? []) {
        const key = `${offer?.atlasProductId}|${offer?.retailer}`;
        if (keys.has(key)) errors.push("CURRENT_DISPLAY_OFFER_DUPLICATE");
        keys.add(key);
        if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(offer?.atlasProductId ?? "")) errors.push("CURRENT_DISPLAY_PRODUCT_INVALID");
        if (!CURRENT_DISPLAY_RETAILERS.includes(offer?.retailer)) errors.push("CURRENT_DISPLAY_RETAILER_INVALID");
        if (offer?.retailerId !== null && !/^RETAILER-\d{4}$/.test(offer.retailerId)) errors.push("CURRENT_DISPLAY_RETAILER_ID_INVALID");
        if (!nonBlank(offer?.marketplace) || !Number.isFinite(offer?.priceUsd) || offer.priceUsd <= 0 || offer.currency !== "USD") errors.push("CURRENT_DISPLAY_PRICE_INVALID");
        if (!nonBlank(offer?.availability) || !nonBlank(offer?.matchStatus) || !Number.isInteger(offer?.sourceRow) || offer.sourceRow < 1) errors.push("CURRENT_DISPLAY_EVIDENCE_INVALID");
        if (![null, "NEW", "USED", "REFURBISHED", "OPEN_BOX"].includes(offer.condition) || offer.shippingUsd !== null || offer.feesUsd !== null) errors.push("CURRENT_DISPLAY_UNKNOWN_VALUE_INVALID");
        if (offer.researchUrl !== null) { try { if (new URL(offer.researchUrl).protocol !== "https:") throw new Error(); } catch { errors.push("CURRENT_DISPLAY_RESEARCH_URL_INVALID"); } }
        if (offer.destinationId !== null && !/^mer_dest_[a-f0-9]{24}$/.test(offer.destinationId)) errors.push("CURRENT_DISPLAY_DESTINATION_ID_INVALID");
        if (typeof offer.comparisonEligible !== "boolean" || !Array.isArray(offer.comparisonReasons) || offer.comparisonReasons.some(reason => !nonBlank(reason))) errors.push("CURRENT_DISPLAY_COMPARISON_INVALID");
        if (offer.comparisonEligible && offer.comparisonReasons.length) errors.push("CURRENT_DISPLAY_COMPARISON_CONTRADICTORY");
        if (offer.comparisonEligible && (offer.condition !== "NEW" || offer.availability !== "AVAILABLE")) errors.push("CURRENT_DISPLAY_COMPARISON_UNSUPPORTED");
    }
    if (snapshot.snapshotId !== createCurrentDisplaySnapshotId(snapshot)) errors.push("CURRENT_DISPLAY_ID_INVALID");
    if (snapshot.materialFingerprint !== currentDisplaySnapshotFingerprint(snapshot)) errors.push("CURRENT_DISPLAY_FINGERPRINT_INVALID");
    return freeze({ valid: errors.length === 0, errors: [...new Set(errors)] });
}

export function createCurrentDisplaySnapshot({ observedAt, importedAt, source, offers } = {}) {
    const snapshot = {
        schemaVersion: CURRENT_DISPLAY_SNAPSHOT_SCHEMA_VERSION,
        snapshotId: "",
        observedAt,
        importedAt,
        source: structuredClone(source),
        offers: structuredClone(offers ?? []).sort((left, right) => left.atlasProductId.localeCompare(right.atlasProductId) || left.retailer.localeCompare(right.retailer)),
        materialFingerprint: ""
    };
    snapshot.snapshotId = createCurrentDisplaySnapshotId(snapshot);
    snapshot.materialFingerprint = currentDisplaySnapshotFingerprint(snapshot);
    const report = validateCurrentDisplaySnapshot(snapshot);
    if (!report.valid) throw new TypeError(report.errors.join(","));
    return freeze(snapshot);
}

export function deriveCurrentDisplayComparison(snapshot, atlasProductId) {
    const report = validateCurrentDisplaySnapshot(snapshot);
    if (!report.valid) throw new TypeError(report.errors.join(","));
    const offers = snapshot.offers.filter(offer => offer.atlasProductId === atlasProductId && offer.comparisonEligible);
    if (!offers.length) return freeze({ status: "UNAVAILABLE", atlasProductId, cheapest: null, offers: [] });
    const ordered = [...offers].sort((left, right) => left.priceUsd - right.priceUsd || left.retailer.localeCompare(right.retailer));
    return freeze({ status: "AVAILABLE", atlasProductId, cheapest: ordered[0], offers: ordered });
}
