import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AmazonAcceptanceExecutionService, FileAcquisitionExecutionLedgerRepository,
  FileAmazonAcceptanceActionRepository, FileAmazonHistoricalAcceptanceRepository,
  FileDataForSeoTaskLedger, FileLiveAuthorizationConsumptionRepository,
  ProductsIdentityDiscoveryDomainAdapter, SqliteNeutralBoundedRepository,
  amazonAcceptanceDigest, createAmazonAcceptanceActionAuthorization,
  createBoundedChildAuthorityBinding, createNeutralParentAuthorityInput,
  createProductionAmazonProductsDiscoverySourceOwner, createProductionDataForSeoTaskOwner,
  defaultSourceRightsRegistry, neutralBoundedDigest, prepareAmazonHistoricalAcceptance,
  selectAmazonHistoricalAcceptanceProduct
} from "../index.js";

let cases = 0;
const eq = (actual, expected) => { assert.deepEqual(actual, expected); cases++; };
const at = "2026-09-14T12:00:00.000Z", expiresAt = "2026-09-14T13:00:00.000Z";
const product = { identity: { atlasProductId: "ram_amazon_recovery_owner_fixture", brand: "Corsair", manufacturerPartNumber: "CMH32GX5M2B6000C38" }, governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" }, extension: { data: { capacity: { capacityGb: 32, moduleCount: 2 }, classification: { memoryType: "DDR5", formFactor: "DIMM" }, performance: { dataRateMtps: 6000 }, physical: {} } } };

async function fixture(name) {
  const root = await mkdtemp(join(tmpdir(), `amazon-products-recovery-${name}-`));
  const boundedRepository = new SqliteNeutralBoundedRepository({ databasePath: join(root, "bounded.sqlite") });
  const artifactRepository = new FileAmazonHistoricalAcceptanceRepository({ statePath: join(root, "artifacts.json") });
  const actionRepository = new FileAmazonAcceptanceActionRepository({ statePath: join(root, "actions.json") });
  const executionRepository = new FileAcquisitionExecutionLedgerRepository({ filePath: join(root, "execution.json") });
  const consumptionRepository = new FileLiveAuthorizationConsumptionRepository({ filePath: join(root, "consumption.json") });
  const taskLedger = new FileDataForSeoTaskLedger(join(root, "dataforseo-task-ledger.json"));
  const selection = selectAmazonHistoricalAcceptanceProduct({ atlasProducts: [product], destinations: [{ destinationId: "destination", atlasProductId: product.identity.atlasProductId, retailerId: "RETAILER-0001", marketplace: "amazon.com", retailerListingId: "B0CQQVNCB6", status: "ACTIVE" }], historicalObservations: [] });
  const artifact = prepareAmazonHistoricalAcceptance({ asOf: at, selection, rightsProfile: defaultSourceRightsRegistry.require("DATAFORSEO_AMAZON"), currentUtcDaySpendUsd: 0 });
  await artifactRepository.record(artifact);
  const member = { memberKey: `DATAFORSEO_AMAZON:${product.identity.atlasProductId}:fixture`, domainMemberId: "mer_productsdiscovery_fixture", source: "DATAFORSEO_AMAZON", operation: "AMAZON_PRODUCTS", taskCeilingUsd: .0015, atlasProductId: product.identity.atlasProductId, rightsDigest: artifact.sourceRightsProfileDigest, sourcePayload: { acceptanceArtifactId: artifact.acceptanceArtifactId } };
  const planMaterial = { policyVersion: "MERCURY-PRODUCTS-IDENTITY-DISCOVERY-1.0", cycle: at, requested: [], ready: [member], blocked: [], automaticPaidRetries: 0, dailySpendCeilingUsd: .025 };
  const plan = { schemaVersion: "1.0", planId: "mer_productsplan_fixture", bindingDigest: neutralBoundedDigest(planMaterial), ...planMaterial, cohortDigest: neutralBoundedDigest([]), maximumPaidTasks: 1, maximumSpendUsd: .0015, preparedAt: at, authorizationState: "NOT_AUTHORIZED", providerSpendAuthorized: false };
  boundedRepository.recordPlan(plan);
  const parentMaterial = { policyVersion: plan.policyVersion, planId: plan.planId, planBindingDigest: plan.bindingDigest, memberSetDigest: plan.cohortDigest, operator: "fixture", reason: "fixture", authorizedAt: at, expiresAt, maximumPaidTasks: 1, maximumSpendUsd: .0015, memberCeilings: [{ memberKey: member.memberKey, maximumTaskCostUsd: .0015 }], currentUtcDaySpendUsd: 0, dailySpendCeilingUsd: .025, automaticPaidRetries: 0 };
  const parentAuthorization = { schemaVersion: "1.0", authorizationId: "mer_productsauth_fixture", bindingDigest: neutralBoundedDigest(parentMaterial), ...parentMaterial, singleUseStart: true, state: "AUTHORIZED" };
  boundedRepository.recordAuthorization(parentAuthorization);
  const neutralParentAuthority = createNeutralParentAuthorityInput({ parentAuthorization, plan, member });
  const child = createAmazonAcceptanceActionAuthorization({ artifact, operation: "AMAZON_PRODUCTS", atlasProduct: product, operator: "machine:bounded-auth", reason: "bounded fixture", authorizedAt: at, expiresAt, currentUtcDaySpendUsd: 0, neutralParentAuthority, boundedRepository });
  await actionRepository.recordAuthorization(child);
  const childAuthority = createBoundedChildAuthorityBinding({ parentAuthorization, member, childAuthorizationId: child.authorizationId, childAuthorizationDigest: amazonAcceptanceDigest(child), expiresAt });
  boundedRepository.recordChildAuthority(childAuthority);
  let providerCalls = 0;
  const taskOwner = createProductionDataForSeoTaskOwner({ operation: "AMAZON_PRODUCTS", stateRoot: root, executionRepository, consumptionRepository, credentialLoader: () => ({ login: "fixture", password: "fixture" }), httpTransport: async () => { providerCalls++; return { status_code: 20000, tasks: [{ id: "amazon-products-task-fixture", status_code: 20100, cost: .0015 }] }; }, now: () => at });
  const executionService = new AmazonAcceptanceExecutionService({ artifactRepository, actionRepository, productRepository: { getById: async id => id === product.identity.atlasProductId ? product : null }, rightsRegistry: defaultSourceRightsRegistry, spendResolver: async () => 0, taskOwners: { AMAZON_PRODUCTS: taskOwner }, retrievalServices: {}, resultRepository: { findByTask: async () => null }, taskLedger, consumptionRepository, executionRepository, now: () => at });
  const delegates = { prepare: async () => ({}), authorize: async () => ({}), execute: async input => executionService.execute(input), resolveTask: async () => null, retrieve: async () => ({ status: "PENDING" }), finalize: async () => ({}) };
  const owner = createProductionAmazonProductsDiscoverySourceOwner({ sourceOwner: delegates, executionService, actionRepository, taskLedger, executionRepository, consumptionRepository, now: () => at });
  const adapter = new ProductsIdentityDiscoveryDomainAdapter({ productRepository: { getById: async () => product }, readinessOwner: { assess: async () => ({ state: "READY_FOR_DISCOVERY", readinessBindingDigest: "a".repeat(64) }) }, rightsRegistry: defaultSourceRightsRegistry, sourceOwners: { DATAFORSEO_GOOGLE_SHOPPING: delegates, DATAFORSEO_AMAZON: owner }, boundedRepository, now: () => at });
  return { root, boundedRepository, actionRepository, taskLedger, executionRepository, consumptionRepository, executionService, owner, adapter, member, parentAuthorization, childAuthority, child, providerCalls: () => providerCalls };
}

const value = await fixture("main");
try {
  eq(typeof value.owner.recoverPreExecution, "function");
  const authorized = { ...value.member, state: "AUTHORIZED", authorizationId: value.child.authorizationId, childAuthorityBinding: value.childAuthority };
  const ready = { ...value.member, state: "READY", authorizationId: null, childAuthorityBinding: null };
  const [first, concurrent] = await Promise.all([
    value.adapter.recoverPreExecutionMember({ member: ready, authorization: value.parentAuthorization }),
    value.adapter.recoverPreExecutionMember({ member: authorized, authorization: value.parentAuthorization })
  ]);
  eq(first.providerTaskId, "amazon-products-task-fixture"); eq(concurrent.providerTaskId, first.providerTaskId); eq(value.providerCalls(), 1);
  eq((await value.taskLedger.getAll()).length, 1); eq((await value.executionRepository.getAll()).length, 1); eq((await value.consumptionRepository.getAll()).length, 1);
  eq((await value.owner.recoverPreExecution({ member: authorized, parentAuthorization: value.parentAuthorization, childAuthority: value.childAuthority })).providerTaskId, first.providerTaskId); eq(value.providerCalls(), 1);
  await assert.rejects(() => value.owner.recoverPreExecution({ member: { ...authorized, atlasProductId: "ram_substituted" }, parentAuthorization: value.parentAuthorization, childAuthority: value.childAuthority }), /LINEAGE_INVALID/); cases++;
  eq((await value.actionRepository.getAuthorizationsForAction(value.child.artifactId, "AMAZON_PRODUCTS")).length, 1);
  eq(first.publicationAuthority, undefined); eq(first.currentPriceAuthority, undefined);
} finally { value.boundedRepository.close(); await rm(value.root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }

const expired = await fixture("expired");
try {
  const expiredOwner = createProductionAmazonProductsDiscoverySourceOwner({ sourceOwner: expired.owner, executionService: expired.executionService, actionRepository: expired.actionRepository, taskLedger: expired.taskLedger, executionRepository: expired.executionRepository, consumptionRepository: expired.consumptionRepository, now: () => "2026-09-14T14:00:00.000Z" });
  await assert.rejects(() => expiredOwner.recoverPreExecution({ member: { ...expired.member, authorizationId: expired.child.authorizationId }, parentAuthorization: expired.parentAuthorization, childAuthority: expired.childAuthority }), /EXPIRED/); cases++;
} finally { expired.boundedRepository.close(); await rm(expired.root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }

const executionOnly = await fixture("execution-only");
try {
  const intent = executionOnly.child.plan.decisions[0].execution.paidActionIntentId;
  await executionOnly.executionRepository.append({ schemaVersion: "1.0", runId: "run-execution-only", planId: executionOnly.child.plan.planId, paidActionIntentId: intent, startedAt: at, finishedAt: at, status: "COMPLETED", actualSpendUsd: .0015, tasks: [{ outcome: "COMPLETED", providerTaskId: "recovered-execution-task", actualCostUsd: .0015, paidActionIntentId: intent }] });
  await executionOnly.consumptionRepository.consume({ authorizationId: executionOnly.child.authorizationId, planId: executionOnly.child.plan.planId, consumedAt: at });
  const recovered = await executionOnly.owner.recoverPreExecution({ member: { ...executionOnly.member, authorizationId: executionOnly.child.authorizationId }, parentAuthorization: executionOnly.parentAuthorization, childAuthority: executionOnly.childAuthority });
  eq(recovered.providerTaskId, "recovered-execution-task"); eq(recovered.actualSpendUsd, .0015); eq(executionOnly.providerCalls(), 0);
} finally { executionOnly.boundedRepository.close(); await rm(executionOnly.root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }

const consumed = await fixture("consumed");
try {
  await consumed.consumptionRepository.consume({ authorizationId: consumed.child.authorizationId, planId: consumed.child.plan.planId, consumedAt: at });
  await assert.rejects(() => consumed.owner.recoverPreExecution({ member: { ...consumed.member, authorizationId: consumed.child.authorizationId }, parentAuthorization: consumed.parentAuthorization, childAuthority: consumed.childAuthority }), /AUTHORIZATION_CONSUMED/); cases++;
  eq(consumed.providerCalls(), 0);
} finally { consumed.boundedRepository.close(); await rm(consumed.root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }

console.log(`Production Amazon Products discovery recovery owner tests passed: ${cases} cases.`);
