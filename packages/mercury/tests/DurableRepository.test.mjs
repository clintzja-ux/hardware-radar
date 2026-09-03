import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import baseObservation from "../observations/mer_obs_000000001.json" with { type: "json" };

const dir = await mkdtemp(join(tmpdir(), "mercury-durable-"));
const statePath = join(dir, "state.json");
try {
  const repo1 = new FileObservationAcceptanceRepository({ statePath, environment: "test", now: () => "2026-08-10T05:00:00Z" });
  const id = await repo1.allocateObservationId();
  assert.equal(id, "mer_obs_000000001");
  const observation = structuredClone(baseObservation);
  observation.observationId = id;
  observation.compliance.licenseContext = "INDEPENDENT_SOURCE";
  const accepted = await repo1.accept(observation, "key-1");
  assert.equal(accepted.status, "ACCEPTED");

  const repo2 = new FileObservationAcceptanceRepository({ statePath, environment: "test", now: () => "2026-08-10T05:01:00Z" });
  assert.equal((await repo2.getById(id)).observationId, id);
  assert.equal((await repo2.findByIdempotencyKey("key-1")).observationId, id);
  assert.equal(await repo2.allocateObservationId(), "mer_obs_000000002");
  assert.equal((await repo2.getByAtlasProductId(observation.atlasProductId)).length, 1);
  assert.equal((await repo2.getByRetailerId(observation.retailerId)).length, 1);
} finally { await rm(dir, { recursive: true, force: true }); }
console.log("✓ durable repository survives restart with identity, lookup, and idempotency intact");
