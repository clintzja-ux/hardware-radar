import { createDataForSeoMarketObservationCandidate } from "./DataForSeoMarketObservationCandidate.js";
import { evaluateDataForSeoObservationEligibility } from "./DataForSeoObservationEligibility.js";
import { canonicalizeMerchantDomain } from "./DataForSeoMerchantIdentity.js";
import { createDataForSeoCanonicalObservation } from "./DataForSeoCanonicalObservation.js";
import { validateObservation } from "../../ObservationValidator.js";
import { evaluateHistoricalEligibility } from "../../HistoricalEligibility.js";

function requireObject(value, field) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${field} must be an object.`);
    return value;
}
function requireString(value, field) {
    if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string.`);
    return value.trim();
}

export class DataForSeoHistoricalPromotionService {
    constructor({ evidenceRepository, observationRepository, now = () => new Date().toISOString() } = {}) {
        if (!evidenceRepository) throw new TypeError("evidenceRepository is required.");
        if (!observationRepository) throw new TypeError("observationRepository is required.");
        this.evidenceRepository = evidenceRepository;
        this.observationRepository = observationRepository;
        this.now = now;
    }

    async promote({ evidenceId, atlasResolution, merchantResolution, createdBy } = {}) {
        requireString(evidenceId, "evidenceId");
        requireObject(atlasResolution, "atlasResolution");
        requireObject(merchantResolution, "merchantResolution");
        requireString(createdBy, "createdBy");

        const record = await this.evidenceRepository.getById(evidenceId);
        if (!record) throw new Error(`DATAFORSEO_EVIDENCE_NOT_FOUND:${evidenceId}`);

        const sourceDomain = canonicalizeMerchantDomain(record.candidate.marketEvidence.seller.domain);
        if (merchantResolution.outcome === "RESOLVED" && canonicalizeMerchantDomain(merchantResolution.canonicalDomain) !== sourceDomain) {
            throw new Error("DATAFORSEO_PROMOTION_MERCHANT_MISMATCH");
        }

        const candidate = createDataForSeoMarketObservationCandidate({
            marketEvidence: record.candidate.marketEvidence,
            atlasResolution
        });
        const eligibility = evaluateDataForSeoObservationEligibility({ candidate, merchantResolution });
        if (eligibility.canonicalObservationEligible !== true || eligibility.historicalAnalyticsEligible !== true) {
            return Object.freeze({ status: "NOT_ELIGIBLE", evidenceId, eligibility });
        }

        const idempotencyKey = `DATAFORSEO_HISTORICAL_PROMOTION:${evidenceId}`;
        const existing = await this.observationRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) {
            return Object.freeze({ status: "DUPLICATE", evidenceId, observationId: existing.observationId });
        }

        const observationId = await this.observationRepository.allocateObservationId();
        const createdAt = this.now();
        const observation = createDataForSeoCanonicalObservation({
            observationId,
            candidate,
            merchantResolution,
            createdAt,
            createdBy,
            normalizedAt: createdAt
        });

        const validation = validateObservation(observation);
        if (!validation.valid) {
            throw new Error(`DATAFORSEO_PROMOTED_OBSERVATION_INVALID:${validation.errors.map((entry) => entry.code).join(",")}`);
        }
        const historical = evaluateHistoricalEligibility(observation);
        if (!historical.eligible) {
            throw new Error(`DATAFORSEO_PROMOTED_OBSERVATION_NOT_HISTORICAL:${historical.reasons.join(",")}`);
        }

        const accepted = await this.observationRepository.accept(observation, idempotencyKey);
        return Object.freeze({
            status: accepted.status === "DUPLICATE" ? "DUPLICATE" : "PROMOTED",
            evidenceId,
            observationId: accepted.observationId,
            observation,
            historicalEligibility: historical
        });
    }
}

export default DataForSeoHistoricalPromotionService;
