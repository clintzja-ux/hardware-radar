export function extractReviewedProductEnrichmentProposal(envelope = {}) {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('PRODUCT_ENRICHMENT_PROPOSAL_ENVELOPE_REQUIRED');
  }
  if (envelope.paidTaskCreated !== false) {
    throw new Error('PRODUCT_ENRICHMENT_PROPOSAL_ALREADY_CREATED_PAID_TASK');
  }
  if (Number(envelope.actualSpendUsd) !== 0) {
    throw new Error('PRODUCT_ENRICHMENT_PROPOSAL_REQUIRES_ZERO_SPEND_PREPARE');
  }
  const proposal = envelope.proposal;
  if (!proposal || typeof proposal !== 'object') {
    throw new Error('PRODUCT_ENRICHMENT_REVIEWED_PROPOSAL_MISSING');
  }
  if (proposal.status !== 'PENDING_OPERATOR_REVIEW' || proposal.operation !== 'PRODUCT_INFO') {
    throw new Error('PRODUCT_INFO_AUTHORIZATION_REQUIRES_REVIEWED_PROPOSAL');
  }
  const governed=proposal.providerSelectionLineage&&envelope.providerSelectionDecision;
  if(!governed&&(!envelope.resolution||envelope.resolution.recommendationStatus!=='RECOMMENDED')) throw new Error('PRODUCT_ENRICHMENT_SAFE_RECOMMENDATION_REQUIRED');
  const recommended=governed?envelope.providerSelectionDecision.selectedProviderIdentity:envelope.resolution.recommendedCandidate?.item;
  if(!recommended) throw new Error('PRODUCT_ENRICHMENT_RECOMMENDED_CANDIDATE_MISSING');
  const sameIdentity =
    (proposal.providerIdentity?.dataDocId ?? null) === (recommended.dataDocId ?? null) &&
    (proposal.providerIdentity?.productId ?? null) === (recommended.productId ?? null) &&
    (proposal.providerIdentity?.gid ?? null) === (recommended.gid ?? null);
  if (!sameIdentity) {
    throw new Error('PRODUCT_ENRICHMENT_PROPOSAL_RESOLUTION_MISMATCH');
  }
  if (proposal.sourceTaskId !== envelope.sourceTaskId || proposal.atlasProductId !== envelope.atlasProductId) {
    throw new Error('PRODUCT_ENRICHMENT_PROPOSAL_ENVELOPE_BINDING_MISMATCH');
  }
  if(governed&&(proposal.providerSelectionLineage.selectionDecisionId!==envelope.providerSelectionDecision.selectionDecisionId||proposal.providerSelectionLineage.equivalenceAssessmentId!==envelope.providerSelectionDecision.equivalenceAssessmentId))throw new Error('PRODUCT_ENRICHMENT_PROVIDER_SELECTION_BINDING_MISMATCH');
  return proposal;
}
