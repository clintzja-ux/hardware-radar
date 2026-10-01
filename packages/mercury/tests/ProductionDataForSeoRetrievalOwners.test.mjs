import assert from "node:assert/strict";
import path from "node:path";
import { createProductionDataForSeoRetrievalOwner, createProductionSellersDf003ProcessingOwner } from "../index.js";

const methods = { PRODUCTS: "getProductsResult", PRODUCT_INFO: "getProductInfoResult", SELLERS: "getSellersResult" };
for (const [operation, method] of Object.entries(methods)) {
  const calls = [];
  const service = { async [method](taskId) { calls.push(taskId); return { id: taskId, cost: 0, result: [{ items: [] }] }; } };
  const owner = createProductionDataForSeoRetrievalOwner({ operation, acquisitionService: service });
  assert.equal(owner.operation, operation);
  const result = await owner.retrieve({ providerTaskId: ` task-${operation} ` });
  assert.deepEqual(calls, [`task-${operation}`]);
  assert.equal(result.id, `task-${operation}`);
  assert.equal(Object.isFrozen(result), true);
  await assert.rejects(() => owner.retrieve({}), new RegExp(`${operation}_TASK_ID_REQUIRED`));
}

let credentialsLoaded = 0;
const lazy = createProductionDataForSeoRetrievalOwner({ operation: "PRODUCTS", credentialLoader: () => (credentialsLoaded++, { login: "x", password: "y" }), httpTransport: async () => ({ status_code: 20000, tasks: [{ id: "t", status_code: 20000, cost: 0, result: [] }] }) });
assert.equal(credentialsLoaded, 0);
await lazy.retrieve({ providerTaskId: "t" });
assert.equal(credentialsLoaded, 1);
assert.throws(() => createProductionDataForSeoRetrievalOwner({ operation: "UNKNOWN" }), /RETRIEVAL_OPERATION_INVALID/);

const processing = createProductionSellersDf003ProcessingOwner({ stateRoot: path.resolve("fixture-state") });
assert.equal(processing.evidencePath, path.resolve("fixture-state", "dataforseo-market-evidence.json"));
assert.equal(typeof processing.process, "function");

console.log("Production DataForSEO retrieval owner tests passed (20 cases).");
