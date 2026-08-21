import assert from 'node:assert/strict';
import { extractReviewedProductEnrichmentProposal } from '../index.js';

const proposal = {
  proposalId: 'enrich_test',
  status: 'PENDING_OPERATOR_REVIEW',
  sourceTaskId: 'products_task',
  atlasProductId: 'ram_test',
  operation: 'PRODUCT_INFO',
  estimatedCostUsd: 0.001,
  maxPaidTasks: 1,
  automaticPaidRetries: 0,
  providerIdentity: { productId: null, dataDocId: '3844868436216882408', gid: null }
};
const envelope = {
  schemaVersion: '1.0',
  sourceTaskId: 'products_task',
  atlasProductId: 'ram_test',
  resolution: {
    recommendationStatus: 'RECOMMENDED',
    recommendedCandidate: {
      item: { productId: null, dataDocId: '3844868436216882408', gid: null }
    }
  },
  proposal,
  paidTaskCreated: false,
  actualSpendUsd: 0
};

assert.equal(extractReviewedProductEnrichmentProposal(envelope), proposal);
assert.throws(() => extractReviewedProductEnrichmentProposal({ ...envelope, paidTaskCreated: true }), /ALREADY_CREATED_PAID_TASK/);
assert.throws(() => extractReviewedProductEnrichmentProposal({ ...envelope, actualSpendUsd: 0.001 }), /REQUIRES_ZERO_SPEND_PREPARE/);
assert.throws(() => extractReviewedProductEnrichmentProposal({ ...envelope, proposal: null }), /REVIEWED_PROPOSAL_MISSING/);
assert.throws(() => extractReviewedProductEnrichmentProposal({ ...envelope, resolution: { recommendationStatus: 'AMBIGUOUS' } }), /SAFE_RECOMMENDATION_REQUIRED/);
assert.throws(() => extractReviewedProductEnrichmentProposal({
  ...envelope,
  proposal: { ...proposal, providerIdentity: { ...proposal.providerIdentity, dataDocId: '17540895125310173539' } }
}), /PROPOSAL_RESOLUTION_MISMATCH/);

console.log('Product Info enrichment PREPARE envelope contract passed.');
