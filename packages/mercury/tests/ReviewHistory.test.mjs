import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-review-history-"));
try {
  const acceptance = new FileObservationAcceptanceRepository({ statePath: path.join(dir, "obs.json"), environment: "development" });
  const id = await acceptance.allocateObservationId();
  await acceptance.accept(makeObservation(id), "history-key");
  const repo = new FileReviewDecisionRepository({ statePath: path.join(dir, "reviews.json"), acceptanceRepository: acceptance, environment: "development" });

  await repo.recordDecision(createReviewDecision({ observationId: id, decision: "HOLD", reviewedBy: "operator:a", reviewedAt: "2026-08-10T15:10:00Z" }));
  await repo.recordDecision(createReviewDecision({ observationId: id, decision: "REVIEWED", reviewedBy: "operator:a", reviewedAt: "2026-08-10T15:20:00Z" }));
  const history = await repo.getHistoryForObservation(id);
  assert.equal(history.length, 2);
  assert.equal(history[0].decision, "HOLD");
  assert.equal(history[1].decision, "REVIEWED");
  assert.equal((await repo.getEffectiveDecision(id)).decision, "REVIEWED");
  console.log("Review history tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
