import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  repeatScaleProposalOperations,
  repeatScaleProposalProvenance,
  selectRepeatScaleProposal,
  validateRepeatScaleProposal
} from "../index.js";

let cases = 0;
const eq = (actual, expected) => { assert.deepEqual(actual, expected); cases += 1; };
const read = async path => JSON.parse(await readFile(new URL(`../../../${path}`, import.meta.url), "utf8"));
const policy = await read("config/mercury/scale-ramp/100-stage-larger-longitudinal-repeat-policy.json");
const amazon = validateRepeatScaleProposal(await read("config/mercury/scale-ramp/100-stage-larger-longitudinal-amazon-review.json"));
const google = validateRepeatScaleProposal(await read("config/mercury/scale-ramp/100-stage-larger-longitudinal-google-control-review.json"));

eq(policy.schemaVersion, "1.0");
eq(policy.policyId, "MERCURY_100_STAGE_LARGER_LONGITUDINAL_REPEAT_EXPERIMENT");
eq(policy.policyVersion, "1.0");
eq(policy.status, "REVIEW_ONLY");
eq(policy.stageCohortDigest, "470dfadbdb8670de3566826d33eb74cb9d97a1ca6e14bf8b3fac71101ecaaf21");
eq(policy.observationCycle, "2026-09-18T00:00:00.000Z");
eq(policy.primaryRequestedSize, 24);
eq(policy.googleControlClassification, "USEFUL_BUT_NOT_REQUIRED");
eq(policy.costEnvelope, { amazonTaskCount: 24, amazonMaximumSpendUsd: 0.036, googleTaskCount: 2, googleMaximumSpendUsd: 0.002, maximumPaidTasks: 26, maximumProviderSpendUsd: 0.038, utcDaySpendCeilingUsd: 0.05, automaticPaidRetries: 0 });
eq(policy.currentUtcDaySpend, { utcDay: "2026-09-17", actualSpendUsd: 0.048, remainingCapacityUsd: 0.002, sufficientForPrimaryToday: false, sufficientForControlToday: true });
eq([policy.authority, policy.providerCalls, policy.providerTasks, policy.paidTasks, policy.actualSpendUsd, policy.prepareAuthorized, policy.authorizationCreated, policy.executionAuthorized, policy.runCreated, policy.downstreamAuthority], ["NONE", 0, 0, 0, 0, false, false, false, false, "NONE"]);

eq([amazon.source, amazon.operation, amazon.candidateCount, amazon.requestedSize], ["DATAFORSEO_AMAZON", "AMAZON_SELLERS", 41, 24]);
eq([google.source, google.operation, google.candidateCount, google.requestedSize], ["DATAFORSEO_GOOGLE_SHOPPING", "SELLERS", 2, 2]);
eq(amazon.observationCycle, policy.observationCycle);
eq(google.observationCycle, policy.observationCycle);
eq(policy.proposalReferences.map(row => [row.role, row.proposalId, row.proposalDigest]), [["PRIMARY", amazon.proposalId, amazon.proposalDigest], ["CONTROL", google.proposalId, google.proposalDigest]]);
eq(repeatScaleProposalOperations(amazon).length, 24);
eq(repeatScaleProposalOperations(google).length, 2);
eq(repeatScaleProposalProvenance(amazon).selectedMemberDigest, amazon.selectedMemberDigest);
eq(repeatScaleProposalProvenance(google).selectedMemberDigest, google.selectedMemberDigest);

const selectionInput = (proposal, requestedSize) => ({
  stageId: proposal.stageId,
  stageCohortDigest: proposal.stageCohortDigest,
  stagePolicyId: proposal.stagePolicyId,
  stagePolicyVersion: proposal.stagePolicyVersion,
  selectorPolicyVersion: proposal.selectorPolicyVersion,
  source: proposal.source,
  operation: proposal.operation,
  observationCycle: proposal.observationCycle,
  requestedSize,
  candidates: proposal.candidatePool
});
const selectedStrata = proposal => proposal.strataSummary.filter(row => row.selectedCount > 0).length;
eq(selectedStrata(selectRepeatScaleProposal(selectionInput(amazon, 20))), 20);
eq(selectedStrata(amazon), 22);
eq(selectedStrata(selectRepeatScaleProposal(selectionInput(amazon, 32))), 22);
eq(policy.currentCandidatePopulation.amazon, {
  count: 41, priorAny: 7, priorNone: 34,
  manufacturers: { Corsair: 13, Crucial: 5, "G.SKILL": 7, Kingston: 10, TeamGroup: 6 },
  generations: { DDR4: 5, DDR5: 36 }, formFactors: { DIMM: 35, SO_DIMM: 6 },
  capacities: { 8: 2, 16: 3, 32: 28, 64: 8 }, moduleCounts: { 1: 5, 2: 36 },
  selectedPreviouslyObserved: 5, selectedFirstRepeat: 19
});
eq(policy.currentCandidatePopulation.google.selectedPreviouslyObserved, 2);
assert.throws(() => validateRepeatScaleProposal({ ...amazon, paidTasks: 1 }), /AUTHORITY_INVALID|BINDING_MISMATCH/); cases += 1;
assert.throws(() => validateRepeatScaleProposal({ ...amazon, selectedMembers: amazon.selectedMembers.slice(1) }), /BINDING_MISMATCH/); cases += 1;
assert.throws(() => validateRepeatScaleProposal({ ...google, observationCycle: "2026-09-19T00:00:00.000Z" }), /SCOPE_CONFLICT|BINDING_MISMATCH/); cases += 1;

console.log(`Repeat-scale experiment policy tests passed: ${cases} cases.`);
