import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { FileCurrentDisplaySnapshotRepository, readManualCurrentPriceWorkbookRows } from "../packages/mercury/current-display/index.js";
import { loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { FileHistoricalObservationRepository } from "../packages/mercury/historical-admission/persistence/FileHistoricalObservationRepository.js";
import { createForgeProductManagerProjection, writeCertifiedMercuryOperationsArtifact } from "../packages/mercury/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
const asOf = String(args.get("--as-of") ?? "");
if (!Number.isFinite(Date.parse(asOf))) throw new Error("--as-of=<ISO_TIMESTAMP> is required");
const stateRoot = path.resolve(String(args.get("--state-root") ?? ".forge-review"));
const readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"));
const products = await new ProductRepository({ readJson }).getAll();
const retailers = await new RetailerRepository({ readJson }).getAll();
const destinationSource = await loadRetailerDestinationSource({ sourcePath: path.resolve("packages/mercury/destinations/production-destinations.json"), products, retailers });
const currentState = await new FileCurrentDisplaySnapshotRepository({ statePath: path.join(stateRoot, "retail-display/current-display-snapshots.json") }).getState();
const historicalObservations = await new FileHistoricalObservationRepository({ statePath: path.join(stateRoot, "mercury/historical-observations.json") }).getAll();
let affiliateRows = [];
try { affiliateRows = await readManualCurrentPriceWorkbookRows({ workbookPath: path.join(stateRoot, "retail-display/hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx") }); }
catch (error) { if (error?.code !== "ENOENT") throw error; }
const projection = createForgeProductManagerProjection({ asOf, products, destinationSource, currentSnapshot: currentState.current, historicalObservations, affiliateRows });
const output = path.resolve(String(args.get("--output") ?? path.join(stateRoot, "forge/product-manager.json")));
await writeCertifiedMercuryOperationsArtifact(output, projection);
console.log("FORGE PRODUCT MANAGER EXPORT");
console.log("");
console.log("Artifact:                 ", output);
console.log("Atlas products:           ", projection.summary.productCount);
console.log("Effective destinations:   ", projection.summary.destinationCount);
console.log("Products with Current:    ", projection.summary.productsWithCurrent);
console.log("Products with History:    ", projection.summary.productsWithHistory);
console.log("Products missing URLs:    ", projection.summary.productsMissingDestinations);
console.log("Mutation authorized:       NO");
console.log("Network operation:         NONE");
console.log("Canonical state modified:  NO");
