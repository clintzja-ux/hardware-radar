IC-MERCURY-004 — Freshness Engine

I recommend locking the following contract before implementation.

Core principle

Freshness is derived state, not stored truth.

We should not add:

{
  "fresh": true
}

or permanently store:

{
  "freshnessStatus": "CURRENT"
}

inside an observation.

Those values decay simply because time passes.

Instead:

observationTime
        +
expiresAt (when explicitly applicable)
        +
FreshnessPolicy
        +
evaluationTime
        ↓
FreshnessEngine
        ↓
FreshnessResult

The underlying observation remains immutable.

Freshness result

I recommend a deterministic result contract along these lines:

status
ageMs
ageMinutes
policyId
evaluatedAt
expiresAt
expired
reason

With exactly three foundational states:

CURRENT
AGING
STALE

I would not introduce EXPIRED as a fourth freshness state.

Expiration and freshness describe related but different facts. An observation can therefore return:

status: STALE
expired: true

That preserves the distinction we identified after M003.

Policy architecture

This is the important part.

I do not want code such as:

if (age > 24 * 60 * 60 * 1000) {
    return "STALE";
}

scattered throughout Mercury.

Instead M004 should introduce a canonical FreshnessPolicy.

Conceptually:

FreshnessPolicy
├── policyId
├── version
├── currentUntilMs
└── staleAfterMs

Then:

0 ---------------- CURRENT ---------------->
                 |
                 currentUntil
                 ↓
              AGING
                 |
                 staleAfter
                 ↓
              STALE

The thresholds become explicit, versioned engineering policy rather than hidden business logic.

For M004 itself, we can establish a development/default policy to prove the mechanism. We should not yet claim that those thresholds are Amazon's final production freshness requirements; retailer/compliance-specific policy can be layered onto the mechanism later.

Deterministic clock

This is non-negotiable.

The Freshness Engine must not internally depend on Date.now() for its core calculation.

Instead:

evaluate(observation, {
    evaluatedAt
})

or an injected clock.

That means a test executed today, tomorrow, or five years from now produces exactly the same result for the same inputs.

It also lets Aurora or historical analysis later ask:

What was the freshness state of this observation at 3:00 PM on August 8?

without Mercury pretending the current clock is the only meaningful time.

expiresAt

The existing field stays.

Its semantics should become:

An explicit absolute time after which the observation must not be treated as current, regardless of the normal freshness policy.

Therefore:

Policy says CURRENT
        +
expiresAt has passed
        ↓
STALE
expired = true

But if expiresAt is null, normal policy evaluation applies.

We do not automatically populate expiresAt during M004 unless an upstream source actually supplies an explicit expiry.

Clock integrity

M004 should also reject impossible temporal evaluation.

For example:

observationTime:
2026-08-08T14:00Z

evaluatedAt:
2026-08-08T13:00Z

An observation cannot be -60 minutes old.

That should produce a deterministic freshness error rather than silently clamping the age to zero.

Proposed implementation

The permanent Mercury package would gain roughly:

packages/mercury/

FreshnessEngine.js
FreshnessPolicy.js
FreshnessValidator.js

freshness/
    policies/
        default-policy.js

tests/
    FreshnessEngine.test.mjs
    FreshnessPolicy.test.mjs
    FreshnessValidator.test.mjs
    FreshnessIntegration.test.mjs

And the Mercury facade should expose freshness evaluation without forcing consumers to instantiate internal services themselves.

M004 boundaries

This sprint will own:

observation age calculation;
CURRENT / AGING / STALE;
explicit expiration evaluation;
versioned freshness policies;
deterministic evaluation time;
invalid-time detection;
freshness result contract;
tests and facade integration.

It will not own:

confidence;
source trust;
retailer reliability;
price quality;
automatic refresh;
scheduling;
scraping;
publication decisions;
Forge workflow changes;
Hardware Radar UI changes.

One particularly important boundary: Freshness may report STALE; it does not decide what Hardware Radar does about it. Publication gating remains a separate concern involving Sentinel/Forge.

Expected tests

We'll need cases covering at least:

newly observed → CURRENT;
boundary at currentUntil;
between thresholds → AGING;
boundary at staleAfter;
old observation → STALE;
explicit future expiresAt;
explicit elapsed expiresAt;
null expiresAt;
evaluation before observation time → error;
malformed policy → error;
deterministic repeated evaluation;
original observation remains unchanged;
facade integration;
existing observation/provenance/adapter regressions.

That should take Mercury beyond its current 14-test baseline while leaving Atlas and Sentinel untouched.