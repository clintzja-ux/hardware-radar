import assert from "node:assert/strict";
import { evaluateAcquisitionRight } from "../rights/SourceRightsEvaluator.js";
assert.equal(evaluateAcquisitionRight({licenseContext:"AMAZON_CREATORS_API",sourceMethod:"API"}).allowed,true);
assert.equal(evaluateAcquisitionRight({licenseContext:"AMAZON_CREATORS_API",sourceMethod:"MANUAL"}).allowed,false);
assert.equal(evaluateAcquisitionRight({licenseContext:"BEST_BUY_PRODUCTS_API",sourceMethod:"API"}).allowed,true);
assert.equal(evaluateAcquisitionRight({licenseContext:"BEST_BUY_PRODUCTS_API",sourceMethod:"MANUAL"}).allowed,false);
console.log("Source rights acquisition tests passed.");
