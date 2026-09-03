import assert from "node:assert/strict";
import { IngestionService } from "../ingestion/IngestionService.js";
for (const sourceMethod of ["MANUAL","IMPORT","AUTOMATED_CHECK","FEED"]) {
 const r=await new IngestionService().ingest({atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",retailerId:"RETAILER-0001",marketplace:"amazon.com",sourceMethod,retrievedAt:"2026-08-10T02:00:00Z",retrievedBy:"human:test",sourcePayload:{price:1}});
 assert.equal(r.status,"BLOCKED_SOURCE_METHOD");
}
console.log("✓ unauthorized Amazon acquisition methods fail closed");
