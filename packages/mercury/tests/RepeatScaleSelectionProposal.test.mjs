import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  repeatScaleProposalOperations,
  REPEAT_SCALE_PROPOSAL_SOURCE_SCOPE,
  REPEAT_SCALE_SELECTION_POLICY_ID,
  selectRepeatScaleProposal,
  validateRepeatScaleProposal
} from "../index.js";

let cases = 0;
const eq = (actual, expected) => { assert.deepEqual(actual, expected); cases += 1; };
const hex = index => index.toString(16).padStart(64, "0").slice(-64);
const cycle = "2026-09-18T00:00:00.000Z";
const amazonCandidate = (index, overrides = {}) => ({
  atlasProductId: `ram_fixture_${String(index).padStart(5, "0")}`,
  source: "DATAFORSEO_AMAZON",
  operation: "AMAZON_SELLERS",
  observationCycle: cycle,
  reusableIdentityDigest: hex(index + 1),
  sourceRightsProfileDigest: hex(index + 10001),
  destinationBindingDigest: hex(index + 20001),
  manufacturer: ["Corsair", "Crucial", "G.SKILL", "Kingston", "TeamGroup"][index % 5],
  memoryGeneration: index % 3 ? "DDR5" : "DDR4",
  formFactor: index % 4 ? "DIMM" : "SO_DIMM",
  capacityGb: [8, 16, 32, 64][index % 4],
  moduleCount: index % 3 ? 2 : 1,
  ...overrides
});
const googleCandidate = (index, overrides = {}) => amazonCandidate(index, {
  source: "DATAFORSEO_GOOGLE_SHOPPING",
  operation: "SELLERS",
  destinationBindingDigest: null,
  ...overrides
});
const input = (candidates, requestedSize = Math.min(6, candidates.length), overrides = {}) => ({
  stageId: "hardware-radar-100-product-stage",
  stageCohortDigest: "a".repeat(64),
  stagePolicyId: "MERCURY_100_PRODUCT_LONGITUDINAL_EXPERIMENT",
  stagePolicyVersion: "1.0",
  source: candidates[0].source,
  operation: candidates[0].operation,
  observationCycle: candidates[0].observationCycle,
  requestedSize,
  candidates,
  ...overrides
});

const candidates = Array.from({ length: 43 }, (_, index) => amazonCandidate(index));
const first = selectRepeatScaleProposal(input(candidates));
const replay = selectRepeatScaleProposal(input([...candidates].reverse()));
eq(first, replay);
eq(first.selectorPolicyId, REPEAT_SCALE_SELECTION_POLICY_ID);
eq(first.sourceScope, REPEAT_SCALE_PROPOSAL_SOURCE_SCOPE);
eq(first.status, "REVIEW_ONLY");
eq(first.authority, "NONE");
eq(repeatScaleProposalOperations(validateRepeatScaleProposal(first)).length, 6);
eq(Object.isFrozen(first.selectedMembers[0]), true);
const driftInput = amazonCandidate(9000);
const driftProposal = selectRepeatScaleProposal(input([driftInput], 1));
driftInput.reusableIdentityDigest = "f".repeat(64);
driftInput.destinationBindingDigest = null;
eq(validateRepeatScaleProposal(driftProposal), driftProposal);

assert.throws(() => selectRepeatScaleProposal(input([candidates[0], candidates[0]], 1)), /DUPLICATE_CANDIDATE/); cases += 1;
const nextCycle = "2026-09-19T00:00:00.000Z";
const later = selectRepeatScaleProposal(input([amazonCandidate(0, { observationCycle: nextCycle })], 1, { observationCycle: nextCycle }));
assert.notEqual(later.candidatePoolDigest, selectRepeatScaleProposal(input([candidates[0]], 1)).candidatePoolDigest); cases += 1;
for (const badCycle of [null, "", "not-a-cycle", "2026-09-18T00:00:00Z"]) {
  assert.throws(() => selectRepeatScaleProposal(input([amazonCandidate(0, { observationCycle: badCycle })], 1, { observationCycle: badCycle })), /CYCLE/); cases += 1;
}

