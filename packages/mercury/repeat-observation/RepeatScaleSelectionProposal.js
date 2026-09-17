import { scaleRampCanaryDigest } from "../scale-ramp/DeterministicCanarySelector.js";

export const REPEAT_SCALE_SELECTION_POLICY_ID = "MERCURY_REPEAT_SCALE_SELECTION";
export const REPEAT_SCALE_SELECTION_POLICY_VERSION = "1.0";
export const REPEAT_SCALE_PROPOSAL_SOURCE_SCOPE = "SINGLE_SOURCE_OPERATION";

const supportedOperations = Object.freeze({
  DATAFORSEO_AMAZON: "AMAZON_SELLERS",
  DATAFORSEO_GOOGLE_SHOPPING: "SELLERS"
});
const candidateKeys = Object.freeze([
  "atlasProductId", "source", "operation", "observationCycle",
  "reusableIdentityDigest", "sourceRightsProfileDigest", "destinationBindingDigest",
  "manufacturer", "memoryGeneration", "formFactor", "capacityGb", "moduleCount"
]);
const proposalKeys = new Set([
  "schemaVersion", "artifactType", "status", "stageId", "stageCohortDigest",
  "stagePolicyId", "stagePolicyVersion", "selectorPolicyId", "selectorPolicyVersion",
  "sourceScope", "source", "operation", "observationCycle", "requestedSize",
  "candidateCount", "candidatePool", "candidatePoolDigest", "selectedMembers",
  "selectedMemberDigest", "strataSummary", "selectionRationale", "proposalId",
  "proposalDigest", "authority", "providerCalls", "existingResultRetrievals",
  "providerTasks", "paidTasks", "actualSpendUsd", "prepareAuthorized",
  "executionAuthorized", "runCreated", "downstreamAuthority"
]);
const text = (value, code) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
};
const integer = (value, code) => {
  if (!Number.isInteger(value) || value <= 0) throw new Error(code);
  return value;
};
const digest = value => scaleRampCanaryDigest(value);
const hex = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const iso = (value, code) => {
  const normalized = text(value, code);
  if (!Number.isFinite(Date.parse(normalized)) || new Date(normalized).toISOString() !== normalized) throw new Error(code);
  return normalized;
};
const deepFreeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};
const compare = (left, right) => left.localeCompare(right, "en");

function normalizeCandidate(value) {
  if (!value || Object.keys(value).some(key => !candidateKeys.includes(key))) {
    throw new Error("REPEAT_SCALE_CANDIDATE_SCHEMA_INVALID");
  }
  const source = text(value.source, "REPEAT_SCALE_CANDIDATE_SOURCE_REQUIRED").toUpperCase();
  const operation = text(value.operation, "REPEAT_SCALE_CANDIDATE_OPERATION_REQUIRED").toUpperCase();
  if (supportedOperations[source] !== operation) throw new Error("REPEAT_SCALE_SOURCE_OPERATION_UNSUPPORTED");
  const destinationBindingDigest = value.destinationBindingDigest === null ? null : text(value.destinationBindingDigest, "REPEAT_SCALE_DESTINATION_BINDING_INVALID");
  if (destinationBindingDigest !== null && !hex(destinationBindingDigest)) throw new Error("REPEAT_SCALE_DESTINATION_BINDING_INVALID");
  const normalized = {
    atlasProductId: text(value.atlasProductId, "REPEAT_SCALE_ATLAS_PRODUCT_REQUIRED"),
    source,
    operation,
    observationCycle: iso(value.observationCycle, "REPEAT_SCALE_OBSERVATION_CYCLE_INVALID"),
    reusableIdentityDigest: text(value.reusableIdentityDigest, "REPEAT_SCALE_IDENTITY_BINDING_INVALID"),
    sourceRightsProfileDigest: text(value.sourceRightsProfileDigest, "REPEAT_SCALE_RIGHTS_BINDING_INVALID"),
    destinationBindingDigest,
    manufacturer: text(value.manufacturer, "REPEAT_SCALE_MANUFACTURER_REQUIRED").normalize("NFC"),
    memoryGeneration: text(value.memoryGeneration, "REPEAT_SCALE_MEMORY_GENERATION_REQUIRED").toUpperCase(),
    formFactor: text(value.formFactor, "REPEAT_SCALE_FORM_FACTOR_REQUIRED").toUpperCase(),
    capacityGb: integer(value.capacityGb, "REPEAT_SCALE_CAPACITY_INVALID"),
    moduleCount: integer(value.moduleCount, "REPEAT_SCALE_MODULE_COUNT_INVALID")
  };
  if (!hex(normalized.reusableIdentityDigest) || !hex(normalized.sourceRightsProfileDigest)) throw new Error("REPEAT_SCALE_BINDING_DIGEST_INVALID");
  return normalized;
}

