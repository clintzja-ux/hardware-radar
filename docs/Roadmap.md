Sprint 1

Let's finish this first.

Hero

✅ Already mostly complete

Compare Drawer

This becomes our next feature.

Compare today's winner with the next 10 cheapest

▼

When opened:

Product	Price	Difference	Retailer
Kingston Fury	$76.99	+$2	Amazon
Teamgroup Vulcan	$77.49	+$2.50	Newegg
Crucial Pro	$78.99	+$4	Amazon
...	...	...	...

That's all.

Simple.

Fast.

Sprint 2

The three recommendation cards.

Not twenty.

Only three.

🎮 Best Gaming DDR5
Lowest latency

Best gaming performance

View Gaming Picks →
🌈 Best RGB DDR5
Best aesthetics

Sync compatible

View RGB Picks →
🖥 Best Workstation DDR5
Large capacities

Stable

View Workstation Picks →

Those become the only three paths away from the page.

Sprint 3

Buying guides.

These aren't blog posts.

They're concise answers.

Think "five-minute reads."

Examples:

DDR5 vs DDR4
Is 32GB enough in 2026?
Does RAM speed matter?
What is CAS latency?
Should you buy RGB RAM?

Every guide ends with:

"Here are today's cheapest DDR5 kits."

That loops readers back into the buying flow.

Sprint 4

Micro polish.

This is where Hardware Radar starts feeling premium.

Examples:

Smooth hover animations.
Expand/collapse transitions.
Better spacing.
Softer shadows.
Consistent iconography.
Mobile refinements.
Skeleton loading while prices load.

None of these change functionality, but together they make the site feel much more polished.


HR-UI-004 — Price Difference Indicator

Purpose

Help users compare alternatives to today's cheapest product at a glance.

Rules

Display only a small colored dot and the price difference.
Never use large badges or labels like "Good Deal" or "Bad Deal."
The price difference remains the primary information.
The colored dot is a secondary visual cue.
Keep the rest of the interface monochrome to preserve a clean, professional appearance.



🚀 Hardware Radar Version 1.0 Roadmap
✅ Phase 1 — Foundation (Completed)
✅ Product philosophy defined
✅ Product Bible established
✅ Design language established
✅ Modular architecture
✅ JSON-driven rendering
✅ Reusable component structure
✅ Phase 2 — DDR5 Category (Feature Complete)
✅ Hero Recommendation
✅ Compare with Next 10 Cheapest
✅ Decision Paths
✅ Buying Advice
✅ FAQ
✅ Consistent styling
✅ No console errors

This is a huge milestone.

🎯 Phase 3 — Launch Readiness Review (Next Session)

This becomes our only focus.

Functional QA
Every button works.
Every accordion opens correctly.
Every retailer link opens correctly.
No broken JSON.
No console errors.
No missing images.
Visual QA
Consistent spacing.
Consistent typography.
Consistent borders.
Consistent button styles.
Mobile layout.
Tablet layout.
Copy QA

Read the page from top to bottom.

Ask:

"If this were my first visit, would I understand everything?"

Any sentence that doesn't add value gets shortened or removed.

Trust QA

This is unique to Hardware Radar.

We'll ask:

Would I trust this recommendation enough to spend my own money?

That's the standard.

Performance QA

We'll look for:

duplicate CSS
duplicate JavaScript
unnecessary DOM
unnecessary rendering
unused assets
🏁 When that is complete

We officially declare:

Hardware Radar DDR5 Version 1.0 Complete

Not "mostly done."

Complete.


Phase A — Foundation ✅
Architecture
Atlas
Mercury
Forge v0.1
Documentation
Engineering standards
Phase B — Productivity 🚧
Forge v0.2
Complete RAM product generation
Schema validation
Duplicate detection
Repository integration
Phase C — Intelligence
Compass recommendations
Dynamic homepage
Historical pricing
Search
AI explanations
Setinel Engine v1.0 certification
I recommend a small roadmap adjustment

Initially we planned:

Session 011
RamRuleSet

↓

Session 012
RamValidators

↓

Session 013
Atlas Integration

Now that we've certified the engine, I think we should slightly reorder the work.

Proposed roadmap
Session 011

RAM Knowledge Model

This session establishes the canonical vocabulary that every subsystem will use.

Deliverables:

RAM domain model
terminology
enumerations
validation boundaries
compatibility concepts

This becomes the contract between Atlas, Sentinel, Mercury, Forge, and Aurora.

Session 012

RamRuleSet

Using the knowledge model, define the actual validation rules.

Examples:

Module count
Capacity consistency
Speed ranges
JEDEC rules
XMP/EXPO validation
Manufacturer normalization
Form factor
ECC consistency
Session 013

