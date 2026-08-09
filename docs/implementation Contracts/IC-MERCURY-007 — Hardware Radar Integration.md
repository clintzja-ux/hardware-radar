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