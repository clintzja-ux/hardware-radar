import atlasDefault from "../../atlas/Atlas.js";
import defaultPublicationPolicy from "./PublicationPolicy.js";
import { evaluateLiveMarketEligibility } from "../live/LiveMarketEligibility.js";
import { createPublicationDecision } from "./PublicationDecision.js";

function freeze(value) { return Object.freeze(value); }
function amazonSourceAuthorized(observation) {
  if (observation?.retailerId !== "RETAILER-0001") return true;
  return observation.sourceMethod === "API" && observation.compliance?.licenseContext === "AMAZON_CREATORS_API";
}

export class PublicationWorkflowService {
  constructor({ acceptanceRepository, reviewRepository, publicationRepository, mercury, atlas = atlasDefault, policy = defaultPublicationPolicy, currentMarketQualificationService = null, requireCurrentMarketQualification = false } = {}) {
    if (!acceptanceRepository) throw new TypeError("acceptanceRepository is required.");
    if (!reviewRepository) throw new TypeError("reviewRepository is required.");
    if (!publicationRepository) throw new TypeError("publicationRepository is required.");
    if (!mercury || typeof mercury.evaluateConfidence !== "function") throw new TypeError("mercury is required.");
    this.acceptanceRepository = acceptanceRepository;
    this.reviewRepository = reviewRepository;
    this.publicationRepository = publicationRepository;
    this.mercury = mercury;
    this.atlas = atlas;
    this.policy = policy;
    this.currentMarketQualificationService = currentMarketQualificationService;
    this.requireCurrentMarketQualification = requireCurrentMarketQualification === true;
  }

  usesCurrentMarketQualification() {
    return Boolean(this.currentMarketQualificationService?.assess);
  }

  async evaluate(observationId, { asOf = new Date().toISOString() } = {}) {
    const observation = await this.acceptanceRepository.getById(observationId, { asOf });
    const audit = await this.acceptanceRepository.getAuditById(observationId);
    const effectiveReview = await this.reviewRepository.getEffectiveDecision(observationId);
    const reasons = [];
    if (!audit) reasons.push("OBSERVATION_NOT_FOUND");
    if (!observation) reasons.push(audit?.storage?.payloadStatus === "PURGED" ? "LICENSED_PAYLOAD_PURGED" : "OBSERVATION_PAYLOAD_UNAVAILABLE");
    if (!effectiveReview) reasons.push("REVIEW_REQUIRED");
    else if (effectiveReview.decision !== "REVIEWED") reasons.push(`REVIEW_${effectiveReview.decision}`);
    if (observation && !amazonSourceAuthorized(observation)) reasons.push("SOURCE_NOT_AUTHORIZED_FOR_PUBLICATION");

    let product = null, retailer = null, freshness = null, confidence = null, evidenceEligibility = null, currentMarketQualification = null;
    if (this.currentMarketQualificationService) {
      currentMarketQualification = await this.currentMarketQualificationService.assess({ observationId, evaluatedAt: asOf });
      if (currentMarketQualification.qualified !== true) reasons.push("CURRENT_MARKET_QUALIFICATION_REQUIRED", ...(currentMarketQualification.reasons ?? []));
      freshness = currentMarketQualification.freshness;
      confidence = currentMarketQualification.confidence;
      evidenceEligibility = freeze({
        eligible: currentMarketQualification.qualified === true,
        reasons: freeze([...(currentMarketQualification.reasons ?? [])]),
        policy: currentMarketQualification.liveMarketPolicy ?? null
      });
    } else if (this.requireCurrentMarketQualification) {
      reasons.push("CURRENT_MARKET_QUALIFICATION_SERVICE_REQUIRED");
    }
    if (observation) {
      product = await this.atlas.getProduct(observation.atlasProductId).catch(() => null);
      retailer = await this.atlas.getRetailer(observation.retailerId).catch(() => null);
      if (!this.currentMarketQualificationService && !this.requireCurrentMarketQualification) {
        try {
          freshness = this.mercury.evaluateFreshness(observation, { evaluatedAt: asOf });
          confidence = this.mercury.evaluateConfidence(observation, { evaluatedAt: asOf });
          evidenceEligibility = evaluateLiveMarketEligibility(observation, { product, retailer, freshness, confidence, storage: audit?.storage ?? null, evaluatedAt: asOf, policy: this.policy });
          reasons.push(...evidenceEligibility.reasons);
        } catch {
          reasons.push("EVIDENCE_EVALUATION_FAILED");
        }
      }
    }

    const uniqueReasons = [...new Set(reasons)];
    return freeze({
      observationId,
      eligible: uniqueReasons.length === 0,
      reasons: freeze(uniqueReasons),
      observation,
      audit,
      product,
      retailer,
      freshness,
      confidence,
      evidenceEligibility,
      currentMarketQualification,
      effectiveReviewDecision: effectiveReview
    });
  }

  async authorizePublish({ observationId, authorizedBy, authorizedAt, reasonCodes = [], notes = "", governance = null } = {}) {
    const result = await this.evaluate(observationId, { asOf: authorizedAt });
    if (!result.eligible) throw new Error(`Observation is not publication eligible: ${result.reasons.join(", ")}`);
    const draft = createPublicationDecision({ observationId, action: "PUBLISH", reviewDecisionId: result.effectiveReviewDecision.reviewDecisionId, authorizedBy, authorizedAt, reasonCodes, notes, governance });
    return this.publicationRepository.recordDecision(draft);
  }

  async withdraw({ observationId, authorizedBy, authorizedAt, reasonCodes = [], notes = "", governance = null } = {}) {
    const effectiveReview = await this.reviewRepository.getEffectiveDecision(observationId);
    const draft = createPublicationDecision({ observationId, action: "WITHDRAW", reviewDecisionId: effectiveReview?.reviewDecisionId ?? null, authorizedBy, authorizedAt, reasonCodes, notes, governance });
    return this.publicationRepository.recordDecision(draft);
  }

  async getState(observationId, { asOf = new Date().toISOString() } = {}) {
    const history = await this.publicationRepository.getHistoryForObservation(observationId);
    const effectiveDecision = history.length ? history[history.length - 1] : null;
    const eligibility = await this.evaluate(observationId, { asOf });
    return freeze({ observationId, effectiveDecision, history, eligibility });
  }

  async getGovernedPublishedObservations({ asOf = new Date().toISOString() } = {}) {
    return freeze((await this.getGovernedPublishedCandidates({ asOf })).map((candidate) => candidate.observation));
  }

  async getGovernedPublishedCandidates({ asOf = new Date().toISOString() } = {}) {
    const observations = await this.acceptanceRepository.getAll({ asOf });
    const published = [];
    for (const observation of observations) {
      const effectiveDecision = await this.publicationRepository.getEffectiveDecision(observation.observationId);
      if (!effectiveDecision || effectiveDecision.action !== "PUBLISH") continue;
      const eligibility = await this.evaluate(observation.observationId, { asOf });
      if (eligibility.eligible) published.push(freeze({
        observation,
        product: eligibility.product,
        retailer: eligibility.retailer,
        currentMarketQualification: eligibility.currentMarketQualification,
        publicationDecision: effectiveDecision
      }));
    }
    return freeze(published);
  }
}
export default PublicationWorkflowService;