RamValidators

These implement the rule logic that evaluates RAM products against the rule set.

Session 014

Atlas Integration

Register the RAM schema and make it available to the rest of the platform.

Session 015

End-to-End Validation

Run real Hardware Radar RAM data through Sentinel and verify:

Product

↓

Atlas Schema

↓

RamRuleSet

↓

RamValidators

↓

Sentinel

↓

Validation Decision

This is the point where the platform begins validating real catalog data.

Why introduce a RAM Knowledge Model?

I think this is one of the most valuable architectural improvements we can make.

Right now, we know what a RAM product looks like.

But we haven't formally defined what RAM means to the platform.

For example, we should define:

Canonical fields
Manufacturer
Series
Part Number
Capacity
Module Count
Capacity Per Module
Memory Type
Generation
Speed
CAS Latency
Voltage
ECC
Buffered
Rank
Heat Spreader
RGB
Form Factor
Profile Support
Warranty

Every subsystem will use these same definitions.

Canonical enumerations

Instead of free text:

DDR5
DDR4
DDR3
LPDDR5X
SO-DIMM
UDIMM
RDIMM

become controlled values.

Canonical relationships

For example:

Capacity

=

Module Count

×

Capacity Per Module

This rule already exists in our Atlas validation philosophy.

By placing it in the knowledge model, Sentinel, Atlas, and Aurora all interpret it consistently.

Compatibility concepts

The model can describe relationships such as:

DDR5

compatible with

AM5
LGA1700
LGA1851
...

Those relationships become reusable across recommendations, validation, and future AI reasoning.

Looking ahead to Aurora

This also sets the stage for the AI layer.

When a user asks:

"Is this memory compatible with my motherboard?"

Aurora won't rely on pattern matching.

It will reason over the knowledge graph:

Motherboard

↓

Supported Memory Generation

↓

RAM Knowledge Model

↓

Sentinel Validation

↓

Answer


Our Engineering Principles

I think we should codify these as non-negotiable.

1. Truth before convenience

Never sacrifice correctness for speed.

2. Platform before application

If something benefits the platform, prefer it over a shortcut that only benefits one application.

3. Knowledge before presentation

Facts are created once and reused everywhere.

4. Explainability before automation

Every recommendation should have a chain of reasoning.

5. Extensibility before optimization

Build systems that can grow.

Optimize after they prove valuable.

6. Trust is the product

Everything else supports trust.

A Long-Term Roadmap

What excites me is that we can already see the journey beyond the initial launch.

Phase 1 — Foundation ✅
Atlas
Mercury
Sentinel
Forge
Phase 2 — Knowledge
RAM
CPU
GPU
SSD
Motherboards
Phase 3 — Intelligence
Compatibility reasoning
Price forecasting
Personalized recommendations
Build optimization
Phase 4 — Ecosystem
Public APIs
Browser extension
Mobile app
Enterprise tools
Developer SDK
Phase 5 — Global Platform
Multi-language support
Regional pricing
International retailers
Enterprise licensing
AI-powered hardware advisor

Notice that Hardware Radar is present throughout, but the platform is what enables each new capability.



Hardware Radar Platform
Platform Roadmap v1.0

Status: July 2026

Vision

Hardware Radar is evolving into a hardware intelligence platform that provides accurate, verifiable, and explainable hardware information.

Its long-term mission is:

To become the authoritative source of truth for consumer computer hardware by separating canonical product knowledge from retailer observations and enforcing engineering-grade validation before publication.

Guiding Principles

The platform is built around several core principles:

Canonical truth over convenience
Explicit ownership boundaries
Engineering-grade validation
Explainable AI
Retailer independence
Reproducible derived data
Every published fact has provenance
Unknown is preferable to guessing
Documentation drives implementation

These principles are now reflected consistently across Atlas, Mercury, Sentinel, and Forge.

Platform Architecture
                    Hardware Radar Platform

                           Hardware Radar
                                 ▲
                                 │
                              Forge
                                 ▲
                                 │
                            Sentinel
                                 ▲
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
      Atlas                                           Mercury

Subsystem responsibilities:

Atlas

Owns canonical hardware truth.

Examples:

Product identity
Technical specifications
Canonical records
Provenance
Lifecycle
Governance

Never stores:

prices
affiliate links
retailer metadata
Mercury

Owns market observations.

Examples:

Prices
Availability
Stock
Promotions
Retailer metadata
Amazon observations

Never modifies Atlas.

Observations are immutable.

Sentinel

The governance engine.

Responsible for:

Validation
Compliance
Engineering rules
Publication eligibility
Security validation

