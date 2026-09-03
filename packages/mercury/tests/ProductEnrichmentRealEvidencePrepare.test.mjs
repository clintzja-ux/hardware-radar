import assert from 'node:assert/strict';
import { prepareProductEnrichmentFromProductsResult } from '../index.js';
const atlasProduct={identity:{atlasProductId:'ram_corsair_cmk32gx5m2b6000z30',brand:'Corsair',manufacturerPartNumber:'CMK32GX5M2B6000Z30'},extension:{data:{classification:{memoryType:'DDR5'},capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16},performance:{dataRateMtps:6000,casLatency:30}}}};
const productsResult={result:[{items:[
 {title:'Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s CL30',data_docid:'17540895125310173539',price:549.99,currency:'USD'},
 {title:'CORSAIR VENGEANCE LPX DDR4 MEMORY CMK',data_docid:'11514783491620938381',price:249.99,currency:'USD'},
 {title:'Corsair Vengeance RGB DDR5 Memory Kit CMH32GX5M2B',data_docid:'3350666287623798193',price:232,currency:'USD'}
]}]};
const x=await prepareProductEnrichmentFromProductsResult({atlasProduct,sourceTaskId:'08210233-2304-0179-0000-4ad9784a612c',productsResult});
assert.equal(x.resolution.recommendationStatus,'RECOMMENDED');
assert.equal(x.proposal.providerIdentity.dataDocId,'17540895125310173539');
assert.equal(x.proposal.status,'PENDING_OPERATOR_REVIEW');
assert.equal(x.paidTaskCreated,false); assert.equal(x.actualSpendUsd,0);
console.log('Product enrichment real-evidence prepare contract passed.');
