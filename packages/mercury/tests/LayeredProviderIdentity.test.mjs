import assert from 'node:assert/strict';
import {
  ATLAS_IDENTITY_STATES,
  PROVIDER_IDENTITY_STATES,
  PRODUCTS_IDENTITY_POLICY_VERSION,
  classifyDefaultAcquisitionRoute,
  createDirectProductsSellersProposal,
  prepareProductEnrichmentFromProductsResult,
  resolveDataForSeoProductCandidates
} from '../index.js';

const product=(atlasProductId='ram_fixture')=>({identity:{atlasProductId,brand:'Corsair',manufacturerPartNumber:'CMH16GX5M2B5200Z40'},extension:{data:{classification:{memoryType:'DDR5'},capacity:{capacityGb:16,moduleCount:2,capacityPerModuleGb:8},performance:{dataRateMtps:5200}}}});
const item=(dataDocId,overrides={})=>({title:'Corsair Vengeance 16GB 2x8GB DDR5 5200 CMH16GX5M2B5200Z40',data_docid:dataDocId,product_id:null,gid:null,seller:'Seller',price:200,currency:'USD',...overrides});
const resolve=(items,atlasProduct=product())=>resolveDataForSeoProductCandidates({atlasProduct,items});
const route=resolution=>classifyDefaultAcquisitionRoute({resolution,directSellersLineageCertified:true});

assert.equal(PRODUCTS_IDENTITY_POLICY_VERSION,'MERCURY-HISTORY-044-1.0');

const sharedProduct=resolve([item('doc-b',{product_id:'product-1',seller:'High price',price:999}),item('doc-a',{product_id:'product-1',seller:'Low price',price:1})]);
assert.equal(sharedProduct.layeredIdentity.atlasIdentity.state,ATLAS_IDENTITY_STATES.CORROBORATED);
assert.equal(sharedProduct.layeredIdentity.providerIdentity.state,PROVIDER_IDENTITY_STATES.SHARED_DOCUMENTED_PRODUCT);
assert.deepEqual(sharedProduct.layeredIdentity.providerIdentity.groupingKey,{type:'PRODUCT_ID',value:'product-1'});
assert.deepEqual(route(sharedProduct).providerAnchor,{productId:'product-1',dataDocId:null,gid:null});
assert.equal(route(sharedProduct).executableRoute,'READY_FOR_SELLERS');

const sharedGid=resolve([item('doc-a',{gid:'gid-1'}),item('doc-b',{gid:'gid-1'})]);
assert.equal(sharedGid.layeredIdentity.providerIdentity.state,PROVIDER_IDENTITY_STATES.SHARED_DOCUMENTED_PRODUCT);
assert.deepEqual(sharedGid.layeredIdentity.providerIdentity.groupingKey,{type:'GID',value:'gid-1'});
assert.deepEqual(route(sharedGid).providerAnchor,{productId:null,dataDocId:null,gid:'gid-1'});

for(const [name,items,reason] of [
  ['product ID conflict',[item('doc-a',{product_id:'product-1'}),item('doc-b',{product_id:'product-2'})],'PRODUCT_ID_CONFLICT'],
  ['GID conflict',[item('doc-a',{gid:'gid-1'}),item('doc-b',{gid:'gid-2'})],'GID_CONFLICT'],
  ['product/GID contradiction',[item('doc-a',{product_id:'product-1',gid:'gid-1'}),item('doc-b',{product_id:'product-1',gid:'gid-2'})],'GID_CONFLICT']
]){
  const resolution=resolve(items);assert.equal(resolution.layeredIdentity.atlasIdentity.state,ATLAS_IDENTITY_STATES.CORROBORATED,name);assert.equal(resolution.layeredIdentity.providerIdentity.state,PROVIDER_IDENTITY_STATES.UNRESOLVED,name);assert.ok(resolution.layeredIdentity.providerIdentity.reasons.includes(reason),name);assert.equal(route(resolution).executableRoute,'UNRESOLVED',name);assert.equal(route(resolution).providerAnchor,null,name);
}

