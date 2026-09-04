import crypto from 'node:crypto';
import {classifyDefaultAcquisitionRoute} from './DefaultAcquisitionRouting.js';
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
  return freeze({schemaVersion:'1.0',identityLineageType:'PRODUCT_INFO_VALIDATED',proposalId,status:'PENDING_OPERATOR_REVIEW',createdAt,operation:'SELLERS',atlasProductId:productInfoAuthorization.atlasProductId,sourceProductsTaskId:productInfoAuthorization.sourceTaskId,sourceProductInfoTaskId:productInfoTaskId,sourceProductInfoAuthorizationId:productInfoAuthorization.requestId,sourceProductInfoProposalId:productInfoAuthorization.proposalId,providerIdentity:actual,evidence:{title:item.title??null,specifications:item.specifications??[],sellerCount:Array.isArray(item.sellers)?item.sellers.length:0},estimatedCostUsd,maxPaidTasks:1,automaticPaidRetries:0,authorizationCreated:false});
}

export function createDirectProductsSellersProposal({atlasProduct,productsReview,sourceRightsDigest,provider='DATAFORSEO',source='DATAFORSEO_GOOGLE_SHOPPING',locationName='United States',languageName='English',createdAt=new Date().toISOString(),estimatedCostUsd=.001}={}){
  if(atlasProduct?.identity?.atlasProductId!==productsReview?.atlasProductId||productsReview?.identityState!=='EXACT_OR_GOVERNED_MATCH'||productsReview?.providerTaskId==null||productsReview?.reviewId==null||productsReview?.materialDigest==null)throw new Error('DIRECT_SELLERS_PRODUCTS_REVIEW_INVALID');
  if(typeof sourceRightsDigest!=='string'||!sourceRightsDigest||productsReview.sourceRightsDigest!==sourceRightsDigest||provider!=='DATAFORSEO'||source!=='DATAFORSEO_GOOGLE_SHOPPING')throw new Error('DIRECT_SELLERS_GOVERNANCE_BINDING_INVALID');
  const resolution=productsReview.resultIdentity,routing=classifyDefaultAcquisitionRoute({resolution,directSellersLineageCertified:true});
  if(routing.materialIdentity!=='ESTABLISHED'||routing.executableRoute!=='READY_FOR_SELLERS')throw new Error('DIRECT_SELLERS_STRONG_IDENTITY_REQUIRED');
  const candidate=resolution.recommendedCandidate,providerIdentity={productId:candidate.item.productId??null,dataDocId:candidate.item.dataDocId??null,gid:candidate.item.gid??null};
  const strongIdentity={schemaVersion:'1.0',status:'VALIDATED',atlasProductId:atlasProduct.identity.atlasProductId,canonicalMpn:atlasProduct.identity.manufacturerPartNumber,manufacturer:atlasProduct.identity.brand,sourceProductsTaskId:productsReview.providerTaskId,sourceProductsReviewId:productsReview.reviewId,sourceProductsReviewMaterialDigest:productsReview.materialDigest,providerIdentity,routing};
  const validation={schemaVersion:'1.0',status:'VALIDATED',lineage:{schemaVersion:'1.0',status:'VALIDATED',identityLineageType:'DIRECT_PRODUCTS_STRONG_IDENTITY',atlasProductId:atlasProduct.identity.atlasProductId,sourceProductsTaskId:productsReview.providerTaskId,sourceProductsReviewId:productsReview.reviewId,providerIdentity},atlas:{atlasProductId:atlasProduct.identity.atlasProductId,status:'COMPATIBLE_WITH_UNKNOWNS',contradictions:[]},strongIdentity};
  const validationDigest=hash(validation),material={atlasProductId:atlasProduct.identity.atlasProductId,canonicalMpn:atlasProduct.identity.manufacturerPartNumber,sourceProductsTaskId:productsReview.providerTaskId,sourceProductsReviewId:productsReview.reviewId,sourceProductsReviewMaterialDigest:productsReview.materialDigest,sourceRightsDigest,provider,source,locationName,languageName,providerIdentity,validationDigest},materialDigest=hash(material);
  return freeze({schemaVersion:'1.1',identityLineageType:'DIRECT_PRODUCTS_STRONG_IDENTITY',proposalId:`sellerenrich_${materialDigest.slice(0,24)}`,status:'PENDING_OPERATOR_REVIEW',createdAt,operation:'SELLERS',atlasProductId:atlasProduct.identity.atlasProductId,canonicalMpn:atlasProduct.identity.manufacturerPartNumber,sourceProductsTaskId:productsReview.providerTaskId,sourceProductsReviewId:productsReview.reviewId,sourceProductsReviewMaterialDigest:productsReview.materialDigest,sourceProductInfoTaskId:null,sourceProductInfoAuthorizationId:null,sourceProductInfoProposalId:null,providerIdentity,evidence:{title:candidate.item.title??null,specifications:[],sellerCount:null},governanceBinding:{sourceRightsDigest,provider,source,locationName,languageName},validation,validationDigest,materialDigest,estimatedCostUsd,maxPaidTasks:1,automaticPaidRetries:0,authorizationCreated:false});
}
