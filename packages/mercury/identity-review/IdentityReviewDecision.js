export const IDENTITY_REVIEW_SUBJECTS = Object.freeze({ PRODUCT_IDENTITY:"PRODUCT_IDENTITY", MERCHANT_IDENTITY:"MERCHANT_IDENTITY" });
export const IDENTITY_REVIEW_OUTCOMES = Object.freeze({ APPROVED:"APPROVED", REJECTED:"REJECTED" });
export const IDENTITY_CONTRADICTION_STATUSES = Object.freeze({ NONE:"NONE", CRITICAL:"CRITICAL" });

function nonBlank(value) { return typeof value === "string" && value.trim() !== ""; }
export function isValidIdentityReviewer(value) {
  if (!nonBlank(value)) return false;
  const normalized=value.trim();
  if (/^<[^<>]+>$/.test(normalized)) return false;
  return !["<YOUR_OPERATOR_LABEL>","<REVIEWED_BY>"].includes(normalized.toUpperCase());
}
function validIso(value) { return nonBlank(value) && Number.isFinite(Date.parse(value)); }
function validDomain(value) {
  if (!nonBlank(value)) return false;
  try { const hostname = new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase(); return hostname === value.toLowerCase().replace(/^www\./, "") && hostname.includes("."); }
  catch { return false; }
}

export function validateIdentityReviewDecision(decision,{allowInvalidReviewer=false}={}) {
  const errors=[];
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) return Object.freeze({valid:false,errors:Object.freeze(["Identity review decision must be an object."])});
  if (decision.schemaVersion !== "1.0") errors.push("Unsupported identity review schemaVersion.");
  if (!Object.values(IDENTITY_REVIEW_SUBJECTS).includes(decision.subjectType)) errors.push("subjectType is invalid.");
  if (!Object.values(IDENTITY_REVIEW_OUTCOMES).includes(decision.decisionOutcome)) errors.push("decisionOutcome is invalid.");
  if (!validIso(decision.reviewedAt)) errors.push("reviewedAt must be a valid ISO timestamp.");
  if (!isValidIdentityReviewer(decision.reviewedBy)&&!allowInvalidReviewer) errors.push("reviewedBy must be a non-placeholder operator identity.");
  if (!nonBlank(decision.reason)) errors.push("reason is required.");
  if (!Array.isArray(decision.supportingEvidenceReferences) || decision.supportingEvidenceReferences.length === 0 || decision.supportingEvidenceReferences.some(x=>!nonBlank(x))) errors.push("supportingEvidenceReferences requires non-empty evidence IDs.");
  if (!Object.values(IDENTITY_CONTRADICTION_STATUSES).includes(decision.contradictionStatus)) errors.push("contradictionStatus is invalid.");
  if (!decision.audit || typeof decision.audit !== "object" || !nonBlank(decision.audit.source) || !nonBlank(decision.audit.requestId) || !validIso(decision.audit.preparedAt)) errors.push("complete audit metadata is required.");
  if (decision.retainedEvidenceModified !== false || decision.promotionAuthorized !== false) errors.push("review cannot modify evidence or authorize promotion.");
  if (decision.subjectType === IDENTITY_REVIEW_SUBJECTS.PRODUCT_IDENTITY) {
    if (!nonBlank(decision.atlasProductId)) errors.push("atlasProductId is required.");
    if (decision.previousState !== "PROBABLE" || decision.requestedState !== "VERIFIED") errors.push("Only PROBABLE to VERIFIED product review is supported.");
    if (decision.decisionOutcome === "APPROVED" && decision.contradictionStatus !== "NONE") errors.push("Critical contradictions block product verification.");
  }
  if (decision.subjectType === IDENTITY_REVIEW_SUBJECTS.MERCHANT_IDENTITY) {
    if (!nonBlank(decision.discoveredMerchantName)) errors.push("discoveredMerchantName is required.");
    if (!nonBlank(decision.canonicalMerchantName)) errors.push("canonicalMerchantName is required.");
    if (!validDomain(decision.canonicalDomain)) errors.push("canonicalDomain must be a canonical hostname.");
    if (!nonBlank(decision.merchantId)) errors.push("merchantId is required.");
    if (decision.previousState !== "DISCOVERED" || decision.requestedState !== "REGISTERED") errors.push("Only DISCOVERED to REGISTERED merchant review is supported.");
    if (typeof decision.merchantActive !== "boolean") errors.push("merchantActive must be boolean.");
    if (decision.decisionOutcome === "APPROVED" && decision.contradictionStatus !== "NONE") errors.push("Critical contradictions block merchant registration.");
  }
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

function create(subjectType, input) {
  const decision={schemaVersion:"1.0",subjectType,...input,supportingEvidenceReferences:[...(input.supportingEvidenceReferences??[])],retainedEvidenceModified:false,promotionAuthorized:false};
  const report=validateIdentityReviewDecision(decision);
  if(!report.valid) throw new TypeError(report.errors.join(" "));
  return Object.freeze(structuredClone(decision));
}

export function createProductIdentityReviewDecision(input={}) {
  return create(IDENTITY_REVIEW_SUBJECTS.PRODUCT_IDENTITY, input);
}

export function createMerchantIdentityReviewDecision(input={}) {
  return create(IDENTITY_REVIEW_SUBJECTS.MERCHANT_IDENTITY, input);
}
