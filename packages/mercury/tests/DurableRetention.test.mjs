import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import baseObservation from "../observations/mer_obs_000000001.json" with { type: "json" };

const dir = await mkdtemp(join(tmpdir(), "mercury-retention-"));
try {
  const repo = new FileObservationAcceptanceRepository({ statePath: join(dir,"state.json"), environment:"test", now:()=>"2026-08-10T06:00:00Z" });
  const o=structuredClone(baseObservation); o.observationId=await repo.allocateObservationId(); o.observationTime="2026-08-10T05:00:00Z"; o.provenance.acquisition.retrievedAt=o.observationTime; o.compliance.licenseContext="AMAZON_CREATORS_API";
  const accepted=await repo.accept(o,"amazon-event");
  assert.equal(accepted.storage.storageClass,"LICENSE_CONTROLLED");
  assert.equal(accepted.storage.payloadExpiresAt,"2026-08-10T06:00:00.000Z");
  assert.equal(await repo.getById(o.observationId,{asOf:"2026-08-10T05:59:59Z"}) !== null,true);
  assert.equal(await repo.getById(o.observationId,{asOf:"2026-08-10T06:00:00Z"}),null);
  const audit=await repo.getAuditById(o.observationId);
  assert.equal(audit.observationId,o.observationId); assert.equal(audit.storage.payloadStatus,"PURGED"); assert.equal(audit.storage.purgeReason,"SOURCE_RETENTION_EXPIRED"); assert.equal(audit.provenance.source.uri, undefined); assert.equal("offer" in audit, false);
  assert.equal((await repo.getAll({asOf:"2026-08-10T07:00:00Z"})).length,0);
} finally { await rm(dir,{recursive:true,force:true}); }
console.log("✓ licensed payload expires independently while durable audit identity remains available");
