import assert from "node:assert/strict";
import { evaluateSourceRight, evaluateAcquisitionRight } from "../rights/SourceRightsEvaluator.js";
const unknown={compliance:{licenseContext:"UNKNOWN_VENDOR"}};
assert.equal(evaluateSourceRight(unknown,"retention.historical").allowed,false);
assert.equal(evaluateSourceRight(unknown,"retention.historical").reason,"SOURCE_RIGHTS_UNKNOWN");
assert.equal(evaluateAcquisitionRight({licenseContext:"UNKNOWN_VENDOR",sourceMethod:"API"}).allowed,false);
assert.equal(evaluateSourceRight({compliance:{licenseContext:"BEST_BUY_PRODUCTS_API"}},"live.comparison").allowed,false);
console.log("Source rights fail-closed tests passed.");
