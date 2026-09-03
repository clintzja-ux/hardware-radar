import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  DataForSeoAcquisitionResultProcessor,
  FileDataForSeoMarketEvidenceRepository,
  SellersResultDf003RetentionService
} from '../index.js';

const dir = await mkdtemp(join(tmpdir(), 'hr-e2f-'));
try {
  const evidenceRepository = new FileDataForSeoMarketEvidenceRepository({
    statePath: join(dir, 'evidence.json'),
    now: () => '2026-08-21T16:40:00.000Z'
  });
  const atlasResolver = { resolve: async () => ({
    outcome: 'PROBABLE',
    atlasProductId: 'ram_corsair_cmk32gx5m2b6000z30',
    externalProductId: null,
    evidence: [],
    candidateAtlasProductIds: [],
    automaticMercuryEligible: false
  })};
  const processor = new DataForSeoAcquisitionResultProcessor({ atlasResolver, evidenceRepository, retailers: [] });
  const service = new SellersResultDf003RetentionService({ resultProcessor: processor });
  const sellersResult = { cost: 0, result: [{
    title: 'Corsair CMK32GX5M2B6000Z30 Vengeance DDR5 32GB (2x16GB) DDR5 6000MHz CL30 - Gray',
    items: [{ type:'shops_list', seller_name:'Platinummicro', title:'Platinummicro', domain:'platinummicro.com', url:'https://platinummicro.com/products/corsair-cmk32gx5m2b6000z30', base_price:588.99, tax:null, shipping_price:null, total_price:588.99, currency:'USD', product_condition:null, details:'Corsair CMK32GX5M2B6000Z30 Vengeance DDR5 32GB (2x16GB) 6000MHz CL30 Gray' }]
  }]};
  const productInfoResult = { cost: 0, result: [{ items: [{
    title:'Corsair CMK32GX5M2B6000Z30 Vengeance DDR5 32GB (2x16GB) DDR5 6000MHz CL30 - Gray',
    product_id:null, data_docid:'3844868436216882408', gid:null,
    specifications:[
      {specification_name:'Brand',specification_value:'CORSAIR'},
      {specification_name:'Capacity',specification_value:'32 GB'},
      {specification_name:'Speed',specification_value:'6,000 MHz'}
    ]
  }] }]};
  const input = { sellersResult, productInfoResult, sellersTaskId:'08211631-2304-0183-0000-2f47e4410471', productInfoTaskId:'08210619-2304-0455-0000-6f9d1fa692ed', observedAt:'2026-08-21T16:31:45.604Z', providerIdentity:{productId:null,dataDocId:'3844868436216882408',gid:null} };
  const first = await service.retain(input);
  assert.equal(first.actualSpendUsd, 0);
  assert.equal(first.paidTaskCreated, false);
  assert.equal(first.retained, 1);
  assert.equal(first.integrations[0].productIdentityOutcome, 'PROBABLE');
  assert.equal(first.integrations[0].merchantIdentityOutcome, 'DISCOVERED');
  assert.equal(first.integrations[0].historicalOutcome, 'NOT_ELIGIBLE');
  assert.equal(first.integrations[0].canonicalObservationEligible, false);
  assert.equal(first.integrations[0].publicationEligible, false);
  const stored = await evidenceRepository.getAll();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].candidate.marketEvidence.seller.name, 'Platinummicro');
  assert.equal(stored[0].candidate.marketEvidence.pricing.basePrice, 588.99);
  assert.equal(stored[0].candidate.marketEvidence.pricing.shippingPrice, null);
  assert.equal(stored[0].candidate.marketEvidence.pricing.tax, null);
  assert.equal(stored[0].candidate.marketEvidence.pricing.totalPrice, 588.99);
  const replay = await service.retain(input);
  assert.equal(replay.retained, 0);
  assert.equal(replay.duplicates, 1);
  assert.equal((await evidenceRepository.getAll()).length, 1);
  await assert.rejects(() => service.retain({...input, sellersResult:{...sellersResult,cost:.001}}), /ZERO_COST/);
} finally {
  await rm(dir,{recursive:true,force:true});
}
console.log('Sellers result DF003 retention tests passed.');
