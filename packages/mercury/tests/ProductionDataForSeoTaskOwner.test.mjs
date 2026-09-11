import assert from "node:assert/strict";
import path from "node:path";
import { createProductionDataForSeoTaskOwner } from "../index.js";

const at = "2026-09-11T12:00:00.000Z";
const operations = ["PRODUCTS", "PRODUCT_INFO", "SELLERS"];

for (const operation of operations) {
  const calls = [];
  const runs = [];
  const consumed = new Set();
  const method = { PRODUCTS: "createProductsTask", PRODUCT_INFO: "createProductInfoTask", SELLERS: "createSellersTask" }[operation];
  const service = {
    async [method](execution) {
      calls.push(structuredClone(execution));
      return { taskId: `task-${operation}`, costUsd: 0.001, createdStatus: 20100 };
    }
  };
  const executionRepository = {
    getAll: async () => structuredClone(runs),
    findByPlanId: async (id) => runs.find((run) => run.planId === id) ?? null,
    append: async (run) => (runs.push(structuredClone(run)), { status: "RECORDED", run })
  };
  const consumptionRepository = {
    isConsumed: async (id) => consumed.has(id),
    consume: async ({ authorizationId }) => consumed.has(authorizationId)
      ? { status: "ALREADY_CONSUMED" }
      : (consumed.add(authorizationId), { status: "CONSUMED" })
  };
  const runLock = { runExclusive: async (fn) => ({ status: "ACQUIRED", result: await fn() }) };
  const intent = `mer_histbootintent_${operation.toLowerCase().padEnd(24, "x").slice(0, 24)}`;
  const execution = { kind: operation, provider: "DATAFORSEO", source: "DATAFORSEO_GOOGLE_SHOPPING", paidActionIntentId: intent };
  if (operation === "PRODUCTS") execution.keyword = "MPN";
  else execution.dataDocId = "doc-1";
  const plan = { schemaVersion: "1.0", planId: `plan-${operation}`, plannedAt: at, policy: { enabled: true, maxPaidTasksPerRun: 1, maxSpendPerRunUsd: 0.001, maxSpendPerDayUsd: 0.01, automaticPaidRetries: 0 }, spentTodayUsd: 0, approvedTaskCount: 1, estimatedApprovedSpendUsd: 0.001, decisions: [{ candidateId: "p1", estimatedCostUsd: 0.001, decision: "APPROVED", execution }] };
  const request = { requestId: `auth-${operation}`, planId: plan.planId, plan, expiresAt: "2026-09-11T12:15:00.000Z", maxSpendUsd: 0.001, maxPaidTasks: 1 };
  const owner = createProductionDataForSeoTaskOwner({ operation, stateRoot: path.resolve("fixture-state"), acquisitionService: service, executionRepository, consumptionRepository, runLock, now: () => at });
  const result = await owner.execute({ request });
  assert.equal(result.status, "COMPLETED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].paidActionIntentId, intent);
  assert.equal(result.execution.run.paidActionIntentId, intent);
  assert.equal(result.execution.run.tasks[0].providerTaskId, `task-${operation}`);
  assert.equal((await owner.execute({ request })).status, "LIVE_AUTHORIZATION_ALREADY_CONSUMED");
  assert.equal(calls.length, 1);
  assert.equal(owner.taskLedgerPath, path.resolve("fixture-state", "dataforseo-task-ledger.json"));
}

const ordinaryCalls = [];
const ordinaryOwner = createProductionDataForSeoTaskOwner({
  operation: "PRODUCTS",
  acquisitionService: { createProductsTask: async (execution) => (ordinaryCalls.push(execution), { taskId: "ordinary", costUsd: 0.001, createdStatus: 20100 }) },
  executionRepository: { getAll: async () => [], findByPlanId: async () => null, append: async (run) => ({ status: "RECORDED", run }) },
  consumptionRepository: { isConsumed: async () => false, consume: async () => ({ status: "CONSUMED" }) },
  runLock: { runExclusive: async (fn) => ({ status: "ACQUIRED", result: await fn() }) },
  now: () => at
});
const ordinaryPlan = { schemaVersion: "1.0", planId: "ordinary-plan", plannedAt: at, policy: { enabled: true, maxPaidTasksPerRun: 1, maxSpendPerRunUsd: 0.001, maxSpendPerDayUsd: 0.01, automaticPaidRetries: 0 }, spentTodayUsd: 0, approvedTaskCount: 1, estimatedApprovedSpendUsd: 0.001, decisions: [{ candidateId: "p1", estimatedCostUsd: 0.001, decision: "APPROVED", execution: { kind: "PRODUCTS", keyword: "MPN" } }] };
await ordinaryOwner.execute({ request: { requestId: "ordinary-auth", planId: ordinaryPlan.planId, plan: ordinaryPlan, expiresAt: "2026-09-11T12:15:00.000Z", maxSpendUsd: 0.001, maxPaidTasks: 1 } });
assert.equal("paidActionIntentId" in ordinaryCalls[0], false);
assert.throws(() => createProductionDataForSeoTaskOwner({ operation: "UNKNOWN" }), /OPERATION_INVALID/);

console.log("Production DataForSEO task owner tests passed (20 cases).");
