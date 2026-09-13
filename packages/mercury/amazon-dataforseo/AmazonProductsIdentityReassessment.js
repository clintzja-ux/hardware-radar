import crypto from "node:crypto";
import { createAmazonProductsIdentityAdapter } from "./DataForSeoAmazonResults.js";
import { AMAZON_ASIN_IDENTITY_POLICY_VERSION, AMAZON_ASIN_IDENTITY_STATES } from "./AmazonAsinIdentityAssessment.js";

export const AMAZON_PRODUCTS_REASSESSMENT_POLICY_VERSION = "MERCURY-HISTORY-052-1.0";
export const AMAZON_PRODUCTS_REASSESSMENT_CONFIRMATION = "REASSESS-DATAFORSEO-AMAZON-PRODUCTS";
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const required = (value, code) => { if (typeof value !== "string" || !value.trim()) throw new Error(code); return value.trim(); };
const blockedStates = new Set(Object.values(AMAZON_ASIN_IDENTITY_STATES).filter(value => value !== AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN));

export function validateAmazonProductsReassessmentLineage({ artifact, originalOutcome, canonicalResult, atlasProduct } = {}) {
  if (!artifact?.acceptanceArtifactId || !originalOutcome?.outcomeId || originalOutcome.artifactId !== artifact.acceptanceArtifactId || originalOutcome.canonicalResultId !== canonicalResult?.canonicalResultId || originalOutcome.resultDigest !== canonicalResult?.resultDigest || canonicalResult?.resultDigest !== digest(canonicalResult?.operationResult) || canonicalResult?.sourceId !== "DATAFORSEO_AMAZON" || canonicalResult?.operation !== "AMAZON_PRODUCTS" || canonicalResult?.checkpointId !== artifact.acceptanceArtifactId || canonicalResult?.atlasProductId !== artifact.atlasProductId || atlasProduct?.identity?.atlasProductId !== artifact.atlasProductId || !blockedStates.has(originalOutcome.state) || typeof originalOutcome.assessmentId !== "string") throw new Error("AMAZON_PRODUCTS_REASSESSMENT_LINEAGE_INVALID");
  return true;
}

export function createAmazonProductsIdentityReassessment({ artifact, originalOutcome, canonicalResult, atlasProduct, operator, reason, createdAt, corroboratingDestinationAsins = [] } = {}) {
  validateAmazonProductsReassessmentLineage({ artifact, originalOutcome, canonicalResult, atlasProduct });
  const reviewedBy = required(operator, "AMAZON_PRODUCTS_REASSESSMENT_OPERATOR_REQUIRED"), reviewReason = required(reason, "AMAZON_PRODUCTS_REASSESSMENT_REASON_REQUIRED");
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error("AMAZON_PRODUCTS_REASSESSMENT_TIME_INVALID");
  const output = createAmazonProductsIdentityAdapter().process({ canonicalResult, atlasProduct, corroboratingDestinationAsins });
  const strong = output.status === AMAZON_ASIN_IDENTITY_STATES.STRONG_UNIQUE_ASIN;
  const binding = { artifactId: artifact.acceptanceArtifactId, atlasProductId: artifact.atlasProductId, operation: "AMAZON_PRODUCTS", canonicalResultId: canonicalResult.canonicalResultId, resultDigest: canonicalResult.resultDigest, originalOutcomeId: originalOutcome.outcomeId, originalAssessmentId: originalOutcome.assessmentId, originalState: originalOutcome.state, newAssessmentId: output.assessment.assessmentId, newState: output.status, newReason: output.assessment.reasons, governedAsin: strong ? output.governedAsinAnchor.asin : null, identityPolicyVersion: AMAZON_ASIN_IDENTITY_POLICY_VERSION, reassessmentPolicyVersion: AMAZON_PRODUCTS_REASSESSMENT_POLICY_VERSION, correctionReference: "IC-MERCURY-HISTORY-051", reviewedBy, reason: reviewReason };
  const bindingDigest = digest(binding), reassessmentId = `mer_amzreassess_${bindingDigest.slice(0, 24)}`;
  return freeze({ schemaVersion: "1.0", reassessmentId, ...binding, createdAt, bindingDigest, nextPermittedAction: strong ? "OPERATOR_REVIEW_FOR_SELLERS" : "STOP", sellersAuthorizationEligible: strong, providerExecutionAuthorized: false, providerSpendAuthorized: false, providerCallPerformed: false, paidTaskCreated: false, actualSpendUsd: 0 });
}

