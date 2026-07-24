Hardware Radar Engineering Program
Phase 0 — Foundation (Completed) ✅
Vision
✅ Product vision
✅ Philosophy
✅ AI-first approach
✅ Business model
✅ Long-term roadmap
Architecture
✅ Atlas
✅ Mercury
✅ Sentinel
✅ Forge
✅ Hardware Radar

Architecture is now considered stable.

Canonical Documentation

Completed:

✅ Atlas Core Product Model
✅ Atlas RAM Extension
✅ Mercury Data Dictionary
✅ Sentinel Rule Specification

These now serve as the engineering contracts for implementation.

Phase 1 — RAM Reference Implementation (Current)

This is our immediate focus.

Milestone 1 ✅

Repository Review

Completed.

Milestone 2 ✅

Architecture Audit

Completed.

Milestone 3 ✅

Documentation Audit

Completed.

Milestone 4 🔄

Implementation Audit

Current Status: ~40%

We're verifying that:

Schemas
Validators
Canonical records
Repository

all faithfully implement the canonical specifications.

Milestone 5
Sentinel Validator Framework

Deliverables:

ValidationResult object
ValidationRunner orchestration
ProductValidator implementation
Identity validators
Capacity validators
Rule execution framework

This is the next major engineering milestone.

Milestone 6
Atlas Record Validation

Every RAM product must pass:

Schema validation
Sentinel validation
Business rules
Derived field verification
Provenance verification

No exceptions.

Milestone 7
Forge Integration

Publishing workflow:

Draft

↓

Validate

↓

Review

↓

Approved

↓

Published

Forge becomes the only path to publication.

Milestone 8
Mercury Integration

Observation pipeline:

Retailer

↓

Observation

↓

Normalize

↓

Link to Atlas

↓

Store

↓

Expose

Atlas remains untouched by retailer data.

Milestone 9
End-to-End Pipeline

This is our first true integration milestone.

Atlas

↓

Sentinel

↓

Forge

↓

Hardware Radar

↓

Public Website

Once complete, we'll have a functioning, validated publishing pipeline.

Milestone 10
Automated Testing

Coverage goals:

Schema tests
Validator tests
Integration tests
Publication tests
Regression tests

This is where engineering discipline really begins to pay dividends.

Phase 2 — Hardware Expansion

After RAM is production-ready, we replicate the pattern for new categories.

SSD
Atlas SSD Extension
Mercury SSD observations
Sentinel SSD rules
GPU

Same framework.

CPU

Same framework.

Motherboards

Same framework.

PSU

Same framework.

Cooling

Same framework.

Networking

Same framework.

By this stage, adding new hardware types should mostly involve creating extension schemas and rules rather than redesigning the platform.

Phase 3 — Intelligence Layer

Once the platform contains enough validated data, we start building capabilities on top of it.

Compass

Recommendation engine.

Examples:

Best value
Best gaming
Best workstation
Compatibility recommendations
Aurora

AI reasoning.

Instead of simply answering:

"Cheapest DDR5"

Aurora can explain:

"This kit is recommended because it offers the lowest verified price among CL30 DDR5-6000 kits with AMD EXPO support and a strong historical price trend."

Every explanation should be grounded in Atlas and Mercury data.

Gateway

Public APIs.

Potential consumers:

Hardware Radar
Partners
Developers
AI agents
Beacon

Analytics.

Track:

Price history
Validation metrics
Publication statistics
Data quality
Platform health
Phase 4 — Platform Maturity

By this point, Hardware Radar is no longer just a website.

It becomes an ecosystem:

                 Gateway API

                      ▲

Compass ◄──── Atlas ────► Mercury

     ▲             ▲            ▲

 Aurora         Sentinel      Forge

       \            |            /

          Hardware Radar Website

The website becomes just one client of the platform.

Engineering Standards

From this point onward, I'd like us to adopt a few working principles:

Specifications first. Every feature traces back to a canonical document.
Incremental implementation. Finish one subsystem before broadening scope.
Automated validation. Rules belong in code, not in developer memory.
Review gates. No major milestone is considered complete until we've audited it together.
RAM as the reference implementation. Future hardware categories should follow its established patterns.
Current Status Snapshot
Area	Status
Vision	✅ Complete
Architecture	✅ Stable
Documentation	✅ Stable
Repository Structure	✅ Stable
Schema Design	🟢 Strong
Implementation Audit	🟡 In Progress
Validator Framework	🔜 Next Priority
End-to-End Pipeline	⏳ Planned
RAM Reference Implementation	🚧 Active
Looking ahead

The next step remains Session 012: Sentinel Validator Framework, but with one additional objective.

Rather than just writing validators, we'll establish the validation infrastructure that every future hardware category will use. If we design that framework carefully now, SSDs, GPUs, CPUs, and the rest of the platform will inherit a proven validation system instead of each category reinventing its own. That investment should significantly reduce future implementation effort while keeping the platform consistent and maintainable.