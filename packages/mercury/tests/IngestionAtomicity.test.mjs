import assert from "node:assert/strict";
import { IngestionService } from "../ingestion/IngestionService.js";
import { InMemoryObservationAcceptanceStore } from "../ingestion/InMemoryObservationAcceptanceStore.js";
const store=new InMemoryObservationAcceptanceStore();
const atlas={getProduct:async()=>null,getRetailer:async id=>({id})};
const r=await new IngestionService({acceptanceStore:store,atlas}).ingest({atlasProductId:"missing_product",retailerId:"RETAILER-0001",marketplace:"amazon.com",sourceMethod:"API",licenseContext:"AMAZON_CREATORS_API",retrievedAt:"2026-08-10T02:00:00Z",retrievedBy:"service:test",sourcePayload:{price:1}});
assert.equal(r.accepted,false); assert.equal((await store.getAll()).length,0);
console.log("✓ failed ingestion leaves no accepted canonical observation");
