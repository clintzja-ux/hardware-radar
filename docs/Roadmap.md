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



## Long term Vision july 27, 2026 ##

The Long-Term Vision

I see the platform evolving in four major eras.

Era 1 — Foundation (Current)

Goal: Build the platform correctly.

This is where we are today.

Subsystems
Subsystem	Status
Atlas	🟡 Near completion
Mercury	🟡 Foundation exists
Sentinel	🟢 Mature
Forge	🟡 Operational (v0.2/0.3)
Observatory	⚪ Planned
Aurora	⚪ Planned
Beacon	⚪ Planned
Gateway	⚪ Planned
Primary Objective

Produce deterministic hardware knowledge.

Not users.

Not traffic.

Not revenue.

Knowledge.

Era 2 — Hardware Radar Production

This is where the platform proves itself.

Objective

Become the most trusted destination for answering:

"Where can I buy the cheapest verified RAM right now?"

Not reviews.

Not opinions.

Facts.

The homepage should eventually become something like:

Cheapest RAM Today

Overall Winner

DDR5

DDR4

Laptop RAM

Recently Changed Prices

Price History

Availability

Verified

Every value comes from Atlas + Mercury.

Nothing is hardcoded.

Nothing is manually edited.

Then expand

Once RAM is complete:

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

↓

Storage

↓

Peripherals

Every category uses exactly the same engineering pipeline.

Era 3 — Hardware Intelligence

This is where Hardware Radar stops being "price comparison."

It starts becoming knowledge.

Imagine visiting a GPU page.

Instead of:

Price

Retailer

Buy Now

You also see:

Compatible CPUs

PCIe version

Power requirements

Recommended PSUs

Competing GPUs

Firmware

Known issues

Successor

Availability trend

Price trend

Launch history

That's no longer a shopping website.

That's hardware intelligence.

This is where Observatory joins.

Example:

RTX 6080

↓

New BIOS released

↓

Driver issue discovered

↓

Price dropped 12%

↓

Replacement announced

Now Hardware Radar understands hardware evolution.

Era 4 — Platform

Eventually I think people will know the platform more than the website.

Applications become:

Hardware Radar

Mobile App

Browser Extension

Enterprise Dashboard

API

AI Assistant

Inventory Systems

Procurement Tools

All powered by the same platform.

Aurora

I don't actually see Aurora as a chatbot.

I think Aurora becomes an engineering reasoning engine.

Questions like:

Is this RAM compatible with my motherboard?

Aurora answers using:

Atlas

↓

Mercury

↓

Observatory

↓

Sentinel

Not web search.

Or:

Why are DDR5 prices rising?

Aurora reasons from Mercury observations.

Or:

Should I wait before buying?

Aurora reasons from:

Atlas

Mercury

Observatory

No hallucinations.

Exactly like the charter says.

Beacon

Beacon eventually becomes the platform's telemetry.

Questions like:

Most viewed products

Most volatile prices

Fastest changing retailers

Top categories

Most searched RAM

Recommendation accuracy

Price prediction accuracy

Beacon improves the platform itself.

Gateway

Gateway exposes the platform.

Eventually:

GET /products

GET /prices

GET /cheapest

GET /compatibility

GET /history

GET /recommendations

Hardware Radar itself should eventually consume Gateway rather than reading repository files directly. That keeps every consumer using the same public contract.

Observatory

I actually think Observatory becomes much more important than we originally imagined.

Not because it stores news.

Because it stores hardware events.

Examples:

Product Launch

Product Discontinued

Firmware Released

BIOS Update

Specification Revision

JEDEC Update

Manufacturer Announcement

Recall

End of Life

Security Advisory

Those events enrich the platform.

The Public Website

One thing I want to clarify because I briefly lost sight of it.

The website is never the platform.

The website is one application.

It should eventually look like:

User

↓

Hardware Radar

↓

Gateway

↓

Atlas

Mercury

Aurora

Beacon

Observatory

The website knows nothing about repository internals.

The Next 12–18 Months

Here's how I would phase it based on the repository as it exists today.

Phase 1 — Complete the Core Platform
Finish Atlas.
Finish Mercury.
Finish Forge.
Keep Sentinel stable.
Replace placeholder data on the website.

Milestone: Hardware Radar is fully driven by platform data.

Phase 2 — Complete RAM
Hundreds of RAM products.
Dozens of retailers.
Price history.
Cheapest algorithms.
Availability.
Compatibility.
Historical tracking.

Milestone: Become the most trusted RAM data source.

Phase 3 — Expand Hardware
SSD
CPU
GPU
Motherboards
Cooling
PSUs
Monitors
Networking
Storage
Peripherals

All using the same engineering pipeline.

Phase 4 — Intelligence
Observatory
Aurora
Beacon
Gateway
Mobile app
Browser extension
Public API
Enterprise integrations


Long-term monetization

One thing I think is becoming clear is that affiliate revenue is Phase One, not the end state.

The platform you're building has several potential revenue streams over time:

Phase 1 (Current Vision)
Affiliate partnerships (Amazon, Newegg, Best Buy, etc.)
Hardware Radar website
Phase 2
Gateway API access for developers
Premium historical market data
Advanced comparison tools
Phase 3
Enterprise procurement dashboards
Inventory and purchasing integrations
OEM or retailer analytics
Phase 4
Aurora-powered intelligence services
Compatibility APIs
Hardware lifecycle and observability services

The important point is that none of these require changing Atlas, Mercury, or Sentinel. They simply consume more of the platform's capabilities.

I think we've finally stabilized the engineering direction

After reviewing the repository and having this discussion, I don't think we're in the "invent architecture" phase anymore.

We're in the execution phase.

Our roadmap is now stable:

Phase A — Complete the Platform Core
Finish Atlas
Finish Mercury
Finish Forge
Keep Sentinel stable
Phase B — Production Pipeline
Replace placeholder data
Publish real Atlas and Mercury records
Drive the public site entirely from platform data
Phase C — Complete RAM
Comprehensive RAM catalog
Verified retailers
Historical observations
Cheapest-offer engine
Phase D — Expand the Platform
SSDs
CPUs
GPUs
Motherboards
Cooling
Networking
Displays
Additional hardware categories
Phase E — Platform Intelligence
Observatory
Aurora
Beacon
Gateway
Mobile app
Browser extension
Enterprise services

That roadmap aligns with the Platform Charter, with the current repository, and with the work already completed.

One commitment from me

I also want to make a commitment for the rest of this project.

Now that I've completed a full repository audit, I am going to stop proposing new architectural directions unless one of three things happens:

The Platform Charter changes.
The repository reveals a conflict or gap that genuinely requires a design decision.
You explicitly ask us to evolve the architecture.

Otherwise, my focus will be on executing the roadmap we've already agreed on. That means less revisiting fundamentals and more shipping well-engineered, tested subsystems in the order we've locked:

Atlas → Mercury → Forge → Production publication → Hardware expansion.

I think that's the discipline this project needs now, and it's the best way to turn the architecture you've designed into a mature Hardware Intelligence Platform.