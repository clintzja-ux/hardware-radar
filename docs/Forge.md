# Forge

**Document ID:** HR-ARCH-006

**Version:** 1.0

**Status:** Planned

---

# Purpose

Forge is the administration and content creation subsystem of Hardware Radar.

It exists to create, validate, manage, and maintain the platform's knowledge without requiring manual editing of repository files.

Forge is used internally by Mirabelle Labs.

It is never part of the public website.

---

# Philosophy

Users browse Hardware Radar.

Administrators use Forge.

Forge should reduce repetitive work, prevent mistakes, and guarantee that all Atlas and Mercury data conforms to Hardware Radar standards.

If Atlas stores knowledge and Mercury stores observations, Forge is responsible for creating them correctly.

---

# Responsibilities

Forge is responsible for:

• Creating Atlas products

• Creating Mercury observations

• Managing brands

• Managing retailers

• Schema validation

• Duplicate detection

• ID generation

• Filename generation

• Repository consistency

• Administrative reporting

Forge never performs recommendations.

Forge never exposes public APIs.

Forge never contains business logic used by the website.

---

# Core Principles

Every generated file should be valid.

Every product should have a permanent identifier.

Every observation should be traceable.

Never duplicate an existing product.

Always validate before saving.

Automate repetitive work.

Human review is required before publication.

---

# Version Roadmap

## Forge v1

Manual Product Generator

Input:

Manufacturer URL

Retailer URL

Category

Price

Output:

✓ Atlas Product JSON

✓ Mercury Observation JSON

✓ Validation Report

✓ Suggested filenames

✓ Suggested commit message

---

## Forge v2

Repository Awareness

Forge searches Atlas before creating products.

If the product already exists:

Generate only a Mercury observation.

Prevent duplicate Atlas entries.

---

## Forge v3

Metadata Extraction

Given:

Manufacturer URL

Amazon URL

Forge automatically extracts:

Brand

SKU

Capacity

Speed

Timings

Voltage

Images

Official links

Retailer information

The administrator reviews the extracted information before generation.

---

## Forge v4

Batch Operations

Import multiple products.

Validate entire categories.

Generate missing observations.

Identify stale pricing.

Generate validation reports.

---

## Forge v5

AI Assisted Review

Suggest missing specifications.

Highlight inconsistencies.

Detect suspicious prices.

Recommend products worth tracking.

Explain validation failures.

---

# Relationship to Other Systems

Atlas

Receives canonical product records.

Mercury

Receives price observations.

Compass

Consumes Atlas and Mercury.

Echo

Indexes Atlas.

Aurora

Explains Atlas and Mercury.

Beacon

Measures Forge productivity and data quality.

Gateway

Does not directly interact with Forge.

---

# Design Rules

Forge should never modify Atlas manually.

Forge generates data.

Repositories store data.

Validation occurs before commit.

Every action should be repeatable.

Every generated file should be deterministic.

---

# Long-Term Vision

Forge should become the operating system for Hardware Radar.

Administrators should spend their time verifying information rather than formatting JSON.

As the catalog grows from hundreds to thousands of products, Forge should increase consistency while reducing effort.

---

# Closing Statement

Forge exists so that people can focus on understanding hardware instead of maintaining files.

The goal is not simply to create JSON.

The goal is to create trusted knowledge.