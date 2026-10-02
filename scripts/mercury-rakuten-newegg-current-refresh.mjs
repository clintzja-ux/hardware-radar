import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { FileCurrentDisplaySnapshotRepository, ProductionRakutenNeweggCurrentRefreshService, validateRakutenProductCatalogGzip } from "../packages/mercury/current-display/index.js";
import { loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { defaultSourceRightsRegistry } from "../packages/mercury/rights/SourceRightsRegistry.js";

const values=process.argv.slice(2),args = new Map(values.map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
const catalogPaths=values.filter(value=>value.startsWith("--catalog-file=")).map(value=>value.slice("--catalog-file=".length)),evaluatedAt = args.get("--evaluated-at"), mode = args.get("--mode") ?? "dry-run";
if (!catalogPaths.length || !Number.isFinite(Date.parse(evaluatedAt)) || !["dry-run", "execute"].includes(mode)) throw new Error("RAKUTEN_CURRENT_REFRESH_COMMAND_INPUT_INVALID");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"));
const sha256File = async filePath => { const hash=crypto.createHash("sha256"); for await(const chunk of createReadStream(filePath)) hash.update(chunk); return hash.digest("hex"); };
const catalogFiles=[];let feedTimestamp=null;
for(const value of catalogPaths){const filePath=path.resolve(value),name=path.basename(filePath).toLowerCase(),identity=name.match(/^(\d+)_(\d+)_mp(?:_delta)?\.txt\.gz$/i),feedProfile=name.endsWith("_mp_delta.txt.gz")?"MAIN_DELTA":name.endsWith("_mp.txt.gz")?"MAIN_FULL":null;if(!feedProfile||!identity)throw new Error("RAKUTEN_CATALOG_FILE_PROFILE_INVALID");const feedFamilyKey=`RAKUTEN_MAIN:${identity[1]}:${identity[2]}`,parsed=await validateRakutenProductCatalogGzip(createReadStream(filePath),{feedProfile,feedFamilyKey}),header=parsed.records.find(record=>record.recordType==="HDR");if(!header)throw new Error("RAKUTEN_CATALOG_HEADER_REQUIRED");catalogFiles.push({feedProfile,records:parsed.records,filename:name,artifactDigest:await sha256File(filePath),headerTimestamp:header.feedTimestamp,feedFamilyKey});feedTimestamp=header.feedTimestamp;}
const service = new ProductionRakutenNeweggCurrentRefreshService({
  productRepository: new ProductRepository({ readJson }),
  retailerRepository: new RetailerRepository({ readJson }),
  destinationSourceLoader: loadRetailerDestinationSource,
  destinationSourcePath: path.join(root, "packages", "mercury", "destinations", "production-destinations.json"),
  snapshotRepository: new FileCurrentDisplaySnapshotRepository({ statePath: path.join(root, ".forge-review", "retail-display", "current-display-snapshots.json") }),
  rightsRegistry: defaultSourceRightsRegistry
});
const result = await service.run({ catalogFiles, feedTimestamp, evaluatedAt, dryRun: mode === "dry-run" });
console.log(JSON.stringify({ operation: result.operation, mode: result.mode, catalogBindingDigest: result.catalogBindingDigest, portfolioId: result.portfolioId, refreshRunId: result.refreshRunId, summary: result.summary, exceptions: result.exceptions, persistence: result.persistence, historicalObservationsCreated: 0, publicationCandidatesCreated: 0, publicationAuthorizationsCreated: 0, artifactsCreated: 0, providerCalls: 0, paidTasks: 0, actualSpendUsd: 0 }, null, 2));
