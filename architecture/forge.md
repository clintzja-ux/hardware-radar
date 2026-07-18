Forge Architecture Bible v1.0

Status: Canonical Engineering Reference

Purpose: Define the long-term architecture, philosophy, and engineering principles of Forge.

1. Mission Statement

Forge exists to produce trustworthy product data.

Generating Atlas and Mercury JSON is not Forge's primary purpose.

Forge's primary purpose is to evaluate, validate, explain, and prepare engineering product records before they enter the Hardware Radar ecosystem.

Every service in Forge should ultimately contribute toward one question:

Can this product record be trusted?

2. Core Philosophy

Forge follows six core principles.

Principle 1 — Deterministic

Given identical input:

Forge must always produce identical output.

No randomness.

No hidden state.

No unpredictable AI decisions during generation.

Principle 2 — Explainable

Forge never says:

Review Required

without explaining why.

Every decision must be traceable.

Example:

READY

Reason

No required fields missing.

No engineering contradictions detected.

Derived values verified.

Explainability is a first-class feature.

Principle 3 — Engineering Before Export

Atlas and Mercury are outputs.

Engineering review is the product.

Everything happens before export.

Principle 4 — Single Responsibility

Every service owns exactly one responsibility.

Example:

ProductForm

↓

DerivedFieldService

↓

RequiredFieldValidator

↓

EngineeringValidator

↓

PublicationReadinessEngine

↓

AtlasProductBuilder

↓

ForgeGenerator

No service should perform another service's job.

Principle 5 — Domain Knowledge Lives in Validators

ForgeGenerator should never know:

DDR5 rules
XMP rules
SSD endurance
PCIe lane rules

Those belong inside engineering validators.

Principle 6 — Trust Over Speed

Forge prefers correctness over convenience.

If uncertain:

Recommend review.

Never invent data.

3. System Pipeline

This becomes the canonical pipeline.

Engineer Input
        │
        ▼
ProductForm
        │
        ▼
DerivedFieldService
        │
        ▼
RequiredFieldValidator
        │
        ▼
EngineeringValidator
        │
        ▼
PublicationReadinessEngine
        │
        ▼
AtlasProductBuilder
        │
        ▼
ForgeGenerator
        │
        ▼
Atlas JSON
Mercury JSON

Nothing bypasses this flow.

4. Decision Model

Forge makes one of three decisions.

READY

Requirements met.

Engineering review passed.

Safe to publish.

REVIEW

Record is valid.

Human verification recommended.

Examples:

unusual specifications
missing optional engineering data
uncommon configurations
BLOCKED

Publishing should not proceed.

Examples:

missing required fields
contradictory core identity
invalid pricing
5. Decision Report

Every evaluation produces a structured report.

{
    status: "READY",

    confidence: "HIGH",

    score: 96,

    blockers: [],

    warnings: [],

    confirmations: [],

    recommendations: [],

    reasoning: []
}

This becomes Forge's primary output.

6. Validation Hierarchy

Validation occurs in layers.

Layer 1

Required Validation

Question:

Can Forge generate this product?

Layer 2

Engineering Validation

Question:

Does this hardware description make sense?

Layer 3

Publication Readiness

Question:

Would an engineer confidently publish this?

7. Engineering Codes

Reserved permanently.

GEN001–GEN099

General

RAM001–RAM099

RAM Warnings

RAM100–RAM199

RAM Confirmations

SSD001–SSD099

SSD Warnings

SSD100–SSD199

CPU001–CPU099

CPU100–CPU199

GPU001–GPU099

GPU100–GPU199

MON001–MON099

MON100–MON199

Codes never change once released.

8. Future Intelligence

Publication Readiness will eventually consume additional services.

Manufacturer Recognition

Part Number Recognition

Specification Suggestions

Image Verification

PDF Verification

Retail Verification

Price Freshness

Confidence Estimation

These remain optional layers.

9. Long-Term Vision

Today:

Engineer

↓

Forge

↓

Atlas

Tomorrow:

Engineer

↓

Forge

↓

Engineering Review

↓

AI Suggestions

↓

Atlas

↓

Mercury

↓

Hardware Radar

Eventually:

Engineer

↓

Forge

↓

Engineering Decision Engine

↓

Multiple Publishing Platforms

Forge becomes the authoritative source of product truth.

10. Development Rule

Every new feature should answer three questions before implementation:

Which service owns this responsibility?
Does it preserve deterministic behavior?
Does it improve trust in the product record?

If the answer to any is "no," reconsider the design.

Why I believe this matters

We've now built enough of Forge that architecture is becoming more valuable than individual features.

Looking back over what we've accomplished:

ProductForm isolates data collection.
DerivedFieldService enriches data deterministically.
RequiredFieldValidator enforces mandatory requirements.
EngineeringValidator encodes hardware knowledge.
The next step, PublicationReadinessEngine, will make explainable decisions rather than simply calculate a score.

