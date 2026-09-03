import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-review-fixture-"));
try {
  const acceptance = new FileObservationAcceptanceRepository({ statePath: path.join(dir, "obs.json"), environment: "development" });
  const id = await acceptance.allocateObservationId();
  await acceptance.accept(makeObservation(id), "fixture-review-key");
  const repo = new FileReviewDecisionRepository({ statePath: path.join(dir, "reviews.json"), acceptanceRepository: acceptance, environment: "production" });
  const draft = createReviewDecision({ observationId: id, decision: "REVIEWED", reviewedBy: "operator:test", reviewedAt: "2026-08-10T15:10:00Z" });
  await assert.rejects(() => repo.recordDecision(draft), /TEST_FIXTURE observations cannot receive production review decisions/);
  console.log("Review fixture-isolation tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
