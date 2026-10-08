import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { FileAmazonAcceptanceActionRepository } from "../packages/mercury/amazon-dataforseo/FileAmazonAcceptanceActionRepository.js";
import { FileHistoricalBootstrapProviderResultRepository } from "../packages/mercury/portfolio/FileHistoricalBootstrapProviderResultRepository.js";
import { defaultSourceRightsRegistry } from "../packages/mercury/rights/SourceRightsRegistry.js";
import { loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { AmazonDestinationProgressionService } from "../packages/mercury/destinations/AmazonDestinationProgression.js";

const pairs=process.argv.slice(2).filter(x=>x.startsWith("--assessment=")).map(x=>x.slice(13).split(":"));
if(!pairs.length||pairs.some(x=>x.length!==2||!x[0]||!x[1]))throw new Error("AMAZON_DESTINATION_ASSESSMENTS_REQUIRED");
const readJson=async resource=>JSON.parse(await readFile(resource,"utf8")),products=new ProductRepository({readJson}),retailers=new RetailerRepository({readJson});
const [allProducts,allRetailers]=await Promise.all([products.getAll(),retailers.getAll()]);
const source=await loadRetailerDestinationSource({sourcePath:path.resolve("packages/mercury/destinations/production-destinations.json"),products:allProducts,retailers:allRetailers});
const destinationRepository={getAll:async()=>source.effective};
const service=new AmazonDestinationProgressionService({productRepository:products,retailerRepository:retailers,identityRepository:new FileAmazonAcceptanceActionRepository({statePath:path.resolve(".forge-review/mercury/amazon-acceptance-actions.json")}),resultRepository:new FileHistoricalBootstrapProviderResultRepository({statePath:path.resolve(".forge-review/mercury/products-identity-discovery/canonical-provider-results.json")}),rightsRegistry:defaultSourceRightsRegistry,destinationRepository});
const preparations=[];for(const [atlasProductId,assessmentId] of pairs)preparations.push(await service.prepare({atlasProductId,assessmentId}));
const artifact={schemaVersion:"1.0",artifactType:"AMAZON_DESTINATION_OPERATOR_REVIEW_QUEUE",policyVersion:preparations[0].policyVersion,preparations,counts:{requested:preparations.length,reviewRequired:preparations.filter(x=>x.reviewRequired).length,alreadyBound:preparations.filter(x=>x.qualification==="ALREADY_BOUND").length},networkOperation:"NONE",canonicalDestinationCreated:false,currentAuthority:false,historicalAuthority:false,publicationAuthority:false,actualSpendUsd:0};
const output=path.resolve(".forge-review/mercury/amazon-destination-review-preparations.json");await mkdir(path.dirname(output),{recursive:true});await writeFile(output,`${JSON.stringify(artifact,null,2)}\n`);console.log(JSON.stringify({output,...artifact.counts,networkOperation:"NONE",actualSpendUsd:0},null,2));
