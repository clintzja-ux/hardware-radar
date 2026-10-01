import { readFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { defaultSourceRightsRegistry } from "../packages/mercury/rights/SourceRightsRegistry.js";
import { loadRetailerDestinationSource } from "../packages/mercury/destinations/RetailerDestinationSource.js";
import { FileCurrentDisplaySnapshotRepository, FileManualCurrentPricePreparationRepository, prepareManualCurrentPriceObservation, readManualCurrentPriceWorkbookRow, selectManualCurrentPriceWorkbookObservation } from "../packages/mercury/current-display/index.js";

const args=Object.fromEntries(process.argv.slice(2).map(value=>{const match=/^--([^=]+)=(.*)$/.exec(value);if(!match)throw new Error(`ARGUMENT_INVALID:${value}`);return[match[1],match[2]];}));
const workbookMode=Boolean(args.workbook||args["atlas-product-id"]);
if(!args["prepared-at"]||(args.input&&workbookMode)||(!workbookMode&&!args.input)||(workbookMode&&(!args.workbook||!args["atlas-product-id"]||!args.retailer)))throw new Error("USAGE: --input=<json-file> --prepared-at=<iso-time> OR --workbook=<xlsx-file> --atlas-product-id=<id> --retailer=<AMAZON|NEWEGG> --prepared-at=<iso-time>");
const readJson=async resource=>JSON.parse(await readFile(resource,"utf8"));
const products=new ProductRepository({readJson}),retailers=new RetailerRepository({readJson});
const [allProducts,allRetailers]=await Promise.all([products.getAll(),retailers.getAll()]);
const retailerKey=(args.retailer??"").toUpperCase();
const input=workbookMode
  ? selectManualCurrentPriceWorkbookObservation({row:await readManualCurrentPriceWorkbookRow({workbookPath:path.resolve(args.workbook),atlasProductId:args["atlas-product-id"]}),retailer:retailerKey}).preparationInput
  : await readJson(path.resolve(args.input));
const source=await loadRetailerDestinationSource({sourcePath:path.resolve("packages/mercury/destinations/production-destinations.json"),products:allProducts,retailers:allRetailers});
const effectiveRetailerKey=(input.retailer??args.retailer??"NEWEGG").toUpperCase(),retailerId=effectiveRetailerKey==="AMAZON"?"RETAILER-0001":effectiveRetailerKey==="NEWEGG"?"RETAILER-0004":null;
if(!retailerId)throw new Error("MANUAL_CURRENT_PRICE_RETAILER_INVALID");
const sourceId=effectiveRetailerKey==="AMAZON"?"AMAZON_MANUAL_PUBLISHER_OBSERVATION":"NEWEGG_MANUAL_PUBLISHER_OBSERVATION";
const product=allProducts.find(value=>value.identity.atlasProductId===input.atlasProductId),retailer=allRetailers.find(value=>value.id===retailerId),destination=source.effective.find(value=>value.destinationId===input.destinationId);
const current=(await new FileCurrentDisplaySnapshotRepository({statePath:path.resolve(".forge-review/retail-display/current-display-snapshots.json")}).getState()).current;
const preparation=prepareManualCurrentPriceObservation({input,product,retailer,destination,rightsProfile:defaultSourceRightsRegistry.require(sourceId),preparedAt:args["prepared-at"],currentSnapshot:current});
const result=await new FileManualCurrentPricePreparationRepository({filePath:path.resolve(".forge-review/retail-display/manual-current-price-preparations.json")}).record(preparation);
console.log(JSON.stringify({status:result.status,preparationId:preparation.preparationId,authorizationState:preparation.authorizationState,itemPriceEligible:preparation.binding.itemPriceEligible,comparisonEligible:preparation.binding.comparisonEligible,networkOperation:preparation.networkOperation,paidTaskCreated:false,actualSpendUsd:0},null,2));
