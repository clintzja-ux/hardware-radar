HR-ARCH-001  Hardware Database Specification


# Hardware Database Specification

**Version:** 1.0

**Status:** Canonical Architecture

**Project:** Hardware Radar

**Maintained By:** Mirabelle Labs

---

# Preface

The Hardware Database is the foundation of Hardware Radar.

Its purpose is not to store products.

Its purpose is to represent hardware knowledge in a way that is accurate, explainable, extensible, and trustworthy.

Every public feature of Hardware Radar—including the website, recommendation engine, APIs, AI assistant, search engine, analytics, and future applications—should ultimately derive its information from this model.

The database is therefore considered the single source of truth for the platform.

This document defines that truth.

---

# Vision

Hardware Radar is not a collection of pages.

It is a hardware intelligence platform.

The website is simply one interface into that platform.

Future interfaces may include:

- Mobile applications
- Desktop applications
- Public APIs
- AI assistants
- Browser extensions
- Internal administration tools

The architecture should support these interfaces without redesigning the underlying model.

---

# Design Philosophy

The database exists to model reality.

Never model pages.

Never model layouts.

Never model temporary UI decisions.

Model hardware.

Model retailers.

Model prices.

Model relationships.

Model history.

Model knowledge.

The user interface should adapt to the data.

The data should never adapt to the user interface.

---

# Core Principles

## HD-P001 — Single Source of Truth

Every product has one canonical definition.

Every system references that definition.

No duplicate product definitions are permitted.

---

## HD-P002 — Immutable Identity

Every product receives one permanent identifier.

The identifier never changes.

Names may change.

Images may change.

Specifications may be corrected.

Retailers may change.

Prices may change.

Identity does not.

---

## HD-P003 — Separation of Responsibility

Products describe hardware.

Prices describe observations.

History describes change.

Recommendations describe decisions.

Compatibility describes relationships.

Each responsibility belongs to one system only.

---

## HD-P004 — Historical Integrity

Historical information should never be overwritten.

Knowledge accumulates.

The platform becomes more valuable over time because it remembers.

---

## HD-P005 — Explainability

Every recommendation should be traceable.

The platform should always be capable of explaining why a recommendation exists.

---

## HD-P006 — Technology Independence

The architecture should survive changes in technology.

JSON today.

SQLite tomorrow.

PostgreSQL later.

Distributed services in the future.

The model should remain stable.

---

## HD-P007 — Build for Expansion

RAM is the first implementation.

It is not the final implementation.

Every design decision should support future hardware categories without architectural redesign.

---

# Conceptual Model

Hardware Radar consists of concepts rather than pages.

The core concepts are:

Brand

↓

Series

↓

Product

↓

Retailer

↓

Price Observation

↓

Price History

↓

Compatibility

↓

Recommendation

↓

Knowledge

Every future feature should be expressible using these concepts.

---

# Core Entities

## Brand

Represents a manufacturer.

Examples:

- Corsair
- G.Skill
- Kingston
- Crucial

A Brand owns many Series.

---

## Series

Represents a product family.

Examples:

- Vengeance
- Fury
- Ripjaws
- Trident

A Series owns many Products.

---

## Product

Represents one physical hardware product.

Products are the center of the Hardware Database.

Everything else references Products.

---

## Retailer

Represents a seller.

Examples:

- Amazon
- Newegg
- Best Buy
- B&H

Retailers never own products.

Retailers observe products.

---

## Price Observation

Represents:

One retailer

One product

One point in time

This distinction is fundamental.

Prices are observations.

Not product properties.

---

## History

History is a sequence of observations.

History should accumulate.

Never replace.

Never delete without explicit administrative action.

---

## Recommendation

Recommendations are generated.

They are never manually curated.

They are conclusions produced from data.

---

## Compatibility

Compatibility is a relationship.

Products are compatible with other hardware.

Products are not compatible by themselves.

---

# Canonical Product Model

Every Product should include:

- Permanent Product ID
- Brand
- Series
- Model
- Category
- Specifications
- Images
- Supported Technologies
- Physical Characteristics
- Metadata

Pricing is intentionally excluded.

---

# Price Model

Prices belong to retailers.

Each observation should include:

- Retailer
- Currency
- Price
- Availability
- Shipping
- Affiliate Link
- Verification Timestamp
- Source URL

Prices are replaceable.

Products are not.

---

# Historical Model

Historical data is one of Hardware Radar's greatest long-term assets.

Historical information should eventually include:

- Price history
- Availability history
- Retailer history
- Specification corrections
- Product image revisions

The value of the platform should increase with time.

---

# Recommendation Inputs

Recommendations should be generated from objective criteria.

Potential scoring systems include:

- Value
- Gaming
- Productivity
- Workstation
- Budget
- RGB
- Efficiency
- Future Upgrade Potential

Recommendations should remain explainable.

---

# Knowledge Graph

Hardware Radar should eventually represent relationships rather than isolated records.

Example:

Brand

↓

Series

↓

Product

↓

Memory Technology

↓

Capacity

↓

Speed

↓

Compatibility

↓

Retailers

↓

Price History

↓

Recommendations

↓

AI Assistant

The graph should expand naturally as new hardware categories are introduced.

---

# Future Storage Strategy

Current Storage

↓

JSON

↓

SQLite

↓

PostgreSQL

↓

Distributed Services

Migration should occur without changing the conceptual model.

Only the storage engine should evolve.

---

# AI Integration

Artificial Intelligence should never invent hardware information.

The AI should query the Hardware Database.

The Hardware Database provides verified information.

The AI explains the information.

Trust is preserved by grounding responses in structured data.

---

# Engineering Rules

Every Product ID is permanent.

Historical data is append-only.

Recommendations are generated.

Prices are timestamped.

Retailers are identifiable.

Relationships are explicit.

Data duplication should be avoided whenever possible.

---

# Future Expansion

The architecture should support future categories including:

- RAM
- SSD
- GPU
- CPU
- Motherboards
- Monitors
- Storage
- Networking
- Peripherals

without requiring architectural redesign.

---

# Future Questions

Questions guide future evolution.

Examples include:

Should compatibility become its own engine?

Should historical observations become event streams?

Should recommendation scores become machine learned?

Should AI produce buying summaries?

Should user preferences become part of the knowledge graph?

These questions intentionally remain open.

---

# Closing Statement

The purpose of this database is not to store hardware.

The purpose of this database is to reduce uncertainty.

Every product represented here should make it easier for someone to make a confident purchasing decision.

Technology will change.

Retailers will change.

Programming languages will change.

The mission should not.

> Build systems that help people buy with confidence.

That is the purpose of the Hardware Database.