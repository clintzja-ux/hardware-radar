import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { FilePublicationDecisionRepository } from "../publication/persistence/FilePublicationDecisionRepository.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";
import { createPublicationDecision } from "../publication/PublicationDecision.js";
import { makeAmazonApiObservation } from "./helpers/publicationFixture.mjs";
class FailOnceRepository extends FilePublicationDecisionRepository { constructor(options){super(options);this.failed=false;} async _commit(state){if(!this.failed){this.failed=true;throw new Error("SIMULATED_PUBLICATION_COMMIT_FAILURE");} return super._commit(state);} }
const dir=await mkdtemp(path.join(os.tmpdir(),"mercury-pub-failure-"));
try {
 const acceptance=new FileObservationAcceptanceRepository({statePath:path.join(dir,"obs.json"),environment:"development"}); const id=await acceptance.allocateObservationId(); await acceptance.accept(makeAmazonApiObservation(id),"k");
 const reviews=new FileReviewDecisionRepository({statePath:path.join(dir,"rev.json"),acceptanceRepository:acceptance,environment:"development"}); const rev=await reviews.recordDecision(createReviewDecision({observationId:id,decision:"REVIEWED",reviewedBy:"op",reviewedAt:"2026-08-10T15:20:00Z"}));
 const statePath=path.join(dir,"pub.json"); const draft=createPublicationDecision({observationId:id,action:"PUBLISH",reviewDecisionId:rev.reviewDecisionId,authorizedBy:"op",authorizedAt:"2026-08-10T15:30:00Z"}); const failing=new FailOnceRepository({statePath,acceptanceRepository:acceptance,reviewRepository:reviews,environment:"development"}); await assert.rejects(()=>failing.recordDecision(draft),/SIMULATED_PUBLICATION_COMMIT_FAILURE/);
 const restarted=new FilePublicationDecisionRepository({statePath,acceptanceRepository:acceptance,reviewRepository:reviews,environment:"development"}); assert.equal((await restarted.getHistoryForObservation(id)).length,0); const saved=await restarted.recordDecision(draft); assert.equal(saved.publicationDecisionId,"mer_pub_000000001");
 console.log("Publication failure-recovery tests passed.");
} finally {await rm(dir,{recursive:true,force:true});}
