import { readFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../../atlas/index.js";
import { loadRetailerDestinationSource } from "../destinations/RetailerDestinationSource.js";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { FileCurrentDisplaySnapshotRepository } from "./FileCurrentDisplaySnapshotRepository.js";
import { FileManualCurrentPricePreparationRepository } from "./FileManualCurrentPricePreparationRepository.js";
import { FileManualCurrentPriceSnapshotExecutionRepository } from "./FileManualCurrentPriceSnapshotExecutionRepository.js";
import { ManualCurrentPriceSnapshotExecutionService } from "./ManualCurrentPriceSnapshotExecution.js";

export async function createProductionManualCurrentPriceSnapshotExecutionService({ root = process.cwd(), now } = {}) {
  const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
  const products = await new ProductRepository({ readJson }).getAll(), retailers = await new RetailerRepository({ readJson }).getAll();
  const destinations = (await loadRetailerDestinationSource({ sourcePath: path.resolve(root, "packages/mercury/destinations/production-destinations.json"), products, retailers })).effective;
  return new ManualCurrentPriceSnapshotExecutionService({
    preparationRepository: new FileManualCurrentPricePreparationRepository({ filePath: path.resolve(root, ".forge-review/retail-display/manual-current-price-preparations.json") }),
    snapshotRepository: new FileCurrentDisplaySnapshotRepository({ statePath: path.resolve(root, ".forge-review/retail-display/current-display-snapshots.json") }),
    executionRepository: new FileManualCurrentPriceSnapshotExecutionRepository({ filePath: path.resolve(root, ".forge-review/retail-display/manual-current-price-snapshot-executions.json") }),
    productResolver: async id => products.find(value => value.identity.atlasProductId === id) ?? null,
    retailerResolver: async id => retailers.find(value => value.id === id) ?? null,
    destinationResolver: async id => destinations.find(value => value.destinationId === id) ?? null,
    rightsResolver: async id => defaultSourceRightsRegistry.require(id),
    ...(now ? { now } : {})
  });
}
