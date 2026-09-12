import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const statePath = () => path.resolve("fixture-bootstrap-state.json");
async function read() { return JSON.parse(await readFile(statePath(), "utf8")); }
async function write(value) { await writeFile(statePath(), `${JSON.stringify(value)}\n`); return value; }
function projection(value) { return { artifactId: value.artifactId, checkpointId: value.checkpointId, eventSequence: value.sequence, cohortState: value.state, productCount: value.productCount, productIndex: value.productIndex, atlasProductId: `fixture_product_${value.productIndex}`, currentStage: value.stage, nextPermittedAction: value.state === "READY_FOR_PAID_TASK" ? "AUTHORIZE_NEXT_PAID_TASK" : value.state === "PREPARED_FOR_AUTHORIZATION" ? "TASK_AUTHORIZATION_REQUIRED" : value.state === "WAITING_FOR_RESULT" ? "RETRIEVE_EXISTING_TASK" : value.state === "RESULT_AVAILABLE" ? "REVIEW_RESULT" : null, sourceRightsProfileDigest: "a".repeat(64), rightsState: "ALLOWED", prepareReference: value.state === "PREPARED_FOR_AUTHORIZATION" ? { prepareArtifactId: "fixture-prepare" } : null, providerTaskId: value.state === "WAITING_FOR_RESULT" ? `fixture-task-${value.tasks}` : null, tasksUsed: value.tasks, taskCap: value.productCount * 3, spendUsedUsd: value.spend, spendCapUsd: value.productCount * 0.003, currentUtcDaySpendUsd: value.spend, lastTerminalOutcome: value.outcome ?? null }; }

export function createProductionHistoricalBootstrapCommandService() {
  return {
    async init({ artifactId }) { const value = await write({ artifactId, checkpointId: "mer_histbootcp_fixture", sequence: 1, state: "READY_FOR_PAID_TASK", productCount: Number(process.env.H041_FIXTURE_PRODUCTS ?? 1), productIndex: 0, stage: "PRODUCTS", route: process.env.H041_FIXTURE_ROUTE ?? "DIRECT", tasks: 0, spend: 0 }); return { checkpointId: value.checkpointId, binding: { artifactId, products: Array.from({ length: value.productCount }, (_, index) => `fixture_product_${index}`) } }; },
    async inspect() { return projection(await read()); },
    async authorizeNext() { const value = await read(); return { continuationAuthorizationId: `fixture-auth-${value.sequence}`, nextOperation: value.stage, actualSpendUsd: 0 }; },
    async prepareNext() { const value = await read(); value.state = "PREPARED_FOR_AUTHORIZATION"; value.sequence++; return write(value); },
    async executeNext() { const value = await read(); value.state = "WAITING_FOR_RESULT"; value.sequence++; value.tasks++; value.spend = Number((value.spend + 0.001).toFixed(3)); await write(value); return { status: "PAID_TASK_CREATED", providerTaskId: `fixture-task-${value.tasks}`, actualSpendUsd: 0.001 }; },
    async retrieve() { const value = await read(); value.state = "RESULT_AVAILABLE"; value.sequence++; await write(value); return { status: "RESULT_AVAILABLE", actualSpendUsd: 0 }; },
    async process() { const value = await read(); value.sequence++; if (value.stage === "PRODUCTS") value.stage = value.route === "ESCALATION" ? "PRODUCT_INFO" : "SELLERS"; else if (value.stage === "PRODUCT_INFO") value.stage = "SELLERS"; else { value.outcome = "ADMITTED"; if (++value.productIndex >= value.productCount) { value.state = "COHORT_COMPLETE"; value.stage = "COMPLETE"; return write(value); } value.stage = "PRODUCTS"; } value.state = "READY_FOR_PAID_TASK"; return write(value); },
    async cancel() { const value = await read(); value.state = "CANCELLED"; value.outcome = "CANCELLED"; value.sequence++; return write(value); }
  };
}