const candidateIdentity = value => [value.atlasProductId, value.source, value.operation, value.observationCycle].join("\u001f");
const stratum = value => [value.manufacturer, value.memoryGeneration, value.formFactor, value.capacityGb, value.moduleCount, value.source, value.operation].join("\u001f");
const baseFrom = value => ({
  stageId: value.stageId,
  stageCohortDigest: value.stageCohortDigest,
  stagePolicyId: value.stagePolicyId,
  stagePolicyVersion: value.stagePolicyVersion,
  selectorPolicyId: REPEAT_SCALE_SELECTION_POLICY_ID,
  selectorPolicyVersion: REPEAT_SCALE_SELECTION_POLICY_VERSION,
  sourceScope: REPEAT_SCALE_PROPOSAL_SOURCE_SCOPE,
  source: value.source,
  operation: value.operation,
  observationCycle: value.observationCycle
});

export function selectRepeatScaleProposal(input = {}) {
  const allowed = ["stageId", "stageCohortDigest", "stagePolicyId", "stagePolicyVersion", "selectorPolicyVersion", "source", "operation", "observationCycle", "requestedSize", "candidates"];
  if (!input || Object.keys(input).some(key => !allowed.includes(key))) throw new Error("REPEAT_SCALE_SELECTION_INPUT_INVALID");
  const selectorPolicyVersion = text(input.selectorPolicyVersion ?? REPEAT_SCALE_SELECTION_POLICY_VERSION, "REPEAT_SCALE_SELECTOR_VERSION_REQUIRED");
  if (selectorPolicyVersion !== REPEAT_SCALE_SELECTION_POLICY_VERSION) throw new Error("REPEAT_SCALE_SELECTOR_VERSION_UNSUPPORTED");
  const source = text(input.source, "REPEAT_SCALE_SOURCE_REQUIRED").toUpperCase();
  const operation = text(input.operation, "REPEAT_SCALE_OPERATION_REQUIRED").toUpperCase();
  if (supportedOperations[source] !== operation) throw new Error("REPEAT_SCALE_SOURCE_OPERATION_UNSUPPORTED");
  const observationCycle = iso(input.observationCycle, "REPEAT_SCALE_OBSERVATION_CYCLE_INVALID");
  if (!Array.isArray(input.candidates) || !input.candidates.length) throw new Error("REPEAT_SCALE_CANDIDATES_REQUIRED");
  const candidatePool = input.candidates.map(normalizeCandidate).sort((a, b) => compare(candidateIdentity(a), candidateIdentity(b)));
  if (candidatePool.some(candidate => candidate.source !== source || candidate.operation !== operation || candidate.observationCycle !== observationCycle)) throw new Error("REPEAT_SCALE_CANDIDATE_SCOPE_CONFLICT");
  if (new Set(candidatePool.map(candidateIdentity)).size !== candidatePool.length) throw new Error("REPEAT_SCALE_DUPLICATE_CANDIDATE");
  const requestedSize = integer(input.requestedSize, "REPEAT_SCALE_REQUESTED_SIZE_INVALID");
  if (requestedSize > candidatePool.length) throw new Error("REPEAT_SCALE_REQUESTED_SIZE_EXCEEDS_CANDIDATES");
  const base = baseFrom({
    stageId: text(input.stageId, "REPEAT_SCALE_STAGE_REQUIRED"),
    stageCohortDigest: text(input.stageCohortDigest, "REPEAT_SCALE_STAGE_DIGEST_REQUIRED"),
    stagePolicyId: text(input.stagePolicyId, "REPEAT_SCALE_STAGE_POLICY_REQUIRED"),
    stagePolicyVersion: text(input.stagePolicyVersion, "REPEAT_SCALE_STAGE_POLICY_VERSION_REQUIRED"),
    source, operation, observationCycle
  });
  if (!hex(base.stageCohortDigest)) throw new Error("REPEAT_SCALE_STAGE_DIGEST_INVALID");
  const candidatePoolDigest = digest({ ...base, candidatePool });
  const rank = (kind, value) => digest({ ...base, candidatePoolDigest, kind, ...value });
  const grouped = new Map();
  for (const candidate of candidatePool) {
    const key = stratum(candidate);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(candidate);
  }
  const strata = [...grouped].map(([key, members]) => ({
    key,
    members: members.sort((a, b) => compare(rank("MEMBER", { stratumKey: key, candidateIdentity: candidateIdentity(a) }), rank("MEMBER", { stratumKey: key, candidateIdentity: candidateIdentity(b) })) || compare(candidateIdentity(a), candidateIdentity(b)))
  })).sort((a, b) => compare(rank("STRATUM", { stratumKey: a.key }), rank("STRATUM", { stratumKey: b.key })) || compare(a.key, b.key));
  const selectedMembers = [];
  for (let pass = 0; selectedMembers.length < requestedSize; pass += 1) {
    for (const group of strata) {
      if (group.members[pass]) selectedMembers.push(group.members[pass]);
      if (selectedMembers.length === requestedSize) break;
    }
  }
  const selectedMemberDigest = digest({ ...base, candidatePoolDigest, requestedSize, selectedMembers });
  const proposalContract = {
    schemaVersion: "1.0", artifactType: "MERCURY_REPEAT_SCALE_REVIEW_PROPOSAL", status: "REVIEW_ONLY",
    ...base, requestedSize, candidateCount: candidatePool.length, candidatePool, candidatePoolDigest,
    selectedMembers, selectedMemberDigest,
    selectionRationale: "DETERMINISTIC_STRATIFIED_ROUND_ROBIN",
    authority: "NONE", providerCalls: 0, existingResultRetrievals: 0, providerTasks: 0,
    paidTasks: 0, actualSpendUsd: 0, prepareAuthorized: false, executionAuthorized: false,
    runCreated: false, downstreamAuthority: "NONE"
  };
  const proposalDigest = digest(proposalContract);
  return deepFreeze({
    ...proposalContract,
    strataSummary: strata.map(group => ({ stratumKey: group.key, candidateCount: group.members.length, selectedCount: selectedMembers.filter(member => stratum(member) === group.key).length })),
    proposalId: `mer_scaleproposal_${proposalDigest.slice(0, 24)}`,
    proposalDigest
  });
}