Those pieces already fit this architecture almost perfectly.

My recommendation

I would freeze this as Forge Architecture Bible v1.0.

From this point forward, every major feature should be checked against it before implementation. It becomes the project's "constitution," just as the Lunchbox Lines Design Bible became the canonical reference for gameplay and monetization.

With that foundation in place, our next coding milestone is no longer "build a scorer." It's build the PublicationReadinessEngine, because we now know exactly what its purpose is, what it consumes, and what it must produce. I think that's a much stronger direction for the project.


Tier 1 — Natural expansion (Hardware Radar)

These are the obvious next categories because they share the same ecosystem and engineering mindset.

✓ RAM
✓ SSD
✓ HDD
✓ CPU
✓ GPU
✓ Motherboards
✓ Power Supplies
✓ Cases
✓ CPU Coolers
✓ Monitors
✓ Keyboards
✓ Mice
✓ Headsets
✓ Laptops
✓ Prebuilt PCs
✓ Networking Equipment

Each gets its own validator.

For example:

validators/

RAMEngineeringValidator

SSDEngineeringValidator

CPUEngineeringValidator

GPUEngineeringValidator

Nothing else changes.

Tier 2 — Consumer Electronics

Once the engine understands products instead of just PC parts:

Phones

Tablets

Smart Watches

TVs

Projectors

Cameras

Drones

Printers

NAS Devices

Example:

Phone Validator

Rules:

Storage sizes valid?
SIM configuration?
5G supported?
Wireless charging?
Regional model?

Exactly the same architecture.

Tier 3 — Home Technology

Now things get interesting.

Robot Vacuums

Smart Locks

Smart Lights

Thermostats

Security Cameras

Doorbells

Wi-Fi Systems

Example:

Robot Vacuum

Engineering rules:

Battery capacity

Runtime

Auto-empty support

Mop capability

LIDAR navigation

Obstacle avoidance

Firmware updates

Again…

Forge doesn't care.

Only the validator changes.

Tier 4 — Photography

This would be fantastic.

Camera Bodies

Lenses

Tripods

Lighting

Microphones

Gimbals

SD Cards

Imagine the validator knowing:

EF mount compatibility
Sony E mount
Full-frame
APS-C
Image stabilization
Tier 5 — Audio

Another deterministic category.

Speakers

Receivers

DACs

Amplifiers

Headphones

Microphones

Engineering rules become:

Impedance
Sensitivity
Power output
Bluetooth codec support
Frequency response
Tier 6 — Automotive

This surprised me when I started thinking about it.

You could build:

Automotive Radar

Products:

Tires

Batteries

Motor Oil

Spark Plugs

Brake Pads

Air Filters

Dash Cameras

Validators become:

Tire width/profile/rim compatibility
Oil viscosity
API certification
Battery group size

Very deterministic.

Tier 7 — Appliances
Air Conditioners

Refrigerators

Dishwashers

Washing Machines

Dryers

Microwaves

Validators:

Energy rating

Voltage

Capacity

Noise

Water consumption

Tier 8 — Professional Equipment

This one is fascinating.

Industrial Networking

Servers

UPS Systems

Rack Cabinets

Enterprise SSDs

Enterprise HDDs

Essentially Hardware Radar Enterprise.

Tier 9 — Medical Equipment

Much later.

Blood Pressure Monitors

Pulse Oximeters

Thermometers

CPAP Machines

Deterministic specifications.

Heavy validation.

Tier 10 — Scientific Equipment
Microscopes

Laboratory Scales

Oscilloscopes

Multimeters

Power Supplies

Engineers love specification comparison.

The really exciting realization

Notice something.

The pipeline never changes.

Product Input
      │
      ▼
Derived Fields
      │
      ▼
Required Validation
      │
      ▼
Engineering Validation
      │
      ▼
Publication Decision
      │
      ▼
Export

Only this changes:

RAM Rules

becomes

Camera Rules

or

Robot Vacuum Rules

That's outstanding software architecture.

The business opportunity

This is the part I find most exciting.

You're currently building:

Hardware Radar

But the engine underneath is:

Forge

Forge could eventually power multiple verticals:

Forge
├── Hardware Radar
├── Camera Radar
├── Audio Radar
├── HomeTech Radar
├── Auto Radar
├── Enterprise Radar

Each site has different product schemas and validators, but they all rely on the same core pipeline.

Even further...

Imagine licensing Forge itself.

A company could define:

Category:
  Coffee Machines

Required Fields:
  Brand
  Pressure
  Water Tank
  Grinder

Engineering Rules:
  Pressure >= 9 bar
  Tank > 0

Forge wouldn't need to know anything about coffee machines ahead of time—it would execute the configured validation and publication workflow.

My recommendation

For the next 5–10 years, I would keep Forge focused on technology products. There is already enough depth to build an exceptional ecosystem:

