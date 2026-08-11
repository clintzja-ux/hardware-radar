import assert from "node:assert/strict";
import { evaluateSourceRight } from "../rights/SourceRightsEvaluator.js";
assert.equal(evaluateSourceRight({compliance:{licenseContext:"AMAZON_CREATORS_API"}},"live.publicDisplay").allowed,true);
assert.equal(evaluateSourceRight({compliance:{licenseContext:"BEST_BUY_PRODUCTS_API"}},"live.publicDisplay").allowed,false);
assert.equal(evaluateSourceRight({compliance:{licenseContext:"MANUAL_PUBLIC_PAGE_OBSERVATION"}},"live.publicDisplay").allowed,false);
console.log("Source rights publication tests passed.");
