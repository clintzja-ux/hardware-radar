import {composeInitialAcquisitionPromotionAssessment} from "./InitialAcquisitionPromotionComposition.js";

export async function resolveGovernedInitialAcquisitionPromotionContext({record,evidenceRecords,retentionAudit,sellersProposalEnvelope,productRepository}={}){
  if(!record||!Array.isArray(evidenceRecords)||!productRepository?.getById)throw new TypeError("INITIAL_ACQUISITION_CONTEXT_INPUT_INVALID");
  if(!retentionAudit?.integrations?.some(value=>value?.evidenceId===record.evidenceId))return null;
  const requestedAtlasProductId=retentionAudit?.governance?.lineage?.atlasProductId;
  if(typeof requestedAtlasProductId!=="string"||!requestedAtlasProductId)throw new Error("INITIAL_ACQUISITION_CONTEXT_PRODUCT_MISSING");
  const atlasProduct=await productRepository.getById(requestedAtlasProductId),composition=composeInitialAcquisitionPromotionAssessment({records:evidenceRecords,requestedAtlasProductId,retentionAudit,sellersProposalEnvelope,atlasProduct}),projection=composition.initialAcquisitionIdentityProjections.find(value=>value.evidenceId===record.evidenceId);
  if(composition.mode!=="GOVERNED_INITIAL_ACQUISITION_BINDING"||!projection)throw new Error("INITIAL_ACQUISITION_CONTEXT_PROJECTION_MISSING");
  const proposal=sellersProposalEnvelope?.proposal??sellersProposalEnvelope,acquisitionChain={productsTaskId:proposal?.sourceProductsTaskId,productInfoTaskId:retentionAudit.productInfoTaskId,sellersTaskId:retentionAudit.sellersTaskId};
  return Object.freeze({contextVersion:"1.0",mode:composition.mode,atlasProductId:requestedAtlasProductId,initialAcquisitionIdentityProjections:Object.freeze([projection]),acquisitionChain:Object.freeze(acquisitionChain)});
}

export default resolveGovernedInitialAcquisitionPromotionContext;
