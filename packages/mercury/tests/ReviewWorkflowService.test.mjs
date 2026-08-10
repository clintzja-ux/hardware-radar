import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { ObservationReviewService } from "../review/ObservationReviewService.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { ReviewWorkflowService } from "../review/ReviewWorkflowService.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-review-workflow-"));
try {
  const acceptance = new FileObservationAcceptanceRepository({ statePath: path.join(dir, "obs.json"), environment: "development", now: () => "2026-08-10T15:05:00Z" });
  const id = await acceptance.allocateObservationId();
  await acceptance.accept(makeObservation(id), "workflow-review-key");
  const reviewService = new ObservationReviewService({ acceptanceRepository: acceptance });
  const reviewRepository = new FileReviewDecisionRepository({ statePath: path.join(dir, "reviews.json"), acceptanceRepository: acceptance, environment: "development" });
  const workflow = new ReviewWorkflowService({ reviewRepository, reviewService });

  await workflow.record({ observationId: id, decision: "HOLD", reviewedBy: "operator:a", reviewedAt: "2026-08-10T15:05:30Z" });
  await workflow.record({ observationId: id, decision: "REVIEWED", reviewedBy: "operator:a", reviewedAt: "2026-08-10T15:06:00Z" });
  const state = await workflow.getState(id);
  assert.equal(state.history.length, 2);
  assert.equal(state.effectiveDecision.decision, "REVIEWED");
  assert.equal(state.effectiveDecision.canonicalObservationModified, false);
  console.log("Review workflow service tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
