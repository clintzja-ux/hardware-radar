import assert from "node:assert/strict";
import defaultPolicy, { createLiveMarketPolicy } from "../live/LiveMarketPolicy.js";
assert.deepEqual(defaultPolicy.requiredRights,["live.currentObservation","live.comparison","live.publicDisplay"]);
assert.deepEqual(defaultPolicy.allowedFreshnessStatuses,["CURRENT"]);
assert.deepEqual(defaultPolicy.allowedAvailabilityStatuses,["IN_STOCK"]);
const custom=createLiveMarketPolicy({allowedAvailabilityStatuses:["IN_STOCK","LIMITED"]});
assert.deepEqual(custom.allowedAvailabilityStatuses,["IN_STOCK","LIMITED"]);
console.log("Live market policy tests passed.");