Core PC hardware
Laptops
Networking
Storage
Monitors
Peripherals
Mobile devices
Smart home technology

These categories share overlapping concepts like manufacturers, retailers, specifications, compatibility, price tracking, and review workflows. That means every new category strengthens the platform instead of pulling it in a completely different direction.

If Forge becomes excellent at managing technology products, expanding into adjacent domains later will be much easier because the underlying architecture will already have proven itself.

i agree completely

I think we've crossed an important threshold in this project.

When we first started Forge, I saw it as a utility.

Now I see it as an engine.

And that's a very different mindset.

What excites me most isn't Hardware Radar anymore

It's that we're accidentally building something that follows a pattern I've seen in very successful software platforms.

They usually start by solving one narrow problem exceptionally well.

For example:

Shopify started with selling snowboards.
GitHub started with Git repositories.
Figma started with interface design.
Unreal Engine started as a game engine.

Over time, the underlying architecture became more valuable than the original product.

I think Forge has that same potential.

The thing we should protect

I think the most valuable asset we're creating is not the code.

It's the engineering philosophy.

For example, these principles are becoming foundational:

Every decision is deterministic.
Every decision is explainable.
Validation is separate from publication.
Domain knowledge is modular.
Builders never contain business logic.
No silent assumptions.
Trust is more important than convenience.

Those principles can outlive every line of code we write.

I also think we've identified Forge's "plug-in" architecture

Instead of this:

Forge

I'm now thinking:

Forge Core
│
├── RAM Module
├── SSD Module
├── CPU Module
├── GPU Module
├── Monitor Module
├── Laptop Module
└── ...

Each module contributes:

Schema

↓

Derived Fields

↓

Engineering Rules

↓

Recommendations

↓

Publication Policies

Forge Core doesn't know anything about DDR5 or PCIe.

It simply asks:

"Module, tell me how to evaluate this product."

That's a powerful separation.

Even the exports become modules

Right now we have:

Atlas

Mercury

Later:

Forge Core
│
├── Atlas Export
├── Mercury Export
├── Website Export
├── API Export
├── CSV Export
├── Analytics Export
└── AI Export

Notice that the engineering pipeline doesn't change.

Only the destination changes.

This is where I think Hardware Radar benefits

Imagine it's 3 years from now.

Hardware Radar contains:

12,000 RAM products
9,000 SSDs
6,000 GPUs
4,000 CPUs
15,000 observations

The average visitor will see a clean website.

What they won't see is that every product has passed through a rigorous, explainable engineering review before it was ever published.

That's a competitive advantage that's very difficult to copy.

A competitor can copy a website.

They can even copy a price table.

What they can't easily copy is a mature engineering workflow and the accumulated knowledge encoded in hundreds of validation rules.

I also want to start thinking about "institutional knowledge"

This is something companies struggle with.

For example:

Why does RAM001 exist?

If the only answer is:

"Because Clinton added it."

That's a problem.

Instead, every rule should eventually have its own documentation:

RAM001

Title:
Capacity Divisibility Check

Purpose:
Ensures total capacity divides evenly across installed modules.

Rationale:
A 32 GB kit with 3 modules would imply 10.67 GB per module, which is not a valid commercial configuration.

Severity:
Warning

Introduced:
Forge v0.2

Applies To:
DDR4
DDR5

Now the reasoning lives with the rule.

Five years from now, you'll still know why it exists.

A roadmap I can now envision

We've been thinking in sprints, which is the right way to build. But looking further ahead, I see distinct phases:

Phase 1 — Foundation (where we are now)
Stable architecture
RAM support
Deterministic pipeline
Engineering review
Atlas/Mercury export
Phase 2 — Product Intelligence
SSDs
CPUs
GPUs
Monitors
Cross-product validation
Better recommendations
Phase 3 — Assisted Engineering
Manufacturer recognition
Automatic spec suggestions
Official image lookup
Datasheet parsing
Retail verification
Phase 4 — Platform
Multiple hardware domains
REST API
Batch imports
Team workflows
Review queues
Approval history
Rule documentation
Analytics dashboards

At that point, Forge stops being "the tool behind Hardware Radar" and becomes a product in its own right.
I think we should establish "Forge Laws"

These aren't implementation details. They're rules we agree never to violate unless there's a compelling reason.

For example:

Law 1

Every class has one responsibility.

Law 2

Business rules never live in UI code.

Law 3

Builders never perform validation.

Law 4

Validators never mutate data.

This one is especially important.

Currently:

ProductForm
    ↓
DerivedFieldService

Derived fields are responsible for mutation.

Validators only inspect.

That separation is worth protecting.

Law 5

Every engineering decision must be explainable.

No hidden logic.

Law 6

Every exported product has passed through the same pipeline.

No shortcuts.

No special cases.

Law 7

Domain knowledge belongs in modules, not the core.

Forge Core should not know what DDR5 is.