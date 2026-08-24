import { normalizeDataForSeoSellerEvidence } from "../../adapters/dataforseo/DataForSeoSellerNormalizer.js";
import { createDataForSeoMarketObservationCandidate } from "../../market/dataforseo/DataForSeoMarketObservationCandidate.js";
import { resolveDataForSeoMerchantIdentity } from "../../market/dataforseo/DataForSeoMerchantIdentity.js";
import { evaluateDataForSeoObservationEligibility } from "../../market/dataforseo/DataForSeoObservationEligibility.js";

function clone(value){ return value == null ? value : structuredClone(value); }
function freeze(value){ if(value && typeof value === "object" && !Object.isFrozen(value)){ Object.freeze(value); for(const child of Object.values(value)) freeze(child); } return value; }
function requireObject(value, field){ if(!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${field} must be an object.`); return value; }

export const DATAFORSEO_EVIDENCE_OUTCOMES = Object.freeze({ RETAINED:"RETAINED", DUPLICATE:"DUPLICATE", REJECTED_INVALID_EVIDENCE:"REJECTED_INVALID_EVIDENCE" });
export const DATAFORSEO_HISTORICAL_OUTCOMES = Object.freeze({ ELIGIBLE:"ELIGIBLE", NOT_ELIGIBLE:"NOT_ELIGIBLE" });

/**
 * Connect a successful governed provider response to DF003 without promoting,
 * publishing, or otherwise bypassing identity gates. Provider acquisition
 * success and evidence acceptance remain independent outcomes.
 */
export class DataForSeoAcquisitionResultProcessor {
  constructor({ atlasResolver, evidenceRepository, retailers = [] } = {}){
    if (!atlasResolver?.resolve) throw new TypeError("atlasResolver is required.");
    if (!evidenceRepository?.retain) throw new TypeError("evidenceRepository is required.");
    if (!Array.isArray(retailers) && typeof retailers !== "function") throw new TypeError("retailers must be an array or function.");
    this.atlasResolver=atlasResolver; this.evidenceRepository=evidenceRepository; this.retailers=retailers;
  }

  async process({ providerResponse, execution, candidateId } = {}){
    requireObject(providerResponse,"providerResponse");
    requireObject(execution,"execution");
    const payload=requireObject(providerResponse.payload,"providerResponse.payload");
    try {
      const sellerItem=requireObject(payload.sellerItem,"providerResponse.payload.sellerItem");
      const productItem=requireObject(payload.productItem,"providerResponse.payload.productItem");
      const context=requireObject(payload.context,"providerResponse.payload.context");
      const marketEvidence=normalizeDataForSeoSellerEvidence(sellerItem,context);
      const atlasResolution=await this.atlasResolver.resolve(productItem);
      const candidate=createDataForSeoMarketObservationCandidate({marketEvidence,atlasResolution});
      const retailers=typeof this.retailers === "function" ? await this.retailers() : this.retailers;
      if(!Array.isArray(retailers)) throw new TypeError("retailers resolver must return an array.");
      const merchantResolution=resolveDataForSeoMerchantIdentity({marketEvidence,retailers});
      const eligibility=evaluateDataForSeoObservationEligibility({candidate,merchantResolution});
      const retained=await this.evidenceRepository.retain({candidate,merchantResolution,eligibility});
      return freeze({
        integrationVersion:"1.0",
        candidateId:candidateId ?? null,
        evidenceOutcome:retained.status === "DUPLICATE" ? DATAFORSEO_EVIDENCE_OUTCOMES.DUPLICATE : DATAFORSEO_EVIDENCE_OUTCOMES.RETAINED,
        evidenceId:retained.evidenceId,
        productIdentityOutcome:atlasResolution.outcome,
        merchantIdentityOutcome:merchantResolution.outcome,
        eligibilityStatus:eligibility.status,
        historicalOutcome:eligibility.historicalAnalyticsEligible === true ? DATAFORSEO_HISTORICAL_OUTCOMES.ELIGIBLE : DATAFORSEO_HISTORICAL_OUTCOMES.NOT_ELIGIBLE,
        canonicalObservationEligible:eligibility.canonicalObservationEligible === true,
        publicationEligible:false
      });
    } catch(error){
      if(error?.code === "ACQUISITION_EVIDENCE_CONFLICT" || error?.message === "ACQUISITION_EVIDENCE_CONFLICT") throw error;
      return freeze({integrationVersion:"1.0",candidateId:candidateId ?? null,evidenceOutcome:DATAFORSEO_EVIDENCE_OUTCOMES.REJECTED_INVALID_EVIDENCE,evidenceId:null,productIdentityOutcome:null,merchantIdentityOutcome:null,eligibilityStatus:null,historicalOutcome:DATAFORSEO_HISTORICAL_OUTCOMES.NOT_ELIGIBLE,canonicalObservationEligible:false,publicationEligible:false,errorCode:error?.code ?? error?.message ?? "DF003_INTEGRATION_FAILURE"});
    }
  }
}
export default DataForSeoAcquisitionResultProcessor;
