import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { ObservationReviewService, REVIEW_ITEM_STATUSES } from "../review/ObservationReviewService.js";

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-review-retention-"));
try {
  const repo = new FileObservationAcceptanceRepository({ statePath: path.join(dir, "state.json"), environment: "production", now: () => "2026-08-10T05:00:00Z" });
  const id = await repo.allocateObservationId();
  const observation = {
    observationId: id, schemaVersion: "1.1", atlasProductId: "ram_corsair_cmk32gx5m2b6000z30", retailerId: "RETAILER-0001", marketplace: "amazon.com",
    observationTime: "2026-08-10T04:00:00Z", sourceMethod: "API", lifecycleStatus: "RETRIEVED", validationStatus: "PASS", supersedesObservationId: null, expiresAt: null,
    offer: { price: 100, currency: "USD", availability: "IN_STOCK", condition: "NEW", sellerType: "RETAILER", sourceUrl: "https://amazon.com/example", shipping: {}, discount: {}, affiliate: {} },
    provenance: { schemaVersion: "1.0", source: { name: "Amazon Creators API", uri: "https://amazon.com/example", marketplace: "amazon.com" }, acquisition: { method: "API", retrievedAt: "2026-08-10T04:00:00Z", retrievedBy: "service", requestId: "r2", rawPayloadReference: null }, transformation: { adapterId: "amazon", adapterVersion: "1", normalizedAt: "2026-08-10T04:00:00Z" }, validation: { validatorVersion: "1", complianceRuleSetVersion: "1" } },
    compliance: { licenseContext: "AMAZON_CREATORS_API" }, metadata: {}
  };
  await repo.accept(observation, "key-2");
  const service = new ObservationReviewService({ acceptanceRepository: repo });
  const item = await service.getReviewItem(id, { asOf: "2026-08-10T05:00:01Z" });
  assert.equal(item.status, REVIEW_ITEM_STATUSES.PAYLOAD_PURGED);
  assert.equal(item.reviewable, false);
  assert.equal(item.observation, null);
  assert.equal(item.audit.storage.payloadStatus, "PURGED");
  assert.equal(item.audit.provenance.source.uri, undefined);
  console.log("Observation review retention tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
