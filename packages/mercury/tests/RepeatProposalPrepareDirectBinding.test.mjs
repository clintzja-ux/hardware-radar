import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BoundedRepeatObservationRunService,
  repeatScaleProposalOperations,
  repeatScaleProposalProvenance,
  selectRepeatScaleProposal,
  SqliteRepeatObservationRepository
} from "../index.js";
import { runBoundedRepeatRunCli } from "../../../scripts/mercury-bounded-repeat-run-cli.mjs";

let cases = 0;
const eq = (actual, expected) => { assert.deepEqual(actual, expected); cases += 1; };
const hex = index => index.toString(16).padStart(64, "0").slice(-64);
const cycle = "2026-09-20T00:00:00.000Z";
const candidate = (index, source = "DATAFORSEO_AMAZON", overrides = {}) => ({
  atlasProductId: `ram_direct_${String(index).padStart(5, "0")}`,
  source,
  operation: source === "DATAFORSEO_AMAZON" ? "AMAZON_SELLERS" : "SELLERS",
  observationCycle: cycle,
  reusableIdentityDigest: hex(index + 1),
  sourceRightsProfileDigest: hex(index + 10001),
  destinationBindingDigest: source === "DATAFORSEO_AMAZON" ? hex(index + 20001) : null,
  manufacturer: ["Corsair", "Crucial", "G.SKILL"][index % 3],
  memoryGeneration: index % 2 ? "DDR5" : "DDR4",
  formFactor: index % 3 ? "DIMM" : "SO_DIMM",
  capacityGb: [16, 32, 64][index % 3],
  moduleCount: index % 2 ? 2 : 1,
  ...overrides
});
const proposal = (size, source = "DATAFORSEO_AMAZON", overrides = {}) => selectRepeatScaleProposal({
  stageId: "hardware-radar-100-product-stage",
  stageCohortDigest: "a".repeat(64),
  stagePolicyId: "MERCURY_100_PRODUCT_LONGITUDINAL_EXPERIMENT",
  stagePolicyVersion: "1.0",
  source,
  operation: source === "DATAFORSEO_AMAZON" ? "AMAZON_SELLERS" : "SELLERS",
  observationCycle: cycle,
  requestedSize: size,
  candidates: Array.from({ length: size }, (_, index) => candidate(index, source)),
  ...overrides
});
const repeat = (blocked = new Set()) => ({
  async prepare(input) {
    if (blocked.has(input.atlasProductId)) throw new Error("REPEAT_OBSERVATION_IDENTITY_NOT_REUSABLE");
    const operation = input.source === "DATAFORSEO_AMAZON" ? "AMAZON_SELLERS" : "SELLERS";
    return { status: "PREPARED", value: { ...input, operation, preparedObservationId: `prep_${input.atlasProductId}_${input.source}_${input.observationCycle}`, taskCostUsd: input.source === "DATAFORSEO_AMAZON" ? 0.0015 : 0.001, reusableIdentity: { identityDigest: hex(50000) }, sourceRightsProfileDigest: hex(60000) } };
  },
  async validateCurrent() { return { state: "CURRENT" }; }
});
const open = async (name, blocked) => {
  const root = await mkdtemp(join(tmpdir(), `repeat-direct-${name}-`));
  const repository = new SqliteRepeatObservationRepository({ databasePath: join(root, "state.sqlite") });
  return { root, repository, service: new BoundedRepeatObservationRunService({ repeatService: repeat(blocked), repository, spendResolver: async () => 0, now: () => cycle }) };
};
const prepare = async (service, value) => {
  const operations = repeatScaleProposalOperations(value);
  return service.prepareRun({ observationCycle: value.observationCycle, cohort: operations.map(({ atlasProductId, source }) => ({ atlasProductId, source })), selectionProvenance: repeatScaleProposalProvenance(value) });
};

const amazon = proposal(6), state = await open("amazon");
try {
  const created = await prepare(state.service, amazon), inspected = await state.service.inspectRun({ runPlanId: created.value.runPlanId });
  eq(created.status, "PREPARED");
  eq(created.value.selectionInputType, "SELECTOR_PROPOSAL");
  eq(created.value.selectionProvenance.selectedOperations, repeatScaleProposalOperations(amazon));
  eq(inspected.selectorMembershipEquivalent, true);
  eq(inspected.selectionProvenance.proposalDigest, amazon.proposalDigest);
  eq(inspected.authorizationState, "NOT_AUTHORIZED");
  eq(inspected.runState, "NOT_STARTED");
  eq(created.value.maximumPaidTasks, 6);
  eq(created.value.maximumSpendUsd, 0.009);
  eq((await prepare(state.service, amazon)).status, "DUPLICATE");
  const concurrent = await Promise.all([prepare(state.service, amazon), prepare(state.service, amazon)]);
  eq(concurrent.every(result => result.status === "DUPLICATE"), true);
  const legacy = await state.service.prepareRun({ observationCycle: "2026-09-21T00:00:00.000Z", cohort: [{ atlasProductId: "ram_legacy", source: "DATAFORSEO_AMAZON" }] });
  const legacyInspect = await state.service.inspectRun({ runPlanId: legacy.value.runPlanId });
  eq(legacyInspect.selectionInputType, "LEGACY_COHORT_INPUT");
  eq(legacyInspect.selectionProvenance, null);
  state.repository.close();
  const reopened = new SqliteRepeatObservationRepository({ databasePath: join(state.root, "state.sqlite") });
  const restarted = new BoundedRepeatObservationRunService({ repeatService: repeat(), repository: reopened, spendResolver: async () => 0, now: () => cycle });
  eq((await restarted.inspectRun({ runPlanId: created.value.runPlanId })).selectionProvenance, inspected.selectionProvenance);
  reopened.close();
} finally { await rm(state.root, { recursive: true, force: true }); }

