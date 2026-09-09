import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { collectRakutenProductCatalogFixture, createCurrentDisplaySnapshot, createCurrentRetailRefreshPortfolio, createPublicCurrentRetailProjection, createRakutenNeweggProductFeedAdapter, CurrentRetailRefreshOrchestrator, extractRakutenMerchantUrl, RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS } from "../current-display/index.js";
import { fixtureFeedText, fixtureRow, sanitizedCases } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0; const gz=text=>gzipSync(Buffer.from(text));
const parse=async(rows,options={})=>(await collectRakutenProductCatalogFixture(gz(fixtureFeedText({rows,...options}))));
const parsed=await parse([sanitizedCases.ordinary]);
assert.equal(parsed[0].feedTimestamp,"2026-09-08T12:00:00.000Z"); assert.equal(parsed[1].fieldCount,39); assert.equal(parsed[2].actualProductCount,1); cases++;
const full=await parse([fixtureRow({}, {delta:false})]); assert.equal(full[1].fieldCount,38); assert.equal(full[1].modification,null); assert.equal(RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS.length,38); cases++;
assert.equal((await parse([sanitizedCases.quotedPipe]))[1].productName,"Sanitized RAM | quoted field"); cases++;
await assert.rejects(()=>collectRakutenProductCatalogFixture(Buffer.from("bad")),/RAKUTEN_GZIP_INVALID/); cases++;
await assert.rejects(()=>parse(["too|few"]),/FIELD_COUNT/); cases++;
await assert.rejects(()=>parse([sanitizedCases.ordinary],{trailerCount:2}),/TRAILER_COUNT_MISMATCH/); cases++;

const product={identity:{productType:"ram",atlasProductId:"ram_fixture_adapter",manufacturerPartNumber:"FIXTURE-MPN-1",brand:"Fixture",displayName:"Fixture"},governance:{lifecycleStatus:"ACTIVE",publicationStatus:"READY"},extension:{data:{classification:{memoryType:"DDR5",formFactor:"DIMM"},capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16},performance:{dataRateMtps:6000}}}};
const destination={destinationId:`mer_dest_${"a".repeat(24)}`,atlasProductId:product.identity.atlasProductId,retailerId:"RETAILER-0004",marketplace:"newegg.com",destinationUrl:"https://newegg.com/p/N82E16820000001",retailerListingId:"N82E16820000001",status:"ACTIVE",binding:{manufacturerPartNumber:"FIXTURE-MPN-1"}};
const retailers=[{id:"RETAILER-0004",name:"Newegg",status:"active"}], asOf="2026-09-08T13:00:00.000Z";
const context={atlasProductId:product.identity.atlasProductId,retailerId:destination.retailerId,retailer:"NEWEGG",destinationId:destination.destinationId,destinationUrl:destination.destinationUrl,retailerListingId:destination.retailerListingId,marketplace:destination.marketplace,asOf};
const adapterFor=(records,options={})=>createRakutenNeweggProductFeedAdapter({records,destinations:[destination],feedTimestamp:parsed[0].feedTimestamp,...options});
const result=await adapterFor([parsed[1]]).refresh(context);
assert.deepEqual({type:result.type,price:result.itemPriceUsd,currency:result.currency,availability:result.availability,condition:result.condition,shipping:result.shippingUsd},{type:"OBSERVATION",price:99.99,currency:"USD",availability:"AVAILABLE",condition:null,shipping:null});
assert.equal(result.sourceEvidence.sourceShippingUsd,0); assert.equal(result.sourceEvidence.sourceUpc,"000000000001"); cases++;
assert.match(extractRakutenMerchantUrl(parsed[1].productUrl),/newegg\.com\/p\/N82E16820000001/); assert.equal(result.destinationUrl,destination.destinationUrl); assert.notEqual(result.sourceEvidence.merchantUrl,result.destinationUrl); cases++;
assert.equal(extractRakutenMerchantUrl("https://click.example.invalid/?murl=https%3A%2F%2Fevilnewegg.com%2Fp%2FN82E16820000001"),null); cases++;

