import assert from "node:assert/strict";
import RetailerAdapter from "../adapters/interfaces/RetailerAdapter.js";
import { AdapterRegistry } from "../adapters/registry/AdapterRegistry.js";
import { IngestionService } from "../ingestion/IngestionService.js";
import { InMemoryObservationAcceptanceStore } from "../ingestion/InMemoryObservationAcceptanceStore.js";
import { createProvenance } from "../Provenance.js";
class FixtureAdapter extends RetailerAdapter {
 getMetadata(){return {adapterId:"mer_adapter_fixture",version:"1.0.0",retailerId:"RETAILER-0001",retailerName:"Fixture",marketplaces:["amazon.com"],sourceMethods:["TEST_FIXTURE"],capabilities:["NORMALIZE_OFFER"],status:"ACTIVE"};}
 supportsMarketplace(v){return v==="amazon.com";} supportsSourceMethod(v){return v==="TEST_FIXTURE";}
 normalize(i,c){return {observationId:c.observationId,schemaVersion:"1.1",atlasProductId:c.atlasProductId,retailerId:"RETAILER-0001",marketplace:"amazon.com",observationTime:c.observationTime,sourceMethod:"IMPORT",lifecycleStatus:"RETRIEVED",validationStatus:"PASS",supersedesObservationId:null,expiresAt:null,offer:{price:i.price,currency:"USD",availability:"IN_STOCK",condition:"NEW",sellerType:"RETAILER",sourceUrl:i.sourceUrl,shipping:{costKnown:false,cost:null,currency:null,notes:null},discount:null,affiliate:{isAffiliateLink:false,network:null,trackingCodePresent:false}},provenance:createProvenance({source:{name:"Deterministic fixture",uri:i.sourceUrl,marketplace:"amazon.com"},acquisition:{method:"IMPORT",retrievedAt:c.observationTime,retrievedBy:c.retrievedBy,requestId:c.requestId,rawPayloadReference:null},transformation:{adapterId:"mer_adapter_fixture",adapterVersion:"1.0.0",normalizedAt:c.observationTime},validation:{validatorVersion:"mercury-observation-validator-1.0.0",complianceRuleSetVersion:"test-fixture-1.0"}}),compliance:{licenseContext:"TEST_FIXTURE",requiredDisclosureShown:false,requiredPriceDisclaimerShown:false,retailerContentDisclaimerShown:false},metadata:{createdAt:c.createdAt,createdBy:c.createdBy,observationHash:null,notes:"Non-production fixture"}};}
}
const atlas={getProduct:async id=>id==="ram_corsair_cmk32gx5m2b6000z30"?{identity:{atlasProductId:id}}:null,getRetailer:async id=>id==="RETAILER-0001"?{id}:null};
const store=new InMemoryObservationAcceptanceStore(); const svc=new IngestionService({atlas,adapterRegistry:new AdapterRegistry([new FixtureAdapter()]),acceptanceStore:store,now:()=>"2026-08-10T02:00:01Z"});
const req={atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",retailerId:"RETAILER-0001",marketplace:"amazon.com",sourceMethod:"TEST_FIXTURE",retrievedAt:"2026-08-10T02:00:00Z",retrievedBy:"test:fixture",requestId:"fixture-1",sourcePayload:{price:99.99,sourceUrl:"https://example.test/fixture"}};
const first=await svc.ingest(req); assert.equal(first.status,"ACCEPTED"); assert.match(first.observationId,/^mer_obs_\d{9}$/); assert.equal((await store.getAll()).length,1);
const second=await svc.ingest(req); assert.equal(second.status,"DUPLICATE"); assert.equal(second.observationId,first.observationId); assert.equal((await store.getAll()).length,1);
console.log("✓ controlled ingestion owns identity, validation, acceptance, and idempotency");
