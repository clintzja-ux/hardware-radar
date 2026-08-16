IC-MERCURY-003 — Exit Review

Sprint: Mercury M003
Contract: Provenance Foundation
Result: ✅ PASS / CERTIFIED

Verification is clean across every affected layer:

Verification	Result
Mercury	✅ 14/14
Sentinel	✅ 7/7
Atlas	✅ 15/15
Forge regression	✅ PASS
Hardware Radar regression	✅ PASS

No regression has surfaced from evolving the observation contract from schema 1.0 to 1.1.

What we can now certify

Mercury has three successive certified foundations:

M001 — Observation Foundation ✅
Canonical immutable market observations.

M002 — Adapter Framework Foundation ✅
Retailer-independent normalization through registered adapters.

M003 — Provenance Foundation ✅
Auditable lineage describing where an observation originated and how it entered canonical form.

The pipeline is consequently becoming quite substantial:

EXTERNAL MARKET
      │
      ▼
Retailer Adapter
      │
      ├── identifies source
      ├── normalizes representation
      └── records transformation
      │
      ▼
Observation Candidate
      │
      ├── Source provenance
      ├── Acquisition provenance
      ├── Transformation provenance
      └── Validation provenance
      │
      ▼
Sentinel / Mercury Validation
      │
      ▼
Canonical Immutable Observation
      │
      ▼
Observation Repository

Critically, we have still resisted giving this pipeline responsibilities it doesn't own. Provenance records facts; it doesn't infer trust or quality.

Next — M004 Freshness Engine

Now we're ready for the first layer that interprets an observation relative to time.

So far Mercury can tell us:

What did we observe? — M001
How did we normalize it? — M002
Where did it come from? — M003

M004 answers:

Is that observation still current enough to use?

There is an architectural distinction I want us to preserve from the beginning:

Freshness is not confidence.

A perfectly trustworthy Amazon observation from three days ago may be stale.

A five-minute-old observation may be fresh but later fail another quality criterion.

So the model should remain approximately:

Observation
    │
    ├── Provenance ─────► Where did it come from?
    │
    ├── Freshness ──────► How current is it?
    │
    └── Confidence ─────► How much should we trust it?   [M005]

For M004, I recommend that freshness be derived rather than permanently stored wherever possible. observationTime and an explicit freshness policy should be authoritative; a service can deterministically calculate age/status at evaluation time. That avoids storing values such as "fresh": true that inevitably become false simply because time passes.

We should also distinguish observation age from expiration. expiresAt can represent an explicit boundary where applicable, while freshness policy can answer whether an observation is CURRENT, AGING, or STALE for a particular use case.

That distinction will matter considerably when Hardware Radar eventually decides whether a price is safe to display.