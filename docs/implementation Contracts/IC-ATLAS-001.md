C-ATLAS-001 — Category Foundation
Purpose

Introduce a canonical hardware category model.

Categories should be technology-agnostic.

Examples later include:

RAM

SSD

CPU

GPU

Motherboard

Power Supply

Cooling

Monitor

Networking

Storage

Peripheral

Notice these are hardware categories—not marketing categories.

Deliverables
1. Category Schema
atlas/schema/category.schema.json
2. CategoryRepository
atlas/repositories/CategoryRepository.js

Implement consistently with:

BrandRepository
ProductRepository
3. CategoryValidator
atlas/validators/CategoryValidator.js

Responsibilities:

schema validation
required fields
slug validation
duplicate detection
manifest consistency
4. Canonical RAM Category

Example:

CATEGORY-0001

Display Name:
Memory (RAM)

Slug:
memory-ram

Short Name:
RAM

This becomes the canonical parent category for all RAM products.

5. Manifest Integration

Atlas manifest updated:

brands

categories

retailers

products

with accurate counts.

6. Tests

Category repository tests

Validator tests

Manifest tests

Repository lookup tests