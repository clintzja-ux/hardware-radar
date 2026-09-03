import crypto from "node:crypto";
import { createProductIdentityReviewDecision, createMerchantIdentityReviewDecision } from "./IdentityReviewDecision.js";
import { createIdentityReviewAuditRemediation } from "./IdentityReviewAuditRemediation.js";
import { prepareProductIdentityReview, prepareMerchantIdentityReview } from "./IdentityReviewPrepare.js";
import { resolveAtlasBackedMerchantRegistration } from "./AtlasBackedMerchantRegistration.js";

export const PRODUCT_IDENTITY_APPROVAL_CONFIRMATION = "APPROVE-PRODUCT-IDENTITY";
export const MERCHANT_IDENTITY_APPROVAL_CONFIRMATION = "APPROVE-MERCHANT-IDENTITY";
export const IDENTITY_REVIEW_AUDIT_REMEDIATION_CONFIRMATION = "REMEDIATE-IDENTITY-REVIEW-AUDIT";

function nonBlank(value, code){if(typeof value!=="string"||value.trim()==="")throw new TypeError(code);return value.trim();}
function exactReferences(left,right){return Array.isArray(left)&&Array.isArray(right)&&JSON.stringify([...left].sort())===JSON.stringify([...right].sort());}
function requireApproval({confirmationToken,expectedToken,reviewedBy,reason,contradictionStatus}){
  if(confirmationToken!==expectedToken)throw new Error(`EXPLICIT_CONFIRMATION_REQUIRED:--confirm=${expectedToken}`);
  nonBlank(reviewedBy,"REVIEWED_BY_REQUIRED");nonBlank(reason,"REVIEW_REASON_REQUIRED");
  if(contradictionStatus!=="NONE"&&contradictionStatus!=="CRITICAL")throw new TypeError("CONTRADICTION_STATUS_INVALID");
  if(contradictionStatus==="CRITICAL")throw new Error("CRITICAL_IDENTITY_CONTRADICTION");
}

