import assert from 'node:assert/strict';
import {resolveDataForSeoProductCandidates,createProductEnrichmentProposal} from '../index.js';
const atlasProduct={identity:{atlasProductId:'ram_corsair_cmk32gx5m2b6000z30',brand:'Corsair',manufacturerPartNumber:'CMK32GX5M2B6000Z30'},extension:{data:{classification:{memoryType:'DDR5'},capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16},performance:{dataRateMtps:6000,casLatency:30}}}};
const items=[
 {title:'Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s CL30',data_docid:'17540895125310173539',price:549.99,currency:'USD'},
 {title:'CORSAIR VENGEANCE LPX DDR4 MEMORY CMK',data_docid:'11514783491620938381',price:249.99,currency:'USD'},
 {title:'Corsair Vengeance RGB DDR5 Memory Kit CMH32GX5M2B6000C30',data_docid:'3350666287623798193',price:232,currency:'USD'},
 {title:'Corsair Vengeance 32GB DDR5 6000MHz Memory',data_docid:'13364366025516914241',price:509.99,currency:'USD'}
];
const r=resolveDataForSeoProductCandidates({atlasProduct,items});
assert.equal(r.recommendationStatus,'RECOMMENDED');
assert.equal(r.recommendedCandidate.item.dataDocId,'17540895125310173539');
assert.equal(r.recommendedCandidate.exactMpnMatch,true);
assert.equal(r.candidates.find(c=>c.item.dataDocId==='11514783491620938381').outcome,'REJECTED');
assert.equal(r.candidates.find(c=>c.item.dataDocId==='3350666287623798193').outcome,'REJECTED');
assert.notEqual(r.recommendedCandidate.item.dataDocId,'3350666287623798193','low price must not improve identity selection');
const p=createProductEnrichmentProposal({resolution:r,sourceTaskId:'08210233-2304-0179-0000-4ad9784a612c'});
assert.equal(p.status,'PENDING_OPERATOR_REVIEW');assert.equal(p.operation,'PRODUCT_INFO');assert.equal(p.estimatedCostUsd,.001);assert.equal(p.maxPaidTasks,1);assert.equal(p.automaticPaidRetries,0);assert.equal(p.providerIdentity.dataDocId,'17540895125310173539');assert.equal(p.authorizationCreated,false);
assert.throws(()=>createProductEnrichmentProposal({resolution:{...r,recommendationStatus:'AMBIGUOUS',recommendedCandidate:null},sourceTaskId:'x'}),/SAFE_RECOMMENDATION/);
console.log('Governed product enrichment authorization tests passed.');
