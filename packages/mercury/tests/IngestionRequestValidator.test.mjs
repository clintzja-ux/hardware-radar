import assert from "node:assert/strict";
import { validateIngestionRequest } from "../ingestion/IngestionRequestValidator.js";
const base={atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",retailerId:"RETAILER-0001",marketplace:"amazon.com",sourceMethod:"TEST_FIXTURE",retrievedAt:"2026-08-10T02:00:00Z",retrievedBy:"test:fixture",sourcePayload:{price:1}};
assert.equal(validateIngestionRequest(base).valid,true);
assert.equal(validateIngestionRequest({...base,sourcePayload:null}).valid,false);
console.log("✓ ingestion request validation is deterministic");
