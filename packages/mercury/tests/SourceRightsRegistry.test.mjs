import assert from "node:assert/strict";
import registry from "../rights/SourceRightsRegistry.js";
assert.equal(registry.get("AMAZON_CREATORS_API").retention.contentTtlMs, 3600000);
assert.equal(registry.get("BEST_BUY_PRODUCTS_API").live.comparison, "CLARIFICATION_REQUIRED");
assert.equal(registry.get("DOES_NOT_EXIST"), null);
console.log("Source rights registry tests passed.");
