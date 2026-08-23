export const EVIDENCE_PROMOTION_POLICY_VERSION="DF004-E2H-1.0";
export const canonicalEvidencePromotionPolicy=Object.freeze({policyVersion:EVIDENCE_PROMOTION_POLICY_VERSION,productRequiredState:"VERIFIED",merchantRequiredState:"REGISTERED",oneObservationSufficient:true,canonicalPromotionPolicy:null,publicationFromRetainedEvidence:false});

export function evaluateEvidencePromotionPolicy({projection,df003Eligibility,provenanceComplete,criticalContradiction=false,policy=canonicalEvidencePromotionPolicy}={}){
  const reasons=[];
  if(!policy||policy.policyVersion!==EVIDENCE_PROMOTION_POLICY_VERSION)return Object.freeze({historicalEligible:false,canonicalEligible:false,publicationEligible:false,blocked:true,historicalReasons:Object.freeze(["PROMOTION_POLICY_MISSING_OR_UNSUPPORTED"]),canonicalReasons:Object.freeze(["CANONICAL_PROMOTION_POLICY_MISSING"]),reasons:Object.freeze(["PROMOTION_POLICY_MISSING_OR_UNSUPPORTED","CANONICAL_PROMOTION_POLICY_MISSING"])});
  if(criticalContradiction)reasons.push("CRITICAL_IDENTITY_CONTRADICTION");
  if(projection?.product?.state!==policy.productRequiredState)reasons.push("PRODUCT_IDENTITY_NOT_VERIFIED");
  if(projection?.merchant?.state!==policy.merchantRequiredState)reasons.push("MERCHANT_IDENTITY_NOT_REGISTERED");
  if(df003Eligibility?.historicalAnalyticsEligible!==true||df003Eligibility?.canonicalObservationEligible!==true)reasons.push("DF003_ELIGIBILITY_NOT_SATISFIED");
  if(provenanceComplete!==true)reasons.push("PROVENANCE_INCOMPLETE");
  const eligible=reasons.length===0;
  const canonicalReasons=["CANONICAL_PROMOTION_POLICY_MISSING"];
  return Object.freeze({policyVersion:policy.policyVersion,historicalEligible:eligible,canonicalEligible:false,publicationEligible:false,blocked:criticalContradiction,historicalReasons:Object.freeze(reasons),canonicalReasons:Object.freeze(canonicalReasons),reasons:Object.freeze([...reasons,...canonicalReasons])});
}
