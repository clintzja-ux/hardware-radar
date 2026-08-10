import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../review/persistence/FileReviewDecisionRepository.js";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

class FailOnceRepository extends FileReviewDecisionRepository {
  constructor(options) { super(options); this.failed = false; }
  async _commit(state) {
    if (!this.failed) { this.failed = true; throw new Error("SIMULATED_REVIEW_COMMIT_FAILURE"); }
    return super._commit(state);
  }
}

const dir = await mkdtemp(path.join(os.tmpdir(), "mercury-review-failure-"));
try {
  const acceptance = new FileObservationAcceptanceRepository({ statePath: path.join(dir, "obs.json"), environment: "development" });
  const id = await acceptance.allocateObservationId();
  await acceptance.accept(makeObservation(id), "failure-review-key");
  const pathName = path.join(dir, "reviews.json");
  const repo = new FailOnceRepository({ statePath: pathName, acceptanceRepository: acceptance, environment: "development" });
  const draft = createReviewDecision({ observationId: id, decision: "HOLD", reviewedBy: "operator:test", reviewedAt: "2026-08-10T15:10:00Z" });
  await assert.rejects(() => repo.recordDecision(draft), /SIMULATED_REVIEW_COMMIT_FAILURE/);

  const restarted = new FileReviewDecisionRepository({ statePath: pathName, acceptanceRepository: acceptance, environment: "development" });
  assert.equal((await restarted.getHistoryForObservation(id)).length, 0);
  const saved = await restarted.recordDecision(draft);
  assert.equal(saved.reviewDecisionId, "mer_rev_000000001");
  console.log("Review failure-recovery tests passed.");
} finally { await rm(dir, { recursive: true, force: true }); }
