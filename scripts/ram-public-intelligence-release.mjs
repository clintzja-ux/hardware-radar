import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository, createRamCatalogProjection } from "../packages/atlas/index.js";
import { loadRetailerDestinationSource, createPublicRetailerDestinationProjection } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { FileCurrentDisplaySnapshotRepository, createPublicCurrentRetailProjection, createEmptyPublicCurrentRetailProjection, createPublicRetailerActionProjection, readManualCurrentPriceWorkbookRows } from "../packages/mercury/current-display/index.js";
import { deriveCurrentDisplayPublicationEligibleSnapshot, deriveLegacySingleOfferPublicationCompatibilitySnapshot } from "../packages/mercury/publication/CurrentDisplayPublication.js";
import { defaultSourceRightsRegistry } from "../packages/mercury/rights/SourceRightsRegistry.js";
import { FileHistoricalObservationRepository } from "../packages/mercury/historical-admission/persistence/FileHistoricalObservationRepository.js";
import { EffectiveHistoricalObservationRepository } from "../packages/mercury/historical-admission/EffectiveHistoricalObservationRepository.js";
import { FileHistoricalComparabilityReassessmentRepository } from "../packages/mercury/historical-admission/FileHistoricalComparabilityReassessmentRepository.js";
import { createRamTerminalPublicIntelligence } from "../packages/mercury/historical-admission/RamTerminalPublicIntelligence.js";
import { createPublicChronologicalPriceSeries } from "../packages/mercury/historical-admission/PublicChronologicalPriceSeries.js";
import { createRamPublicIntelligencePortfolioManifest, certifyRamPublicIntelligencePortfolio, portfolioFileDigest, validateRamPublicIntelligencePortfolio } from "../packages/mercury/publication/RamPublicIntelligenceReleasePortfolio.js";
import { generateRamProductPages } from "./ram-product-publishing.mjs";
import { generateRamTerminalPage } from "./ram-terminal-publishing.mjs";
import { generateEditorialSite, generateSitemap } from "./editorial-publishing.mjs";
import { loadStaticPublicationContinuityProjection } from "./static-publication-release-runtime.mjs";

const root = path.resolve(".");
const argv = new Map(process.argv.slice(2).map(value => { const i = value.indexOf("="); return i < 0 ? [value.replace(/^--/, ""), true] : [value.slice(2, i), value.slice(i + 1)]; }));
const action = argv.get("action");
const json = async file => JSON.parse(await readFile(file, "utf8"));
const canonicalText = value => `${JSON.stringify(value, null, 2)}\n`;
const sha = text => createHash("sha256").update(text.replaceAll("\r\n", "\n"), "utf8").digest("hex");
const stateRoot = path.resolve(argv.get("state-root") || ".forge-review");
const portfolioRoot = path.resolve(argv.get("portfolio-root") || path.join(stateRoot, "publication", "ram-intelligence"));
const candidateDirectory = id => path.join(portfolioRoot, id);
const fileNames = { catalog: "ram-catalog.json", current: "ram-current-retail.json", terminal: "ram-terminal.json", staleCurrent: "ram-current-retail-stale.json", staleTerminal: "ram-terminal-stale.json", chronology: "ram-chronology.json", destinations: "retailer-destinations.json" };

