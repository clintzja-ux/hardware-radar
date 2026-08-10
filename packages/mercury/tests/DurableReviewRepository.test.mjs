import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-durable-review-"));
try {
  const acceptancePath = path.join(dir, "observations.json");
  const reviewPath = path.join(dir, "reviews.json");
  const acceptance = new FileObservationAcceptanceRepository({ statePath: acceptancePath, environment: "development", now: () => "2026-08-10T15:05:00Z" });
  const id = await acceptance.allocateObservationId();
  await acceptance.accept(makeObservation(id), "review-key-1");

  const repo = new FileReviewDecisionRepository({ statePath: reviewPath, acceptanceRepository: acceptance, environment: "development", now: () => "2026-08-10T15:06:00Z" });
  const saved = await repo.recordDecision(createReviewDecision({ observationId: id, decision: "HOLD", reviewedBy: "operator:test", reviewedAt: "2026-08-10T15:05:30Z", notes: "Check source." }));
  assert.equal(saved.reviewDecisionId, "mer_rev_000000001");
  assert.equal(saved.canonicalObservationModified, false);

  const restarted = new FileReviewDecisionRepository({ statePath: reviewPath, acceptanceRepository: acceptance, environment: "development" });
  assert.deepEqual(await restarted.getById(saved.reviewDecisionId), saved);
  console.log("Durable review repository tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
