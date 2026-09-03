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
const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-pub-repo-"));
try {
  const acceptance = new FileObservationAcceptanceRepository({ statePath: path.join(dir,"obs.json"), environment:"development" });
  const id = await acceptance.allocateObservationId();
  await acceptance.accept(makeAmazonApiObservation(id), "pub-key");
  const reviews = new FileReviewDecisionRepository({ statePath:path.join(dir,"reviews.json"), acceptanceRepository:acceptance, environment:"development" });
  const review = await reviews.recordDecision(createReviewDecision({ observationId:id, decision:"REVIEWED", reviewedBy:"operator:test", reviewedAt:"2026-08-10T15:20:00Z" }));
  const statePath = path.join(dir,"publications.json");
  const repo = new FilePublicationDecisionRepository({ statePath, acceptanceRepository:acceptance, reviewRepository:reviews, environment:"development" });
  const saved = await repo.recordDecision(createPublicationDecision({ observationId:id, action:"PUBLISH", reviewDecisionId:review.reviewDecisionId, authorizedBy:"operator:test", authorizedAt:"2026-08-10T15:30:00Z" }));
  assert.equal(saved.publicationDecisionId,"mer_pub_000000001");
  const restarted = new FilePublicationDecisionRepository({ statePath, acceptanceRepository:acceptance, reviewRepository:reviews, environment:"development" });
  assert.equal((await restarted.getEffectiveDecision(id)).publicationDecisionId,"mer_pub_000000001");
  console.log("Durable publication repository tests passed.");
} finally { await rm(dir,{recursive:true,force:true}); }
