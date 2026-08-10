import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Mercury } from "../packages/mercury/Mercury.js";
import { MarketPublicationService } from "../packages/mercury/publication/MarketPublicationService.js";
import { GovernedMarketPublicationService } from "../packages/mercury/publication/GovernedMarketPublicationService.js";
import { PublicationWorkflowService } from "../packages/mercury/publication/PublicationWorkflowService.js";
import { FileObservationAcceptanceRepository } from "../packages/mercury/persistence/FileObservationAcceptanceRepository.js";
import { FileReviewDecisionRepository } from "../packages/mercury/review/persistence/FileReviewDecisionRepository.js";
import { FilePublicationDecisionRepository } from "../packages/mercury/publication/persistence/FilePublicationDecisionRepository.js";
import { PublicationAtlasResolver } from "../packages/mercury/publication/PublicationAtlasResolver.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function copyDirectory(source, destination, { exclude = [] } = {}) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source)) {
        if (exclude.includes(entry)) continue;
        const sourcePath = path.join(source, entry);
        const destinationPath = path.join(destination, entry);
        const info = await stat(sourcePath);
        if (info.isDirectory()) await cp(sourcePath, destinationPath, { recursive: true });
        else await cp(sourcePath, destinationPath);
    }
}

async function json(file) { return JSON.parse(await readFile(file, "utf8")); }
async function loadManifestRecords(packageRoot, entries) { return Promise.all(entries.map((entry) => json(path.resolve(packageRoot, entry.path)))); }

await copyDirectory(path.join(root, "packages", "atlas"), path.join(root, "public", "data", "atlas"), { exclude: ["tests", "README.md"] });
await copyDirectory(path.join(root, "apps", "forge"), path.join(root, "public", "forge"), { exclude: ["README.md"] });
await rm(path.join(root, "public", "data", "mercury"), { recursive: true, force: true });
await rm(path.join(root, "public", "data", "sentinel"), { recursive: true, force: true });
await rm(path.join(root, "public", "js", "atlasAdapter.js"), { force: true });
await rm(path.join(root, "public", "js", "atlasSmokeTest.js"), { force: true });

const atlasRoot = path.join(root, "packages", "atlas");
const atlasManifest = await json(path.join(atlasRoot, "atlas-manifest.json"));
const [products, retailers] = await Promise.all([
    loadManifestRecords(atlasRoot, atlasManifest.products),
    loadManifestRecords(atlasRoot, atlasManifest.retailers)
]);
const generatedAt = process.env.HARDWARE_RADAR_GENERATED_AT || new Date().toISOString();
const mercury = new Mercury();
let snapshot;

const acceptanceStatePath = process.env.HARDWARE_RADAR_ACCEPTANCE_STATE;
const reviewStatePath = process.env.HARDWARE_RADAR_REVIEW_STATE;
const publicationStatePath = process.env.HARDWARE_RADAR_PUBLICATION_STATE;

if (acceptanceStatePath && reviewStatePath && publicationStatePath) {
    const acceptanceRepository = new FileObservationAcceptanceRepository({ statePath: path.resolve(acceptanceStatePath), environment: "production" });
    const reviewRepository = new FileReviewDecisionRepository({ statePath: path.resolve(reviewStatePath), acceptanceRepository, environment: "production" });
    const publicationRepository = new FilePublicationDecisionRepository({ statePath: path.resolve(publicationStatePath), acceptanceRepository, reviewRepository, environment: "production" });
    const workflowService = new PublicationWorkflowService({ acceptanceRepository, reviewRepository, publicationRepository, mercury, atlas: new PublicationAtlasResolver({ products, retailers }) });
    const governed = new GovernedMarketPublicationService({ workflowService, marketPublicationService: new MarketPublicationService({ mercury }) });
    snapshot = await governed.createSnapshot({ products, retailers, generatedAt });
} else {
    // Fail closed: canonical manifest observations are not implicitly publication-authorized.
    snapshot = await new MarketPublicationService({ mercury }).createSnapshot({ observations: [], products, retailers, generatedAt });
}

await writeFile(path.join(root, "public", "data", "market-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log("Public deployment artifacts built from canonical packages and governed published intelligence.");
