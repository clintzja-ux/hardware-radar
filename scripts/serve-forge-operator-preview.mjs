import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { RetailerRepository } from "../packages/atlas/index.js";
import { FileForgeOperatorAuditRepository, FileHistoricalObservationRepository, ForgeManualPriceEntryService, ForgeTrustedOperatorHttpRuntime, ForgeTrustedOperatorService, ProductionFlatRetailerDestinationRepository } from "../packages/mercury/index.js";
import { FileCurrentDisplaySnapshotRepository, FileManualCurrentPricePreparationRepository, FileManualCurrentPriceSnapshotExecutionRepository, ManualCurrentPriceHistoryService, ManualCurrentPriceSnapshotExecutionService, RoutineManualCurrentPriceProcessingService } from "../packages/mercury/current-display/index.js";
import { defaultSourceRightsRegistry } from "../packages/mercury/rights/SourceRightsRegistry.js";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const runtimeRevision = (() => { try { return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim(); } catch { return "UNKNOWN"; } })();
const forgeRoot = join(repositoryRoot, "apps", "forge"), publicImages = join(repositoryRoot, "public", "images");
const mime = new Map([[".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"], [".ico", "image/x-icon"], [".png", "image/png"]]);
const port = Number(process.env.FORGE_OPERATOR_PREVIEW_PORT ?? 4174), operatorId = process.env.FORGE_OPERATOR_ID?.trim() ?? null;
let trustedRuntime = null;

const within = (root, target) => { const value = relative(root, target); return value !== "" && !value.startsWith("..") && !value.includes(`..${process.platform === "win32" ? "\\" : "/"}`); };
const readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"));

if (operatorId) {
  const fixtureRoot = process.env.FORGE_OPERATOR_FIXTURE_ROOT ? resolve(process.env.FORGE_OPERATOR_FIXTURE_ROOT) : null;
  if (fixtureRoot && !within(repositoryRoot, fixtureRoot)) throw new Error("FORGE_OPERATOR_FIXTURE_ROOT_MUST_BE_INSIDE_REPOSITORY");
  const destinationPath = fixtureRoot ? join(fixtureRoot, "production-destinations.json") : join(repositoryRoot, "packages", "mercury", "destinations", "production-destinations.json");
  const currentPath = fixtureRoot ? join(fixtureRoot, "current-display-snapshots.json") : join(repositoryRoot, ".forge-review", "retail-display", "current-display-snapshots.json");
  const historyPath = fixtureRoot ? join(fixtureRoot, "historical-observations.json") : join(repositoryRoot, ".forge-review", "mercury", "historical-observations.json");
  const preparationPath = fixtureRoot ? join(fixtureRoot, "manual-current-price-preparations.json") : join(repositoryRoot, ".forge-review", "retail-display", "manual-current-price-preparations.json");
  const executionPath = fixtureRoot ? join(fixtureRoot, "manual-current-price-snapshot-executions.json") : join(repositoryRoot, ".forge-review", "retail-display", "manual-current-price-snapshot-executions.json");
  const auditPath = fixtureRoot ? join(fixtureRoot, "operator-audit.json") : join(repositoryRoot, ".forge-review", "forge", "operator-audit.json");
  const retailerRepository = new RetailerRepository({ readJson });
  const products = await Promise.all((await readJson(new URL("../packages/atlas/atlas-manifest.json", import.meta.url))).products.map(entry => readJson(new URL(`../packages/atlas/${entry.path}`, import.meta.url))));
  const productRepository = { getAll: async () => structuredClone(products), getById: async id => structuredClone(products.find(product => product.identity.atlasProductId === id) ?? null) };
  const destinationRepository = new ProductionFlatRetailerDestinationRepository({ statePath: destinationPath, productRepository, retailerRepository });
  const preparationRepository = new FileManualCurrentPricePreparationRepository({ filePath: preparationPath });
  const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: currentPath });
  const executionRepository = new FileManualCurrentPriceSnapshotExecutionRepository({ filePath: executionPath });
  const historicalRepository = new FileHistoricalObservationRepository({ statePath: historyPath });
  const productResolver = id => productRepository.getById(id), retailerResolver = async id => (await retailerRepository.getAll()).find(value => value.id === id) ?? null, destinationResolver = async id => (await destinationRepository.getAll()).find(value => value.destinationId === id) ?? null;
  const snapshotExecutionService = new ManualCurrentPriceSnapshotExecutionService({ preparationRepository, snapshotRepository, executionRepository, productResolver, retailerResolver, destinationResolver, rightsResolver: async id => defaultSourceRightsRegistry.require(id) });
  const historyService = new ManualCurrentPriceHistoryService({ historicalRepository, rightsRegistry: defaultSourceRightsRegistry });
  const routineProcessingService = new RoutineManualCurrentPriceProcessingService({ preparationRepository, snapshotExecutionService, executionRepository, snapshotRepository, historyService, productResolver, retailerResolver, destinationResolver });
  const manualPriceEntryService = new ForgeManualPriceEntryService({ preparationRepository, routineProcessingService, snapshotRepository, listProducts: () => productRepository.getAll(), listRetailers: () => retailerRepository.getAll(), listDestinations: () => destinationRepository.getAll() });
  const service = new ForgeTrustedOperatorService({ auditRepository: new FileForgeOperatorAuditRepository({ statePath: auditPath }), manualPriceEntryService });
  trustedRuntime = new ForgeTrustedOperatorHttpRuntime({ service, operatorId, allowedOrigin: `http://127.0.0.1:${port}`, trustedLaunch: process.env.FORGE_OPERATOR_TRUSTED_LAUNCH === "1" });
}

function targetFor(url) {
  if (url.pathname.startsWith("/images/")) { const target = resolve(publicImages, `.${normalize(url.pathname.slice("/images".length))}`); return within(publicImages, target) ? target : null; }
  const target = resolve(forgeRoot, `.${normalize(url.pathname === "/" ? "/index.html" : url.pathname)}`);
  return within(forgeRoot, target) ? target : null;
}

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store"); response.setHeader("X-Content-Type-Options", "nosniff"); response.setHeader("X-Frame-Options", "DENY");
  if (trustedRuntime && request.url === "/" && request.method === "GET") trustedRuntime.establishTrustedLaunch(request, response);
  if (request.url === "/operator-api/health" && request.method === "GET") { response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }); return response.end(JSON.stringify({ status: "READY", mode: trustedRuntime ? "TRUSTED" : "READ_ONLY", loopback: true, runtimeRevision, processId: process.pid, capabilities: trustedRuntime ? ["MANUAL_CURRENT_PRICE_PROCESS"] : [] })); }
  if (trustedRuntime && request.url.startsWith("/operator-api/")) { await trustedRuntime.handle(request, response); return; }
  if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405, { Allow: "GET, HEAD" }); return response.end("Operator API unavailable"); }
  const target = targetFor(new URL(request.url, "http://127.0.0.1"));
  try { if (!target) throw new Error(); await access(target); if (!(await stat(target)).isFile()) throw new Error(); response.writeHead(200, { "Content-Type": mime.get(extname(target).toLowerCase()) ?? "application/octet-stream" }); if (request.method === "HEAD") return response.end(); createReadStream(target).pipe(response); }
  catch { response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Not found"); }
});

server.listen(port, "127.0.0.1", () => { const actualPort = server.address().port; console.log(`${trustedRuntime ? "Forge trusted operator" : "Forge operator preview"}: http://127.0.0.1:${actualPort}/`); });
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => server.close(() => process.exit(0)));
