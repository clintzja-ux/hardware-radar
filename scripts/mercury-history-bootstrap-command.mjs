import { pathToFileURL } from "node:url";
import { createProductionHistoricalBootstrapCommandService } from "../packages/mercury/index.js";

const SPECS = Object.freeze({
  init: { flags: ["artifact", "initialized-by", "confirmation"], call: "init", map: { artifact: "artifactId", "initialized-by": "initializedBy", confirmation: "confirmation" } },
  inspect: { flags: ["checkpoint"], call: "inspect", map: { checkpoint: "checkpointId" } },
  "authorize-next": { flags: ["checkpoint", "authorized-by", "reason", "confirmation", "ttl-minutes"], call: "authorizeNext", map: { checkpoint: "checkpointId", "authorized-by": "authorizedBy", reason: "reason", confirmation: "confirmation", "ttl-minutes": "ttlMinutes" } },
  "prepare-next": { flags: ["checkpoint", "authorization"], call: "prepareNext", map: { checkpoint: "checkpointId", authorization: "authorizationId" } },
  "execute-next": { flags: ["checkpoint", "authorization", "executed-by", "confirmation"], call: "executeNext", map: { checkpoint: "checkpointId", authorization: "authorizationId", "executed-by": "executedBy", confirmation: "confirmation" } },
  retrieve: { flags: ["checkpoint"], call: "retrieve", map: { checkpoint: "checkpointId" } },
  process: { flags: ["checkpoint"], call: "process", map: { checkpoint: "checkpointId" } },
  cancel: { flags: ["checkpoint", "cancelled-by", "reason", "confirmation"], call: "cancel", map: { checkpoint: "checkpointId", "cancelled-by": "cancelledBy", reason: "reason", confirmation: "confirmation" } }
});

function parse(args, spec) {
  const values = {};
  for (const token of args) {
    if (!token.startsWith("--") || !token.includes("=")) throw new Error("HISTORY_041_ARGUMENT_FORMAT_INVALID");
    const [key, ...rest] = token.slice(2).split("=");
    if (!spec.flags.includes(key) || key in values) throw new Error(`HISTORY_041_ARGUMENT_NOT_ALLOWED:${key}`);
    const value = rest.join("=").trim();
    if (!value) throw new Error(`HISTORY_041_ARGUMENT_REQUIRED:${key}`);
    values[key] = key === "ttl-minutes" ? Number(value) : value;
    if (key === "ttl-minutes" && (!Number.isInteger(values[key]) || values[key] < 1)) throw new Error("HISTORY_041_TTL_INVALID");
  }
  for (const key of spec.flags.filter(value => value !== "ttl-minutes")) if (!(key in values)) throw new Error(`HISTORY_041_ARGUMENT_REQUIRED:${key}`);
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [spec.map[key], value]));
}

function safe(value) {
  if (!value || typeof value !== "object") return value;
  const copy = structuredClone(value);
  for (const key of ["operationResult", "rawPayload", "providerResult", "password", "token", "credentials"]) if (key in copy) copy[key] = "[REDACTED]";
  return copy;
}

function summarize(action, result) {
  if (action === "init") return {
    operation: "INIT", artifactId: result.binding?.artifactId ?? null, artifactSchema: "1.1",
    checkpointId: result.checkpointId, cohortSize: result.binding?.products?.length ?? 0,
    firstAtlasProduct: result.binding?.products?.[0] ?? null, currentState: "READY_FOR_PAID_TASK",
    nextPermittedAction: "AUTHORIZE_NEXT_PAID_TASK", providerTasksCreated: 0, actualSpendUsd: 0
  };
  if (action === "inspect") return {
    operation: "INSPECT", artifactId: result.artifactId, artifactSchema: "1.1", checkpointId: result.checkpointId,
    sequence: result.eventSequence, lifecycleState: result.cohortState, cohortSize: result.productCount,
    productIndex: result.productIndex, atlasProductId: result.atlasProductId, currentOperation: result.currentStage,
    nextPermittedAction: result.nextPermittedAction, originatingRightsDigest: result.sourceRightsProfileDigest,
    currentRightsStatus: result.rightsState, continuationState: "RESOLVED_BY_ACTION_BOUNDARY",
    prepareState: result.prepareReference ? "PREPARE_BOUND" : "NOT_BOUND", providerTaskState: result.providerTaskId ? "TASK_BOUND" : "NONE",
    resultState: result.resultState ?? (result.cohortState === "RESULT_AVAILABLE" ? "AVAILABLE" : "NONE"), terminalOutcome: result.lastTerminalOutcome,
    tasksUsed: result.tasksUsed, taskCap: result.taskCap, cohortSpendUsd: result.spendUsedUsd, cohortSpendCapUsd: result.spendCapUsd,
    utcDaySpendUsd: result.currentUtcDaySpendUsd, downstreamAuthority: "NONE", providerTasksCreated: 0, actualSpendUsd: 0
  };
  return { operation: action.toUpperCase().replaceAll("-", "_"), result: safe(result), paidTaskCreated: action === "execute-next" ? result?.status === "PAID_TASK_CREATED" : false, actualSpendUsd: Number(result?.actualSpendUsd ?? 0) };
}

export async function runHistoricalBootstrapCommand(action, { args = process.argv.slice(2), service = null, write = value => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`) } = {}) {
  const spec = SPECS[action];
  if (!spec) throw new Error("HISTORY_041_COMMAND_INVALID");
  const input = parse(args, spec);
  const owner = service ?? createProductionHistoricalBootstrapCommandService();
  const result = await owner[spec.call](input);
  write(summarize(action, result));
  return result;
}

export async function commandMain(action) {
  try { await runHistoricalBootstrapCommand(action); }
  catch (error) { process.stderr.write(`${error?.message ?? "HISTORY_041_COMMAND_FAILED"}\n`); process.exitCode = 1; }
}

const direct = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direct) commandMain(process.argv[2]);
