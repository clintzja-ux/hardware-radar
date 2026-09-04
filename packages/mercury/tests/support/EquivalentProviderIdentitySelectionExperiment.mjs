import crypto from 'node:crypto';

const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalize = value => String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};

const providerIdentity = candidate => ({
  dataDocId: candidate?.item?.dataDocId ?? null,
  productId: candidate?.item?.productId ?? null,
  gid: candidate?.item?.gid ?? null
});
const identityKey = identity => JSON.stringify([identity.dataDocId, identity.productId, identity.gid]);
const validIdentity = identity => Boolean(identity.dataDocId || identity.productId || identity.gid);

function selectionBinding({ atlasProduct, equivalenceGroup, sourceTaskId }) {
  if (!atlasProduct?.identity?.atlasProductId || !atlasProduct.identity.manufacturerPartNumber || !sourceTaskId) {
    throw new Error('PROVIDER_SELECTION_BINDING_REQUIRED');
  }
  if (!Array.isArray(equivalenceGroup) || equivalenceGroup.length < 2 || equivalenceGroup.some(member => !member?.eligible)) {
    throw new Error('PROVIDER_EQUIVALENCE_GROUP_REQUIRED');
  }
  const members = equivalenceGroup.map(member => {
    const identity = providerIdentity(member.candidate);
    if (!validIdentity(identity)) throw new Error('PROVIDER_SELECTION_IDENTIFIER_REQUIRED');
    if (!member.candidate.exactMpnMatch || member.evidence?.mpn !== normalize(atlasProduct.identity.manufacturerPartNumber)) {
      throw new Error('PROVIDER_SELECTION_EXACT_MPN_REQUIRED');
    }
    return { providerIdentity: identity, evidence: member.evidence };
  }).sort((left, right) => identityKey(left.providerIdentity).localeCompare(identityKey(right.providerIdentity)));
  const material = {
    atlasProductId: atlasProduct.identity.atlasProductId,
    manufacturerPartNumber: atlasProduct.identity.manufacturerPartNumber,
    sourceTaskId,
    members
  };
  return freeze({ ...material, equivalenceGroupDigest: hash(material) });
}

export function assessEquivalentProviderIdentitySelection({ atlasProduct, equivalenceGroup, sourceTaskId, priorSelection = null } = {}) {
  const binding = selectionBinding({ atlasProduct, equivalenceGroup, sourceTaskId });
  if (!priorSelection) return freeze({ status: 'MANUAL_SELECTION_REQUIRED', binding, selectedProviderIdentity: null, reason: 'NO_PROVIDER_CONTRACT_PREFERENCE' });
  if (priorSelection.atlasProductId !== binding.atlasProductId || normalize(priorSelection.manufacturerPartNumber) !== normalize(binding.manufacturerPartNumber)) {
    throw new Error('PRIOR_PROVIDER_SELECTION_ATLAS_BINDING_CONFLICT');
  }
  const selected = priorSelection.selectedProviderIdentity;
  if (!validIdentity(selected) || !binding.members.some(member => identityKey(member.providerIdentity) === identityKey(selected))) {
    throw new Error('PRIOR_PROVIDER_SELECTION_NO_LONGER_PRESENT');
  }
  return freeze({ status: 'REUSED_PREVIOUS_GOVERNED_SELECTION', binding, selectedProviderIdentity: selected, priorSelectionId: priorSelection.selectionDecisionId });
}

export function createManualEquivalentProviderIdentitySelectionDecision({ assessment, selectedProviderIdentity, requestId, reviewedBy, reviewedAt, reason } = {}) {
  if (assessment?.status !== 'MANUAL_SELECTION_REQUIRED' || !assessment.binding) throw new Error('MANUAL_PROVIDER_SELECTION_ASSESSMENT_REQUIRED');
  if (!validIdentity(selectedProviderIdentity)) throw new Error('MANUAL_PROVIDER_SELECTION_IDENTIFIER_REQUIRED');
  if (!assessment.binding.members.some(member => identityKey(member.providerIdentity) === identityKey(selectedProviderIdentity))) {
    throw new Error('MANUAL_PROVIDER_SELECTION_OUTSIDE_EQUIVALENCE_GROUP');
  }
  if (typeof requestId !== 'string' || !requestId.trim()) throw new Error('MANUAL_PROVIDER_SELECTION_REQUEST_REQUIRED');
  if (typeof reviewedBy !== 'string' || !reviewedBy.trim() || /^<[^>]+>$/.test(reviewedBy.trim())) throw new Error('MANUAL_PROVIDER_SELECTION_OPERATOR_REQUIRED');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('MANUAL_PROVIDER_SELECTION_REASON_REQUIRED');
  if (!Number.isFinite(Date.parse(reviewedAt))) throw new Error('MANUAL_PROVIDER_SELECTION_TIME_REQUIRED');
  const material = {
    requestId: requestId.trim(),
    atlasProductId: assessment.binding.atlasProductId,
    manufacturerPartNumber: assessment.binding.manufacturerPartNumber,
    sourceTaskId: assessment.binding.sourceTaskId,
    equivalenceGroupDigest: assessment.binding.equivalenceGroupDigest,
    equivalentProviderIdentities: assessment.binding.members.map(member => member.providerIdentity),
    selectedProviderIdentity,
    selectionBasis: 'EXPLICIT_OPERATOR_SELECTION_WITHIN_CERTIFIED_EQUIVALENCE_GROUP',
    reviewedBy: reviewedBy.trim(),
    reviewedAt,
    reason: reason.trim()
  };
  return freeze({
    schemaVersion: 'experiment-1.0',
    selectionDecisionId: `mer_providerselect_${hash(material).slice(0, 24)}`,
    ...material,
    grantsProductIdentity: false,
    grantsMarketAuthority: false,
    grantsPublicationAuthority: false,
    grantsRankingAuthority: false,
    materialDigest: hash(material)
  });
}

