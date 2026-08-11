import assert from "node:assert/strict"; import { evaluateHistoricalEligibility } from "../HistoricalEligibility.js";
const valid={atlasProductId:"ram_x",observationTime:"2026-01-01T00:00:00Z",validationStatus:"PASS",compliance:{licenseContext:"INDEPENDENT_SOURCE"},offer:{price:10,currency:"USD",condition:"NEW"}};
assert.equal(evaluateHistoricalEligibility(valid).eligible,true); assert.equal(evaluateHistoricalEligibility({...valid,validationStatus:"FAIL"}).eligible,false); assert.equal(evaluateHistoricalEligibility({...valid,offer:{...valid.offer,price:-1}}).eligible,false);
console.log("Historical eligibility tests passed.");
