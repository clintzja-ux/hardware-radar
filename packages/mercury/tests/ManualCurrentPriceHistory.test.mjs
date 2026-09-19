import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { createRetailerDestination } from "../destinations/RetailerDestination.js";
import { prepareManualCurrentPriceObservation } from "../current-display/ManualCurrentPricePreparation.js";
import { assessManualCurrentPriceHistoricalEligibility, createManualCurrentPriceHistoricalObservation, ManualCurrentPriceHistoryService } from "../current-display/ManualCurrentPriceHistory.js";
import { FileHistoricalObservationRepository } from "../historical-admission/persistence/FileHistoricalObservationRepository.js";

let cases=0;const eq=(a,b)=>{assert.deepEqual(a,b);cases++;};const ok=value=>{assert.equal(value,true);cases++;};
const at="2026-09-19T17:00:00.000Z";
const product={identity:{atlasProductId:"ram_fixture_manual_history",productType:"ram",brand:"Fixture",manufacturerPartNumber:"FIX-H",displayName:"Fixture History RAM"},governance:{lifecycleStatus:"ACTIVE",publicationStatus:"READY"}};
const retailer={id:"RETAILER-0001",name:"Amazon",slug:"amazon",websiteUrl:"https://amazon.com",status:"active"};
const destination=createRetailerDestination({atlasProductId:product.identity.atlasProductId,retailerId:retailer.id,marketplace:"amazon.com",destinationType:"PRODUCT_PAGE",destinationUrl:"https://amazon.com/dp/B000000001",retailerListingId:"B000000001",binding:{manufacturerPartNumber:"FIX-H",method:"OPERATOR_EXACT_PRODUCT_REVIEW",scope:"EXACT_STANDALONE_PRODUCT",evidenceReferences:["fixture"]},provenance:{sourceType:"OPERATOR_INSPECTED_PUBLIC_PAGE"},reviewedBy:"fixture",reviewedAt:at,status:"ACTIVE",createdAt:at,createdBy:"fixture"});
const rights=defaultSourceRightsRegistry.require("AMAZON_MANUAL_PUBLISHER_OBSERVATION");
const preparation=prepareManualCurrentPriceObservation({input:{atlasProductId:product.identity.atlasProductId,destinationId:destination.destinationId,itemPriceUsd:90,currency:"USD",availability:"AVAILABLE",observedAt:"2026-09-19T16:30:00.000Z",observedBy:"operator",evidenceReference:"operator:amazon:fixture"},product,retailer,destination,rightsProfile:rights,preparedAt:at});
const assessment=assessManualCurrentPriceHistoricalEligibility({preparation,product,retailer,destination,rightsProfile:rights});ok(assessment.eligible);eq(assessment.reasons,[]);
const record=createManualCurrentPriceHistoricalObservation({preparation,product,retailer,destination,rightsProfile:rights,admittedAt:at,admittedBy:"operator"});
eq(record.schemaVersion,"1.1");eq(record.market.basePrice,90);eq(record.market.totalPrice,null);eq(record.market.shipping,null);eq(record.market.tax,null);eq(record.market.condition,null);eq(record.market.sellerName,null);eq(record.comparability.standaloneEligible,true);eq(record.provenance.acquisition.type,"MANUAL_PUBLISHER_OBSERVATION");eq(record.governance.canonicalEligible,false);eq(record.governance.publicationEligible,false);
const temp=await mkdtemp(path.join(os.tmpdir(),"manual-history-"));try{const repository=new FileHistoricalObservationRepository({statePath:path.join(temp,"history.json")});const service=new ManualCurrentPriceHistoryService({historicalRepository:repository,rightsRegistry:defaultSourceRightsRegistry,now:()=>at});eq((await service.admit({preparation,product,retailer,destination,admittedBy:"operator"})).status,"ADMITTED");eq((await service.admit({preparation,product,retailer,destination,admittedBy:"operator"})).status,"DUPLICATE");eq((await repository.getAll()).length,1);}finally{await rm(temp,{recursive:true,force:true});}
const later=prepareManualCurrentPriceObservation({input:{...preparation.binding,itemPriceUsd:88,observedAt:"2026-09-19T16:45:00.000Z",destinationId:destination.destinationId,atlasProductId:product.identity.atlasProductId,currency:"USD",availability:"AVAILABLE",observedBy:"operator",evidenceReference:"operator:amazon:later"},product,retailer,destination,rightsProfile:rights,preparedAt:at});
assert.notEqual(later.preparationId,preparation.preparationId);cases++;
const blockedRights=structuredClone(rights);blockedRights.retention.historical="BLOCKED";eq(assessManualCurrentPriceHistoricalEligibility({preparation,product,retailer,destination,rightsProfile:blockedRights}).eligible,false);
const bundled=structuredClone(destination);bundled.binding.scope="BUNDLE";eq(assessManualCurrentPriceHistoricalEligibility({preparation,product,retailer,destination:bundled,rightsProfile:rights}).eligible,false);
console.log(`Manual current-price history tests passed: ${cases} cases.`);
