IC-MERCURY-006 — Historical Intelligence

Objective: derive reproducible historical market facts from canonical immutable Mercury observations.

The key principle should be:

History is derived from observations; it is not a second market-data store.

So we do not create separate mutable price-history records. The immutable observation repository remains authoritative.

Observation Repository
        │
        ├── T1 $509.99
        ├── T2 $499.99
        ├── T3 $489.99
        └── T4 $495.99
                │
                ▼
      Historical Intelligence
What M006 should provide

I recommend five deterministic primitives:

Timeline — chronologically ordered comparable observations.
Range — lowest and highest observed prices, including the observations that established them.
Average — arithmetic mean across eligible observations.
Movement — absolute and percentage movement between first/last or explicitly selected observations.
Summary — count, first/last observation, first/latest price, min, max, average and movement.

There should be no "great deal", "buy now", "normal price" or trend prediction in M006.

Comparability is the crucial rule

We must not accidentally calculate:

USD Amazon NEW price + JMD retailer price + USED item price

as one history.

A historical series should therefore have a deterministic comparison identity:

atlasProductId
+ currency
+ condition

and optionally:

retailerId
marketplace

as query dimensions.

That allows both:

Product-market history

What has this RAM kit cost across eligible retailers?

and:

Retailer-specific history

What has Amazon charged for this RAM kit?

without mixing incompatible offers.

Historical eligibility

I agree with our earlier conclusion: current freshness must not determine whether an observation belongs in history.

A July observation may be stale today, but it remains a valid record of July.

For M006, eligibility should instead require deterministic historical facts:

validationStatus === PASS
offer.price is finite and >= 0
currency is valid
condition is present
observationTime is valid
canonical product identity matches query

Provenance remains preserved and queryable, but I would not retroactively run today's freshness or confidence policy to decide whether an old observation happened.

That's an important distinction:

Freshness asks whether an observation is current now. Historical eligibility asks whether it is admissible evidence of what was observed then.

Architecture

I recommend adding:

packages/mercury/
├── HistoricalIntelligence.js
├── HistoricalEligibility.js
├── HistoricalValidator.js
└── history/
    └── policies/
        └── default-policy.js

The facade can then expose operations such as:

getPriceTimeline(...)
getHistoricalSummary(...)
getPriceRange(...)
getPriceMovement(...)

The existing ObservationRepository remains storage; historical intelligence sits above it.

One more important rule

Results should retain observation IDs.

For example, lowestPrice should not merely return:

489.99

It should retain:

price: 489.99
observationId: mer_obs_...
observationTime: ...
retailerId: ...

That preserves explainability and lets us trace every historical claim back to its evidence.

This should become ADR-011 — Historical Intelligence Is Derived From Immutable Observations.

One practical point: the repository currently contains only one canonical Mercury observation, so we cannot prove meaningful history using production data yet. M006 tests should therefore use deterministic in-memory observation fixtures representing multiple points in time. We should not manufacture fake canonical market observations merely to make the feature appear populated. Once real ingestion begins, the same engine will operate on actual accumulated observations.