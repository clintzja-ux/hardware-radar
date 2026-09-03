import crypto from 'node:crypto';
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};

export function createSellersEnrichmentProposal({productInfoTaskId,productInfoResult,productInfoAuthorization,createdAt=new Date().toISOString(),estimatedCostUsd=.001}={}){
  if(!productInfoTaskId) throw new TypeError('productInfoTaskId is required.');
  if(productInfoAuthorization?.authorizationType!=='PRODUCT_INFO_ENRICHMENT') throw new Error('SELLERS_REQUIRES_GOVERNED_PRODUCT_INFO_AUTHORIZATION');
  const items=productInfoResult?.result?.[0]?.items;
  if(!Array.isArray(items)||items.length!==1||!items[0]||typeof items[0]!=='object') throw new Error('SELLERS_REQUIRES_EXACTLY_ONE_PRODUCT_INFO_EVIDENCE_ITEM');
  const item=items[0];
  const expected=productInfoAuthorization.providerIdentity??{};
  const actual={productId:item.product_id??null,dataDocId:item.data_docid??null,gid:item.gid??null};
  const fields=['productId','dataDocId','gid'],shared=fields.filter(field=>expected[field]!=null&&actual[field]!=null);
  if(!shared.length||shared.some(field=>String(expected[field])!==String(actual[field]))) throw new Error('SELLERS_PRODUCT_INFO_IDENTITY_MISMATCH');
  if(Number(productInfoResult?.cost??0)!==0) throw new Error('SELLERS_PREPARE_RETRIEVAL_MUST_BE_ZERO_COST');
  const proposalId=`sellerenrich_${hash([productInfoTaskId,productInfoAuthorization.atlasProductId,actual]).slice(0,24)}`;
  return freeze({schemaVersion:'1.0',proposalId,status:'PENDING_OPERATOR_REVIEW',createdAt,operation:'SELLERS',atlasProductId:productInfoAuthorization.atlasProductId,sourceProductsTaskId:productInfoAuthorization.sourceTaskId,sourceProductInfoTaskId:productInfoTaskId,sourceProductInfoAuthorizationId:productInfoAuthorization.requestId,sourceProductInfoProposalId:productInfoAuthorization.proposalId,providerIdentity:actual,evidence:{title:item.title??null,specifications:item.specifications??[],sellerCount:Array.isArray(item.sellers)?item.sellers.length:0},estimatedCostUsd,maxPaidTasks:1,automaticPaidRetries:0,authorizationCreated:false});
}
