import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  NeutralBoundedPaidActionCoordinator, ProductsIdentityDiscoveryDomainAdapter,
  ProductsIdentityDiscoveryService, PRODUCTS_DISCOVERY_CONFIRMATIONS,
  SqliteNeutralBoundedRepository
} from "../index.js";

let cases = 0;
const eq = (actual, expected) => { assert.deepEqual(actual, expected); cases++; };
const root = await mkdtemp(join(tmpdir(), "products-existing-result-recovery-"));
const repository = new SqliteNeutralBoundedRepository({ databasePath: join(root, "bounded.sqlite") });
try {
  const cmk = { memberKey: "amazon:cmk32", domainMemberId: "cmk32", source: "DATAFORSEO_AMAZON", operation: "AMAZON_PRODUCTS", taskCeilingUsd: .0015, atlasProductId: "ram_corsair_cmk32gx5m2b6000z30", rightsDigest: "a".repeat(64), sourcePayload: { acceptanceArtifactId: "mer_amzaccept_489539f908ff47375e7b0dc9" }, state: "EXECUTED", providerTaskId: "09151414-2304-0209-0000-87b0af6a0f45", authorizationId: "expired-child", paidTaskCreated: true, actualSpendUsd: .0015, exception: null, outcome: null };
  const crucial = { memberKey: "amazon:crucial", domainMemberId: "crucial", source: "DATAFORSEO_AMAZON", operation: "AMAZON_PRODUCTS", taskCeilingUsd: .0015, atlasProductId: "ram_crucial_cp2k16g56c46u5", rightsDigest: "a".repeat(64), state: "COMPLETED", providerTaskId: "crucial-task", paidTaskCreated: true, actualSpendUsd: .0015, exception: null, outcome: "STRONG_UNIQUE_ASIN", assessmentId: "mer_amzasin_bb4e22e865b2056991a8f05f" };
  const plan = { planId: "incident-plan", bindingDigest: "p".repeat(64), cycle: "2026-09-15T14:10:27.548Z", ready: [cmk, crucial], blocked: [], requested: [], maximumPaidTasks: 2, maximumSpendUsd: .003 };
  const authorization = { authorizationId: "expired-parent", planId: plan.planId, bindingDigest: "q".repeat(64), authorizedAt: "2026-09-15T14:10:00.000Z", expiresAt: "2026-09-15T14:33:19.807Z" };
  repository.recordPlan(plan); repository.recordAuthorization(authorization); repository.startRun({ runId: "incident-run", planId: plan.planId, authorizationId: authorization.authorizationId, state: "FAILED", startedAt: "2026-09-15T14:14:51.785Z", systemicFailure: "BOOTSTRAP_PROVIDER_RESULT_CONFLICT", members: [cmk, crucial] });
  let executions = 0, providerCalls = 0, finalizations = 0;
  const amazon = { prepare: async () => ({}), authorize: async () => ({}), execute: async () => { executions++; }, resolveTask: async ({ member }) => member.atlasProductId === cmk.atlasProductId ? { providerTaskId: cmk.providerTaskId, actualSpendUsd: .0015 } : null, retrieve: async () => ({ status: "AVAILABLE", canonicalResult: { canonicalResultId: "mer_providerresult_02d5c2b04c915e8ba4cffdd0" }, providerCalls: 0 }), finalize: async () => { finalizations++; return { state: "INSUFFICIENT_ASIN_EVIDENCE", assessmentId: "mer_amzasin_ee897f25c0c1d4ebef52138a", providerResultId: "mer_providerresult_02d5c2b04c915e8ba4cffdd0", h052ReviewAvailable: true }; } };
  const google = { ...amazon, retrieve: async () => { providerCalls++; return { status: "PENDING" }; } };
  const adapter = new ProductsIdentityDiscoveryDomainAdapter({ productRepository: { getById: async id => ({ identity: { atlasProductId: id } }) }, readinessOwner: { assess: async () => ({ state: "READY_FOR_DISCOVERY" }) }, rightsRegistry: { require: () => ({ bindingDigest: "a".repeat(64) }) }, sourceOwners: { DATAFORSEO_AMAZON: amazon, DATAFORSEO_GOOGLE_SHOPPING: google }, boundedRepository: repository, now: () => "2026-09-15T16:00:00.000Z" });
  const recovered = await adapter.recoverMember({ member: { ...cmk, state: "EXCEPTION", exception: "DATAFORSEO_AMAZON_ASIN_INVALID" } }); eq(recovered.state, "EXECUTED"); eq(recovered.providerTaskId, cmk.providerTaskId);
  const coordinator = new NeutralBoundedPaidActionCoordinator({ repository, domainAdapter: adapter, spendResolver: async () => .004, now: () => "2026-09-15T16:00:00.000Z", dailySpendCeilingUsd: .025, policyVersion: "MERCURY-PRODUCTS-IDENTITY-DISCOVERY-1.0" });
  const service = new ProductsIdentityDiscoveryService({ coordinator }), finished = await service.resume({ runId: "incident-run", resumedBy: "fixture", confirmation: PRODUCTS_DISCOVERY_CONFIRMATIONS.RESUME }), member = finished.members.find(value => value.atlasProductId === cmk.atlasProductId);
  eq(finished.state, "COMPLETED"); eq(member.state, "COMPLETED"); eq(member.outcome, "INSUFFICIENT_ASIN_EVIDENCE"); eq(member.assessmentId, "mer_amzasin_ee897f25c0c1d4ebef52138a"); eq(member.h052ReviewAvailable, true); eq(finished.members.find(value => value.atlasProductId === crucial.atlasProductId).assessmentId, crucial.assessmentId); eq(executions, 0); eq(providerCalls, 0); eq(finalizations, 1);
  eq((await service.resume({ runId: "incident-run", resumedBy: "fixture", confirmation: PRODUCTS_DISCOVERY_CONFIRMATIONS.RESUME })).state, "COMPLETED"); eq(finalizations, 1);
} finally { repository.close(); await rm(root, { recursive: true, force: true }); }
console.log(`Products identity discovery existing-result recovery tests passed: ${cases} cases.`);
