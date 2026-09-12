import {createAmazonSellersEvidence,projectAmazonSellerToRetainedEvidence,DATAFORSEO_AMAZON_SOURCE_ID} from "./DataForSeoAmazonContracts.js";
import {createDataForSeoMarketObservationCandidate} from "../market/dataforseo/DataForSeoMarketObservationCandidate.js";
import {evaluateDataForSeoObservationEligibility} from "../market/dataforseo/DataForSeoObservationEligibility.js";
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const text=value=>typeof value==="string"&&value.trim()?value.trim():null;
const domain=value=>{try{return new URL(value).hostname.toLowerCase().replace(/^www\./,"");}catch{return null;}};
export function projectAmazonSellerRetention({sellerItem,atlasProductId,identityAssessment,sellersTaskId,immutableResult,observedAt,rawPayloadReference}={}){
 const evidence=createAmazonSellersEvidence(sellerItem);
 if(identityAssessment?.state!=="STRONG_UNIQUE_ASIN"||identityAssessment?.providerAnchor?.asin!==evidence.dataAsin)throw new Error("AMAZON_RETAINED_IDENTITY_NOT_STRONG");
 if(immutableResult?.sourceId!==DATAFORSEO_AMAZON_SOURCE_ID||immutableResult?.operation!=="AMAZON_SELLERS"||immutableResult?.providerTaskId!==sellersTaskId||!text(immutableResult?.canonicalResultId)||!text(immutableResult?.resultDigest))throw new Error("AMAZON_IMMUTABLE_RESULT_LINEAGE_INVALID");
 const marketEvidence=structuredClone(projectAmazonSellerToRetainedEvidence(evidence,{atlasProductId,sourceTaskId:sellersTaskId,observedAt,rawPayloadReference}));
 marketEvidence.seller.domain=domain(evidence.sellerUrl);marketEvidence.pricing.totalPrice=evidence.currentPrice;
 marketEvidence.offer.details=[evidence.conditionDescription,Array.isArray(evidence.voucherTerms)?evidence.voucherTerms.map(value=>JSON.stringify(value)).join(" "):text(evidence.voucherTerms)].filter(Boolean).join(" ")||null;
 Object.assign(marketEvidence.provenance,{immutableProviderResultId:immutableResult.canonicalResultId,immutableProviderResultDigest:immutableResult.resultDigest,sourceRightsProfileDigest:immutableResult.sourceRightsProfileDigest});
 const candidate=createDataForSeoMarketObservationCandidate({marketEvidence,atlasResolution:{outcome:"CONFIRMED",atlasProductId,externalProductId:evidence.dataAsin,evidence:[{field:"provider.asin",value:evidence.dataAsin}],automaticMercuryEligible:true}});
 const sellerDomain=marketEvidence.seller.domain;
 let merchantResolution={resolutionVersion:"1.0",outcome:"DISCOVERED",retailerId:null,merchantKey:sellerDomain?`domain:${sellerDomain}`:null,sellerName:evidence.sellerName,canonicalDomain:sellerDomain,suppliedDomain:sellerDomain,urlDomain:sellerDomain,requiresRegistration:true,evidence:[{field:"seller.name",value:evidence.sellerName},{field:"seller.url.hostname",value:sellerDomain}],reason:sellerDomain?"MERCHANT_REGISTRATION_REQUIRED":"AMAZON_SELLER_CANONICAL_IDENTITY_UNRESOLVED"};
 const eligibility=evaluateDataForSeoObservationEligibility({candidate,merchantResolution});
 return freeze({candidate,merchantResolution,eligibility,acquisitionChain:{type:"AMAZON_INITIAL_ACQUISITION",sourceId:DATAFORSEO_AMAZON_SOURCE_ID,productsTaskId:identityAssessment.productsTaskId??null,asinTaskId:identityAssessment.asinTaskId??null,sellersTaskId,governedAsin:evidence.dataAsin,immutableSellersResultId:immutableResult.canonicalResultId,immutableSellersResultDigest:immutableResult.resultDigest,sourceRightsProfileDigest:immutableResult.sourceRightsProfileDigest}});
}
export class DataForSeoAmazonHistoricalRetentionService{constructor({evidenceRepository}={}){if(!evidenceRepository?.retain)throw new TypeError("evidenceRepository is required.");this.evidenceRepository=evidenceRepository;}async retain(input){const projection=projectAmazonSellerRetention(input),retained=await this.evidenceRepository.retain({candidate:projection.candidate,merchantResolution:projection.merchantResolution,eligibility:projection.eligibility});return freeze({...retained,projection,paidTaskCreated:false,actualSpendUsd:0});}}
