import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createCurrentDisplaySnapshot, FileCurrentDisplaySnapshotRepository } from "../current-display/index.js";
import { CurrentSchemaMigrationService, FileCurrentSchemaMigrationRepository, prepareCurrentSchemaMigration } from "../current-display/CurrentSchemaMigration.js";

let cases = 0;
const at = "2026-10-01T12:00:00.000Z";
const offer = (retailer = "AMAZON", sellerName = null) => ({ atlasProductId: "ram_fixture_one", retailer, retailerId: retailer === "AMAZON" ? "RETAILER-0001" : "RETAILER-0004", marketplace: "US", priceUsd: 100, currency: "USD", availability: "AVAILABLE", condition: "NEW", shippingUsd: null, feesUsd: null, researchUrl: "https://example.com/product", destinationId: `mer_dest_${(retailer === "AMAZON" ? "a" : "b").repeat(24)}`, matchStatus: "FIXTURE", sourceRow: 1, observedAt: at, sellerName, sourceIdentity: { sourceId: "MANUAL" }, comparisonEligible: true, comparisonReasons: [], itemPriceEligible: true, deliveredCostEligible: false, deliveredCostReasons: ["UNKNOWN_COSTS"] });
const snapshot = createCurrentDisplaySnapshot({ observedAt: at, importedAt: at, source: { workbook: "fixture", sheet: "legacy", digest: "a".repeat(64) }, offers: [offer("AMAZON", "Seller A"), offer("NEWEGG")] });
const plan = prepareCurrentSchemaMigration(snapshot);
assert.equal(plan.audit.offersExamined, 2); cases += 1;
assert.equal(plan.audit.uniqueIdentities, 2); cases += 1;
assert.equal(plan.audit.factMismatches, 0); cases += 1;
assert.equal(plan.audit.freshnessMismatches, 0); cases += 1;
assert.equal(plan.audit.sellerKnown, 1); cases += 1;
assert.equal(plan.audit.sellerUnknown, 1); cases += 1;
assert.equal(prepareCurrentSchemaMigration(plan.targetSnapshot).status, "ALREADY_MIGRATED"); cases += 1;

const root = await mkdtemp(path.join(tmpdir(), "current-migration-"));
try {
    const snapshots = new FileCurrentDisplaySnapshotRepository({ statePath: path.join(root, "current.json") });
    const migrations = new FileCurrentSchemaMigrationRepository({ statePath: path.join(root, "migrations.json") });
    const service = new CurrentSchemaMigrationService({ snapshotRepository: snapshots, migrationRepository: migrations });
    await snapshots.replace(snapshot);
    const prepared = await service.prepare();
    assert.equal((await service.inspect(prepared.migrationId)).status, "READY"); cases += 1;
    assert.equal((await service.execute(prepared.migrationId)).status, "MIGRATED"); cases += 1;
    const restarted = await new FileCurrentDisplaySnapshotRepository({ statePath: path.join(root, "current.json") }).getState();
    assert.equal(restarted.current.schemaVersion, "1.1"); cases += 1;
    assert.equal(restarted.current.offers.length, 2); cases += 1;
    assert.equal(restarted.previous.snapshotId, snapshot.snapshotId); cases += 1;
    assert.equal((await service.execute(prepared.migrationId)).status, "ALREADY_MIGRATED"); cases += 1;
} finally { await rm(root, { recursive: true, force: true }); }

const driftRoot = await mkdtemp(path.join(tmpdir(), "current-migration-drift-"));
try {
    const snapshots = new FileCurrentDisplaySnapshotRepository({ statePath: path.join(driftRoot, "current.json") });
    const migrations = new FileCurrentSchemaMigrationRepository({ statePath: path.join(driftRoot, "migrations.json") });
    const service = new CurrentSchemaMigrationService({ snapshotRepository: snapshots, migrationRepository: migrations });
    await snapshots.replace(snapshot);
    const prepared = await service.prepare();
    const drifted = createCurrentDisplaySnapshot({ observedAt: at, importedAt: at, source: { workbook: "fixture", sheet: "drift", digest: "b".repeat(64) }, offers: [{ ...offer("AMAZON", "Seller A"), priceUsd: 101 }, offer("NEWEGG")] });
    await snapshots.replace(drifted);
    await assert.rejects(() => service.execute(prepared.migrationId), /SOURCE_CHANGED/); cases += 1;
    assert.equal((await snapshots.getState()).current.snapshotId, drifted.snapshotId); cases += 1;
} finally { await rm(driftRoot, { recursive: true, force: true }); }

const collision = structuredClone(snapshot); collision.offers = [offer("AMAZON"), { ...offer("AMAZON"), priceUsd: 90 }];
assert.throws(() => prepareCurrentSchemaMigration(collision), /UNSAFE/); cases += 1;
const ambiguous = structuredClone(snapshot); ambiguous.offers[0].sellerName = ["Seller A"];
assert.throws(() => prepareCurrentSchemaMigration(ambiguous), /UNSAFE/); cases += 1;

console.log(`Current schema migration tests passed: ${cases} cases.`);