const google = selectRepeatScaleProposal(input(Array.from({ length: 6 }, (_, index) => googleCandidate(index)), 3));
eq(google.source, "DATAFORSEO_GOOGLE_SHOPPING");
eq(google.operation, "SELLERS");
assert.throws(() => selectRepeatScaleProposal(input([googleCandidate(0)], 1, { source: "DATAFORSEO_AMAZON", operation: "AMAZON_SELLERS" })), /SCOPE_CONFLICT/); cases += 1;
assert.throws(() => selectRepeatScaleProposal(input([amazonCandidate(0, { operation: "SELLERS" })], 1)), /SOURCE_OPERATION_UNSUPPORTED/); cases += 1;
assert.throws(() => selectRepeatScaleProposal(input([amazonCandidate(0), googleCandidate(1)], 1)), /SCOPE_CONFLICT/); cases += 1;

for (const size of [1, 6, 24, 43]) eq(selectRepeatScaleProposal(input(candidates, size)).selectedMembers.length, size);
for (const size of [0, -1, 1.5, 44]) assert.throws(() => selectRepeatScaleProposal(input(candidates, size)), /SIZE/), cases += 1;
eq(new Set(first.selectedMembers.map(member => `${member.manufacturer}:${member.memoryGeneration}:${member.formFactor}:${member.capacityGb}:${member.moduleCount}`)).size > 1, true);

for (const forbidden of ["affiliateCommission", "commission", "retailerPreference", "expectedPrice", "expectedSellerCount", "expectedProviderSuccess", "previousIdentityYield", "previousOfferQuality", "operatorFavorite"]) {
  assert.throws(() => selectRepeatScaleProposal(input([{ ...amazonCandidate(0), [forbidden]: true }], 1)), /CANDIDATE_SCHEMA_INVALID/); cases += 1;
}

const mutations = [
  value => ({ ...value, source: "DATAFORSEO_GOOGLE_SHOPPING" }),
  value => ({ ...value, operation: "SELLERS" }),
  value => ({ ...value, observationCycle: nextCycle }),
  value => ({ ...value, stagePolicyVersion: "2.0" }),
  value => ({ ...value, requestedSize: 5 }),
  value => ({ ...value, candidateCount: 42 }),
  value => ({ ...value, candidatePoolDigest: "b".repeat(64) }),
  value => ({ ...value, candidatePool: value.candidatePool.slice(1) }),
  value => ({ ...value, selectedMembers: value.selectedMembers.slice(1) }),
  value => ({ ...value, selectedMemberDigest: "b".repeat(64) }),
  value => ({ ...value, proposalDigest: "b".repeat(64) }),
  value => ({ ...value, proposalId: "mer_scaleproposal_bad" }),
  value => ({ ...value, authority: "PAID" }),
  value => ({ ...value, providerCalls: 1 }),
  value => ({ ...value, existingResultRetrievals: 1 }),
  value => ({ ...value, paidTasks: 1 }),
  value => ({ ...value, actualSpendUsd: 0.0015 }),
  value => ({ ...value, prepareAuthorized: true }),
  value => ({ ...value, executionAuthorized: true }),
  value => ({ ...value, runCreated: true }),
  value => ({ ...value, downstreamAuthority: "CURRENT_PRICE" })
];
for (const mutate of mutations) assert.throws(() => validateRepeatScaleProposal(mutate(first))), cases += 1;

const timings = [];
for (const size of [6, 24, 43, 100, 1000]) {
  const pool = Array.from({ length: size }, (_, index) => amazonCandidate(index));
  const started = performance.now();
  const proposal = selectRepeatScaleProposal(input(pool, Math.min(size, 24)));
  validateRepeatScaleProposal(proposal);
  timings.push({ candidates: size, selected: proposal.selectedMembers.length, elapsedMs: Number((performance.now() - started).toFixed(2)) });
  cases += 1;
}

eq(first.providerCalls, 0);
eq(first.existingResultRetrievals, 0);
eq(first.providerTasks, 0);
eq(first.paidTasks, 0);
eq(first.actualSpendUsd, 0);
eq(first.prepareAuthorized, false);
eq(first.executionAuthorized, false);
eq(first.runCreated, false);
eq(first.downstreamAuthority, "NONE");

console.log(`Repeat scale selection/proposal tests passed: ${cases} cases. Scale: ${JSON.stringify(timings)}`);
