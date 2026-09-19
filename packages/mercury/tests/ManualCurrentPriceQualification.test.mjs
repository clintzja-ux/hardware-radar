import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { createRetailerDestination } from "../destinations/RetailerDestination.js";
import { createCurrentDisplaySnapshot } from "../current-display/CurrentDisplaySnapshot.js";
import { createPublicCurrentRetailProjection } from "../current-display/PublicCurrentRetailProjection.js";
import { FileManualCurrentPricePreparationRepository } from "../current-display/FileManualCurrentPricePreparationRepository.js";
import { assessManualCurrentPriceInput, prepareManualCurrentPriceObservation, projectPreparedManualCurrentOffer } from "../current-display/ManualCurrentPricePreparation.js";

let cases=0; const ok=v=>{assert.equal(v,true);cases++}; const eq=(a,b)=>{assert.equal(a,b);cases++};
const at="2026-09-18T12:00:00.000Z";
const product={identity:{atlasProductId:"ram_fixture_manual",productType:"ram",brand:"Fixture",manufacturerPartNumber:"FIX-1",displayName:"Fixture RAM"},governance:{lifecycleStatus:"ACTIVE",publicationStatus:"READY"},extension:{data:{classification:{memoryType:"DDR5",formFactor:"DIMM"},capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16},performance:{dataRateMtps:6000,casLatency:30}}}};
const retailer={id:"RETAILER-0004",name:"Newegg",slug:"newegg",websiteUrl:"https://newegg.com",status:"active"};
const destination=createRetailerDestination({atlasProductId:product.identity.atlasProductId,retailerId:retailer.id,marketplace:"newegg.com",destinationType:"PRODUCT_PAGE",destinationUrl:"https://newegg.com/p/N82E16800000001",retailerListingId:"N82E16800000001",binding:{manufacturerPartNumber:"FIX-1",method:"OPERATOR_EXACT_PRODUCT_REVIEW",scope:"EXACT_STANDALONE_PRODUCT",evidenceReferences:["fixture"]},provenance:{sourceType:"OPERATOR_INSPECTED_PUBLIC_PAGE"},reviewedBy:"fixture",reviewedAt:at,status:"ACTIVE",createdAt:at,createdBy:"fixture"});
const rights=defaultSourceRightsRegistry.require("NEWEGG_MANUAL_PUBLISHER_OBSERVATION");
const input={atlasProductId:product.identity.atlasProductId,destinationId:destination.destinationId,itemPriceUsd:99.99,currency:"USD",availability:"AVAILABLE",observedAt:"2026-09-18T11:00:00.000Z",observedBy:"operator",evidenceReference:"operator:newegg:fixture",evidenceNotes:"Visible item price"};
const assessment=assessManualCurrentPriceInput({input,product,retailer,destination,rightsProfile:rights,preparedAt:at});
ok(assessment.eligible); ok(assessment.eligibility.itemPriceEligible); eq(assessment.eligibility.comparisonEligible,false); ok(assessment.eligibility.comparisonReasons.includes("CONDITION_UNKNOWN")); ok(assessment.eligibility.comparisonReasons.includes("SOURCE_COMPARISON_NOT_ALLOWED"));
const prep=prepareManualCurrentPriceObservation({input,product,retailer,destination,rightsProfile:rights,preparedAt:at});
ok(/^mer_manualpriceprep_[a-f0-9]{24}$/.test(prep.preparationId)); eq(prep.authorizationState,"NOT_AUTHORIZED"); eq(prep.executionAuthorized,false); eq(prep.networkOperation,"NONE"); eq(prep.actualSpendUsd,0); eq(prep.historicalAuthority,false); eq(prep.comparisonAuthority,false); eq(prep.cheapestAuthority,false); eq(prep.publicationAuthority,false);
eq(prepareManualCurrentPriceObservation({input,product,retailer,destination,rightsProfile:rights,preparedAt:at}).preparationId,prep.preparationId);
const weak=projectPreparedManualCurrentOffer(prep); ok(weak.itemPriceEligible); eq(weak.comparisonEligible,false); eq(weak.condition,null); eq(weak.shippingUsd,null); eq(weak.feesUsd,null); eq(weak.sourceIdentity.historicalRetentionAllowed,false);
const invalid=[
  [{itemPriceUsd:0},"ITEM_PRICE_INVALID"],[{itemPriceUsd:-1},"ITEM_PRICE_INVALID"],[{itemPriceUsd:NaN},"ITEM_PRICE_INVALID"],[{currency:"EUR"},"CURRENCY_NOT_USD"],[{availability:"UNKNOWN"},"AVAILABILITY_INVALID"],[{observedAt:"bad"},"OBSERVATION_TIME_INVALID"],[{observedAt:"2026-09-18T13:00:00.000Z"},"OBSERVATION_TIME_INVALID"],[{observedAt:"2026-09-16T00:00:00.000Z"},"OBSERVATION_STALE"],[{observedBy:""},"OPERATOR_PROVENANCE_REQUIRED"],[{evidenceReference:""},"OPERATOR_PROVENANCE_REQUIRED"],[{atlasProductId:"ram_other"},"ATLAS_PRODUCT_NOT_FOUND"],[{destinationId:"mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa"},"NEWEGG_DESTINATION_NOT_ELIGIBLE"]
];
for(const [change,reason] of invalid){const result=assessManualCurrentPriceInput({input:{...input,...change},product,retailer,destination,rightsProfile:rights,preparedAt:at});eq(result.eligible,false);ok(result.reasons.includes(reason));}
const held=structuredClone(product);held.governance.lifecycleStatus="DRAFT";ok(assessManualCurrentPriceInput({input,product:held,retailer,destination,rightsProfile:rights,preparedAt:at}).reasons.includes("ATLAS_PRODUCT_NOT_ACTIVE_READY"));
const blockedRights=structuredClone(rights);blockedRights.live.publicDisplay="BLOCKED";ok(assessManualCurrentPriceInput({input,product,retailer,destination,rightsProfile:blockedRights,preparedAt:at}).reasons.includes("SOURCE_RIGHTS_INVALID"));
const conflicting={offers:[{atlasProductId:input.atlasProductId,retailerId:"RETAILER-0004",sourceIdentity:{sourceId:"RAKUTEN_NEWEGG_PRODUCT_CATALOG"}}]};ok(assessManualCurrentPriceInput({input,product,retailer,destination,rightsProfile:rights,preparedAt:at,currentSnapshot:conflicting}).reasons.includes("CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED"));
const comparable={...weak,condition:"NEW",comparisonEligible:true,comparisonReasons:[],deliveredCostReasons:["SHIPPING_COST_UNKNOWN","FEES_UNKNOWN"],priceUsd:120,sourceIdentity:{...weak.sourceIdentity,sourceId:"FIXTURE"}};
const snapshot=createCurrentDisplaySnapshot({observedAt:input.observedAt,importedAt:at,source:{workbook:"fixture",sheet:"fixture",digest:"a".repeat(64)},offers:[weak]});ok(snapshot.offers[0].itemPriceEligible);eq(snapshot.offers[0].comparisonEligible,false);
const projection=createPublicCurrentRetailProjection({products:[product],retailers:[retailer],destinations:[destination],currentSnapshot:snapshot,asOf:at});eq(projection.products.length,1);eq(projection.products[0].lowerCurrentItemPrice,null);eq(projection.winners.overall,null);eq(projection.products[0].offers[0].comparisonEligible,false);
const twoDest={...destination,destinationId:"mer_dest_bbbbbbbbbbbbbbbbbbbbbbbb"};
const projection2=createPublicCurrentRetailProjection({products:[product],retailers:[retailer],destinations:[destination,twoDest],currentSnapshot:{offers:[{...weak,destinationId:destination.destinationId,priceUsd:50},{...comparable,destinationId:twoDest.destinationId}]},asOf:at});eq(projection2.winners.overall.itemPriceUsd,120);eq(projection2.products[0].lowerCurrentItemPrice.itemPriceUsd,120);eq(projection2.products[0].offers.length,2);
const temp=await mkdtemp(path.join(os.tmpdir(),"manual-price-"));try{const repo=new FileManualCurrentPricePreparationRepository({filePath:path.join(temp,"preparations.json")});eq((await repo.record(prep)).status,"CREATED");eq((await repo.record(prep)).status,"EXISTING");eq((await repo.getById(prep.preparationId)).bindingDigest,prep.bindingDigest);eq((await repo.getAll()).length,1);await assert.rejects(()=>repo.record({...prep,bindingDigest:"0".repeat(64)}),/CONFLICT/);cases++;}finally{await rm(temp,{recursive:true,force:true});}
eq(rights.acquisition.manual,"ALLOWED");eq(rights.live.publicDisplay,"ALLOWED");eq(rights.live.comparison,"BLOCKED");eq(rights.retention.historical,"BLOCKED");eq(rights.provenance.retailerId,"RETAILER-0004");eq(rights.provenance.marketplace,"newegg.com");
console.log(`Manual current-price qualification tests passed: ${cases} cases.`);