export class IdentityReviewService {
  constructor({evidenceRepository,decisionRepository,retailerRepository=null}={}){if(!evidenceRepository?.getById)throw new TypeError("evidenceRepository is required.");if(!decisionRepository?.recordDecision)throw new TypeError("decisionRepository is required.");this.evidenceRepository=evidenceRepository;this.decisionRepository=decisionRepository;this.retailerRepository=retailerRepository;}
  async _records(refs){const records=[];for(const id of refs??[]){const record=await this.evidenceRepository.getById(id);if(!record)throw new Error(`IDENTITY_REVIEW_EVIDENCE_NOT_FOUND:${id}`);records.push(record);}return records;}
  async recordProductDecision(input={}){const records=await this._records(input.supportingEvidenceReferences);if(records.length===0||records.some(r=>r.candidate?.identity?.outcome!=="PROBABLE"||r.candidate?.identity?.atlasProductId!==input.atlasProductId))throw new Error("PRODUCT_REVIEW_CURRENT_STATE_NOT_PROBABLE");return this.decisionRepository.recordDecision(createProductIdentityReviewDecision(input));}
  async recordMerchantDecision(input={}){const records=await this._records(input.supportingEvidenceReferences);if(records.length===0||records.some(r=>r.merchantResolution?.outcome!=="DISCOVERED"||r.merchantResolution?.canonicalDomain!==input.canonicalDomain))throw new Error("MERCHANT_REVIEW_CURRENT_STATE_NOT_DISCOVERED");return this.decisionRepository.recordDecision(createMerchantIdentityReviewDecision(input));}
  async approvePreparedProductRequest({request,requestId,confirmationToken,reviewedBy,reason,contradictionStatus,reviewedAt,atlasProductId}={}){
    requireApproval({confirmationToken,expectedToken:PRODUCT_IDENTITY_APPROVAL_CONFIRMATION,reviewedBy,reason,contradictionStatus});
    if(!request||request.requestId!==requestId)throw new Error("PRODUCT_REVIEW_REQUEST_ID_MISMATCH");
    if(request.subjectType!=="PRODUCT_IDENTITY"||request.status!=="PENDING_OPERATOR_REVIEW"||request.previousState!=="PROBABLE"||request.requestedState!=="VERIFIED")throw new Error("PRODUCT_REVIEW_REQUEST_BINDING_INVALID");
    if(request.atlasProductId!==atlasProductId)throw new Error("PRODUCT_REVIEW_ATLAS_PRODUCT_MISMATCH");
    const current=prepareProductIdentityReview({records:await this.evidenceRepository.getAll(),atlasProductId,preparedAt:request.preparedAt,requestId});
    if(!exactReferences(request.supportingEvidenceReferences,current.supportingEvidenceReferences))throw new Error("PRODUCT_REVIEW_EVIDENCE_SUBSTITUTION");
    return this.recordProductDecision({atlasProductId,previousState:request.previousState,requestedState:request.requestedState,decisionOutcome:"APPROVED",reviewedAt,reviewedBy:reviewedBy.trim(),reason:reason.trim(),supportingEvidenceReferences:[...request.supportingEvidenceReferences],contradictionStatus,audit:{source:"IDENTITY_REVIEW_APPROVAL_CLI",requestId,preparedAt:request.preparedAt}});
  }
  async approvePreparedMerchantRequest({request,requestId,confirmationToken,reviewedBy,reason,contradictionStatus,reviewedAt,canonicalDomain,merchantId}={}){
    requireApproval({confirmationToken,expectedToken:MERCHANT_IDENTITY_APPROVAL_CONFIRMATION,reviewedBy,reason,contradictionStatus});
    if(!request||request.requestId!==requestId)throw new Error("MERCHANT_REVIEW_REQUEST_ID_MISMATCH");
    if(request.subjectType!=="MERCHANT_IDENTITY"||request.status!=="PENDING_OPERATOR_REVIEW"||request.previousState!=="DISCOVERED"||request.requestedState!=="REGISTERED")throw new Error("MERCHANT_REVIEW_REQUEST_BINDING_INVALID");
    if(request.canonicalDomain!==canonicalDomain)throw new Error("MERCHANT_REVIEW_DOMAIN_MISMATCH");
    if(request.merchantId!==merchantId)throw new Error("MERCHANT_REVIEW_ID_MISMATCH");
    const current=prepareMerchantIdentityReview({records:await this.evidenceRepository.getAll(),canonicalDomain,canonicalMerchantName:request.canonicalMerchantName,merchantId,preparedAt:request.preparedAt,requestId});
    if(current.discoveredMerchantName!==request.discoveredMerchantName||!exactReferences(request.supportingEvidenceReferences,current.supportingEvidenceReferences))throw new Error("MERCHANT_REVIEW_EVIDENCE_SUBSTITUTION");
    if(!this.retailerRepository?.getAll)throw new Error("ATLAS_RETAILER_REPOSITORY_REQUIRED");
    const retailers=await this.retailerRepository.getAll();
    const atlasBoundDecision={subjectType:"MERCHANT_IDENTITY",discoveredMerchantName:request.discoveredMerchantName,canonicalMerchantName:request.canonicalMerchantName,canonicalDomain,merchantId,merchantActive:true};
    for(const record of await this._records(request.supportingEvidenceReferences))resolveAtlasBackedMerchantRegistration({decision:atlasBoundDecision,record,retailers});
    return this.recordMerchantDecision({discoveredMerchantName:request.discoveredMerchantName,canonicalMerchantName:request.canonicalMerchantName,canonicalDomain,merchantId,merchantActive:true,previousState:request.previousState,requestedState:request.requestedState,decisionOutcome:"APPROVED",reviewedAt,reviewedBy:reviewedBy.trim(),reason:reason.trim(),supportingEvidenceReferences:[...request.supportingEvidenceReferences],contradictionStatus,audit:{source:"IDENTITY_REVIEW_APPROVAL_CLI",requestId,preparedAt:request.preparedAt}});
  }
  async remediateReviewerAudit({decisionId,confirmationToken,correctedReviewedBy,reason,remediatedAt,remediatedBy}={}){
    if(confirmationToken!==IDENTITY_REVIEW_AUDIT_REMEDIATION_CONFIRMATION)throw new Error(`EXPLICIT_CONFIRMATION_REQUIRED:--confirm=${IDENTITY_REVIEW_AUDIT_REMEDIATION_CONFIRMATION}`);
    nonBlank(decisionId,"DECISION_ID_REQUIRED");nonBlank(correctedReviewedBy,"CORRECTED_REVIEWED_BY_REQUIRED");nonBlank(remediatedBy,"REMEDIATED_BY_REQUIRED");nonBlank(reason,"REMEDIATION_REASON_REQUIRED");
    const original=await this.decisionRepository.getById(decisionId);if(!original)throw new Error("IDENTITY_REVIEW_REMEDIATION_DECISION_NOT_FOUND");
    if(original.decisionOutcome!=="APPROVED"||original.contradictionStatus!=="NONE")throw new Error("IDENTITY_REVIEW_REMEDIATION_ORIGINAL_NOT_APPROVED");
    const records=await this._records(original.supportingEvidenceReferences);
    if(original.subjectType==="PRODUCT_IDENTITY"&&(original.previousState!=="PROBABLE"||original.requestedState!=="VERIFIED"||records.some(r=>r.candidate?.identity?.outcome!=="PROBABLE"||r.candidate?.identity?.atlasProductId!==original.atlasProductId)))throw new Error("IDENTITY_REVIEW_REMEDIATION_PRODUCT_BINDING_INVALID");
    if(original.subjectType==="MERCHANT_IDENTITY"&&(original.previousState!=="DISCOVERED"||original.requestedState!=="REGISTERED"||records.some(r=>r.merchantResolution?.outcome!=="DISCOVERED"||r.merchantResolution?.canonicalDomain!==original.canonicalDomain)))throw new Error("IDENTITY_REVIEW_REMEDIATION_MERCHANT_BINDING_INVALID");
    const remediation=createIdentityReviewAuditRemediation({originalDecisionId:original.identityReviewDecisionId,subjectType:original.subjectType,originalReviewedBy:original.reviewedBy,correctedReviewedBy:correctedReviewedBy.trim(),remediatedAt,reason:reason.trim(),remediatedBy:remediatedBy.trim(),supportingEvidenceReferences:[...original.supportingEvidenceReferences],originalDecisionHash:crypto.createHash("sha256").update(JSON.stringify(original)).digest("hex")});
    return this.decisionRepository.recordRemediation(remediation);
  }
}
export default IdentityReviewService;
