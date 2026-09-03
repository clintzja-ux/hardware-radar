import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import baseObservation from "../observations/mer_obs_000000001.json" with { type: "json" };

const dir = await mkdtemp(join(tmpdir(), "mercury-idempotency-"));
try {
  const repo = new FileObservationAcceptanceRepository({ statePath: join(dir,"state.json"), environment: "test" });
  const a = structuredClone(baseObservation); a.observationId = await repo.allocateObservationId(); a.compliance.licenseContext="INDEPENDENT_SOURCE";
  const b = structuredClone(a); b.observationId = await repo.allocateObservationId();
  assert.equal((await repo.accept(a,"same-event")).status,"ACCEPTED");
  const second = await repo.accept(b,"same-event");
  assert.equal(second.status,"DUPLICATE"); assert.equal(second.observationId,a.observationId);
  assert.equal((await repo.getAll()).length,1);
} finally { await rm(dir,{recursive:true,force:true}); }
console.log("✓ durable idempotency treats retries as duplicates without collapsing distinct allocated identities");
