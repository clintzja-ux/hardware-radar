import path from "node:path";
import {readFile} from "node:fs/promises";
import {ProductRepository} from "../packages/atlas/index.js";
import {FileAmazonAcceptanceActionRepository,FileAmazonHistoricalAcceptanceRepository,FileDataForSeoMarketEvidenceRepository,FileHistoricalObservationRepository,createProductionRepeatObservationIdentityResolvers,createProductionRepeatObservationService} from "../packages/mercury/index.js";

export const parseRepeatArgs=(values=process.argv.slice(2))=>new Map(values.map(value=>{const i=value.indexOf("=");return i<0?[value,true]:[value.slice(0,i),value.slice(i+1)];}));
export function createRepeatObservationRuntime(args,{now,taskOwners,retrievalOwners,processingOwners,historicalAdmissionOwner,taskResolver,credentialLoader,httpTransport}={}){
 const location=(key,fallback)=>path.resolve(String(args.get(key)||fallback)),readJson=async resource=>JSON.parse(await readFile(resource,"utf8"));
 const productRepository=new ProductRepository({readJson}),amazonArtifactRepository=new FileAmazonHistoricalAcceptanceRepository({statePath:location("--amazon-acceptance-state",".forge-review/mercury/amazon-acceptance-artifacts.json")}),amazonActionRepository=new FileAmazonAcceptanceActionRepository({statePath:location("--amazon-action-state",".forge-review/mercury/amazon-acceptance-actions.json")}),evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:location("--evidence-state",".forge-review/acquisition/dataforseo-market-evidence.json")}),historicalRepository=new FileHistoricalObservationRepository({statePath:location("--historical-state",".forge-review/mercury/historical-observations.json")});
 const identityResolvers=createProductionRepeatObservationIdentityResolvers({amazonArtifactRepository,amazonActionRepository,evidenceRepository,historicalRepository});
 return createProductionRepeatObservationService({stateRoot:location("--acquisition-root",".forge-review/acquisition"),databasePath:location("--repeat-state",".forge-review/mercury/repeat-observations.sqlite"),productRepository,identityResolvers,taskOwners,retrievalOwners,processingOwners,historicalAdmissionOwner,taskResolver,now,credentialLoader,httpTransport});
}
