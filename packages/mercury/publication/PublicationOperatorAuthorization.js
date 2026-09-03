import crypto from "node:crypto";
import { PUBLICATION_OPERATOR_POLICY_VERSION, publicationCandidateBindingDigest } from "./PublicationOperatorPolicy.js";

export const PUBLICATION_CONFIRMATIONS = Object.freeze({ PUBLISH: "RECORD-PUBLICATION-PUBLISH-DECISION", WITHDRAW: "RECORD-PUBLICATION-WITHDRAW-DECISION" });
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonEmpty = value => typeof value === "string" && value.trim();
export function validatePublicationAuthorization(value) {
  const errors = [];
  if (!value || value.schemaVersion !== "1.0" || value.authorizationType !== "PUBLICATION_TRANSITION" || value.policyVersion !== PUBLICATION_OPERATOR_POLICY_VERSION || !["PUBLISH", "WITHDRAW"].includes(value.decision) || value.status !== "PENDING_OPERATOR_APPROVAL") errors.push("PUBLICATION_AUTHORIZATION_SCHEMA_INVALID");
  for (const key of ["authorizationId", "assessmentId", "observationId", "candidateBindingDigest", "requestedBy", "reason", "preparedAt", "expiresAt"]) if (!nonEmpty(value?.[key])) errors.push(`PUBLICATION_AUTHORIZATION_${key.toUpperCase()}_REQUIRED`);
  if (!value?.candidateBinding || publicationCandidateBindingDigest(value.candidateBinding) !== value?.candidateBindingDigest || value.candidateBinding.observationId !== value.observationId || value.candidateBinding.decision !== value.decision) errors.push("PUBLICATION_AUTHORIZATION_BINDING_INVALID");
  if (!Number.isFinite(Date.parse(value?.preparedAt)) || !Number.isFinite(Date.parse(value?.expiresAt)) || Date.parse(value.expiresAt) <= Date.parse(value.preparedAt)) errors.push("PUBLICATION_AUTHORIZATION_TIME_INVALID");
  if (value?.singleUse !== true || value?.networkOperation !== "NONE" || value?.paidTaskCreated !== false || value?.actualSpendUsd !== 0 || value?.currentPriceAuthority !== false || value?.cheapestAuthority !== false || value?.pickAuthority !== false) errors.push("PUBLICATION_AUTHORIZATION_SCOPE_INVALID");
  return freeze({ valid: errors.length === 0, errors });
}
export function createPublicationAuthorization({ assessment, requestedBy, reason, preparedAt, ttlMinutes = 15 } = {}) {
  if (assessment?.eligible !== true || !assessment.binding) throw new Error(`PUBLICATION_NOT_ELIGIBLE:${(assessment?.blockers ?? []).join(",")}`);
  if (!nonEmpty(requestedBy) || !nonEmpty(reason) || !Number.isFinite(Date.parse(preparedAt)) || !Number.isFinite(ttlMinutes) || ttlMinutes <= 0) throw new TypeError("PUBLICATION_AUTHORIZATION_INPUT_INVALID");
  const expiresAt = new Date(Date.parse(preparedAt) + ttlMinutes * 60_000).toISOString(), intent = { assessmentId: assessment.assessmentId, observationId: assessment.observationId, decision: assessment.decision, candidateBindingDigest: assessment.bindingDigest, requestedBy: requestedBy.trim(), reason: reason.trim(), preparedAt, expiresAt };
  const authorization = { schemaVersion: "1.0", authorizationType: "PUBLICATION_TRANSITION", authorizationId: `mer_pubauth_${hash(intent).slice(0,24)}`, assessmentId: assessment.assessmentId, policyVersion: PUBLICATION_OPERATOR_POLICY_VERSION, observationId: assessment.observationId, decision: assessment.decision, candidateBinding: structuredClone(assessment.binding), candidateBindingDigest: assessment.bindingDigest, requestedBy: requestedBy.trim(), reason: reason.trim(), preparedAt, expiresAt, status: "PENDING_OPERATOR_APPROVAL", confirmationRequired: PUBLICATION_CONFIRMATIONS[assessment.decision], singleUse: true, currentPriceAuthority: false, livePriceAuthority: false, publicPriceAuthority: false, cheapestAuthority: false, pickAuthority: false, rankingAuthority: false, recommendationAuthority: false, networkOperation: "NONE", paidTaskCreated: false, actualSpendUsd: 0 };
  const report = validatePublicationAuthorization(authorization); if (!report.valid) throw new TypeError(report.errors.join(",")); return freeze(authorization);
}
export function assertPublicationAuthorization({ authorization, assessment, now }) {
  const report = validatePublicationAuthorization(authorization); if (!report.valid) throw new Error(report.errors.join(","));
  if (Date.parse(now) >= Date.parse(authorization.expiresAt)) throw new Error("PUBLICATION_AUTHORIZATION_EXPIRED");
  if (assessment?.eligible !== true || assessment.assessmentId !== authorization.assessmentId || assessment.bindingDigest !== authorization.candidateBindingDigest || stable(assessment.binding) !== stable(authorization.candidateBinding)) throw new Error("PUBLICATION_AUTHORIZATION_BINDING_CHANGED");
}
