import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import baseObservation from "../observations/mer_obs_000000001.json" with { type: "json" };

class FailSecondCommitRepository extends FileObservationAcceptanceRepository {
  constructor(options){ super(options); this.commits=0; }
  async _commit(state){ this.commits += 1; if(this.commits===2) throw new Error("SIMULATED_COMMIT_FAILURE"); return super._commit(state); }
}
const dir=await mkdtemp(join(tmpdir(),"mercury-recovery-")); const statePath=join(dir,"state.json");
try {
 const failing=new FailSecondCommitRepository({statePath,environment:"test",now:()=>"2026-08-10T07:00:00Z"});
 const o=structuredClone(baseObservation); o.observationId=await failing.allocateObservationId(); o.compliance.licenseContext="INDEPENDENT_SOURCE";
 await assert.rejects(()=>failing.accept(o,"event-failure"),/SIMULATED_COMMIT_FAILURE/);
 const recovered=new FileObservationAcceptanceRepository({statePath,environment:"test"});
 assert.equal(await recovered.getById(o.observationId),null);
 assert.equal(await recovered.findByIdempotencyKey("event-failure"),null);
 assert.equal((await recovered.getAll()).length,0);
 assert.equal(await recovered.allocateObservationId(),"mer_obs_000000002");
} finally { await rm(dir,{recursive:true,force:true}); }
console.log("✓ failed durable commit leaves no half-accepted observation or idempotency record");
