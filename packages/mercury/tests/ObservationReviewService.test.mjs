import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { ObservationReviewService, REVIEW_ITEM_STATUSES } from "../review/ObservationReviewService.js";

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-review-"));
try {
  const repo = new FileObservationAcceptanceRepository({ statePath: path.join(dir, "state.json"), environment: "development", now: () => "2026-08-10T05:00:00Z" });
  const id = await repo.allocateObservationId();
  const observation = {
    observationId: id,
    schemaVersion: "1.1",
    atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
    retailerId: "RETAILER-0001",
    marketplace: "amazon.com",
    observationTime: "2026-08-10T04:55:00Z",
    sourceMethod: "TEST_FIXTURE",
    lifecycleStatus: "RETRIEVED",
    validationStatus: "PASS",
    supersedesObservationId: null,
    expiresAt: null,
    offer: { price: 99.99, currency: "USD", availability: "IN_STOCK", condition: "NEW", sellerType: "RETAILER", sourceUrl: "https://example.test/item", shipping: {}, discount: {}, affiliate: {} },
    provenance: { schemaVersion: "1.0", source: { name: "fixture", uri: "https://example.test/item", marketplace: "amazon.com" }, acquisition: { method: "TEST_FIXTURE", retrievedAt: "2026-08-10T04:55:00Z", retrievedBy: "test", requestId: "r1", rawPayloadReference: null }, transformation: { adapterId: "test", adapterVersion: "1", normalizedAt: "2026-08-10T04:55:00Z" }, validation: { validatorVersion: "1", complianceRuleSetVersion: "1" } },
    compliance: { licenseContext: "TEST_FIXTURE" },
    metadata: {}
  };
  await repo.accept(observation, "key-1");
  const service = new ObservationReviewService({ acceptanceRepository: repo });
  const item = await service.getReviewItem(id, { asOf: "2026-08-10T05:00:00Z" });
  assert.equal(item.status, REVIEW_ITEM_STATUSES.AVAILABLE);
  assert.equal(item.reviewable, true);
  assert.equal(item.observation.observationId, id);
  assert.equal(item.audit.observationId, id);
  assert.equal(item.observation.offer.price, 99.99);
  assert.equal(Object.isFrozen(item), true);
  assert.equal(Object.isFrozen(item.observation), true);
  console.log("Observation review service tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
