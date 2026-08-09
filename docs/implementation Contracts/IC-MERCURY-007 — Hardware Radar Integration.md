IC-MERCURY-007 — Hardware Radar Integration

This deserves more caution than a normal Mercury sprint because we're about to cross a major architectural boundary:

PLATFORM                         APPLICATION

Mercury
   │
   ▼
Publishing Boundary
   │
   ▼
public/data/...
   │
   ▼
Hardware Radar

Until now we've been able to make Mercury increasingly sophisticated while Hardware Radar continued operating independently.

M007 connects those worlds.

And I want to preserve something from the charter:

The website is merely a presentation layer.

Hardware Radar should not import packages/mercury and start executing Mercury intelligence in the browser.

Instead, Mercury should produce—or Forge should publish—a stable application-facing representation that Hardware Radar consumes.

That keeps this boundary intact:

Atlas + Mercury + Sentinel
          │
          ▼
        Forge
          │
    validate/publish
          │
          ▼
   Published Dataset
          │
          ▼
   Hardware Radar

This also brings us directly back to something you emphasized before we started Mercury:

Forge is the internal administration/publishing subsystem, and the public site needs the subsystems operational so Forge can ultimately publish the data the site displays.

M007 is where that philosophy starts becoming real.

But there is an important constraint

We still have only a tiny amount of canonical Mercury market data.

So M007 must not pretend Hardware Radar suddenly has live prices.

I recommend dividing the integration into two concerns:

M007 establishes the production publishing contract and proves Hardware Radar can consume it.

Then actual retailer acquisition/population can follow through the adapter/Forge workflow.

That means we can replace the architecture of the placeholder path without falsely representing placeholder values as verified live observations.

This is especially important given Hardware Radar's core promise:

Find today's cheapest verified computer hardware from trusted retailers.

We shouldn't display "verified" until Mercury actually has qualifying observations to support that statement.

Proposed M007 objective

Establish the certified Mercury → Forge → Hardware Radar publishing boundary while preserving truthful empty/insufficient-data behavior.

Likely deliverables will include:

application-facing market snapshot contract;
deterministic cheapest-price selection;
publication eligibility rules;
Atlas + Mercury joining;
Forge publishing service;
generated public/data artifact;
Hardware Radar consumer migration;
insufficient-data state;
provenance/freshness metadata appropriate for presentation;
regression tests;
publishing tests;
site integration tests.

And there is a major architectural decision embedded in there:

What exactly qualifies an observation for publication?

We now have all the ingredients to answer that properly:

Canonical observation?
        ↓
Validation PASS?
        ↓
Product exists in Atlas?
        ↓
Retailer exists?
        ↓
Provenance valid?
        ↓
Fresh enough?
        ↓
Confidence sufficient?
        ↓
Eligible for publication

Notice how the previous six sprints suddenly converge.

That's why we didn't rush the website integration earlier.

We can now define "cheapest verified RAM" using platform evidence rather than a pile of frontend assumptions.

The audit also uncovered exactly why M007 is necessary.

The homepage currently loads public/data/ram.json, which still contains placeholder claims such as 247 prices checked, 8 trusted retailers, and lowest price in the last 90 days. It then overwrites the hero with atlasAdapter.js, but that adapter is still reading the old legacy PRICE-20260715-000001.json contract rather than the canonical mer_obs_000000001 v1.1 observation.

So we now have three data worlds:

Placeholder application data
          +
Legacy Mercury compatibility data
          +
Canonical Atlas/Mercury platform data

M007 should collapse that to one legitimate publishing path.

IC-MERCURY-007 — Hardware Radar Integration

I recommend locking the architecture as:

Atlas ───────┐
             │
Mercury ─────┼──► Publication Pipeline
             │          │
Sentinel ────┘          ▼
                   Published Snapshot
                         │
                         ▼
                   public/data/
                         │
                         ▼
                   Hardware Radar

Hardware Radar will consume a published application artifact. It will not execute Mercury's intelligence engine in the browser.

That also means our current build:public behavior should eventually stop copying the complete Mercury engineering package into public/data/mercury. Public deployment should receive published data, not Mercury's internal engine implementation.

Publication eligibility

