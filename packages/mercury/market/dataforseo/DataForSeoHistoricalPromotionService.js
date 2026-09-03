/**
 * Compatibility name retained for DF003 callers. Canonical authority belongs
 * to DF004-E2P; caller-supplied resolutions are deliberately rejected.
 */
export class DataForSeoHistoricalPromotionService{
 constructor({canonicalAdmissionService}={}){if(!canonicalAdmissionService?.admit)throw new TypeError("E2P_CANONICAL_ADMISSION_SERVICE_REQUIRED");this.canonicalAdmissionService=canonicalAdmissionService;}
 async promote(input={}){if(input.atlasResolution!==undefined||input.merchantResolution!==undefined||input.providerIdentity!==undefined||input.eligibility!==undefined)throw new Error("CALLER_SUPPLIED_CANONICAL_RESOLUTION_FORBIDDEN");return this.canonicalAdmissionService.admit({evidenceId:input.evidenceId,admittedBy:input.createdBy,identityReuseAssessments:input.identityReuseAssessments,policy:input.policy});}
}
export default DataForSeoHistoricalPromotionService;
