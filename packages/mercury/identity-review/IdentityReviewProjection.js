import crypto from "node:crypto";
import { canonicalizeMerchantDomain } from "../market/dataforseo/DataForSeoMerchantIdentity.js";
import { validateIdentityReviewDecision, isValidIdentityReviewer } from "./IdentityReviewDecision.js";
import { validateIdentityReviewAuditRemediation } from "./IdentityReviewAuditRemediation.js";
import { resolveAtlasBackedMerchantRegistration } from "./AtlasBackedMerchantRegistration.js";

function remediationFor(decision,remediations){return remediations.find(x=>x.originalDecisionId===decision.identityReviewDecisionId)??null;}
function reviewerEffective(decision,remediations){if(isValidIdentityReviewer(decision.reviewedBy))return true;const remediation=remediationFor(decision,remediations);return Boolean(remediation&&remediation.subjectType===decision.subjectType&&remediation.originalReviewedBy===decision.reviewedBy&&remediation.originalDecisionHash===crypto.createHash("sha256").update(JSON.stringify(decision)).digest("hex")&&JSON.stringify(remediation.supportingEvidenceReferences)===JSON.stringify(decision.supportingEvidenceReferences));}
function latestApproved(decisions,remediations,predicate) {
  return [...decisions].filter(d=>d.decisionOutcome==="APPROVED"&&reviewerEffective(d,remediations)&&predicate(d)).sort((a,b)=>(a.sequence??0)-(b.sequence??0)).at(-1)??null;
}

export function projectIdentityReviewState({record,decisions=[],remediations=[],atlasRetailers=[]}={}) {
  if(!record||typeof record!=="object"||!Array.isArray(decisions)||!Array.isArray(remediations)||!Array.isArray(atlasRetailers)) throw new TypeError("record, decisions, remediations, and atlasRetailers are required.");
  for(const decision of decisions){const report=validateIdentityReviewDecision(decision,{allowInvalidReviewer:true});if(!report.valid)throw new TypeError(`INVALID_IDENTITY_REVIEW_DECISION:${report.errors.join(" ")}`);}
  const decisionsById=new Map(decisions.map(x=>[x.identityReviewDecisionId,x]));const seenRemediations=new Set();for(const remediation of remediations){const report=validateIdentityReviewAuditRemediation(remediation);if(!report.valid)throw new TypeError(`INVALID_IDENTITY_REVIEW_REMEDIATION:${report.errors.join(" ")}`);if(seenRemediations.has(remediation.originalDecisionId))throw new Error("CONFLICTING_IDENTITY_REVIEW_REMEDIATIONS");const original=decisionsById.get(remediation.originalDecisionId);if(!original||!reviewerEffective(original,[remediation]))throw new Error("IDENTITY_REVIEW_REMEDIATION_BINDING_INVALID");seenRemediations.add(remediation.originalDecisionId);}
  const evidenceId=record.evidenceId;
  const atlasProductId=record.candidate?.identity?.atlasProductId;
  const domain=canonicalizeMerchantDomain(record.candidate?.marketEvidence?.seller?.domain);
  const supports=d=>d.supportingEvidenceReferences.includes(evidenceId);
  const product=latestApproved(decisions,remediations,d=>d.subjectType==="PRODUCT_IDENTITY"&&d.atlasProductId===atlasProductId&&supports(d));
  const merchant=latestApproved(decisions,remediations,d=>d.subjectType==="MERCHANT_IDENTITY"&&d.canonicalDomain===domain&&supports(d));
  const atlasMerchant=merchant?resolveAtlasBackedMerchantRegistration({decision:merchant,record,retailers:atlasRetailers}):null;
  return Object.freeze({
    projectionVersion:"1.0",evidenceId,
    product:Object.freeze({state:product?"VERIFIED":record.candidate?.identity?.outcome??null,decisionId:product?.identityReviewDecisionId??null,remediationId:product?remediationFor(product,remediations)?.identityReviewRemediationId??null:null,atlasProductId}),
    merchant:Object.freeze({state:atlasMerchant?"REGISTERED":record.merchantResolution?.outcome??null,decisionId:merchant?.identityReviewDecisionId??null,remediationId:merchant?remediationFor(merchant,remediations)?.identityReviewRemediationId??null:null,merchantId:atlasMerchant?.retailerId??null,canonicalMerchantName:merchant?.canonicalMerchantName??null,canonicalDomain:atlasMerchant?.canonicalDomain??domain,active:atlasMerchant?true:null,atlasResolution:atlasMerchant}),
    retainedEvidenceModified:false
  });
}
