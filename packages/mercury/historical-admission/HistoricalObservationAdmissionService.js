import {assessDataForSeoEvidencePromotion} from "../market/dataforseo/DataForSeoEvidencePromotionAssessment.js";
import {projectIdentityReviewState} from "../identity-review/IdentityReviewProjection.js";
import {createHistoricalObservation,createHistoricalObservationId} from "./HistoricalObservation.js";

function nonBlank(value,code){if(typeof value!=="string"||value.trim()==="")throw new TypeError(code);return value.trim();}

export class HistoricalObservationAdmissionService{
  constructor({evidenceRepository,decisionRepository,productRepository,retailerRepository,historicalRepository,acquisitionChainResolver,now=()=>new Date().toISOString()}={}){
    if(!evidenceRepository?.getById)throw new TypeError("evidenceRepository is required.");if(!decisionRepository?.getAll||!decisionRepository?.getAllRemediations)throw new TypeError("decisionRepository is required.");if(!productRepository?.getById)throw new TypeError("productRepository is required.");if(!retailerRepository?.getAll)throw new TypeError("retailerRepository is required.");if(!historicalRepository?.accept)throw new TypeError("historicalRepository is required.");if(typeof acquisitionChainResolver!=="function")throw new TypeError("acquisitionChainResolver is required.");
    Object.assign(this,{evidenceRepository,decisionRepository,productRepository,retailerRepository,historicalRepository,acquisitionChainResolver,now});
  }
  async admit({evidenceId,admittedBy}={}){
    nonBlank(evidenceId,"EVIDENCE_ID_REQUIRED");nonBlank(admittedBy,"ADMITTED_BY_REQUIRED");
    const record=await this.evidenceRepository.getById(evidenceId);if(!record)throw new Error(`HISTORICAL_EVIDENCE_NOT_FOUND:${evidenceId}`);const retainedBefore=structuredClone(record);
    const decisions=await this.decisionRepository.getAll();const remediations=await this.decisionRepository.getAllRemediations();const retailers=await this.retailerRepository.getAll();
    const assessment=assessDataForSeoEvidencePromotion({records:[record],identityReviewDecisions:decisions,identityReviewRemediations:remediations,atlasRetailers:retailers});
    if(assessment.state!=="HISTORICAL_ELIGIBLE"||assessment.historicalEligible!==true)throw new Error(`HISTORICAL_ADMISSION_NOT_ELIGIBLE:${assessment.state}`);
    if(assessment.canonicalEligible!==false||assessment.publicationEligible!==false)throw new Error("HISTORICAL_ADMISSION_GOVERNANCE_BOUNDARY_INVALID");
    const projection=projectIdentityReviewState({record,decisions,remediations,atlasRetailers:retailers});
    if(projection.product.state!=="VERIFIED"||projection.merchant.state!=="REGISTERED"||projection.merchant.atlasResolution?.outcome!=="RESOLVED")throw new Error("HISTORICAL_ADMISSION_IDENTITY_NOT_RESOLVED");
    const atlasProduct=await this.productRepository.getById(projection.product.atlasProductId);if(atlasProduct?.identity?.atlasProductId!==projection.product.atlasProductId)throw new Error("HISTORICAL_ADMISSION_ATLAS_PRODUCT_MISMATCH");
    const retailer=retailers.find(x=>x.id===projection.merchant.merchantId);if(!retailer)throw new Error("HISTORICAL_ADMISSION_ATLAS_RETAILER_MISSING");
    const chain=await this.acquisitionChainResolver(record);for(const key of ["productsTaskId","productInfoTaskId","sellersTaskId"])nonBlank(chain?.[key],`HISTORICAL_${key.toUpperCase()}_REQUIRED`);if(chain.sellersTaskId!==record.candidate?.marketEvidence?.provenance?.sourceTaskId)throw new Error("HISTORICAL_ACQUISITION_CHAIN_MISMATCH");
    const idempotencyKey=`E2J_HISTORICAL_ADMISSION:${record.evidenceId}`;const existing=await this.historicalRepository.findByIdempotencyKey(idempotencyKey);if(existing)return Object.freeze({status:"DUPLICATE",evidenceId,observationId:existing.observationId,observation:existing,assessment});
    const observationId=createHistoricalObservationId(record.evidenceId);const evidence=record.candidate.marketEvidence;
    const observation=createHistoricalObservation({observationId,atlasProductId:projection.product.atlasProductId,retailerId:projection.merchant.merchantId,marketplace:projection.merchant.canonicalDomain,observationTime:evidence.provenance.observedAt,admittedAt:this.now(),market:{sellerName:retailer.name,sourceUrl:evidence.seller.url,basePrice:evidence.pricing.basePrice,totalPrice:evidence.pricing.totalPrice,shipping:evidence.pricing.shippingPrice,tax:evidence.pricing.tax,currency:evidence.pricing.currency,condition:evidence.offer.condition,availability:evidence.offer.availability},provenance:{retainedEvidenceId:record.evidenceId,provider:evidence.provider,source:evidence.source,rawPayloadReference:evidence.provenance.rawPayloadReference,acquisition:{productsTaskId:chain.productsTaskId,productInfoTaskId:chain.productInfoTaskId,sellersTaskId:chain.sellersTaskId},identityReview:{productDecisionId:projection.product.decisionId,productRemediationId:projection.product.remediationId,merchantDecisionId:projection.merchant.decisionId,merchantRemediationId:projection.merchant.remediationId}},admittedBy:admittedBy.trim(),idempotencyKey});
    const accepted=await this.historicalRepository.accept(observation,idempotencyKey);if(JSON.stringify(record)!==JSON.stringify(retainedBefore))throw new Error("RETAINED_EVIDENCE_MUTATED_DURING_ADMISSION");
    return Object.freeze({status:accepted.status,evidenceId,observationId:accepted.observationId,observation,assessment});
  }
}
export default HistoricalObservationAdmissionService;
