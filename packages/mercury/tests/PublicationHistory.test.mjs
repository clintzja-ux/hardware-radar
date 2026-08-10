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
const dir=await mkdtemp(path.join(os.tmpdir(),"mercury-pub-history-"));
try {
 const acceptance=new FileObservationAcceptanceRepository({statePath:path.join(dir,"obs.json"),environment:"development"}); const id=await acceptance.allocateObservationId(); await acceptance.accept(makeAmazonApiObservation(id),"k");
 const reviews=new FileReviewDecisionRepository({statePath:path.join(dir,"rev.json"),acceptanceRepository:acceptance,environment:"development"}); const rev=await reviews.recordDecision(createReviewDecision({observationId:id,decision:"REVIEWED",reviewedBy:"op",reviewedAt:"2026-08-10T15:20:00Z"}));
 const pubs=new FilePublicationDecisionRepository({statePath:path.join(dir,"pub.json"),acceptanceRepository:acceptance,reviewRepository:reviews,environment:"development"});
 await pubs.recordDecision(createPublicationDecision({observationId:id,action:"PUBLISH",reviewDecisionId:rev.reviewDecisionId,authorizedBy:"op",authorizedAt:"2026-08-10T15:30:00Z"}));
 await pubs.recordDecision(createPublicationDecision({observationId:id,action:"WITHDRAW",reviewDecisionId:rev.reviewDecisionId,authorizedBy:"op",authorizedAt:"2026-08-10T15:40:00Z"}));
 const history=await pubs.getHistoryForObservation(id); assert.equal(history.length,2); assert.equal(history[0].action,"PUBLISH"); assert.equal(history[1].action,"WITHDRAW"); assert.equal((await pubs.getEffectiveDecision(id)).action,"WITHDRAW");
 console.log("Publication history tests passed.");
} finally {await rm(dir,{recursive:true,force:true});}
