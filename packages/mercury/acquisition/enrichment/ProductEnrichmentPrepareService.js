import { resolveDataForSeoProductCandidates } from './DataForSeoProductCandidateResolver.js';
import { createProductEnrichmentProposal } from './ProductEnrichmentProposal.js';

export async function prepareProductEnrichmentFromProductsResult({atlasProduct,sourceTaskId,productsResult}={}){
  if(!atlasProduct?.identity?.atlasProductId) throw new TypeError('atlasProduct is required.');
  if(!sourceTaskId) throw new TypeError('sourceTaskId is required.');
  const items=productsResult?.result?.[0]?.items;
  if(!Array.isArray(items)) throw new Error('PRODUCTS_RESULT_ITEMS_MISSING');
  const resolution=resolveDataForSeoProductCandidates({atlasProduct,items});
  const proposal=resolution.recommendationStatus==='RECOMMENDED'
    ? createProductEnrichmentProposal({resolution,sourceTaskId})
    : null;
  return Object.freeze({schemaVersion:'1.0',sourceTaskId,atlasProductId:atlasProduct.identity.atlasProductId,resolution,proposal,paidTaskCreated:false,actualSpendUsd:0});
}
