import { readFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../../atlas/index.js";
import { loadRetailerDestinationSource } from "../destinations/RetailerDestinationSource.js";
import { FileHistoricalObservationRepository } from "../historical-admission/persistence/FileHistoricalObservationRepository.js";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { FileCurrentDisplaySnapshotRepository } from "./FileCurrentDisplaySnapshotRepository.js";
import { FileManualCurrentPricePreparationRepository } from "./FileManualCurrentPricePreparationRepository.js";
import { FileManualCurrentPriceSnapshotExecutionRepository } from "./FileManualCurrentPriceSnapshotExecutionRepository.js";
import { ManualCurrentPriceHistoryService } from "./ManualCurrentPriceHistory.js";
import { ManualCurrentPriceSnapshotExecutionService } from "./ManualCurrentPriceSnapshotExecution.js";
import { RoutineManualCurrentPriceProcessingService } from "./RoutineManualCurrentPriceProcessing.js";

export async function createProductionRoutineManualCurrentPriceProcessingService({ root = process.cwd(), now } = {}) {
  const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
  const products = await new ProductRepository({ readJson }).getAll(), retailers = await new RetailerRepository({ readJson }).getAll();
  const destinations = (await loadRetailerDestinationSource({ sourcePath: path.resolve(root, "packages/mercury/destinations/production-destinations.json"), products, retailers })).effective;
  const preparationRepository = new FileManualCurrentPricePreparationRepository({ filePath: path.resolve(root, ".forge-review/retail-display/manual-current-price-preparations.json") });
  const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: path.resolve(root, ".forge-review/retail-display/current-display-snapshots.json") });
  const executionRepository = new FileManualCurrentPriceSnapshotExecutionRepository({ filePath: path.resolve(root, ".forge-review/retail-display/manual-current-price-snapshot-executions.json") });
  const productResolver = async id => products.find(value => value.identity.atlasProductId === id) ?? null, retailerResolver = async id => retailers.find(value => value.id === id) ?? null, destinationResolver = async id => destinations.find(value => value.destinationId === id) ?? null;
  const snapshotExecutionService = new ManualCurrentPriceSnapshotExecutionService({ preparationRepository, snapshotRepository, executionRepository, productResolver, retailerResolver, destinationResolver, rightsResolver: async id => defaultSourceRightsRegistry.require(id), ...(now ? { now } : {}) });
  const historyService = new ManualCurrentPriceHistoryService({ historicalRepository: new FileHistoricalObservationRepository({ statePath: path.resolve(root, ".forge-review/mercury/historical-observations.json") }), rightsRegistry: defaultSourceRightsRegistry, ...(now ? { now } : {}) });
  return new RoutineManualCurrentPriceProcessingService({ preparationRepository, snapshotExecutionService, executionRepository, snapshotRepository, historyService, productResolver, retailerResolver, destinationResolver, ...(now ? { now } : {}) });
}
