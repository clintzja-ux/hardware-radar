import crypto from "node:crypto";
import { canonicalAdmissionMaterialHash } from "../canonical-admission/CanonicalObservationAdmissionPolicy.js";

export const PUBLICATION_OPERATOR_POLICY_VERSION = "MVP-002-2.0";
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
export const publicationCandidateBindingDigest = binding => hash(binding);

export class PublicationOperatorAssessmentService {
  constructor({ acceptanceRepository, reviewRepository, publicationRepository, currentMarketQualificationService } = {}) {
    if (!acceptanceRepository?.getById || !acceptanceRepository?.getAuditById || !reviewRepository?.getEffectiveDecision || !publicationRepository?.getEffectiveDecision || !currentMarketQualificationService?.assess) throw new TypeError("PUBLICATION_OPERATOR_ASSESSMENT_DEPENDENCY_REQUIRED");
    Object.assign(this, { acceptanceRepository, reviewRepository, publicationRepository, currentMarketQualificationService });
  }

  async assess({ observationId, decision, asOf = new Date().toISOString() } = {}) {
    const blockers = [];
    if (typeof observationId !== "string" || !observationId.trim() || !["PUBLISH", "WITHDRAW"].includes(decision) || !Number.isFinite(Date.parse(asOf))) blockers.push("PUBLICATION_OPERATOR_INPUT_INVALID");
    const [observation, audit, review, predecessor] = blockers.length ? [null, null, null, null] : await Promise.all([this.acceptanceRepository.getById(observationId, { asOf }), this.acceptanceRepository.getAuditById(observationId), this.reviewRepository.getEffectiveDecision(observationId), this.publicationRepository.getEffectiveDecision(observationId)]);
    if (!observation || !audit) blockers.push("PUBLICATION_CANONICAL_OBSERVATION_INVALID");
    let qualification = null;
    if (decision === "PUBLISH") {
      qualification = await this.currentMarketQualificationService.assess({ observationId, evaluatedAt: asOf });
      if (review?.decision !== "REVIEWED") blockers.push("PUBLICATION_REVIEW_NOT_REVIEWED");
      if (qualification?.qualified !== true || qualification?.status !== "CURRENT_MARKET_QUALIFIED") blockers.push("PUBLICATION_CURRENT_MARKET_NOT_QUALIFIED", ...(qualification?.reasons ?? []));
      if (!qualification?.binding || !qualification?.bindingDigest) blockers.push("PUBLICATION_QUALIFICATION_BINDING_INVALID");
      if (predecessor?.action === "PUBLISH") blockers.push("PUBLICATION_ALREADY_PUBLISHED");
    } else if (predecessor?.action !== "PUBLISH") blockers.push("PUBLICATION_WITHDRAW_REQUIRES_EFFECTIVE_PUBLISH");
    const qualificationBinding = qualification?.binding ? structuredClone(qualification.binding) : null;
    if (qualificationBinding) delete qualificationBinding.evaluatedAt;
    const binding = observation && audit ? freeze({
      observationId,
      decision,
      observationDigest: canonicalAdmissionMaterialHash(observation),
      auditDigest: canonicalAdmissionMaterialHash(audit),
      reviewDecisionId: review?.reviewDecisionId ?? null,
      reviewDecisionDigest: review ? canonicalAdmissionMaterialHash(review) : null,
      atlasProductId: observation.atlasProductId,
      retailerId: observation.retailerId,
      provider: qualification?.binding?.provider ?? null,
      sourceId: observation.compliance?.licenseContext ?? null,
      providerTaskId: observation.provenance?.acquisition?.requestId ?? null,
      provenanceDigest: canonicalAdmissionMaterialHash(observation.provenance),
      rightsProfileHash: qualification?.binding?.rightsProfileHash ?? null,
      adapterId: qualification?.binding?.adapterId ?? null,
      adapterVersion: qualification?.binding?.adapterVersion ?? null,
      e2sPolicyVersion: qualification?.policyVersion ?? null,
      e2sCandidateDigest: qualificationBinding ? canonicalAdmissionMaterialHash(qualificationBinding) : null,
      freshnessStatus: qualification?.freshness?.status ?? null,
      confidenceStatus: qualification?.confidence?.status ?? null,
      condition: qualification?.condition ?? null,
      availability: qualification?.availability ?? null,
      freshnessPolicyId: qualification?.binding?.freshnessPolicyId ?? null,
      freshnessPolicyVersion: qualification?.binding?.freshnessPolicyVersion ?? null,
      predecessorPublicationDecisionId: predecessor?.publicationDecisionId ?? null,
      predecessorPublicationDigest: predecessor ? canonicalAdmissionMaterialHash(predecessor) : null,
      publicationOperatorPolicyVersion: PUBLICATION_OPERATOR_POLICY_VERSION
    }) : null;
    if (!binding) blockers.push("PUBLICATION_CANDIDATE_BINDING_INCOMPLETE");
    const unique = [...new Set(blockers)];
    return freeze({ schemaVersion: "1.0", assessmentType: "PUBLICATION_OPERATOR_TRANSITION", assessmentId: `mer_pubassess_${hash({ policy: PUBLICATION_OPERATOR_POLICY_VERSION, binding, blockers: unique }).slice(0,24)}`, policyVersion: PUBLICATION_OPERATOR_POLICY_VERSION, observationId, decision, eligible: unique.length === 0, blockers: unique, binding, bindingDigest: binding ? publicationCandidateBindingDigest(binding) : null, qualificationAssessment: qualification, effectivePublicationDecision: predecessor, mutationAuthorized: false, publicationDecisionRecorded: false, currentPriceAuthority: false, livePriceAuthority: false, publicPriceAuthority: false, cheapestAuthority: false, pickAuthority: false, rankingAuthority: false, recommendationAuthority: false, networkOperation: "NONE", paidTaskCreated: false, actualSpendUsd: 0 });
  }
}