const nullKeys=resolve([item('doc-b'),item('doc-a')]);
assert.equal(nullKeys.layeredIdentity.atlasIdentity.state,ATLAS_IDENTITY_STATES.CORROBORATED);
assert.equal(nullKeys.layeredIdentity.providerIdentity.state,PROVIDER_IDENTITY_STATES.MULTIPLE_DOCUMENTS_UNGROUPED);
assert.equal(route(nullKeys).materialIdentity,'CORROBORATED');
assert.equal(route(nullKeys).executableRoute,'UNRESOLVED');
assert.deepEqual(route(nullKeys).reasons,['PROVIDER_IDENTITY_UNRESOLVED','NO_SHARED_DOCUMENTED_PRODUCT_KEY']);
const ungroupedPrepared=await prepareProductEnrichmentFromProductsResult({atlasProduct:product(),sourceTaskId:'ungrouped-task',productsResult:{result:[{items:[item('doc-a',{price:1,seller:'Newegg.com',domain:'newegg.com',affiliateStatus:'ENABLED',trustScore:100,retailerDestination:'present'}),item('doc-b',{price:999,seller:'Other',domain:'other.example'})]}]}});
assert.equal(ungroupedPrepared.proposal,null);

const single=resolve([item('doc-only')]);
assert.equal(single.layeredIdentity.providerIdentity.state,PROVIDER_IDENTITY_STATES.UNIQUE_DOCUMENT_ANCHOR);
assert.deepEqual(route(single).providerAnchor,{dataDocId:'doc-only',productId:null,gid:null});
assert.equal(route(single).executableRoute,'READY_FOR_SELLERS');

const reordered=resolve([item('doc-a',{product_id:'product-1',price:900,seller:'Newegg.com'}),item('doc-b',{product_id:'product-1',price:2,seller:'Other'})]);
assert.deepEqual(reordered.layeredIdentity,sharedProduct.layeredIdentity);
assert.deepEqual(route(reordered).providerAnchor,route(sharedProduct).providerAnchor);
assert.equal(route(reordered).reasons[0],route(sharedProduct).reasons[0]);

const review={reviewId:'review-1',atlasProductId:'ram_fixture',providerTaskId:'products-task',identityState:'EXACT_OR_GOVERNED_MATCH',sourceRightsDigest:'rights',materialDigest:'digest',resultIdentity:sharedProduct};
const proposal=createDirectProductsSellersProposal({atlasProduct:product(),productsReview:review,sourceRightsDigest:'rights',createdAt:'2026-09-11T12:00:00.000Z'});
assert.deepEqual(proposal.providerIdentity,{productId:'product-1',dataDocId:null,gid:null});
assert.equal(proposal.providerGrouping.type,'PRODUCT_ID');
assert.equal(proposal.evidence.title,null);

const prepared=await prepareProductEnrichmentFromProductsResult({atlasProduct:product(),sourceTaskId:'products-task',productsResult:{result:[{items:[item('doc-a',{gid:'gid-1'}),item('doc-b',{gid:'gid-1'})]}]}});
assert.deepEqual(prepared.proposal.providerIdentity,{productId:null,dataDocId:null,gid:'gid-1'});

const realReplay=resolve([
  item('11576802757176384012',{seller:'PayMore Summerville',price:235.99}),
  item('5327259357682777702',{seller:'Newegg.com',price:299.99}),
  item('83202910179076809',{seller:'Walmart - Newegg Inc.',price:299.99})
]);
assert.equal(realReplay.layeredIdentity.atlasIdentity.state,ATLAS_IDENTITY_STATES.CORROBORATED);
assert.equal(realReplay.layeredIdentity.providerIdentity.state,PROVIDER_IDENTITY_STATES.MULTIPLE_DOCUMENTS_UNGROUPED);
assert.equal(realReplay.layeredIdentity.providerIdentity.groupingKey,null);
assert.equal(route(realReplay).executableRoute,'UNRESOLVED');
assert.ok(route(realReplay).reasons.includes('PROVIDER_IDENTITY_UNRESOLVED'));

for(const atlasProductId of ['ram_fixture_ddr5','ram_fixture_ddr4','ram_fixture_sodimm']){
  const cases=[resolve([item(`${atlasProductId}-one`)],product(atlasProductId)),resolve([item(`${atlasProductId}-a`,{product_id:'shared'}),item(`${atlasProductId}-b`,{product_id:'shared'})],product(atlasProductId)),resolve([item(`${atlasProductId}-a`),item(`${atlasProductId}-b`)],product(atlasProductId))];
  assert.deepEqual(cases.map(value=>value.layeredIdentity.providerIdentity.state),[PROVIDER_IDENTITY_STATES.UNIQUE_DOCUMENT_ANCHOR,PROVIDER_IDENTITY_STATES.SHARED_DOCUMENTED_PRODUCT,PROVIDER_IDENTITY_STATES.MULTIPLE_DOCUMENTS_UNGROUPED]);
}

console.log('Layered provider identity tests passed (product/gid grouping, conflicts, neutrality, replay, downstream anchor, real replay, and multi-product scale).');