const adapter=adapterFor([parsed[1]]), portfolio=createCurrentRetailRefreshPortfolio({products:[product],destinations:[destination],retailers,adapters:[adapter],asOf});
const run=await new CurrentRetailRefreshOrchestrator({adapters:[adapter]}).run({portfolio});
assert.equal(run.outcomes[0].status,"CONDITION_UNKNOWN"); assert.equal(run.snapshot.offers[0].itemPriceEligible,false); assert.ok(run.snapshot.offers[0].comparisonReasons.includes("CONDITION_NOT_ELIGIBLE")); assert.ok(run.snapshot.offers[0].comparisonReasons.includes("SOURCE_PUBLIC_DISPLAY_NOT_ALLOWED")); cases++;
for(const modification of ["I","U"]){const record=(await parse([fixtureRow({modification})]))[1];assert.equal((await adapterFor([record]).refresh(context)).type,"OBSERVATION");} cases++;
const deleted=(await parse([sanitizedCases.deletedRam]))[1], deleteAdapter=adapterFor([deleted]); assert.equal((await deleteAdapter.refresh(context)).status,"SOURCE_WITHDRAWN"); cases++;

const prior=adapterId=>createCurrentDisplaySnapshot({observedAt:"2026-09-08T11:00:00.000Z",importedAt:"2026-09-08T11:00:00.000Z",source:{workbook:"fixture",sheet:"fixture",digest:"a".repeat(64)},offers:[{atlasProductId:product.identity.atlasProductId,retailer:"NEWEGG",retailerId:destination.retailerId,marketplace:destination.marketplace,priceUsd:99.99,currency:"USD",availability:"AVAILABLE",condition:null,shippingUsd:null,feesUsd:null,researchUrl:destination.destinationUrl,destinationId:destination.destinationId,matchStatus:"CANONICAL_DESTINATION_REFRESH",sourceRow:1,observedAt:"2026-09-08T11:00:00.000Z",sellerType:null,sellerName:null,sourceIdentity:{adapterId,sourceId:"FIXTURE",rightsProfileId:"FIXTURE",historicalRetentionAllowed:false},comparisonEligible:false,comparisonReasons:["CONDITION_NOT_ELIGIBLE"],itemPriceEligible:false,deliveredCostEligible:false,deliveredCostReasons:["CONDITION_NOT_ELIGIBLE"]}]});
const dp=createCurrentRetailRefreshPortfolio({products:[product],destinations:[destination],retailers,adapters:[deleteAdapter],asOf});
assert.equal((await new CurrentRetailRefreshOrchestrator({adapters:[deleteAdapter]}).run({portfolio:dp,priorSnapshot:prior(deleteAdapter.adapterId)})).snapshot.offers.length,0); cases++;
const manual=await new CurrentRetailRefreshOrchestrator({adapters:[deleteAdapter]}).run({portfolio:dp,priorSnapshot:prior("mer_adapter_operator_curated_ram_offer")});
assert.equal(manual.snapshot.offers.length,1); assert.deepEqual(product,structuredClone(product)); assert.deepEqual(destination,structuredClone(destination)); cases++;

const outcome=async overrides=>adapterFor([(await parse([fixtureRow(overrides)]))[1]]).refresh(context);
assert.equal((await outcome({availability:"unseen"})).availability,"UNKNOWN"); cases++;
assert.equal((await outcome({currency:"CAD"})).status,"INVALID_SOURCE_RESULT"); cases++;
assert.equal((await outcome({retailPrice:"109.99",salePrice:"99.99"})).status,"PRICE_SEMANTICS_UNRESOLVED"); cases++;
assert.equal((await outcome({manufacturerPartNumber:"OTHER"})).status,"SOURCE_UNAVAILABLE"); cases++;
assert.equal((await adapterFor([]).refresh(context)).status,"SOURCE_UNAVAILABLE"); cases++;
const collision={...destination,destinationId:`mer_dest_${"b".repeat(24)}`};
assert.equal((await createRakutenNeweggProductFeedAdapter({records:[parsed[1]],destinations:[destination,collision],feedTimestamp:parsed[0].feedTimestamp}).refresh(context)).status,"SOURCE_UNAVAILABLE"); cases++;

