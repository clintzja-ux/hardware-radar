import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { FileAcquisitionExecutionLedgerRepository, FileHistoricalObservationRepository, FileAmazonHistoricalAcceptanceRepository, defaultSourceRightsRegistry, loadRetailerDestinationSource, readGovernedSpendForUtcDay } from "../packages/mercury/index.js";

export const parseArgs = (values = process.argv.slice(2)) => new Map(values.map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
export function createAmazonAcceptanceRuntime(args) {
  const location = (name, fallback) => path.resolve(String(args.get(name) || fallback));
  const readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"));
  const productRepository = new ProductRepository({ readJson }), retailerRepository = new RetailerRepository({ readJson });
  const historicalRepository = new FileHistoricalObservationRepository({ statePath: location("--historical-state", ".forge-review/mercury/historical-observations.json") });
  const executionRepository = new FileAcquisitionExecutionLedgerRepository({ filePath: location("--execution-ledger", ".forge-review/acquisition/execution-ledger.json") });
  const artifactRepository = new FileAmazonHistoricalAcceptanceRepository({ statePath: location("--acceptance-state", ".forge-review/mercury/amazon-acceptance-artifacts.json") });
  return { location, readJson, productRepository, retailerRepository, historicalRepository, executionRepository, artifactRepository, rightsRegistry: defaultSourceRightsRegistry, readGovernedSpendForUtcDay };
}

