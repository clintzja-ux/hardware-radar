import assert from 'node:assert/strict';
import {
  assessEquivalentProviderIdentitySelection,
  createManualEquivalentProviderIdentitySelectionDecision
} from './support/EquivalentProviderIdentitySelectionExperiment.mjs';

const atlasProduct = { identity: { atlasProductId: 'ram_fixture', brand: 'Kingston', manufacturerPartNumber: 'KVR32N22D8/32' } };
const member = (dataDocId, productId, gid, evidence = {}) => ({
  eligible: true,
  evidence: { mpn: 'KVR32N22D832', brand: 'KINGSTON', capacityGb: 32, ...evidence },
  candidate: { exactMpnMatch: true, score: 93, item: { dataDocId, productId, gid, price: 100 } }
});
const sparse = member('doc-sparse', 'product-sparse', 'gid-sparse');
const rich = member('doc-rich', null, 'gid-rich', { memoryType: 'DDR4', dataRateMtps: 3200, formFactor: 'DIMM' });
const group = [sparse, rich];

const assessment = assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: group, sourceTaskId: 'products-task' });
assert.equal(assessment.status, 'MANUAL_SELECTION_REQUIRED');
assert.equal(assessment.selectedProviderIdentity, null, 'identity completeness must not manufacture an automatic winner');

const reordered = assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: [...group].reverse(), sourceTaskId: 'products-task' });
assert.equal(reordered.binding.equivalenceGroupDigest, assessment.binding.equivalenceGroupDigest, 'input order must not change group identity');

const selectedProviderIdentity = { dataDocId: 'doc-rich', productId: null, gid: 'gid-rich' };
const decisionInput = {
  assessment,
  selectedProviderIdentity,
  requestId: 'fixture-provider-selection',
  reviewedBy: 'operator:fixture',
  reviewedAt: '2026-09-04T01:00:00.000Z',
  reason: 'Fixture selection for exact downstream provider lineage.'
};
const decision = createManualEquivalentProviderIdentitySelectionDecision(decisionInput);
assert.deepEqual(createManualEquivalentProviderIdentitySelectionDecision(decisionInput), decision, 'exact replay must be stable');
assert.equal(decision.equivalentProviderIdentities.length, 2);
assert.equal(decision.grantsProductIdentity, false);
assert.equal(decision.grantsMarketAuthority, false);
assert.equal(decision.grantsPublicationAuthority, false);
assert.equal(decision.grantsRankingAuthority, false);

const replayWithCommercialChanges = assessEquivalentProviderIdentitySelection({
  atlasProduct,
  equivalenceGroup: group.map(value => ({ ...value, candidate: { ...value.candidate, item: { ...value.candidate.item, price: 1, sellerCount: 999, affiliateState: 'PREFERRED' } } })),
  sourceTaskId: 'products-task'
});
assert.equal(replayWithCommercialChanges.binding.equivalenceGroupDigest, assessment.binding.equivalenceGroupDigest, 'commercial fields must not affect selection binding');

const reused = assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: group, sourceTaskId: 'later-products-task', priorSelection: decision });
assert.equal(reused.status, 'REUSED_PREVIOUS_GOVERNED_SELECTION');
assert.deepEqual(reused.selectedProviderIdentity, selectedProviderIdentity);

assert.throws(() => assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: [sparse], sourceTaskId: 'products-task' }), /EQUIVALENCE_GROUP_REQUIRED/);
assert.throws(() => assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: [{ ...sparse, eligible: false }, rich], sourceTaskId: 'products-task' }), /EQUIVALENCE_GROUP_REQUIRED/);
assert.throws(() => assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: [member(null, null, null), rich], sourceTaskId: 'products-task' }), /IDENTIFIER_REQUIRED/);
assert.throws(() => assessEquivalentProviderIdentitySelection({ atlasProduct: { identity: { ...atlasProduct.identity, atlasProductId: 'other' } }, equivalenceGroup: group, sourceTaskId: 'later', priorSelection: decision }), /ATLAS_BINDING_CONFLICT/);
assert.throws(() => assessEquivalentProviderIdentitySelection({ atlasProduct: { identity: { ...atlasProduct.identity, manufacturerPartNumber: 'OTHER' } }, equivalenceGroup: group, sourceTaskId: 'later', priorSelection: decision }), /EXACT_MPN_REQUIRED|ATLAS_BINDING_CONFLICT/);
assert.throws(() => assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: [sparse, member('new-doc', 'new-product', 'new-gid')], sourceTaskId: 'later', priorSelection: decision }), /NO_LONGER_PRESENT/);
assert.throws(() => createManualEquivalentProviderIdentitySelectionDecision({ ...decisionInput, selectedProviderIdentity: { dataDocId: 'outside', productId: null, gid: null } }), /OUTSIDE_EQUIVALENCE_GROUP/);
assert.throws(() => createManualEquivalentProviderIdentitySelectionDecision({ ...decisionInput, reviewedBy: '<OPERATOR>' }), /OPERATOR_REQUIRED/);

const removedOptionalEvidence = group.map(value => ({ ...value, evidence: { mpn: value.evidence.mpn } }));
const sparseAssessment = assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: removedOptionalEvidence, sourceTaskId: 'products-task' });
assert.equal(sparseAssessment.status, 'MANUAL_SELECTION_REQUIRED', 'removing optional evidence must not create an automatic winner');

const addedEquivalentDocument = [...group, member('doc-new', 'product-new', 'gid-new')];
const expanded = assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup: addedEquivalentDocument, sourceTaskId: 'products-task' });
assert.equal(expanded.status, 'MANUAL_SELECTION_REQUIRED', 'a new equivalent document must not alter the no-automatic-selection posture');

console.log('Equivalent provider identity selection fixture experiment tests passed.');

