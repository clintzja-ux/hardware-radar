import assert from "node:assert/strict";
import { FreshnessEngine } from "../FreshnessEngine.js";
import { createFreshnessPolicy } from "../FreshnessPolicy.js";

const MINUTE = 60 * 1000;
const policy = createFreshnessPolicy({
    policyId: "test-policy",
    version: "1.0.0",
    currentUntilMs: 30 * MINUTE,
    staleAfterMs: 120 * MINUTE
});
const engine = new FreshnessEngine({ defaultPolicy: policy });
const base = Object.freeze({ observationTime: "2026-08-08T12:00:00Z", expiresAt: null });

assert.equal(engine.evaluate(base, { evaluatedAt: "2026-08-08T12:00:00Z" }).status, "CURRENT");
assert.equal(engine.evaluate(base, { evaluatedAt: "2026-08-08T12:30:00Z" }).status, "CURRENT");
assert.equal(engine.evaluate(base, { evaluatedAt: "2026-08-08T12:30:00.001Z" }).status, "AGING");
assert.equal(engine.evaluate(base, { evaluatedAt: "2026-08-08T13:59:59.999Z" }).status, "AGING");
assert.equal(engine.evaluate(base, { evaluatedAt: "2026-08-08T14:00:00Z" }).status, "STALE");

const expiring = Object.freeze({ observationTime: "2026-08-08T12:00:00Z", expiresAt: "2026-08-08T12:20:00Z" });
const beforeExpiry = engine.evaluate(expiring, { evaluatedAt: "2026-08-08T12:19:59Z" });
assert.equal(beforeExpiry.status, "CURRENT");
assert.equal(beforeExpiry.expired, false);
const atExpiry = engine.evaluate(expiring, { evaluatedAt: "2026-08-08T12:20:00Z" });
assert.equal(atExpiry.status, "STALE");
assert.equal(atExpiry.expired, true);
assert.equal(atExpiry.reason, "EXPLICIT_EXPIRY_REACHED");

const first = engine.evaluate(base, { evaluatedAt: "2026-08-08T12:45:00Z" });
const second = engine.evaluate(base, { evaluatedAt: "2026-08-08T12:45:00Z" });
assert.deepEqual(first, second);
assert.equal(base.expiresAt, null);
assert.equal(Object.isFrozen(first), true);

assert.throws(() => engine.evaluate(base, { evaluatedAt: "2026-08-08T11:00:00Z" }), (error) => {
    assert.equal(error.name, "FreshnessEvaluationError");
    return true;
});

console.log("Freshness engine tests passed.");
