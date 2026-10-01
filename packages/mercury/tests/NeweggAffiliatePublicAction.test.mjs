import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ProductRepository, RetailerRepository, createRamCatalogProjection } from "../../atlas/index.js";
import { createPublicRetailerDestinationProjection, loadRetailerDestinationSource } from "../destinations/RetailerDestinationSource.js";
import { FileCurrentDisplaySnapshotRepository } from "../current-display/FileCurrentDisplaySnapshotRepository.js";
import { createPublicCurrentRetailProjection } from "../current-display/PublicCurrentRetailProjection.js";
import { assessNeweggAffiliatePublicAction, createPublicRetailerActionProjection } from "../current-display/NeweggAffiliatePublicAction.js";
import { readManualCurrentPriceWorkbookRows } from "../current-display/ManualCurrentPriceWorkbookFile.js";
import { deriveCurrentDisplayPublicationEligibleSnapshot } from "../publication/CurrentDisplayPublication.js";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { createRamTerminalPublicIntelligence } from "../historical-admission/RamTerminalPublicIntelligence.js";

let cases = 0;
const destination = { destinationId:"mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa", atlasProductId:"ram_fixture_one", retailerId:"RETAILER-0004", retailerDisplayName:"Newegg", marketplace:"newegg.com", destinationUrl:"https://newegg.com/p/N82E16820000001", retailerListingId:"N82E16820000001", destinationType:"PRODUCT_PAGE" };
const affiliateUrl = `https://click.linksynergy.com/deeplink?id=operator-preserved&mid=44583&murl=${encodeURIComponent(destination.destinationUrl)}&u1=operator-preserved`;
const row = { atlasProductId:destination.atlasProductId, recordReviewedBy:"operator", neweggReference:{destinationId:destination.destinationId,listingId:destination.retailerListingId}, rakutenRouting:{affiliateUrl,status:"READY",checkedAt:"2026-09-30T21:00:00-05:00",reviewedBy:"operator"} };
const selected = createPublicRetailerActionProjection({ destinations:[destination], manualWorkbookRows:[row] });
assert.equal(selected[0].destinationUrl, affiliateUrl); cases++;
assert.equal(assessNeweggAffiliatePublicAction({row,destination}).eligible, true); cases++;
assert.equal(createPublicRetailerActionProjection({destinations:[destination],manualWorkbookRows:[{...row,rakutenRouting:{...row.rakutenRouting,affiliateUrl:null,status:"MISSING"}}]})[0].destinationUrl,destination.destinationUrl); cases++;
for (const invalidRow of [
  {...row,rakutenRouting:{...row.rakutenRouting,affiliateUrl:"https://example.com/not-newegg"}},
  {...row,atlasProductId:"ram_fixture_other"},
  {...row,neweggReference:{...row.neweggReference,listingId:"N82WRONG"}}
]) assert.equal(assessNeweggAffiliatePublicAction({row:invalidRow,destination}).eligible,false); cases+=3;
assert.equal(createPublicRetailerActionProjection({destinations:[destination],manualWorkbookRows:[{...row,rakutenRouting:{...row.rakutenRouting,affiliateUrl:"https://example.com/not-newegg"}}]})[0].destinationUrl,destination.destinationUrl); cases++;
assert.equal(createPublicRetailerActionProjection({destinations:[],manualWorkbookRows:[row]}).length,0); cases++;
assert.equal(selected[0].destinationUrl, affiliateUrl, "The operator URL must be preserved byte-for-byte."); cases++;
assert.equal(destination.destinationUrl,"https://newegg.com/p/N82E16820000001", "The ordinary governed URL must not be rewritten."); cases++;

