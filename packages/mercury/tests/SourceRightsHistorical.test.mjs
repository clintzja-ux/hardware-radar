import assert from "node:assert/strict";
import { evaluateHistoricalEligibility } from "../HistoricalEligibility.js";
const base={atlasProductId:"ram_x",observationTime:"2026-01-01T00:00:00Z",validationStatus:"PASS",offer:{price:10,currency:"USD",condition:"NEW"}};
const allowed=evaluateHistoricalEligibility({...base,compliance:{licenseContext:"INDEPENDENT_SOURCE"}});
assert.equal(allowed.eligible,true);
for (const licenseContext of ["AMAZON_CREATORS_API","BEST_BUY_PRODUCTS_API","MANUAL_PUBLIC_PAGE_OBSERVATION","UNKNOWN_VENDOR"]) {
  const result=evaluateHistoricalEligibility({...base,compliance:{licenseContext}});
  assert.equal(result.eligible,false,licenseContext);
}
console.log("Source rights historical tests passed.");