async function canonicalInputs(asOf) {
  const products = await new ProductRepository({ readJson: json }).getAll();
  const retailers = await new RetailerRepository({ readJson: json }).getAll();
  const catalog = createRamCatalogProjection(products);
  const destinationSourcePath = path.join(root, "packages/mercury/destinations/production-destinations.json");
  const source = await loadRetailerDestinationSource({ sourcePath: destinationSourcePath, products, retailers });
  const ordinaryDestinations = createPublicRetailerDestinationProjection({ source, retailers });
  const manualWorkbookRows = await readManualCurrentPriceWorkbookRows({ workbookPath: path.join(stateRoot, "retail-display/hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx") });
  const destinations = createPublicRetailerActionProjection({ destinations: ordinaryDestinations, governedDestinations: source.effective, manualWorkbookRows });
  const currentStatePath = path.join(stateRoot, "retail-display/current-display-snapshots.json");
  const currentState = await new FileCurrentDisplaySnapshotRepository({ statePath: currentStatePath }).getState();
  const snapshot = currentState.current ? { ...currentState.current, offers: currentState.current.offers.filter(offer => offer?.sourceIdentity?.sourceId) } : null;
  const eligibleSnapshot = snapshot ? deriveCurrentDisplayPublicationEligibleSnapshot({ snapshot, rightsRegistry: defaultSourceRightsRegistry }) : null;
  let publishedProjection = null; try { publishedProjection = (await loadStaticPublicationContinuityProjection({ manifestPath: path.join(root, "config/publication-release.json") })).projection; } catch {}
  const continuityRoot=path.join(stateRoot,"mercury/rakuten-full-current-refresh"),continuityTransitions=[];
  try { for(const file of await readdir(continuityRoot)){if(!file.startsWith("mer_rakutenfullprep_")||!file.endsWith(".json"))continue;const preparation=await json(path.join(continuityRoot,file));for(const member of preparation.members??[])if(member?.priorOffer&&member?.offer)continuityTransitions.push({priorOffer:member.priorOffer,offer:member.offer});} } catch {}
  const publicationSnapshot = eligibleSnapshot && currentState.previous ? deriveLegacySingleOfferPublicationCompatibilitySnapshot({ eligibleSnapshot, predecessorSnapshot: currentState.previous, publishedProjection, continuityTransitions }) : eligibleSnapshot;
  const current = publicationSnapshot ? createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: publicationSnapshot, asOf }) : createEmptyPublicCurrentRetailProjection({ asOf });
  const staleCurrent = createEmptyPublicCurrentRetailProjection({ asOf, state: "NO_QUALIFYING_CURRENT_PRICE" });
  const rawHistoryPath = path.join(stateRoot, "mercury/historical-observations.json");
  const reassessmentPath = path.join(stateRoot, "mercury/historical-comparability-reassessments.json");
  const historicalRepository = new EffectiveHistoricalObservationRepository({ historicalRepository: new FileHistoricalObservationRepository({ statePath: rawHistoryPath }), reassessmentRepository: new FileHistoricalComparabilityReassessmentRepository({ statePath: reassessmentPath }) });
  const [terminal, staleTerminal, chronology] = await Promise.all([
    createRamTerminalPublicIntelligence({ catalog, currentRetail: current, historicalRepository, asOf, currentSnapshotId: null }),
    createRamTerminalPublicIntelligence({ catalog, currentRetail: staleCurrent, historicalRepository, asOf, currentSnapshotId: null }),
    createPublicChronologicalPriceSeries({ catalog, retailers, historicalRepository })
  ]);
  const currentOffers = current.products.flatMap(product => product.offers);
  const currentValidUntil = currentOffers.length ? new Date(Math.min(...currentOffers.map(offer => Date.parse(offer.observedAt) + current.freshness.maxAgeHours * 3_600_000))).toISOString() : null;
  const texts = Object.fromEntries(Object.entries({ catalog, current, terminal, staleCurrent, staleTerminal, chronology, destinations }).map(([name, value]) => [name, canonicalText(value)]));
  const inputTexts = await Promise.all([readFile(path.join(root, "packages/atlas/atlas-manifest.json"), "utf8"), readFile(destinationSourcePath, "utf8"), readFile(currentStatePath, "utf8"), readFile(rawHistoryPath, "utf8"), readFile(reassessmentPath, "utf8")]);
  return { products, retailers, catalog, current, terminal, staleTerminal, chronology, destinations, texts, currentValidUntil, currentSnapshotId: currentState.current?.snapshotId ?? null, inputDigests: { atlasManifest: sha(inputTexts[0]), atlasCatalog: sha(texts.catalog), destinations: sha(inputTexts[1]), currentState: sha(inputTexts[2]), history: sha(inputTexts[3]), comparabilityReassessments: sha(inputTexts[4]) } };
}

