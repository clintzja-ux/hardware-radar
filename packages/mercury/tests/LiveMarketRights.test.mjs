import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Mercury } from "../Mercury.js";
import { evaluateLiveMarketEligibility } from "../live/LiveMarketEligibility.js";
import { makeAmazonApiObservation } from "./helpers/publicationFixture.mjs";
const product=JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json",import.meta.url),"utf8"));
const retailer=JSON.parse(await readFile(new URL("../../atlas/retailers/RETAILER-0001-amazon.json",import.meta.url),"utf8"));
const mercury=new Mercury();
for (const sourceId of ["BEST_BUY_PRODUCTS_API","UNKNOWN_RETAILER_SOURCE"]) {
 const observation=makeAmazonApiObservation(`mer_obs_${sourceId.length.toString().padStart(9,"0")}`,"2026-08-10T15:00:00Z"); observation.compliance.licenseContext=sourceId;
 const asOf="2026-08-10T15:20:00Z"; const freshness=mercury.evaluateFreshness(observation,{evaluatedAt:asOf}); const confidence=mercury.evaluateConfidence(observation,{evaluatedAt:asOf});
 const result=evaluateLiveMarketEligibility(observation,{product,retailer,freshness,confidence,evaluatedAt:asOf}); assert.equal(result.eligible,false); assert.ok(result.reasons.some(r=>r.startsWith("SOURCE_RIGHT_")||r==="SOURCE_RIGHTS_UNKNOWN"));
}
console.log("Live market rights tests passed.");
