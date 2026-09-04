import assert from 'node:assert/strict';
import {
  assessPotentialProviderDocumentEquivalenceCandidate,
  assessPotentialProviderDocumentEquivalenceGroups
} from './support/ProviderDocumentEquivalenceExperiment.mjs';

const atlasProduct = {
  identity: { atlasProductId: 'ram_fixture', brand: 'Kingston', manufacturerPartNumber: 'KVR32N22D8/32' },
  extension: { data: {
    classification: { memoryType: 'DDR4', formFactor: 'DIMM', moduleType: 'UDIMM' },
    capacity: { capacityGb: 32, moduleCount: 1, capacityPerModuleGb: 32 },
    performance: { dataRateMtps: 3200, casLatency: 22 },
    physical: { color: null, rgbLighting: false }
  } }
};

const candidate = (title, dataDocId, overrides = {}) => ({
  outcome: 'RECOMMENDED', score: 93, exactMpnMatch: true, contradictions: [],
  item: { title, dataDocId, productId: null, gid: null, ...overrides.item }, ...overrides
});

const sparse = candidate('Kingston KVR32N22D8/32 32GB DDR4-3200 Memory', 'doc-a');
const rich = candidate('Kingston KVR32N22D8/32 32GB DDR4-3200 1x32GB UDIMM CL22 Memory', 'doc-b');
let result = assessPotentialProviderDocumentEquivalenceGroups({ atlasProduct, candidates: [sparse, rich] });
assert.equal(result.groups.length, 1);
assert.equal(result.groups[0].length, 2, 'a richer non-conflicting document may group with a sparse exact document');
assert.notEqual(result.groups[0][0].candidate.item.dataDocId, result.groups[0][1].candidate.item.dataDocId, 'equivalence must preserve distinct provider documents');

const rejected = [
  candidate('Kingston KVR32N22D8/16 32GB DDR4-3200 Memory', 'different-mpn', { exactMpnMatch: false }),
  candidate('Kingston KVR32N22D8/32 16GB DDR4-3200 Memory', 'capacity'),
  candidate('Kingston KVR32N22D8/32 32GB DDR4-3200 2x16GB Memory', 'modules'),
  candidate('Replacement for Kingston KVR32N22D8/32 32GB DDR4-3200 Memory', 'replacement'),
  candidate('Used Kingston KVR32N22D8/32 32GB DDR4-3200 Memory', 'condition'),
  candidate('Kingston KVR32N22D8/32 32GB DDR4-3200 Motherboard Bundle', 'bundle'),
  candidate('Kingston 32GB DDR4-3200 Memory', 'missing-mpn', { exactMpnMatch: false }),
  candidate('Kingston KVR32N22D8/16 16GB DDR4 Memory', 'neighbor', { exactMpnMatch: false }),
  candidate('Kingston KVR32N22D8/32 32GB DDR4-3200 Memory', 'resolver-conflict', { contradictions: ['CAPACITY_CONFLICT'] })
];
for (const value of rejected) assert.equal(assessPotentialProviderDocumentEquivalenceCandidate({ atlasProduct, candidate: value }).eligible, false);

const unknownColorAtlas = structuredClone(atlasProduct);
unknownColorAtlas.extension.data.physical.color = null;
const black = candidate('Kingston KVR32N22D8/32 32GB DDR4-3200 Black Memory', 'black');
const white = candidate('Kingston KVR32N22D8/32 32GB DDR4-3200 White Memory', 'white');
result = assessPotentialProviderDocumentEquivalenceGroups({ atlasProduct: unknownColorAtlas, candidates: [black, white] });
assert.equal(result.groups.length, 2, 'documents that disagree on a jointly available significant field must not group');

const noFuzzyRescue = assessPotentialProviderDocumentEquivalenceGroups({ atlasProduct, candidates: [
  candidate('Kingston ValueRAM 32GB DDR4-3200 Memory', 'family-only', { exactMpnMatch: false, score: 33 }),
  candidate('Kingston KVR32N22D8/16 32GB DDR4-3200 Memory', 'neighboring-sku', { exactMpnMatch: false, score: 40 })
] });
assert.equal(noFuzzyRescue.groups.length, 0);
assert.equal(noFuzzyRescue.excluded.length, 2);

console.log('Provider document equivalence fixture experiment tests passed.');