export function validateAmazonProductsIdentityReassessment(value, { originalOutcome = null } = {}) {
  if (value?.schemaVersion !== "1.0" || value?.reassessmentPolicyVersion !== AMAZON_PRODUCTS_REASSESSMENT_POLICY_VERSION || value?.identityPolicyVersion !== AMAZON_ASIN_IDENTITY_POLICY_VERSION || value?.operation !== "AMAZON_PRODUCTS" || value?.correctionReference !== "IC-MERCURY-HISTORY-051" || !Array.isArray(value?.newReason) || typeof value?.bindingDigest !== "string" || value.bindingDigest !== digest({ artifactId: value.artifactId, atlasProductId: value.atlasProductId, operation: value.operation, canonicalResultId: value.canonicalResultId, resultDigest: value.resultDigest, originalOutcomeId: value.originalOutcomeId, originalAssessmentId: value.originalAssessmentId, originalState: value.originalState, newAssessmentId: value.newAssessmentId, newState: value.newState, newReason: value.newReason, governedAsin: value.governedAsin, identityPolicyVersion: value.identityPolicyVersion, reassessmentPolicyVersion: value.reassessmentPolicyVersion, correctionReference: value.correctionReference, reviewedBy: value.reviewedBy, reason: value.reason }) || value.reassessmentId !== `mer_amzreassess_${value.bindingDigest.slice(0, 24)}` || !Number.isFinite(Date.parse(value.createdAt)) || value.providerExecutionAuthorized !== false || value.providerSpendAuthorized !== false || value.providerCallPerformed !== false || value.paidTaskCreated !== false || value.actualSpendUsd !== 0) throw new Error("AMAZON_PRODUCTS_REASSESSMENT_INVALID");
  if (originalOutcome && (value.originalOutcomeId !== originalOutcome.outcomeId || value.artifactId !== originalOutcome.artifactId || value.canonicalResultId !== originalOutcome.canonicalResultId || value.resultDigest !== originalOutcome.resultDigest || value.originalAssessmentId !== originalOutcome.assessmentId || value.originalState !== originalOutcome.state)) throw new Error("AMAZON_PRODUCTS_REASSESSMENT_LINEAGE_INVALID");
  return true;
}

export function projectEffectiveAmazonProductsOutcome(originalOutcome, reassessments = []) {
  if (!originalOutcome) return null;
  if (!Array.isArray(reassessments)) throw new Error("AMAZON_PRODUCTS_REASSESSMENT_STATE_INVALID");
  const applicable = reassessments.filter(value => value.originalOutcomeId === originalOutcome.outcomeId);
  if (applicable.length === 0) return freeze({ ...originalOutcome, effectiveRecordType: "ORIGINAL_OUTCOME" });
  if (applicable.length !== 1) throw new Error("AMAZON_PRODUCTS_REASSESSMENT_CONFLICT");
  const value = applicable[0]; validateAmazonProductsIdentityReassessment(value, { originalOutcome });
  return freeze({ schemaVersion: "1.0", outcomeId: originalOutcome.outcomeId, artifactId: value.artifactId, authorizationId: originalOutcome.authorizationId, canonicalResultId: value.canonicalResultId, resultDigest: value.resultDigest, state: value.newState, assessmentId: value.newAssessmentId, governedAsin: value.governedAsin, nextPermittedAction: value.nextPermittedAction, sellersAuthorizationEligible: value.sellersAuthorizationEligible, asinEnrichmentAuthorized: false, providerCallPerformed: false, actualSpendUsd: 0, effectiveRecordType: "PRODUCTS_REASSESSMENT", reassessmentId: value.reassessmentId, originalOutcomeId: originalOutcome.outcomeId });
}
