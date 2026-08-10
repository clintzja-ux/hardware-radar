import assert from "node:assert/strict";
import { evaluatePublicationEligibility } from "../publication/PublicationEligibility.js";
const observation={compliance:{licenseContext:"TEST_FIXTURE"},validationStatus:"PASS",offer:{price:1,availability:"IN_STOCK",condition:"NEW",sourceUrl:"https://example.test"}};
const r=evaluatePublicationEligibility(observation,{freshness:{status:"CURRENT"},confidence:{status:"HIGH"}});
assert.equal(r.eligible,false); assert.ok(r.reasons.includes("TEST_FIXTURE_NOT_PUBLISHABLE"));
console.log("✓ test fixtures are explicitly publication-ineligible");
