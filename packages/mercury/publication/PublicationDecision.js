const PUBLICATION_DECISION_SCHEMA_VERSION = "1.0";
export const PUBLICATION_ACTIONS = Object.freeze(["PUBLISH", "WITHDRAW"]);

function nonEmpty(value) { return typeof value === "string" && value.trim() !== ""; }
function validIso(value) { return nonEmpty(value) && Number.isFinite(Date.parse(value)); }

export function createPublicationDecision({
  observationId,
  action,
  authorizedBy,
  authorizedAt,
  reviewDecisionId = null,
  reasonCodes = [],
  notes = ""
} = {}) {
  const decision = {
    schemaVersion: PUBLICATION_DECISION_SCHEMA_VERSION,
    observationId,
    action,
    reviewDecisionId,
    authorizedBy,
    authorizedAt,
    reasonCodes: [...reasonCodes],
    notes,
    canonicalObservationModified: false,
    publicationAuthorizationExplicit: true
  };
  const validation = validatePublicationDecision(decision);
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  return Object.freeze(structuredClone(decision));
}

export function validatePublicationDecision(decision) {
  const errors = [];
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) return Object.freeze({ valid: false, errors: Object.freeze(["Publication decision must be an object."]) });
  if (decision.schemaVersion !== PUBLICATION_DECISION_SCHEMA_VERSION) errors.push("Unsupported publication decision schemaVersion.");
  if (!nonEmpty(decision.observationId)) errors.push("observationId is required.");
  if (!PUBLICATION_ACTIONS.includes(decision.action)) errors.push("action must be PUBLISH or WITHDRAW.");
  if (decision.action === "PUBLISH" && !nonEmpty(decision.reviewDecisionId)) errors.push("PUBLISH requires reviewDecisionId.");
  if (decision.reviewDecisionId !== null && decision.reviewDecisionId !== undefined && !nonEmpty(decision.reviewDecisionId)) errors.push("reviewDecisionId must be null or a non-empty string.");
  if (!nonEmpty(decision.authorizedBy)) errors.push("authorizedBy is required.");
  if (!validIso(decision.authorizedAt)) errors.push("authorizedAt must be a valid ISO date-time.");
  if (!Array.isArray(decision.reasonCodes) || decision.reasonCodes.some((code) => !nonEmpty(code))) errors.push("reasonCodes must be an array of non-empty strings.");
  if (typeof decision.notes !== "string") errors.push("notes must be a string.");
  if (decision.canonicalObservationModified !== false) errors.push("Publication decisions cannot modify canonical observations.");
  if (decision.publicationAuthorizationExplicit !== true) errors.push("publicationAuthorizationExplicit must be true.");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export { PUBLICATION_DECISION_SCHEMA_VERSION };
export default createPublicationDecision;