const mkplRecord=(await collectRakutenProductCatalogFixture(gz(fixtureFeedText({rows:[sanitizedCases.mkpl]})),{feedProfile:"NEWEGG_MKPL"}))[1], mkplDestination={...destination,retailerListingId:"9SIAFIXTURE01",destinationUrl:"https://newegg.com/p/9SIAFIXTURE01"};
assert.equal(mkplRecord.fieldCount,51); assert.equal(mkplRecord.profileFields.length,12);
const mkpl=await createRakutenNeweggProductFeedAdapter({records:[mkplRecord],destinations:[mkplDestination],feedTimestamp:parsed[0].feedTimestamp,feedProfile:"NEWEGG_MKPL"}).refresh({...context,destinationUrl:mkplDestination.destinationUrl,retailerListingId:mkplDestination.retailerListingId});
assert.equal(mkpl.sourceEvidence.marketplace,true); assert.equal(mkpl.condition,null); assert.equal(mkpl.sellerName,null); cases++;
assert.equal((await adapterFor([parsed[1]],{feedProfile:"ADDITIONAL_UNCLASSIFIED"}).refresh(context)).sourceEvidence.marketplace,null); cases++;
const unavailable=adapterFor([]), unavailablePortfolio=createCurrentRetailRefreshPortfolio({products:[product],destinations:[destination],retailers,adapters:[unavailable],asOf});
const sourceLoss=await new CurrentRetailRefreshOrchestrator({adapters:[unavailable]}).run({portfolio:unavailablePortfolio,priorSnapshot:prior(unavailable.adapterId)});
assert.equal(sourceLoss.snapshot.offers[0].observedAt,"2026-09-08T11:00:00.000Z"); assert.equal(sourceLoss.outcomes[0].status,"SOURCE_UNAVAILABLE");
assert.equal(createPublicCurrentRetailProjection({products:[product],retailers,destinations:[destination],currentSnapshot:sourceLoss.snapshot,asOf:"2026-09-10T12:00:00.000Z"}).winners.overall,null); assert.equal(unavailablePortfolio.affiliateStateUsed,false); cases++;

const state=JSON.parse(await readFile(new URL("../destinations/production-destinations.json",import.meta.url),"utf8"));
const effective=[...new Map(state.records.filter(x=>x.status==="ACTIVE").map(x=>[`${x.atlasProductId}|${x.retailerId}|${x.marketplace}`,x])).values()].filter(x=>x.retailerId==="RETAILER-0004"); assert.equal(effective.length,94);
const rows=effective.map((x,i)=>({recordType:"PRODUCT",sku:x.retailerListingId,productUrl:`https://click.example.invalid/track?murl=${encodeURIComponent(x.destinationUrl)}`,productId:`fixture-${i}`,manufacturerPartNumber:x.binding.manufacturerPartNumber,upc:null,modification:"U",retailPrice:"100",salePrice:"100",shipping:"0.00",availability:"in-stock",currency:"USD"}));
const coverage=createRakutenNeweggProductFeedAdapter({records:rows,destinations:effective,feedTimestamp:parsed[0].feedTimestamp});
for(const x of effective)assert.equal((await coverage.refresh({atlasProductId:x.atlasProductId,retailerId:x.retailerId,retailer:"NEWEGG",destinationId:x.destinationId,destinationUrl:x.destinationUrl,retailerListingId:x.retailerListingId,marketplace:x.marketplace,asOf})).type,"OBSERVATION"); cases++;
assert.equal(adapter.rights.historicalRetentionAllowed,false); assert.equal(run.externalOperations,0); assert.equal(run.actualSpendUsd,0); cases++;
assert.equal(JSON.stringify({parsed,result}).match(/password|username|host.?key/i),null); cases++;
console.log(`RAKUTEN-NEWEGG-002 fixture adapter tests passed: ${cases} cases.`);
