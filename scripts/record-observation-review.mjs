import { readFile } from "node:fs/promises";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../packages/mercury/persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../packages/mercury/review/persistence/FileReviewDecisionRepository.js";

const [acceptanceStatePath, reviewStatePath, decisionPath, legacyAcknowledgement] = process.argv.slice(2);
if (!acceptanceStatePath || !reviewStatePath || !decisionPath || legacyAcknowledgement!=="ACKNOWLEDGE-NONPRODUCTION-LEGACY-REVIEW-RECORD") {
  console.error("DEPRECATED FOR PRODUCTION: use the governed E2R PREPARE/EXECUTE commands.");
  console.error("Usage for local legacy fixtures only: npm run review:record -- <acceptance-state.json> <review-state.json> <decision.json> ACKNOWLEDGE-NONPRODUCTION-LEGACY-REVIEW-RECORD");
  process.exit(1);
}

const decision = JSON.parse(await readFile(path.resolve(decisionPath), "utf8"));
const acceptanceRepository = new FileObservationAcceptanceRepository({
  statePath: path.resolve(acceptanceStatePath),
  environment: "development"
});
const reviewRepository = new FileReviewDecisionRepository({
  statePath: path.resolve(reviewStatePath),
  acceptanceRepository,
  environment: "development"
});
const saved = await reviewRepository.recordDecision(decision);
console.log(JSON.stringify(saved, null, 2));
