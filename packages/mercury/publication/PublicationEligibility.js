import { validateObservation } from "../ObservationValidator.js";
import { validateProvenance } from "../ProvenanceValidator.js";
import defaultPublicationPolicy from "./PublicationPolicy.js";
import { evaluateSourceRight } from "../rights/SourceRightsEvaluator.js";

export function evaluatePublicationEligibility(observation, { product, retailer, freshness, confidence, storage = null, evaluatedAt = null, policy = defaultPublicationPolicy, enforceSourceRights = false } = {}) {
    const reasons = [];
    const observationReport = validateObservation(observation);
    const provenanceReport = validateProvenance(observation?.provenance, {
        observationTime: observation?.observationTime,
        sourceMethod: observation?.sourceMethod,
        marketplace: observation?.marketplace
    });

    if (!observationReport.valid) reasons.push("OBSERVATION_INVALID");
    if (enforceSourceRights) {
      const publicationRight = evaluateSourceRight(observation, "live.publicDisplay");
      if (!publicationRight.allowed) reasons.push(publicationRight.reason ?? "PUBLICATION_RIGHT_NOT_ALLOWED");
    }
    if (observation?.compliance?.licenseContext === "TEST_FIXTURE") reasons.push("TEST_FIXTURE_NOT_PUBLISHABLE");
    if (storage?.payloadStatus === "PURGED") reasons.push("LICENSED_PAYLOAD_PURGED");
    if (storage?.payloadExpiresAt && evaluatedAt && Date.parse(storage.payloadExpiresAt) <= Date.parse(evaluatedAt)) reasons.push("LICENSED_PAYLOAD_EXPIRED");
    if (!product || product.identity?.atlasProductId !== observation?.atlasProductId) reasons.push("ATLAS_PRODUCT_UNRESOLVED");
    if (!retailer || retailer.id !== observation?.retailerId) reasons.push("ATLAS_RETAILER_UNRESOLVED");
    if (!provenanceReport.valid) reasons.push("PROVENANCE_INVALID");
    if (observation?.validationStatus !== "PASS") reasons.push("VALIDATION_NOT_PASS");
    if (!policy.allowedFreshnessStatuses.includes(freshness?.status)) reasons.push("FRESHNESS_NOT_ELIGIBLE");
    if (!policy.allowedConfidenceStatuses.includes(confidence?.status)) reasons.push("CONFIDENCE_NOT_ELIGIBLE");
    if (!Number.isFinite(observation?.offer?.price) || observation.offer.price < 0) reasons.push("PRICE_INVALID");
    if (!policy.allowedAvailabilityStatuses.includes(observation?.offer?.availability)) reasons.push("AVAILABILITY_NOT_ELIGIBLE");
    if (!policy.allowedConditions.includes(observation?.offer?.condition)) reasons.push("CONDITION_NOT_ELIGIBLE");
    if (typeof observation?.offer?.sourceUrl !== "string" || observation.offer.sourceUrl.trim() === "") reasons.push("SOURCE_URL_MISSING");

    return Object.freeze({ eligible: reasons.length === 0, reasons: Object.freeze(reasons) });
}

export default evaluatePublicationEligibility;
