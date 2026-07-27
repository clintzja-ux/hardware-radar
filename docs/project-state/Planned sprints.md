Hardware Intelligence Platform Roadmap (Execution Phase)
Phase 1 — Atlas (Current Sprint)

Objective: Complete the canonical knowledge repository.

Sprint 1 — Repository Foundation
✅ Brand Foundation (complete)
✅ Product Foundation (complete)
🔜 Category Foundation
🔜 Retailer Foundation
Sprint 2 — Repository Completion
ProductRepository completion
CategoryRepository
RetailerRepository
Repository APIs
Manifest completion
Referential integrity
Duplicate cleanup
Sprint 3 — Repository Validation
Atlas integrity validation
Repository consistency tests
Canonical identity verification
Legacy record migration
Complete Atlas documentation

Exit Criteria

When Atlas is finished:

every product belongs to a valid category
every product belongs to a valid brand
every retailer exists
every identifier is deterministic
every record validates
every repository test passes
Forge has one—and only one—canonical Atlas target

Only then do we move on.

Phase 2 — Mercury

Now Atlas becomes Mercury's source of truth.

We'll build:

Repository
MercuryRepository
ObservationRepository
Validation
ObservationValidator
Product reference validation
Retailer reference validation
Duplicate observation detection
Observation freshness rules
Intelligence
Cheapest offer selection
Cheapest by category
Current price
Price history
Price volatility
Retailer comparison
Tests

Everything deterministic.

Everything reproducible.

No inferred market state.

Phase 3 — Forge v1.0

Only after Atlas and Mercury stabilize.

Forge becomes an engineering tool—not a prototype.

We'll complete:

automatic ID generation
repository lookups
live schema validation
duplicate detection
Sentinel validation
publication readiness
deterministic output generation

Forge should eventually be capable of taking a product from engineering input to publication-ready records with minimal manual intervention.

Phase 4 — Hardware Radar Integration

Replace every placeholder.

Today:

Placeholder JSON

↓

Website

Target:

Forge

↓

Atlas

↓

Mercury

↓

Gateway (future)

↓

Hardware Radar

The public website becomes a pure presentation layer.

Phase 5 — RAM Completion

Only now do we scale content.

Instead of four RAM products:

Eventually:

DDR5
DDR4
Laptop RAM
ECC
Registered DIMMs
Thousands of observations
Hundreds of products
Dozens of retailers

Hardware Radar should become the authoritative RAM reference.

Phase 6 — Category Expansion

Reuse the exact same engineering pipeline.

RAM
   ↓
SSD
   ↓
CPU
   ↓
GPU
   ↓
Motherboards
   ↓
Cooling
   ↓
Power Supplies
   ↓
Networking
   ↓
Displays

Notice something important:

We're not redesigning the platform.

We're reusing it.

That tells me we've achieved a good architecture.

Phase 7 — Platform Intelligence

After enough data exists:

Observatory

Hardware lifecycle events

Aurora

Reasoning

Compatibility

Recommendations

Purchase advice

Beacon

Platform analytics

Gateway

Public APIs

Mobile
Browser Extension
Enterprise Dashboard
Throughout every phase

Affiliate integrations stay independent.

The pipeline remains:

Atlas
    ↓
Mercury
    ↓
Sentinel
    ↓
Recommendation
    ↓
Affiliate Resolution
    ↓
Amazon / Best Buy / Newegg / etc.

Affiliate relationships never influence the recommendation.

They only determine where the user can purchase after the platform has already identified the best option.

The Immediate Sprint

Now we narrow our focus.

Atlas Completion

I suggest we treat Atlas as a proper engineering milestone.

Sprint: ATLAS-1
Review EDR-010 (Canonical Entity Structure) and complete it.
Implement the Category Foundation.
Implement the Retailer Foundation.
Complete the ProductRepository.
Complete the Atlas manifest.
Resolve the legacy vs. canonical record strategy.
Run the full Atlas test suite.
Declare Atlas v1.0 Complete.

Only after Atlas earns that declaration do we open the Mercury sprint.

I also want to make one process change that I think will help 

From here on, every engineering session will follow the same structure:

Objective — What are we building?
Repository Review — What already exists?
Gap Analysis — What's missing?
Implementation Contract (IC) — Exactly what will be built.
Implementation — Write the code.
Verification — Tests and validation.
Engineering Review — Confirm it meets the contract.
Update the Engineering Log — Mark the milestone complete.

That keeps us disciplined, minimizes architectural drift, and gives us a clear record of progress. I think it'll make this feel much more like a real engineering project than a series of disconnected conversations.