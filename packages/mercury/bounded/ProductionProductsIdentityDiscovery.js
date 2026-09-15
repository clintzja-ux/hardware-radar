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
import { loadRetailerDestinationSource } from "../destinations/RetailerDestinationSource.js";
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
import { createBoundedSpendProgressionResolver } from "./BoundedSpendProgression.js";
import { FileSingleWriterRunLock } from "../runtime/FileSingleWriterRunLock.js";
import { TasklessChildAuthorityDispositionService } from "./TasklessChildAuthorityDisposition.js";
import { amazonAcceptanceDigest } from "../amazon-dataforseo/AmazonHistoricalAcceptancePreparation.js";
import crypto from "node:crypto";

/** Composition root only. All decisions and durable writes remain with certified owners. */
export function createProductionProductsIdentityDiscoveryService({
  stateRoot=path.resolve(".forge-review/mercury/products-identity-discovery"), acquisitionRoot=path.resolve(".forge-review/acquisition"), mercuryRoot=path.resolve(".forge-review/mercury"), destinationSourcePath=path.resolve("packages/mercury/destinations/production-destinations.json"),
  productRepository,retailerRepository,destinationRepository,historicalRepository,evidenceRepository,boundedRepository,childArtifactRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,amazonArtifactRepository,amazonActionRepository,
  rightsRegistry=defaultSourceRightsRegistry,googleIdentityResolver,readinessOwner,sourceOwners,spendResolver,runLock,now=()=>new Date().toISOString(),credentialLoader,httpTransport,acquisitionService
}={}){
  const readJson=async resource=>JSON.parse(await readFile(resource,"utf8"));
  productRepository??=new ProductRepository({readJson});retailerRepository??=new RetailerRepository({readJson});
  evidenceRepository??=new FileDataForSeoMarketEvidenceRepository({statePath:path.join(acquisitionRoot,"dataforseo-market-evidence.json")});
  historicalRepository??=new FileHistoricalObservationRepository({statePath:path.join(mercuryRoot,"historical-observations.json")});
  if(!destinationRepository){let sourcePromise;destinationRepository=Object.freeze({async getAll(){sourcePromise??=Promise.all([productRepository.getAll(),retailerRepository.getAll()]).then(([products,retailers])=>loadRetailerDestinationSource({sourcePath:destinationSourcePath,products,retailers}));return(await sourcePromise).records;}});}
  boundedRepository??=new SqliteNeutralBoundedRepository({databasePath:path.join(stateRoot,"identity-discovery.sqlite")});
  childArtifactRepository??=new FileDataForSeoPrepareArtifactRepository({statePath:path.join(stateRoot,"child-authorization-artifacts.json")});
  taskLedger??=new FileDataForSeoTaskLedger(path.join(acquisitionRoot,"dataforseo-task-ledger.json"));
  executionRepository??=new FileAcquisitionExecutionLedgerRepository({filePath:path.join(acquisitionRoot,"execution-ledger.json")});
  consumptionRepository??=new FileLiveAuthorizationConsumptionRepository({filePath:path.join(acquisitionRoot,"live-authorization-consumptions.json")});
  resultRepository??=new FileHistoricalBootstrapProviderResultRepository({statePath:path.join(stateRoot,"canonical-provider-results.json")});
  amazonArtifactRepository??=new FileAmazonHistoricalAcceptanceRepository({statePath:path.join(mercuryRoot,"amazon-acceptance-artifacts.json")});
  amazonActionRepository??=new FileAmazonAcceptanceActionRepository({statePath:path.join(mercuryRoot,"amazon-acceptance-actions.json")});
  googleIdentityResolver??=new GovernedProviderIdentityResolver({historicalRepository,evidenceRepository,neutralFinalizationRepository:resultRepository});
  spendResolver??=(evaluationTime=>readGovernedSpendForUtcDay({executionRepository,evaluationTime}));
  const atlas={products:productRepository};
  readinessOwner??=new ProductsIdentityDiscoveryReadinessOwner({productRepository,rightsRegistry,googleIdentityResolver,amazonArtifactRepository,amazonActionRepository});
  const boundedSpendProgressionResolver=createBoundedSpendProgressionResolver({boundedRepository,executionRepository});
  runLock??=new FileSingleWriterRunLock({lockPath:path.join(acquisitionRoot,"mercury-acquisition.lock")});
  sourceOwners??={
    DATAFORSEO_GOOGLE_SHOPPING:createProductionGoogleProductsDiscoverySourceOwner({atlas,boundedRepository,childArtifactRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,rightsRegistry,boundedSpendProgressionResolver,credentialLoader,httpTransport,acquisitionService,runLock,stateRoot:acquisitionRoot,now}),
    DATAFORSEO_AMAZON:createProductionAmazonProductsDiscoverySourceOwner({atlas,destinationRepository,historicalRepository,boundedRepository,artifactRepository:amazonArtifactRepository,actionRepository:amazonActionRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,rightsRegistry,spendResolver,boundedSpendProgressionResolver,credentialLoader,httpTransport,acquisitionService,runLock,stateRoot:acquisitionRoot,now})
  };
  const domainAdapter=new ProductsIdentityDiscoveryDomainAdapter({productRepository,readinessOwner,rightsRegistry,sourceOwners,boundedRepository,childAuthorizationArtifactRepository:childArtifactRepository,now});
  const coordinator=new NeutralBoundedPaidActionCoordinator({repository:boundedRepository,domainAdapter,spendResolver,now,dailySpendCeilingUsd:.025,policyVersion:PRODUCTS_DISCOVERY_POLICY_VERSION,idPrefixes:{plan:"mer_iddiscplan",authorization:"mer_iddiscauth",run:"mer_iddiscrun"}}),service=new ProductsIdentityDiscoveryService({coordinator});
  const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value),sha=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
  const lineageResolver=async({member,child})=>{
    let authorization,authorizationArtifactId=null,authorizationArtifactDigest=null,taskMatches;
    if(member.source==="DATAFORSEO_GOOGLE_SHOPPING"){
      const artifact=await childArtifactRepository.getByBoundedMember(child.parentAuthorizationId,member.memberKey);if(!artifact)throw new Error("TASKLESS_DISPOSITION_AUTHORIZATION_ARTIFACT_NOT_FOUND");authorization=artifact.authorizationRequest;authorizationArtifactId=artifact.prepareArtifactId;authorizationArtifactDigest=artifact.bindingDigest;
      const execution=authorization.plan.decisions[0].execution,payload={keyword:execution.keyword,locationName:execution.locationName,languageName:execution.languageName},requestKey=crypto.createHash("sha256").update(JSON.stringify([member.source,"PRODUCTS",payload])).digest("hex");taskMatches=(await taskLedger.getAll()).filter(value=>value.requestKey===requestKey&&value.kind==="PRODUCTS"&&value.sourceId===member.source);
    }else if(member.source==="DATAFORSEO_AMAZON"){
      authorization=await amazonActionRepository.getAuthorization(child.childAuthorizationId);if(!authorization)throw new Error("TASKLESS_DISPOSITION_AUTHORIZATION_ARTIFACT_NOT_FOUND");authorizationArtifactId=authorization.artifactId;authorizationArtifactDigest=authorization.artifactBindingDigest;const execution=authorization.plan.decisions[0].execution;taskMatches=(await taskLedger.getAll()).filter(value=>value.kind==="AMAZON_PRODUCTS"&&value.checkpointId===authorization.artifactId&&value.requestDigest===execution.requestDigest&&value.paidActionIntentId===execution.paidActionIntentId);
    }else throw new Error("TASKLESS_DISPOSITION_SOURCE_UNSUPPORTED");
    const authorizationDigest=member.source==="DATAFORSEO_AMAZON"?amazonAcceptanceDigest(authorization):sha(authorization),authorizationPlanId=authorization.plan.planId,executions=(await executionRepository.getAll()).filter(value=>value.planId===authorizationPlanId),results=(await resultRepository.getAllCanonicalResults()).filter(value=>taskMatches.some(task=>task.taskId===value.providerTaskId)||value.paidActionIntentId===(authorization.plan.decisions[0].execution.paidActionIntentId??authorization.requestId)||value.acquisitionReferenceId===member.domainMemberId);
    return{authorizationId:authorization.authorizationId??authorization.requestId,authorizationDigest,authorizationPlanId,expiresAt:authorization.expiresAt,authorizationArtifactId,authorizationArtifactDigest,tasks:taskMatches,executions,results};
  };
  const tasklessDispositionService=new TasklessChildAuthorityDispositionService({boundedRepository,consumptionRepository,lineageResolver,runLock,now});
  return Object.freeze({service,prepareDiscovery:input=>service.prepare(input),inspectDiscovery:input=>service.inspect(input),authorizeDiscovery:input=>service.authorize(input),startDiscovery:input=>service.start(input),resumeDiscovery:input=>service.resume(input),assessTasklessDisposition:input=>tasklessDispositionService.assess(input),disposeTasklessChild:input=>tasklessDispositionService.dispose(input),tasklessDispositionService,readinessOwner,coordinator,repositories:Object.freeze({boundedRepository,taskLedger,executionRepository,resultRepository})});
}