Sentinel never edits data.

Forge

Editorial platform.

Responsible for:

Editing
Publishing
Workflow
Builder
Human review

Forge follows Sentinel decisions.

Hardware Radar

Public presentation.

Responsible only for displaying approved information.

Current Progress
Component	Status	Completion
Platform Vision	✅ Complete	100%
Architecture	✅ Stable	100%
Atlas Core Model	✅ Complete	100%
RAM Extension	✅ Complete	100%
Mercury Model	✅ Complete	95%
Sentinel Specification	✅ Complete	95%
Repository Structure	✅ Stable	95%
JSON Schemas	🟡 Under Audit	85%
Canonical Product Records	🟡 Under Audit	80%
Validator Implementation	🟡 Early Implementation	35%
Forge Workflow	🟡 Good Foundation	60%
Hardware Radar UI	🟡 MVP+	70%
What We've Accomplished
Phase 1 — Vision

✅ Hardware Radar concept

✅ AI-first philosophy

✅ Retailer independence

Phase 2 — Architecture

✅ Atlas

✅ Mercury

✅ Sentinel

✅ Forge

Subsystem ownership established.

Phase 3 — Canonical Documentation

Completed:

Atlas Core Product Model
Atlas RAM Product Model
Mercury Data Dictionary
Sentinel Rule Specification

These are now our engineering contracts.

Phase 4 — Repository

Repository now mirrors the architecture.

This was a major milestone.

Phase 5 — Current Session (011)

Current objective:

Implementation Alignment

We're ensuring:

implementation
=
specifications

This is the transition from architecture to engineering.

Remaining Roadmap
Session 012
Sentinel Validator Framework

Deliverables:

ValidationResult model
Validation pipeline
ProductValidator implementation
Identity validators
Capacity validator
Unit tests
Session 013
Schema Compliance
Complete schema audit
Remove inconsistencies
Finalize JSON schemas
Validate canonical records
Session 014
Forge Integration

Implement:

Validation UI
READY/BLOCKED workflow
Review workflow
Publication eligibility
Session 015
Mercury Integration

Implement:

Observation loading
Atlas linking
Historical observations
Refresh workflow
Session 016
End-to-End Pipeline

Build:

Atlas Record

↓

Sentinel Validation

↓

Forge Review

↓

Publication Candidate

↓

Hardware Radar

This will be our first complete publishing pipeline.

Session 017
Automated Testing

Build:

Unit tests
Integration tests
Schema validation tests
Sentinel tests
End-to-end publication tests
Session 018
Hardware Radar Public MVP

Complete:

DDR5
DDR4
SO-DIMM

using the validated pipeline.

Phase 2 Roadmap

After the RAM platform is complete:

Atlas SSD Extension

Reuse:

Atlas Core
Mercury
Sentinel
Forge

Only SSD-specific fields change.

Then:

GPU
CPU
Motherboard
PSU
Cooling
Storage
Networking

Every new category becomes progressively easier because the platform beneath it is already proven.

Long-Term Vision

Eventually, the platform expands beyond a comparison website:

Hardware Radar

↓

Hardware Knowledge Platform

↓

Recommendation Engine (Compass)

↓

AI Reasoning (Aurora)

↓

Developer APIs (Gateway)

↓

Enterprise Hardware Intelligence Platform

At that stage, Hardware Radar becomes just one consumer of the platform rather than the platform itself.

Engineering Philosophy Going Forward

I recommend we formally adopt the following engineering policy:

Phase Complete
Architecture is considered stable.
Canonical documents are considered authoritative.
Major subsystem responsibilities are frozen.
Future Sessions Focus On
Implementation
Validation
Testing
Automation
Performance
Maintainability
Documentation refinement

Not on redesigning the architecture without a compelling engineering reason.

Success Criteria for Version 1.0

We'll consider Version 1.0 achieved when:

✅ Atlas stores canonical hardware truth.
✅ Mercury stores immutable retailer observations.
✅ Sentinel validates every publishable artifact.
✅ Forge cannot publish unvalidated content.
✅ Hardware Radar displays only validated data.
✅ Every published fact has traceable provenance.
✅ Every engineering invariant is automatically tested.
✅ RAM serves as the reference implementation for all future hardware categories.
My assessment

We've reached a milestone that many projects never achieve: the conceptual architecture is no longer the uncertain part. The challenge ahead is disciplined engineering—implementing validators, tightening schemas, expanding automated tests, and proving the design in production. Once the RAM pipeline is complete, SSDs, GPUs, CPUs, and future hardware families become extension projects rather than fresh architectural efforts. That is exactly the leverage we were aiming for from the beginning.