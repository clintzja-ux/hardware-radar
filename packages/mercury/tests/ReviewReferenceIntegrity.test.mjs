import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-review-ref-"));
try {
  const acceptance = new FileObservationAcceptanceRepository({ statePath: path.join(dir, "obs.json"), environment: "development" });
  const repo = new FileReviewDecisionRepository({ statePath: path.join(dir, "reviews.json"), acceptanceRepository: acceptance, environment: "development" });
  const draft = createReviewDecision({ observationId: "mer_obs_999999999", decision: "HOLD", reviewedBy: "operator:test", reviewedAt: "2026-08-10T15:00:00Z" });
  await assert.rejects(() => repo.recordDecision(draft), /Observation does not exist/);
  assert.equal((await repo.getHistoryForObservation("mer_obs_999999999")).length, 0);
  console.log("Review reference-integrity tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