const root = new URL("../../../", import.meta.url);
const workbookPath = fileURLToPath(new URL(".forge-review/retail-display/hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx", root));
const workbookBefore = createHash("sha256").update(await readFile(workbookPath)).digest("hex");
const readJson = async file => JSON.parse(await readFile(file,"utf8"));
const products = await new ProductRepository({readJson}).getAll(), retailers = await new RetailerRepository({readJson}).getAll();
const source = await loadRetailerDestinationSource({sourcePath:new URL("packages/mercury/destinations/production-destinations.json",root),products,retailers});
const ordinary = createPublicRetailerDestinationProjection({source,retailers});
const rows = await readManualCurrentPriceWorkbookRows({workbookPath});
const actions = createPublicRetailerActionProjection({destinations:ordinary,governedDestinations:source.effective,manualWorkbookRows:rows});
const ordinaryById = new Map(ordinary.map(value=>[value.destinationId,value])), actionById = new Map(actions.map(value=>[value.destinationId,value]));
const statePath = new URL(".forge-review/retail-display/current-display-snapshots.json",root);
const stateBytesBefore = await readFile(statePath);
const state = await new FileCurrentDisplaySnapshotRepository({statePath:fileURLToPath(statePath)}).getState();
const current = {...state.current,offers:state.current.offers.filter(offer=>offer?.sourceIdentity?.sourceId)};
const eligible = deriveCurrentDisplayPublicationEligibleSnapshot({snapshot:current,rightsRegistry:defaultSourceRightsRegistry});
const actionableNewegg = eligible.offers.filter(offer=>offer.retailerId==="RETAILER-0004" && rows.find(row=>row.atlasProductId===offer.atlasProductId)?.rakutenRouting?.affiliateUrl);
assert.equal(actionableNewegg.length,42); cases++;
assert.equal(actionableNewegg.filter(offer=>actionById.get(offer.destinationId)?.destinationUrl!==ordinaryById.get(offer.destinationId)?.destinationUrl).length,42); cases++;
assert.equal(actionableNewegg.filter(offer=>actionById.get(offer.destinationId)?.destinationUrl===ordinaryById.get(offer.destinationId)?.destinationUrl).length,0); cases++;
assert.equal(rows.filter(row=>row.rakutenRouting?.affiliateUrl && !ordinary.some(item=>item.atlasProductId===row.atlasProductId&&item.retailerId==="RETAILER-0004")).length,1); cases++;
assert.equal(actions.filter(item=>item.retailerId==="RETAILER-0004"&&item.destinationUrl!==ordinaryById.get(item.destinationId).destinationUrl).length,44); cases++;

const asOf="2026-10-01T06:10:00.000Z", ordinaryCurrent=createPublicCurrentRetailProjection({products,retailers,destinations:ordinary,currentSnapshot:eligible,asOf}), affiliateCurrent=createPublicCurrentRetailProjection({products,retailers,destinations:actions,currentSnapshot:eligible,asOf});
const omitUrl=value=>JSON.parse(JSON.stringify(value),(key,item)=>key==="destinationUrl"?undefined:item);
assert.deepEqual(omitUrl(affiliateCurrent),omitUrl(ordinaryCurrent)); cases++;
for(const scope of ["overall","ddr5","ddr4","laptop"]) assert.equal(affiliateCurrent.winners[scope]?.destinationId??null,ordinaryCurrent.winners[scope]?.destinationId??null); cases+=4;
const catalog=createRamCatalogProjection(products), history={getAll:async()=>[]};
assert.deepEqual(await createRamTerminalPublicIntelligence({catalog,currentRetail:affiliateCurrent,historicalRepository:history,asOf}),await createRamTerminalPublicIntelligence({catalog,currentRetail:ordinaryCurrent,historicalRepository:history,asOf})); cases++;
assert.deepEqual(await readFile(statePath),stateBytesBefore); cases++;
assert.equal(createHash("sha256").update(await readFile(workbookPath)).digest("hex"),workbookBefore); cases++;
assert.equal(workbookBefore,"4101ebad513ea488f665f196077b1c75bf4f0b08d92e06a243fe7e333d533419"); cases++;

console.log(`Newegg affiliate public-action precedence tests passed: ${cases} cases.`);
