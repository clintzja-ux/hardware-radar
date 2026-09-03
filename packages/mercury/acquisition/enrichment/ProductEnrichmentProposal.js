import crypto from 'node:crypto';
export function createProductEnrichmentProposal({resolution,sourceTaskId,createdAt=new Date().toISOString(),estimatedCostUsd=.001}={}){
  if(!resolution?.atlasProductId) throw new TypeError('resolution is required.');
  if(!sourceTaskId) throw new TypeError('sourceTaskId is required.');
  if(resolution.recommendationStatus!=='RECOMMENDED'||!resolution.recommendedCandidate) throw new Error('ENRICHMENT_REQUIRES_SAFE_RECOMMENDATION');
  const c=resolution.recommendedCandidate.item;
  if(!c.dataDocId&&!c.productId&&!c.gid) throw new Error('ENRICHMENT_REQUIRES_PROVIDER_IDENTIFIER');
  const proposalId=`enrich_${crypto.createHash('sha256').update(`${resolution.atlasProductId}|${sourceTaskId}|${c.dataDocId??c.productId??c.gid}`).digest('hex').slice(0,24)}`;
  return Object.freeze({schemaVersion:'1.0',proposalId,status:'PENDING_OPERATOR_REVIEW',createdAt,sourceTaskId,atlasProductId:resolution.atlasProductId,operation:'PRODUCT_INFO',estimatedCostUsd,maxPaidTasks:1,automaticPaidRetries:0,providerIdentity:Object.freeze({productId:c.productId,dataDocId:c.dataDocId,gid:c.gid}),candidate:Object.freeze({title:c.title,price:c.price,currency:c.currency,score:resolution.recommendedCandidate.score,exactMpnMatch:resolution.recommendedCandidate.exactMpnMatch}),authorizationCreated:false});
}