async function loadCandidate(candidateId) {
  const directory = candidateDirectory(candidateId);
  const manifest = await json(path.join(directory, "manifest.json"));
  const fileTexts = Object.fromEntries(await Promise.all(Object.entries(fileNames).map(async ([name, file]) => [name, await readFile(path.join(directory, file), "utf8")])));
  return { directory, manifest, fileTexts };
}

if (action === "prepare") {
  const preparedAt = argv.get("as-of") || new Date().toISOString();
  const input = await canonicalInputs(preparedAt);
  const files = Object.fromEntries(Object.entries(input.texts).map(([name, text]) => [name, { file: fileNames[name], digestSha256: portfolioFileDigest(text), bytes: Buffer.byteLength(text, "utf8") }]));
  const staticRouteCount = (await json(path.join(root, "content/site-routes.json"))).length;
  const editorialArticleRoutes = (await readdir(path.join(root, "content/guides"))).filter(name => name.endsWith(".md") && name !== "README.md").length;
  const routes = { total: staticRouteCount + editorialArticleRoutes + input.catalog.productCount, staticRoutes: staticRouteCount, editorialArticleRoutes, productRoutes: input.catalog.productCount, snapshotRoutes: 0 };
  const all = input.terminal.lenses.ALL_RAM;
  const counts = { products: input.catalog.productCount, freshCurrentProducts: input.current.products.length, freshCurrentOffers: input.current.counts.publicCurrentEligibleOffers, staleCurrentOffers: input.current.counts.staleOffers, comparableHistoryObservations: input.chronology.eligibleObservationCount, historyProducts: input.chronology.productSeriesCount, timestampGroups: input.chronology.timestampGroupCount, governedDestinations: input.destinations.length };
  const manifest = createRamPublicIntelligencePortfolioManifest({ preparedAt, preparedBy: argv.get("prepared-by") || "operator", inputs: { ...input.inputDigests, currentSnapshotId: input.currentSnapshotId }, routes, files, counts, currentValidUntil: input.currentValidUntil });
  const directory = candidateDirectory(manifest.candidateId);
  await mkdir(directory, { recursive: true });
  for (const [name, text] of Object.entries(input.texts)) await writeFile(path.join(directory, fileNames[name]), text, "utf8");
  await writeFile(path.join(directory, "manifest.json"), canonicalText(manifest), "utf8");
  console.log(JSON.stringify({ status: "RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_PREPARED", candidateId: manifest.candidateId, artifactId: manifest.artifactId, bindingDigest: manifest.bindingDigest, directory, ...counts, terminalState: all.currentMarket.state, snapshotIncluded: false, releaseAuthority: false, deploymentAuthority: false }, null, 2));
} else if (["inspect", "certify", "preview"].includes(action)) {
  const candidateId = argv.get("candidate-id"); if (!candidateId) throw new Error("RAM_PUBLIC_INTELLIGENCE_CANDIDATE_ID_REQUIRED");
  const loaded = await loadCandidate(candidateId);
  const evaluatedAt = argv.get("evaluated-at") || new Date().toISOString();
  const report = validateRamPublicIntelligencePortfolio({ manifest: loaded.manifest, fileTexts: loaded.fileTexts, evaluatedAt });
  if (!report.valid) throw new Error(`RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_INVALID:${report.errors.join(",")}`);
  if (action === "inspect") console.log(JSON.stringify({ status: "RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_VALID", candidateId, artifactId: loaded.manifest.artifactId, evaluatedAt, currentMode: report.currentMode, counts: loaded.manifest.counts, routes: loaded.manifest.routes, snapshotIncluded: false, releaseAuthority: false, deploymentAuthority: false }, null, 2));
  if (action === "certify") {
    const certification = certifyRamPublicIntelligencePortfolio({ manifest: loaded.manifest, fileTexts: loaded.fileTexts, evaluatedAt, certifiedBy: argv.get("certified-by") || "operator" });
    await writeFile(path.join(loaded.directory, "certification.json"), canonicalText(certification), "utf8");
    console.log(JSON.stringify(certification, null, 2));
  }
  if (action === "preview") {
    const certification = await json(path.join(loaded.directory, "certification.json"));
    if (certification.status !== "CERTIFIED" || certification.artifactBindingDigest !== loaded.manifest.bindingDigest) throw new Error("RAM_PUBLIC_INTELLIGENCE_CERTIFICATION_REQUIRED");
    const output = path.resolve(argv.get("output") || path.join(stateRoot, "public-release-preview"));
    await rm(output, { recursive: true, force: true }); await mkdir(output, { recursive: true }); await cp(path.join(root, "public"), output, { recursive: true });
    await rm(path.join(output, "ram/market-snapshots"), { recursive: true, force: true }); await rm(path.join(output, "data/ram-market-snapshot-2026-09-30.json"), { force: true });
    const catalog = JSON.parse(loaded.fileTexts.catalog), destinations = JSON.parse(loaded.fileTexts.destinations), chronology = JSON.parse(loaded.fileTexts.chronology);
    const current = JSON.parse(report.currentMode === "FRESH" ? loaded.fileTexts.current : loaded.fileTexts.staleCurrent);
    const terminal = JSON.parse(report.currentMode === "FRESH" ? loaded.fileTexts.terminal : loaded.fileTexts.staleTerminal);
    await writeFile(path.join(output, "data/ram-catalog.json"), loaded.fileTexts.catalog); await writeFile(path.join(output, "data/ram-current-retail.json"), canonicalText(current)); await writeFile(path.join(output, "data/ram-terminal.json"), canonicalText(terminal));
    const products = await new ProductRepository({ readJson: json }).getAll();
    const editorial = await generateEditorialSite({ sourceDir: path.join(root, "content/guides"), outputDir: output, sitemapPath: path.join(output, "sitemap.xml"), routeManifestPath: path.join(root, "content/site-routes.json"), guidesIndexPath: path.join(root, "content/guides-index.json") });
    const productPages = await generateRamProductPages({ catalog, products, destinations, currentRetailByProduct: new Map(current.products.map(x => [x.atlasProductId, x])), terminalByProduct: new Map(terminal.lenses.ALL_RAM.productRows.map(x => [x.atlasProductId, x])), chronologicalSeriesByProduct: new Map(chronology.products.map(x => [x.atlasProductId, x])), disclosure: current.disclosure, outputDir: output });
    await generateRamTerminalPage({ artifact: terminal, outputDir: output });
    const staticRoutes = await json(path.join(root, "content/site-routes.json"));
    if (productPages.routes.length !== loaded.manifest.routes.productRoutes || staticRoutes.length + editorial.articles.length + productPages.routes.length !== loaded.manifest.routes.total) throw new Error("RAM_PUBLIC_INTELLIGENCE_PREVIEW_ROUTE_COUNT_MISMATCH");
    await writeFile(path.join(output, "sitemap.xml"), generateSitemap({ staticRoutes, articles: editorial.articles, additionalRoutes: productPages.routes }));
    await writeFile(path.join(output, "release-preview.json"), canonicalText({ mode: "EXACT_RAM_PUBLIC_INTELLIGENCE_RELEASE_PREVIEW", candidateId, artifactId: loaded.manifest.artifactId, certificationId: certification.certificationId, evaluatedAt, currentMode: report.currentMode, releaseAuthority: false, deploymentAuthority: false, snapshotIncluded: false }));
    console.log(JSON.stringify({ status: "RAM_PUBLIC_INTELLIGENCE_EXACT_RELEASE_PREVIEW_BUILT", output, candidateId, certificationId: certification.certificationId, evaluatedAt, currentMode: report.currentMode, releaseAuthority: false, deploymentAuthority: false }, null, 2));
  }
} else throw new Error("RAM_PUBLIC_INTELLIGENCE_ACTION_INVALID");
