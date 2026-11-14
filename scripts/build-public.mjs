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
import { createRamCatalogProjection } from "../packages/atlas/RamCatalogProjection.js";
import { generateEditorialSite, generateSitemap, loadEditorialArticles } from "./editorial-publishing.mjs";
import { generateRamDiscoveryLinks, generateRamProductPages } from "./ram-product-publishing.mjs";
import { createPublicRetailerDestinationProjection, loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { FileCurrentDisplaySnapshotRepository, createEmptyPublicCurrentRetailProjection, createPublicCurrentRetailProjection } from "../packages/mercury/current-display/index.js";
import { loadStaticPublicationRelease } from "./static-publication-release-runtime.mjs";
import { createRamTerminalPublicIntelligence } from "../packages/mercury/historical-admission/RamTerminalPublicIntelligence.js";
import { createPublicChronologicalPriceSeries } from "../packages/mercury/historical-admission/PublicChronologicalPriceSeries.js";
import { generateRamTerminalPage } from "./ram-terminal-publishing.mjs";

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(process.env.HARDWARE_RADAR_PUBLICATION_WORKSPACE_ROOT || runtimeRoot);
const publicOutputRoot = path.resolve(process.env.HARDWARE_RADAR_PUBLIC_OUTPUT_ROOT || path.join(workspaceRoot, "public"));
if (publicOutputRoot !== path.join(workspaceRoot, "public")) throw new Error("PUBLIC_OUTPUT_ROOT_CONFLICT");
const scopeArgument = process.argv.slice(2).find(value => value.startsWith("--scope="))?.slice("--scope=".length);
const buildScope = String(scopeArgument ?? process.env.HARDWARE_RADAR_PUBLIC_BUILD_SCOPE ?? "FULL").toUpperCase();
if (!["FULL", "PRICE_PUBLICATION"].includes(buildScope)) throw new Error(`PUBLIC_BUILD_SCOPE_INVALID:${buildScope}`);
const pricePublication = buildScope === "PRICE_PUBLICATION";

const editorialInput = {
    sourceDir: path.join(runtimeRoot, "content", "guides"),
    routeManifestPath: path.join(runtimeRoot, "content", "site-routes.json")
};
const editorial = pricePublication
    ? await loadEditorialArticles(editorialInput)
    : await generateEditorialSite({
        ...editorialInput,
        outputDir: publicOutputRoot,
        sitemapPath: path.join(publicOutputRoot, "sitemap.xml"),
        guidesIndexPath: path.join(workspaceRoot, "content", "guides-index.json")
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

if (!pricePublication) {
    await copyDirectory(path.join(runtimeRoot, "packages", "atlas"), path.join(publicOutputRoot, "data", "atlas"), { exclude: ["tests", "README.md"] });
    await normalizeGeneratedText(path.join(publicOutputRoot, "data", "atlas"));
    await copyDirectory(path.join(runtimeRoot, "apps", "forge"), path.join(publicOutputRoot, "forge"), { exclude: ["README.md"] });
    await rm(path.join(publicOutputRoot, "data", "mercury"), { recursive: true, force: true });
    await rm(path.join(publicOutputRoot, "data", "sentinel"), { recursive: true, force: true });
    await rm(path.join(publicOutputRoot, "js", "atlasAdapter.js"), { force: true });
    await rm(path.join(publicOutputRoot, "js", "atlasSmokeTest.js"), { force: true });
}

const atlasRoot = path.join(runtimeRoot, "packages", "atlas");
const atlasManifest = await json(path.join(atlasRoot, "atlas-manifest.json"));
const [products, retailers] = await Promise.all([
    loadManifestRecords(atlasRoot, atlasManifest.products),
    loadManifestRecords(atlasRoot, atlasManifest.retailers)
]);
let ramCatalog = createRamCatalogProjection(products);
const destinationSource = await loadRetailerDestinationSource({ sourcePath: path.join(runtimeRoot, "packages", "mercury", "destinations", "production-destinations.json"), products, retailers });
let publicDestinations = createPublicRetailerDestinationProjection({ source: destinationSource, retailers });
const generatedAt = process.env.HARDWARE_RADAR_GENERATED_AT || new Date().toISOString();
const staticRelease = await loadStaticPublicationRelease({
    manifestPath: path.resolve(process.env.HARDWARE_RADAR_STATIC_RELEASE_MANIFEST || path.join(runtimeRoot, "config", "publication-release.json")),
    targetEnvironment: (process.env.HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT || "PREVIEW").toUpperCase(),
    evaluatedAt: generatedAt
});
let currentRetail, terminal, chronological;
try {
    const currentDisplayPath = process.env.HARDWARE_RADAR_CURRENT_DISPLAY_STATE || path.join(runtimeRoot, ".forge-review", "retail-display", "current-display-snapshots.json");
    const currentDisplayState = await new FileCurrentDisplaySnapshotRepository({ statePath: currentDisplayPath }).getState();
    currentRetail = currentDisplayState.current
        ? createPublicCurrentRetailProjection({ products, retailers, destinations: publicDestinations, currentSnapshot: currentDisplayState.current, asOf: generatedAt })
        : createEmptyPublicCurrentRetailProjection({ asOf: generatedAt });
} catch {
    currentRetail = createEmptyPublicCurrentRetailProjection({ asOf: generatedAt });
}
if (staticRelease.exposed && staticRelease.portfolio) {
    const files = staticRelease.portfolio.fileTexts;
    ramCatalog = JSON.parse(files.catalog);
    const durableOnly = staticRelease.currentMode === "EXPIRED_DURABLE_ONLY";
    currentRetail = JSON.parse(durableOnly ? files.staleCurrent : files.current);
    terminal = JSON.parse(durableOnly ? files.staleTerminal : files.terminal);
    chronological = JSON.parse(files.chronology);
    publicDestinations = JSON.parse(files.destinations);
    await rm(path.join(publicOutputRoot, "ram", "market-snapshots"), { recursive: true, force: true });
    await rm(path.join(publicOutputRoot, "data", "ram-market-snapshot-2026-09-30.json"), { force: true });
} else {
    currentRetail = staticRelease.exposed ? staticRelease.projection : createEmptyPublicCurrentRetailProjection({ asOf: generatedAt, state: "NO_CURRENT_RETAIL_STATE" });
    terminal = await createRamTerminalPublicIntelligence({ catalog: ramCatalog, currentRetail, historicalRepository: { getAll: async () => [] }, asOf: generatedAt });
    chronological = await createPublicChronologicalPriceSeries({ catalog: ramCatalog, retailers, historicalRepository: { getAll: async () => [] } });
}
await writeFile(path.join(publicOutputRoot, "data", "ram-catalog.json"), `${JSON.stringify(ramCatalog, null, 2)}\n`);
await writeFile(path.join(publicOutputRoot, "data", "ram-current-retail.json"), `${JSON.stringify(currentRetail, null, 2)}\n`);
await writeFile(path.join(publicOutputRoot, "data", "ram-terminal.json"), `${JSON.stringify(terminal, null, 2)}\n`);
const currentRetailByProduct = new Map(currentRetail.products.map(item => [item.atlasProductId, item]));
const terminalByProduct = new Map(terminal.lenses.ALL_RAM.productRows.map(item => [item.atlasProductId, item]));
const chronologicalSeriesByProduct = new Map(chronological.products.map(item => [item.atlasProductId, item]));
const productPages = await generateRamProductPages({ catalog: ramCatalog, products, destinations: publicDestinations, currentRetailByProduct, terminalByProduct, chronologicalSeriesByProduct, disclosure: currentRetail.disclosure, outputDir: publicOutputRoot });
if (!pricePublication) await generateRamDiscoveryLinks({ catalog: ramCatalog, outputDir: publicOutputRoot });
await generateRamTerminalPage({ artifact: terminal, outputDir: publicOutputRoot });
const staticRoutes = await json(path.join(runtimeRoot, "content", "site-routes.json"));
await writeFile(path.join(publicOutputRoot, "sitemap.xml"), generateSitemap({ staticRoutes, articles: editorial.articles, additionalRoutes: productPages.routes }));
const mercury = new Mercury();
let snapshot;

const acceptanceStatePath = process.env.HARDWARE_RADAR_ACCEPTANCE_STATE;
const reviewStatePath = process.env.HARDWARE_RADAR_REVIEW_STATE;
const publicationStatePath = process.env.HARDWARE_RADAR_PUBLICATION_STATE;
const freshnessPolicyStatePath = process.env.HARDWARE_RADAR_FRESHNESS_POLICY_STATE || path.join(runtimeRoot, "packages", "mercury", "current-market", "policies", "production-policies.json");

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

await writeFile(path.join(publicOutputRoot, "data", "market-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(pricePublication
    ? "Price-publication artifacts built from the certified release without unrelated application packaging."
    : "Public deployment artifacts built from canonical packages and governed published intelligence.");
