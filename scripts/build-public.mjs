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
import { CurrentMarketObservationQualificationService } from "../packages/mercury/current-market/CurrentMarketObservationQualificationService.js";
import { FileProductionFreshnessPolicyRepository } from "../packages/mercury/current-market/FileProductionFreshnessPolicyRepository.js";
import { adapterRegistry } from "../packages/mercury/adapters/index.js";
import { ProductRepository } from "../packages/atlas/ProductRepository.js";
import { RetailerRepository } from "../packages/atlas/RetailerRepository.js";
import { generateEditorialSite } from "./editorial-publishing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await generateEditorialSite({
    sourceDir: path.join(root, "content", "guides"),
    outputDir: path.join(root, "public"),
    sitemapPath: path.join(root, "public", "sitemap.xml"),
    routeManifestPath: path.join(root, "content", "site-routes.json"),
    guidesIndexPath: path.join(root, "content", "guides-index.json")
});

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

async function normalizeGeneratedText(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) await normalizeGeneratedText(target);
        else {
            const value = await readFile(target, "utf8");
            const normalized = value.replaceAll("\r\n", "\n");
            if (normalized !== value) await writeFile(target, normalized, "utf8");
        }
    }
}

async function json(file) { return JSON.parse(await readFile(file, "utf8")); }
async function loadManifestRecords(packageRoot, entries) { return Promise.all(entries.map((entry) => json(path.resolve(packageRoot, entry.path)))); }

await copyDirectory(path.join(root, "packages", "atlas"), path.join(root, "public", "data", "atlas"), { exclude: ["tests", "README.md"] });
await normalizeGeneratedText(path.join(root, "public", "data", "atlas"));
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
const freshnessPolicyStatePath = process.env.HARDWARE_RADAR_FRESHNESS_POLICY_STATE || path.join(root, "packages", "mercury", "current-market", "policies", "production-policies.json");

if (acceptanceStatePath && reviewStatePath && publicationStatePath) {
    const acceptanceRepository = new FileObservationAcceptanceRepository({ statePath: path.resolve(acceptanceStatePath), environment: "production" });
    const reviewRepository = new FileReviewDecisionRepository({ statePath: path.resolve(reviewStatePath), acceptanceRepository, environment: "production" });
    const publicationRepository = new FilePublicationDecisionRepository({ statePath: path.resolve(publicationStatePath), acceptanceRepository, reviewRepository, environment: "production" });
    const currentMarketQualificationService = new CurrentMarketObservationQualificationService({
        acceptanceRepository,
        reviewRepository,
        productRepository: new ProductRepository({ readJson: json }),
        retailerRepository: new RetailerRepository({ readJson: json }),
        mercury,
        adapterRegistry,
        freshnessPolicyRepository: new FileProductionFreshnessPolicyRepository({ statePath: path.resolve(freshnessPolicyStatePath) })
    });
    const workflowService = new PublicationWorkflowService({ acceptanceRepository, reviewRepository, publicationRepository, mercury, atlas: new PublicationAtlasResolver({ products, retailers }), currentMarketQualificationService, requireCurrentMarketQualification: true });
    const governed = new GovernedMarketPublicationService({ workflowService, marketPublicationService: new MarketPublicationService({ mercury }), requireCurrentMarketQualification: true });
    snapshot = await governed.createSnapshot({ products, retailers, generatedAt });
} else {
    // Fail closed: canonical manifest observations are not implicitly publication-authorized.
    snapshot = await new MarketPublicationService({ mercury }).createSnapshot({ observations: [], products, retailers, generatedAt });
}

await writeFile(path.join(root, "public", "data", "market-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log("Public deployment artifacts built from canonical packages and governed published intelligence.");
