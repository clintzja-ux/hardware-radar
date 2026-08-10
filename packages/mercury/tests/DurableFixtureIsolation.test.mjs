import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import baseObservation from "../observations/mer_obs_000000001.json" with { type: "json" };

const dir=await mkdtemp(join(tmpdir(),"mercury-fixture-isolation-"));
try {
 const repo=new FileObservationAcceptanceRepository({statePath:join(dir,"production-state.json"),environment:"production"});
 const o=structuredClone(baseObservation); o.observationId=await repo.allocateObservationId(); o.compliance.licenseContext="TEST_FIXTURE";
 await assert.rejects(()=>repo.accept(o,"fixture-event"),/cannot enter the production durable repository/);
 assert.equal((await repo.getAll()).length,0);
} finally { await rm(dir,{recursive:true,force:true}); }
console.log("✓ production durable repository physically rejects test-fixture evidence");
