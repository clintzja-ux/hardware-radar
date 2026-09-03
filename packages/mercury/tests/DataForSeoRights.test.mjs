import assert from "node:assert/strict"; import { defaultSourceRightsRegistry, RIGHTS_STATES } from "../index.js";
const p=defaultSourceRightsRegistry.require("DATAFORSEO_GOOGLE_SHOPPING");
assert.equal(p.acquisition.api,RIGHTS_STATES.ALLOWED); assert.equal(p.live.comparison,RIGHTS_STATES.ALLOWED); assert.equal(p.retention.historical,RIGHTS_STATES.ALLOWED); assert.equal(p.derivation.historicalAnalytics,RIGHTS_STATES.ALLOWED);
assert.equal(defaultSourceRightsRegistry.has("DATAFORSEO_AMAZON"),false); console.log("DataForSEO rights tests passed.");
