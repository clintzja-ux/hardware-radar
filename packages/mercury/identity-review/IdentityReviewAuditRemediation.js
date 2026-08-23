import {isValidIdentityReviewer} from "./IdentityReviewDecision.js";

function nonBlank(value){return typeof value==="string"&&value.trim()!=="";}
function validIso(value){return nonBlank(value)&&Number.isFinite(Date.parse(value));}

export function validateIdentityReviewAuditRemediation(value){
  const errors=[];
  if(!value||typeof value!=="object"||Array.isArray(value))return Object.freeze({valid:false,errors:Object.freeze(["Audit remediation must be an object."])});
  if(value.schemaVersion!=="1.0")errors.push("Unsupported remediation schemaVersion.");
  if(value.remediationType!=="REVIEWER_IDENTITY_CORRECTION")errors.push("remediationType is invalid.");
  if(!nonBlank(value.originalDecisionId))errors.push("originalDecisionId is required.");
  if(!["PRODUCT_IDENTITY","MERCHANT_IDENTITY"].includes(value.subjectType))errors.push("subjectType is invalid.");
  if(!nonBlank(value.originalReviewedBy))errors.push("originalReviewedBy is required.");
  if(!isValidIdentityReviewer(value.correctedReviewedBy))errors.push("correctedReviewedBy must be a non-placeholder operator identity.");
  if(!isValidIdentityReviewer(value.remediatedBy))errors.push("remediatedBy must be a non-placeholder operator identity.");
  if(!validIso(value.remediatedAt))errors.push("remediatedAt must be a valid ISO timestamp.");
  if(!nonBlank(value.reason))errors.push("reason is required.");
  if(!Array.isArray(value.supportingEvidenceReferences)||value.supportingEvidenceReferences.length===0||value.supportingEvidenceReferences.some(x=>!nonBlank(x)))errors.push("supportingEvidenceReferences are required.");
  if(typeof value.originalDecisionHash!=="string"||!/^[a-f0-9]{64}$/.test(value.originalDecisionHash))errors.push("originalDecisionHash is invalid.");
  if(value.originalDecisionModified!==false||value.promotionAuthorized!==false)errors.push("remediation cannot modify the original decision or authorize promotion.");
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function createIdentityReviewAuditRemediation(input={}){
  const value={schemaVersion:"1.0",remediationType:"REVIEWER_IDENTITY_CORRECTION",...input,supportingEvidenceReferences:[...(input.supportingEvidenceReferences??[])],originalDecisionModified:false,promotionAuthorized:false};
  const report=validateIdentityReviewAuditRemediation(value);if(!report.valid)throw new TypeError(report.errors.join(" "));return Object.freeze(structuredClone(value));
}