This is where M001–M006 finally converge. A market observation should be publishable only when the publication service can establish, deterministically:

canonical observation validity;
canonical Atlas product;
canonical Atlas retailer;
valid provenance;
acceptable lifecycle/validation state;
acceptable freshness;
sufficient confidence;
valid comparable offer;
required application-facing fields.

Failure at any required gate means:

NOT PUBLISHED

—not "publish it with a warning."

Forge can still expose review states internally, but the public artifact must fail closed.

Published contract

I recommend introducing an application-facing snapshot rather than exposing raw observations.

Conceptually:

{
  "schemaVersion": "1.0",
  "generatedAt": "...",
  "status": "AVAILABLE",
  "scope": {
    "category": "ram"
  },
  "cheapest": {
    "atlasProductId": "...",
    "observationId": "...",
    "brand": "Corsair",
    "displayName": "...",
    "memoryType": "DDR5",
    "capacity": "32GB",
    "speed": "6000 MT/s",
    "price": 509.99,
    "currency": "USD",
    "retailer": "Amazon",
    "sourceUrl": "...",
    "observedAt": "...",
    "freshness": "...",
    "confidence": "..."
  },
  "coverage": {
    "eligibleObservations": 1,
    "retailersRepresented": 1
  }
}

The exact schema can be finalized during implementation.

Crucially, it contains the evidence identifiers:

atlasProductId
observationId

so every public price can be traced back through Mercury and Atlas.

Insufficient-data behavior

This needs to be first-class.

Right now we have only one canonical market observation, and at today's evaluation time that July 15 observation may not satisfy M004's current freshness policy.

Therefore M007 must be capable of truthfully publishing:

status: INSUFFICIENT_DATA

with no cheapest price.

Hardware Radar then needs to render an appropriate state such as:

Current verified pricing is temporarily unavailable.

rather than falling back to $74.99 or pretending that stale data is today's cheapest price.

That is the point where Truth over clicks becomes executable architecture.

Placeholder migration

I recommend M007 remove placeholder market claims from the live rendering path.

We don't necessarily need to delete the old JSON immediately; it can remain temporarily as legacy/reference material during migration. But Hardware Radar should no longer use placeholder prices as if they were verified platform intelligence.

Static editorial material—FAQ copy, buying advice, category descriptions—can remain separate because those aren't Mercury observations.

One adjustment to Forge

Forge already contains PublicationReadinessEngine, but its current purpose is primarily product-authoring readiness.

I would not overload it with Mercury publication semantics.

Instead, M007 should introduce a dedicated platform publishing service, with Forge orchestrating it later:

Forge
  ↓
MarketPublicationService
  ↓
Published Hardware Radar Snapshot

That protects Forge's role as the administration/publishing application without making its UI services the canonical source of publication rules.

ADR

This deserves:

ADR-012 — Applications Consume Published Intelligence Artifacts

Decision:

Public applications shall consume application-facing artifacts produced from validated platform knowledge and intelligence. Applications shall not directly execute canonical platform subsystems or independently determine publication eligibility.

That rule will eventually apply not only to Hardware Radar but also to the mobile app, browser extension, enterprise dashboard, and Gateway consumers.

M007 exit criteria

I would require:

canonical publication eligibility implemented;
deterministic cheapest eligible observation selection;
Atlas + Mercury joining implemented;
published snapshot schema implemented;
AVAILABLE and INSUFFICIENT_DATA states implemented;
evidence IDs retained;
placeholder hero path removed;
legacy PRICE-* observation no longer used by Hardware Radar;
no false "verified today" claims;
site gracefully handles insufficient data;
publication tests;
integration tests;
existing 28 Mercury tests remain green;
15 Atlas tests remain green;
7 Sentinel tests remain green;
Forge remains operational;
all Hardware Radar pages remain operational.

One thing I would not do in M007 is fabricate enough observations to make the website look complete. If the certified platform can currently substantiate only one product—or none under current freshness policy—the site should say so.

That may temporarily make Hardware Radar look less impressive than the placeholder version.

Architecturally, however, it will make it vastly more trustworthy.

IC-MERCURY-007 is approved for implementation on this baseline. This is the sprint where Hardware Radar stops looking like a hardware intelligence application and begins actually being powered by one.