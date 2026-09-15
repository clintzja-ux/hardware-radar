import path from "node:path";
import { readFile } from "node:fs/promises";
import { ProductRepository, RetailerRepository } from "../../atlas/index.js";
import { FileDataForSeoTaskLedger } from "../acquisition/dataforseo/FileDataForSeoTaskLedger.js";
import { FileAcquisitionExecutionLedgerRepository } from "../acquisition/execution/FileAcquisitionExecutionLedgerRepository.js";
import { FileLiveAuthorizationConsumptionRepository } from "../acquisition/authorization/FileLiveAuthorizationConsumptionRepository.js";
import { FileDataForSeoPrepareArtifactRepository } from "../acquisition/operations/FileDataForSeoPrepareArtifactRepository.js";
import { readGovernedSpendForUtcDay } from "../acquisition/planning/GovernedDailySpend.js";
import { GovernedProviderIdentityResolver } from "../acquisition/portfolio/ProductionAcquisitionPortfolio.js";
import { FileDataForSeoMarketEvidenceRepository } from "../market/dataforseo/persistence/FileDataForSeoMarketEvidenceRepository.js";
import { FileHistoricalObservationRepository } from "../historical-admission/persistence/FileHistoricalObservationRepository.js";
import { FileRetailerDestinationRepository } from "../destinations/FileRetailerDestinationRepository.js";
import { FileAmazonHistoricalAcceptanceRepository } from "../amazon-dataforseo/FileAmazonHistoricalAcceptanceRepository.js";
import { FileAmazonAcceptanceActionRepository } from "../amazon-dataforseo/FileAmazonAcceptanceActionRepository.js";
import { FileHistoricalBootstrapProviderResultRepository } from "../portfolio/FileHistoricalBootstrapProviderResultRepository.js";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { NeutralBoundedPaidActionCoordinator } from "./NeutralBoundedPaidActionCoordinator.js";
import { SqliteNeutralBoundedRepository } from "./SqliteNeutralBoundedRepository.js";
import { ProductsIdentityDiscoveryDomainAdapter, ProductsIdentityDiscoveryService, PRODUCTS_DISCOVERY_POLICY_VERSION } from "./ProductsIdentityDiscoveryDomainAdapter.js";
import { ProductsIdentityDiscoveryReadinessOwner } from "./ProductsIdentityDiscoveryReadinessOwner.js";
import { createProductionGoogleProductsDiscoverySourceOwner } from "./ProductionGoogleProductsDiscoverySourceOwner.js";
import { createProductionAmazonProductsDiscoverySourceOwner } from "../amazon-dataforseo/ProductionAmazonProductsDiscoverySourceOwner.js";

/** Composition root only. All decisions and durable writes remain with certified owners. */
export function createProductionProductsIdentityDiscoveryService({
  stateRoot=path.resolve(".forge-review/mercury/products-identity-discovery"), acquisitionRoot=path.resolve(".forge-review/acquisition"), mercuryRoot=path.resolve(".forge-review/mercury"),
  productRepository,retailerRepository,destinationRepository,historicalRepository,evidenceRepository,boundedRepository,childArtifactRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,amazonArtifactRepository,amazonActionRepository,
  rightsRegistry=defaultSourceRightsRegistry,googleIdentityResolver,readinessOwner,sourceOwners,spendResolver,now=()=>new Date().toISOString(),credentialLoader,httpTransport,acquisitionService
}={}){
  const readJson=async resource=>JSON.parse(await readFile(resource,"utf8"));
  productRepository??=new ProductRepository({readJson});retailerRepository??=new RetailerRepository({readJson});
  evidenceRepository??=new FileDataForSeoMarketEvidenceRepository({statePath:path.join(acquisitionRoot,"dataforseo-market-evidence.json")});
  historicalRepository??=new FileHistoricalObservationRepository({statePath:path.join(mercuryRoot,"historical-observations.json")});
  destinationRepository??=new FileRetailerDestinationRepository({statePath:path.resolve("packages/mercury/destinations/production-destinations.json"),productRepository,retailerRepository});
  boundedRepository??=new SqliteNeutralBoundedRepository({databasePath:path.join(stateRoot,"identity-discovery.sqlite")});
  childArtifactRepository??=new FileDataForSeoPrepareArtifactRepository({statePath:path.join(stateRoot,"child-authorization-artifacts.json")});
  taskLedger??=new FileDataForSeoTaskLedger(path.join(acquisitionRoot,"dataforseo-task-ledger.json"));
  executionRepository??=new FileAcquisitionExecutionLedgerRepository({filePath:path.join(acquisitionRoot,"execution-ledger.json")});
  consumptionRepository??=new FileLiveAuthorizationConsumptionRepository({filePath:path.join(acquisitionRoot,"live-authorization-consumptions.json")});
  resultRepository??=new FileHistoricalBootstrapProviderResultRepository({statePath:path.join(stateRoot,"canonical-provider-results.json")});
  amazonArtifactRepository??=new FileAmazonHistoricalAcceptanceRepository({statePath:path.join(mercuryRoot,"amazon-acceptance-artifacts.json")});
  amazonActionRepository??=new FileAmazonAcceptanceActionRepository({statePath:path.join(mercuryRoot,"amazon-acceptance-actions.json")});
  googleIdentityResolver??=new GovernedProviderIdentityResolver({historicalRepository,evidenceRepository});
  spendResolver??=(evaluationTime=>readGovernedSpendForUtcDay({executionRepository,evaluationTime}));
  const atlas={products:productRepository};
  readinessOwner??=new ProductsIdentityDiscoveryReadinessOwner({productRepository,rightsRegistry,googleIdentityResolver,amazonArtifactRepository,amazonActionRepository});
  sourceOwners??={
    DATAFORSEO_GOOGLE_SHOPPING:createProductionGoogleProductsDiscoverySourceOwner({atlas,boundedRepository,childArtifactRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,rightsRegistry,credentialLoader,httpTransport,acquisitionService,stateRoot:acquisitionRoot,now}),
    DATAFORSEO_AMAZON:createProductionAmazonProductsDiscoverySourceOwner({atlas,destinationRepository,historicalRepository,boundedRepository,artifactRepository:amazonArtifactRepository,actionRepository:amazonActionRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,rightsRegistry,spendResolver,credentialLoader,httpTransport,acquisitionService,stateRoot:acquisitionRoot,now})
  };
  const domainAdapter=new ProductsIdentityDiscoveryDomainAdapter({productRepository,readinessOwner,rightsRegistry,sourceOwners,boundedRepository,childAuthorizationArtifactRepository:childArtifactRepository,now});
  const coordinator=new NeutralBoundedPaidActionCoordinator({repository:boundedRepository,domainAdapter,spendResolver,now,dailySpendCeilingUsd:.025,policyVersion:PRODUCTS_DISCOVERY_POLICY_VERSION,idPrefixes:{plan:"mer_iddiscplan",authorization:"mer_iddiscauth",run:"mer_iddiscrun"}}),service=new ProductsIdentityDiscoveryService({coordinator});
  return Object.freeze({service,prepareDiscovery:input=>service.prepare(input),inspectDiscovery:input=>service.inspect(input),authorizeDiscovery:input=>service.authorize(input),startDiscovery:input=>service.start(input),resumeDiscovery:input=>service.resume(input),readinessOwner,coordinator,repositories:Object.freeze({boundedRepository,taskLedger,executionRepository,resultRepository})});
}