export function validateRepeatScaleProposal(value) {
  if (!value || Object.keys(value).some(key => !proposalKeys.has(key))) throw new Error("REPEAT_SCALE_PROPOSAL_SCHEMA_INVALID");
  if (value.schemaVersion !== "1.0" || value.artifactType !== "MERCURY_REPEAT_SCALE_REVIEW_PROPOSAL" || value.status !== "REVIEW_ONLY") throw new Error("REPEAT_SCALE_PROPOSAL_SCHEMA_INVALID");
  if (value.selectorPolicyId !== REPEAT_SCALE_SELECTION_POLICY_ID || value.selectorPolicyVersion !== REPEAT_SCALE_SELECTION_POLICY_VERSION || value.sourceScope !== REPEAT_SCALE_PROPOSAL_SOURCE_SCOPE) throw new Error("REPEAT_SCALE_PROPOSAL_POLICY_INVALID");
  if (value.authority !== "NONE" || value.providerCalls !== 0 || value.existingResultRetrievals !== 0 || value.providerTasks !== 0 || value.paidTasks !== 0 || value.actualSpendUsd !== 0 || value.prepareAuthorized !== false || value.executionAuthorized !== false || value.runCreated !== false || value.downstreamAuthority !== "NONE") throw new Error("REPEAT_SCALE_PROPOSAL_AUTHORITY_INVALID");
  const replay = selectRepeatScaleProposal({
    stageId: value.stageId, stageCohortDigest: value.stageCohortDigest,
    stagePolicyId: value.stagePolicyId, stagePolicyVersion: value.stagePolicyVersion,
    selectorPolicyVersion: value.selectorPolicyVersion, source: value.source,
    operation: value.operation, observationCycle: value.observationCycle,
    requestedSize: value.requestedSize, candidates: value.candidatePool
  });
  if (digest(value) !== digest(replay)) throw new Error("REPEAT_SCALE_PROPOSAL_BINDING_MISMATCH");
  return replay;
}

export function repeatScaleProposalOperations(value) {
  const proposal = validateRepeatScaleProposal(value);
  return deepFreeze(proposal.selectedMembers.map(member => ({
    atlasProductId: member.atlasProductId,
    source: member.source,
    operation: member.operation,
    observationCycle: member.observationCycle
  })));
}

export function repeatScaleProposalProvenance(value) {
  const proposal = validateRepeatScaleProposal(value);
  const selectedOperations = repeatScaleProposalOperations(proposal);
  return deepFreeze({
    selectionInputType: "SELECTOR_PROPOSAL",
    proposalId: proposal.proposalId,
    proposalDigest: proposal.proposalDigest,
    proposalSchemaVersion: proposal.schemaVersion,
    proposalArtifactType: proposal.artifactType,
    stagePolicyId: proposal.stagePolicyId,
    stagePolicyVersion: proposal.stagePolicyVersion,
    stageId: proposal.stageId,
    stageCohortDigest: proposal.stageCohortDigest,
    experimentPolicyId: proposal.stagePolicyId,
    experimentPolicyVersion: proposal.stagePolicyVersion,
    selectorPolicyId: proposal.selectorPolicyId,
    selectorPolicyVersion: proposal.selectorPolicyVersion,
    candidateCount: proposal.candidateCount,
    candidatePoolDigest: proposal.candidatePoolDigest,
    selectedMemberDigest: proposal.selectedMemberDigest,
    requestedSelectorSize: proposal.requestedSize,
    source: proposal.source,
    operation: proposal.operation,
    observationCycle: proposal.observationCycle,
    selectedAtlasProductIds: selectedOperations.map(operation => operation.atlasProductId),
    selectedOperations
  });
}
