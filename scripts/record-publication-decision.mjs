import { readFile } from "node:fs/promises";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../packages/mercury/persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../packages/mercury/review/persistence/FileReviewDecisionRepository.js";
import { FilePublicationDecisionRepository } from "../packages/mercury/publication/persistence/FilePublicationDecisionRepository.js";
import { PublicationWorkflowService } from "../packages/mercury/publication/PublicationWorkflowService.js";
import { PublicationAtlasResolver } from "../packages/mercury/publication/PublicationAtlasResolver.js";
import { Mercury } from "../packages/mercury/Mercury.js";

const [acceptanceStatePath, reviewStatePath, publicationStatePath, action, observationId, actor, at, ...noteParts] = process.argv.slice(2);
if (!acceptanceStatePath || !reviewStatePath || !publicationStatePath || !action || !observationId || !actor || !at) {
  console.error("Usage: npm run publication:record -- <acceptance-state.json> <review-state.json> <publication-state.json> <PUBLISH|WITHDRAW> <observationId> <actor> <ISO-time> [notes]");
  process.exit(1);
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const atlasRoot = path.join(repoRoot, "packages", "atlas");
const manifest = JSON.parse(await readFile(path.join(atlasRoot, "atlas-manifest.json"), "utf8"));
const load = async (entries) => Promise.all(entries.map(async (entry) => JSON.parse(await readFile(path.resolve(atlasRoot, entry.path), "utf8"))));
const [products, retailers] = await Promise.all([load(manifest.products), load(manifest.retailers)]);
const atlas = new PublicationAtlasResolver({ products, retailers });
const acceptanceRepository = new FileObservationAcceptanceRepository({ statePath: path.resolve(acceptanceStatePath), environment: "development" });
const reviewRepository = new FileReviewDecisionRepository({ statePath: path.resolve(reviewStatePath), acceptanceRepository, environment: "development" });
const publicationRepository = new FilePublicationDecisionRepository({ statePath: path.resolve(publicationStatePath), acceptanceRepository, reviewRepository, environment: "development" });
const workflow = new PublicationWorkflowService({ acceptanceRepository, reviewRepository, publicationRepository, mercury: new Mercury(), atlas });
const notes = noteParts.join(" ");
const normalizedAction = action.toUpperCase();
let result;
if (normalizedAction === "PUBLISH") result = await workflow.authorizePublish({ observationId, authorizedBy: actor, authorizedAt: at, notes });
else if (normalizedAction === "WITHDRAW") result = await workflow.withdraw({ observationId, authorizedBy: actor, authorizedAt: at, notes });
else throw new Error("action must be PUBLISH or WITHDRAW");
console.log(JSON.stringify(result, null, 2));