const google = proposal(2, "DATAFORSEO_GOOGLE_SHOPPING"), googleState = await open("google");
try {
  const created = await prepare(googleState.service, google);
  eq(created.value.ready.every(row => row.operation === "SELLERS"), true);
  eq(created.value.maximumSpendUsd, 0.002);
} finally { googleState.repository.close(); await rm(googleState.root, { recursive: true, force: true }); }

const driftState = await open("drift", new Set([amazon.selectedMembers[0].atlasProductId]));
try {
  const created = await prepare(driftState.service, amazon);
  eq(created.value.requested.length, 6);
  eq(created.value.ready.length, 5);
  eq(created.value.blocked.length, 1);
  eq(created.value.selectionProvenance.selectedOperations.length, 6);
} finally { driftState.repository.close(); await rm(driftState.root, { recursive: true, force: true }); }

const badProvenance = repeatScaleProposalProvenance(amazon);
const mismatchState = await open("mismatch");
try {
  await assert.rejects(() => mismatchState.service.prepareRun({ observationCycle: cycle, cohort: repeatScaleProposalOperations(amazon).map(({ atlasProductId, source }) => ({ atlasProductId, source })), selectionProvenance: { ...badProvenance, operation: "SELLERS" } }), /OPERATION_MISMATCH|PROVENANCE/); cases += 1;
  await assert.rejects(() => mismatchState.service.prepareRun({ observationCycle: "2026-09-21T00:00:00.000Z", cohort: repeatScaleProposalOperations(amazon).map(({ atlasProductId, source }) => ({ atlasProductId, source })), selectionProvenance: badProvenance }), /OPERATION_MISMATCH/); cases += 1;
  const created = await prepare(mismatchState.service, amazon), stored = mismatchState.repository.getRunPlan(created.value.runPlanId);
  mismatchState.repository.db.prepare("UPDATE repeat_run_plans SET payload_json=? WHERE run_plan_id=?").run(JSON.stringify({ ...stored, selectionProvenance: { ...stored.selectionProvenance, proposalDigest: "f".repeat(64) } }), created.value.runPlanId);
  await assert.rejects(() => mismatchState.service.inspectRun({ runPlanId: created.value.runPlanId }), /PLAN_INTEGRITY_INVALID/); cases += 1;
} finally { mismatchState.repository.close(); await rm(mismatchState.root, { recursive: true, force: true }); }

const cliCalls = [], cliRuntime = { service: { prepareRun: async input => (cliCalls.push(input), { status: "PREPARED", value: { runPlanId: "plan", observationCycle: input.observationCycle, requested: input.cohort, ready: [], blocked: [], maximumPaidTasks: 0, maximumSpendUsd: 0, automaticPaidRetries: 0, selectionInputType: input.selectionProvenance ? "SELECTOR_PROPOSAL" : "LEGACY_COHORT_INPUT", selectionProvenance: input.selectionProvenance } }) }, close() {} };
await runBoundedRepeatRunCli("prepare", { values: ["--selector-proposal-file=proposal.json"], runtimeFactory: () => cliRuntime, readText: async () => JSON.stringify(amazon), write() {} });
eq(cliCalls[0].observationCycle, cycle);
eq(cliCalls[0].cohort.length, 6);
await assert.rejects(() => runBoundedRepeatRunCli("prepare", { values: ["--selector-proposal-file=a", "--cohort-file=b"], runtimeFactory: () => cliRuntime, readText: async () => "[]", write() {} }), /PREPARE_SOURCE_REQUIRED/); cases += 1;
await assert.rejects(() => runBoundedRepeatRunCli("prepare", { values: ["--selector-proposal-file=a", "--observation-cycle=2026-09-21T00:00:00.000Z"], runtimeFactory: () => cliRuntime, readText: async () => JSON.stringify(amazon), write() {} }), /CYCLE_MISMATCH/); cases += 1;

const timings = [];
for (const size of [6, 24, 43, 100, 1000]) {
  const value = proposal(size), scaleState = await open(`scale-${size}`), started = performance.now();
  try {
    const created = await prepare(scaleState.service, value), inspected = await scaleState.service.inspectRun({ runPlanId: created.value.runPlanId });
    eq(inspected.selectorMembershipEquivalent, true);
    timings.push({ size, elapsedMs: Number((performance.now() - started).toFixed(2)) });
  } finally { scaleState.repository.close(); await rm(scaleState.root, { recursive: true, force: true }); }
}

console.log(`Repeat proposal PREPARE direct-binding tests passed: ${cases} cases. Scale: ${JSON.stringify(timings)}`);
