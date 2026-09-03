import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ProductRepository } from "../packages/atlas/index.js";
import { defaultSourceRightsRegistry, FileAcquisitionExecutionLedgerRepository, FileDataForSeoMarketEvidenceRepository, FileHistoricalObservationRepository, FileAcquisitionPortfolioRepository, FileAcquisitionCheckpointRepository, GovernedProviderIdentityResolver, ProductionAcquisitionPortfolioPrepareService } from "../packages/mercury/index.js";

export function parsePortfolioArgs(values=process.argv.slice(2)){return new Map(values.map(value=>{const i=value.indexOf("=");return i<0?[value,true]:[value.slice(0,i),value.slice(i+1)];}));}
export function createProductionPortfolioRuntime(args,{readJson=async resource=>JSON.parse(await readFile(resource instanceof URL?fileURLToPath(resource):resource,"utf8"))}={}){
  const location=(name,fallback)=>path.resolve(String(args.get(name)||fallback));
  const productRepository=new ProductRepository({readJson});
  const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:location("--evidence-state",".forge-review/acquisition/dataforseo-market-evidence.json")});
  const historicalRepository=new FileHistoricalObservationRepository({statePath:location("--historical-state",".forge-review/mercury/historical-observations.json")});
  const executionRepository=new FileAcquisitionExecutionLedgerRepository({filePath:location("--execution-ledger",".forge-review/acquisition/execution-ledger.json")});
  const portfolioRepository=new FileAcquisitionPortfolioRepository({rootPath:location("--portfolio-state-root",".forge-review/mercury/acquisition-portfolios")});
  const checkpointRepository=new FileAcquisitionCheckpointRepository({rootPath:location("--portfolio-state-root",".forge-review/mercury/acquisition-portfolios")});
  const providerIdentityResolver=new GovernedProviderIdentityResolver({historicalRepository,evidenceRepository});
  const service=new ProductionAcquisitionPortfolioPrepareService({atlas:{products:productRepository},rightsRegistry:defaultSourceRightsRegistry,providerIdentityResolver,executionRepository,portfolioRepository});
  return {service,portfolioRepository,checkpointRepository,productRepository,evidenceRepository,historicalRepository,executionRepository,providerIdentityResolver};
}
