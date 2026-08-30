export const REVIEW_DECISIONS = Object.freeze({
  REVIEWED: "REVIEWED",
  HOLD: "HOLD",
  REJECTED: "REJECTED"
});

function nonBlank(value) {
  return typeof value === "string" && value.trim() !== "";
}

export function validateReviewDecision(input) {
  const errors = [];
  if (!input || typeof input !== "object") return Object.freeze({ valid: false, errors: Object.freeze(["Review decision must be an object."]) });
  const allowed=["schemaVersion","observationId","decision","reviewedBy","reviewedAt","reasonCodes","notes","canonicalObservationModified","governance"];
  if(Object.keys(input).some(key=>!allowed.includes(key)))errors.push("Review decision contains unsupported fields.");
  if(input.schemaVersion!=="1.0")errors.push("Review decision schemaVersion is invalid.");
  if (!nonBlank(input.observationId)) errors.push("observationId is required.");
  if (!Object.values(REVIEW_DECISIONS).includes(input.decision)) errors.push("decision is invalid.");
  if (!nonBlank(input.reviewedBy)) errors.push("reviewedBy is required.");
  if (!nonBlank(input.reviewedAt) || !Number.isFinite(Date.parse(input.reviewedAt))) errors.push("reviewedAt must be a valid ISO date-time.");
  if (input.reasonCodes !== undefined && (!Array.isArray(input.reasonCodes) || input.reasonCodes.some((v) => !nonBlank(v)))) errors.push("reasonCodes must be an array of non-empty strings.");
  if (input.notes !== undefined && typeof input.notes !== "string") errors.push("notes must be a string when supplied.");
  if(input.canonicalObservationModified!==false)errors.push("Review decisions cannot modify canonical observations.");
  if(input.governance!==undefined){const governance=input.governance,keys=["policyVersion","authorizationId","candidateBindingDigest","predecessorReviewDecisionId"];if(!governance||typeof governance!=="object"||Array.isArray(governance)||Object.keys(governance).some(key=>!keys.includes(key))||!nonBlank(governance.policyVersion)||!nonBlank(governance.authorizationId)||!/^[a-f0-9]{64}$/.test(governance.candidateBindingDigest??"")||(governance.predecessorReviewDecisionId!==null&&!nonBlank(governance.predecessorReviewDecisionId)))errors.push("Review decision governance is invalid.");}
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function createReviewDecision({ observationId, decision, reviewedBy, reviewedAt, reasonCodes = [], notes = "", governance }) {
  const candidate = {
    schemaVersion: "1.0",
    observationId,
    decision,
    reviewedBy,
    reviewedAt,
    reasonCodes: [...reasonCodes],
    notes,
    canonicalObservationModified: false,
    ...(governance===undefined?{}:{governance:structuredClone(governance)})
  };
  const report = validateReviewDecision(candidate);
  if (!report.valid) throw new TypeError(report.errors.join(" "));
  return Object.freeze({ ...candidate, reasonCodes: Object.freeze(candidate.reasonCodes) });
}

export default createReviewDecision;
