import assert from "node:assert/strict";
import { ConfidenceEngine } from "../ConfidenceEngine.js";
import defaultConfidencePolicy from "../confidence/policies/default-policy.js";

function evidence(overrides = {}) {
    return {
        observationValidation: { status: "PASS", issueCount: 0 },
        provenanceValidation: { status: "PASS", issueCount: 0 },
        adapterRegistration: { status: "REGISTERED", adapterId: "mer_adapter_amazon_us" },
        freshness: { status: "CURRENT", expired: false, evaluatedAt: "2026-08-08T17:00:00Z" },
        declaredValidationStatus: "PASS",
        ...overrides
    };
}

const engine = new ConfidenceEngine({ defaultPolicy: defaultConfidencePolicy });
const high = engine.evaluate(evidence());
assert.equal(high.status, "HIGH");
assert.equal(high.reasons.length, 5);

const mediumAging = engine.evaluate(evidence({ freshness: { status: "AGING", expired: false, evaluatedAt: "2026-08-08T17:00:00Z" } }));
assert.equal(mediumAging.status, "MEDIUM");

const mediumWarn = engine.evaluate(evidence({ declaredValidationStatus: "WARN" }));
assert.equal(mediumWarn.status, "MEDIUM");

const lowStale = engine.evaluate(evidence({ freshness: { status: "STALE", expired: false, evaluatedAt: "2026-08-08T17:00:00Z" } }));
assert.equal(lowStale.status, "LOW");

const lowAdapter = engine.evaluate(evidence({ adapterRegistration: { status: "UNREGISTERED", adapterId: "unknown" } }));
assert.equal(lowAdapter.status, "LOW");

assert.deepEqual(engine.evaluate(evidence()), high);
assert.equal(Object.isFrozen(high), true);

console.log("Confidence engine tests passed.");
