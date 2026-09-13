import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProductionDataForSeoRetrievalOwner, defaultSourceRightsRegistry, prepareAmazonHistoricalAcceptance, selectAmazonHistoricalAcceptanceProduct } from "../index.js";
import { createAmazonAcceptanceExecutionRuntime } from "../../../scripts/mercury-amazon-acceptance-execution-runtime.mjs";

let cases = 0;
const taskId = "fixture-amazon-task", at = "2026-09-13T03:00:00.000Z";
const endpoints = { AMAZON_PRODUCTS: "/v3/merchant/amazon/products/task_get/advanced/fixture-amazon-task", AMAZON_ASIN: "/v3/merchant/amazon/asin/task_get/advanced/fixture-amazon-task", AMAZON_SELLERS: "/v3/merchant/amazon/sellers/task_get/advanced/fixture-amazon-task" };
for (const [operation, endpoint] of Object.entries(endpoints)) {
  const calls = [], owner = createProductionDataForSeoRetrievalOwner({ operation, credentialLoader: () => ({ login: "fixture", password: "fixture" }), httpTransport: async request => (calls.push(structuredClone(request)), { status_code: 20000, tasks: [{ id: taskId, status_code: 20000, result: [{ items: [] }] }] }) });
  const result = await owner.retrieve({ providerTaskId: taskId });
  assert.equal(result.id, taskId); assert.equal(calls.length, 1); assert.equal(calls[0].method, "GET"); assert.equal(new URL(calls[0].url).pathname, endpoint); assert.equal("body" in calls[0], false); cases += 5;
}

const googleCalls = [], google = createProductionDataForSeoRetrievalOwner({ operation: "PRODUCTS", credentialLoader: () => ({ login: "fixture", password: "fixture" }), httpTransport: async request => (googleCalls.push(structuredClone(request)), { status_code: 20000, tasks: [{ id: taskId, status_code: 20000, result: [] }] }) });
await google.retrieve({ providerTaskId: taskId }); assert.equal(new URL(googleCalls[0].url).pathname, `/v3/merchant/google/products/task_get/advanced/${taskId}`); cases++;

const root = await mkdtemp(path.join(os.tmpdir(), "hr-h050f-"));
try {
  const product = { identity: { atlasProductId: "ram_amazon_retrieval_runtime_fixture", brand: "Corsair", manufacturerPartNumber: "CMH32GX5M2B6000C38" }, governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" }, extension: { data: { capacity: { capacityGb: 32, moduleCount: 2 }, classification: { memoryType: "DDR5", formFactor: "DIMM" }, performance: { dataRateMtps: 6000 }, physical: {} } } };
  const selection = selectAmazonHistoricalAcceptanceProduct({ atlasProducts: [product], destinations: [{ destinationId: "fixture", atlasProductId: product.identity.atlasProductId, retailerId: "RETAILER-0001", marketplace: "amazon.com", retailerListingId: "B0CQQVNCB6", status: "ACTIVE" }], historicalObservations: [] });
  const artifact = prepareAmazonHistoricalAcceptance({ asOf: at, selection, rightsProfile: defaultSourceRightsRegistry.require("DATAFORSEO_AMAZON"), currentUtcDaySpendUsd: 0 });
  const paths = { acceptance: path.join(root, "acceptance.json"), actions: path.join(root, "actions.json"), tasks: path.join(root, "tasks.json"), results: path.join(root, "results.json"), acquisition: path.join(root, "acquisition") };
  await writeFile(paths.acceptance, JSON.stringify({ schemaVersion: "1.0", artifacts: [artifact] }));
  await writeFile(paths.actions, JSON.stringify({ schemaVersion: "1.0", authorizations: [], outcomes: [] }));
  await writeFile(paths.tasks, JSON.stringify([{ requestKey: "fixture-key", kind: "AMAZON_PRODUCTS", taskId, costUsd: .0015, createdStatus: 20100, sourceId: "DATAFORSEO_AMAZON", atlasProductId: artifact.atlasProductId, asin: null, requestDigest: "a".repeat(64), checkpointId: artifact.acceptanceArtifactId, productIndex: 0, sourceRightsProfileDigest: artifact.sourceRightsProfileDigest, paidActionIntentId: "mer_histbootintent_fixture" }]));
  const args = new Map([["--acceptance-state", paths.acceptance], ["--action-state", paths.actions], ["--task-ledger", paths.tasks], ["--result-state", paths.results], ["--acquisition-root", paths.acquisition]]), calls = [];
  const runtime = createAmazonAcceptanceExecutionRuntime(args, { now: () => at, credentialLoader: () => ({ login: "fixture", password: "fixture" }), httpTransport: async request => (calls.push(structuredClone(request)), { status_code: 20000, tasks: [{ id: taskId, status_code: 20000, result: [{ items: [{ data_asin: "B0CQQVNCB6", title: "Corsair memory" }] }] }] }) });
  const available = await runtime.retrieve({ artifactId: artifact.acceptanceArtifactId, operation: "AMAZON_PRODUCTS" });
  assert.equal(available.status, "AVAILABLE"); assert.equal(available.canonicalResult.providerTaskId, taskId); assert.equal(available.canonicalResult.sourceId, "DATAFORSEO_AMAZON"); assert.equal(calls.length, 1); assert.equal(new URL(calls[0].url).pathname, endpoints.AMAZON_PRODUCTS); cases += 5;
  const persisted = JSON.parse(await readFile(paths.results, "utf8")); assert.equal(Object.keys(persisted.results).length, 1); cases++;
  const replay = await runtime.retrieve({ artifactId: artifact.acceptanceArtifactId, operation: "AMAZON_PRODUCTS" }); assert.equal(replay.status, "AVAILABLE"); assert.equal(replay.canonicalResult.canonicalResultId, available.canonicalResult.canonicalResultId); cases += 2;
} finally { await rm(root, { recursive: true, force: true }); }

console.log(`DataForSEO Amazon production retrieval composition tests passed: ${cases} cases.`);
