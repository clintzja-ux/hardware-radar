# Hardware Radar Architecture

This directory contains the long-term architectural design of Hardware Radar.

Unlike implementation code, these documents describe the systems, data models, and engineering decisions that define the platform.

The goal is to preserve architectural intent as Hardware Radar evolves.

Code changes frequently.

Architecture should change deliberately.

---

## Purpose

Hardware Radar is being designed as a long-term hardware intelligence platform.

These documents explain how the platform works, why major decisions were made, and how future systems should integrate with one another.

Every major subsystem should have its own architecture document.

---

## Current Architecture Documents

- Hardware Database Specification
- Recommendation Engine
- Pricing Engine
- Search Engine
- AI Assistant

Additional documents may be added as the platform grows.

---

## Engineering Philosophy

The user interface is temporary.

The data model is permanent.

Build systems that survive technology changes.

Optimize for clarity before complexity.

Document decisions before they are forgotten.

Always protect the integrity of the data.

---

## Mirabelle Labs

Hardware Radar is developed using the Mirabelle Labs Product Framework.

Architecture exists to ensure that every future feature strengthens the platform rather than increasing technical debt.





# Hardware Radar Architecture

**Document ID:** HR-ARCH-000

**Version:** 1.0

**Status:** Canonical Architecture Index

---

# Purpose

This document is the architectural map of Hardware Radar.

It defines every major subsystem, its responsibility, and how those subsystems interact.

Individual architecture documents describe each subsystem in detail.

This document describes how the platform fits together.

---

# Architecture Philosophy

Hardware Radar is not a website.

Hardware Radar is a collection of independent systems working together to help people make better hardware purchasing decisions.

Each subsystem has one clear responsibility.

Subsystems communicate through well-defined interfaces.

The website is simply one consumer of these systems.

---

# Core Architecture

                        Hardware Radar

                               │

        ┌──────────────────────┼──────────────────────┐

        ▼                      ▼                      ▼

      Atlas                Mercury                 Echo

 Hardware Database      Pricing Engine        Search Engine

        ▼                      ▼                      ▼

      Compass             Aurora               Beacon

 Recommendation         AI Assistant          Analytics

        ▼                      ▼                      ▼

       Forge               Gateway

 Administration          Public API

---

# Core Subsystems

## Atlas

Document

HR-ARCH-001

Purpose

Understand hardware.

Responsibilities

• Products

• Brands

• Specifications

• Compatibility

• Categories

• Images

Owns

Hardware knowledge.

Does NOT own

Prices.

Recommendations.

Analytics.

Status

In Development

---

## Mercury

Document

HR-ARCH-002

Purpose

Observe retailers.

Responsibilities

• Prices

• Availability

• Shipping

• Verification

• Historical observations

Owns

Price observations.

Does NOT own

Products.

Status

Planned

---

## Compass

Document

HR-ARCH-003

Purpose

Generate recommendations.

Consumes

Atlas

Mercury

Produces

Best Value

Best Gaming

Best Budget

Best Overall

Status

Planned

---

## Echo

Document

HR-ARCH-004

Purpose

Search and discovery.

Consumes

Atlas

Indexes

Products

Brands

Categories

Status

Planned

---

## Aurora

Document

HR-ARCH-005

Purpose

Explain.

Consumes

Atlas

Mercury

Compass

Produces

Natural language explanations.

Buying guidance.

Comparison summaries.

Status

Planned

---

## Forge

Document

HR-ARCH-006

Purpose

Administration.

Used By

Mirabelle Labs.

Responsibilities

Product management.

Price verification.

Retailer management.

Content moderation.

Status

Planned

---

## Beacon

Document

HR-ARCH-007

Purpose

Understand users.

Sources

Google Analytics

Microsoft Clarity

Search Console

Bing Webmaster Tools

Produces

Insights.

Growth recommendations.

Behavior analysis.

Status

Foundation Complete

---

## Gateway

Document

HR-ARCH-008

Purpose

Expose Hardware Radar.

Consumers

Website

Future mobile apps

Browser extensions

Public APIs

Future integrations

Status

Future

---

# Architectural Rules

Every subsystem owns exactly one responsibility.

Subsystems communicate through data rather than direct coupling.

Historical information is append-only.

The UI never owns business logic.

Knowledge belongs to Atlas.

Prices belong to Mercury.

Recommendations belong to Compass.

AI belongs to Aurora.

Analytics belong to Beacon.

Administration belongs to Forge.

External consumers interact through Gateway.

---

# Current Development Order

HR-ARCH-001

Atlas

↓

HR-ARCH-002

Mercury

↓

HR-ARCH-003

Compass

↓

HR-ARCH-004

Echo

↓

HR-ARCH-005

Aurora

↓

HR-ARCH-006

Forge

↓

HR-ARCH-007

Beacon

↓

HR-ARCH-008

Gateway

---

# Long-Term Vision

Hardware Radar should evolve through capabilities rather than pages.

Every new subsystem should increase the intelligence of the platform without increasing architectural complexity.

The architecture should remain understandable years after its creation.

---

# Closing Statement

Architecture exists to protect the future.

Every subsystem should make the platform easier to expand, easier to maintain, and easier to trust.

The purpose of this architecture is not to build software.

The purpose is to build understanding.






ADR-001

Why Atlas separates Facts from Observations.

Decision:
Separate immutable product knowledge from time-varying retailer observations.

Status:
Accepted.

Reason:
Improves scalability, simplifies price history, enables future storage migration.





ADR-002

Why Product IDs are immutable.

Status:
Accepted.

Reason:
Allows stable references across history, analytics, APIs, and AI.


ADR-003

Why Recommendations are generated instead of manually maintained.

Status:
Accepted.

Reason:
Reduces bias, improves consistency, enables explainability.



Architecture Version

v1.0

Current Components

✓ Atlas
✓ Mercury
✓ Compass
✓ Echo
✓ Aurora
✓ Forge
✓ Beacon
✓ Gateway

Status

Atlas        Planned
Mercury      Planned
Compass      Planned
Echo         Planned
Aurora       Planned
Forge        Planned
Beacon       Planned
Gateway      Planned



Sentinel

Purpose:
Protect Atlas through automated Knowledge Integrity Rules (KIRs).

Status:
Future