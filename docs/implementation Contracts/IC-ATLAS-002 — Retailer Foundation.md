IC-ATLAS-002 — Retailer Foundation

Purpose:

Represent where products are observed—not who manufactures them.

Deliverables
Retailer Schema

Validate:

retailer id
display name
slug
website
region
status
RetailerRepository

Following BrandRepository conventions.

RetailerValidator

Validate:

required fields
unique ids
unique slugs
valid URLs
manifest consistency
Canonical Amazon Record

This already partially exists.

We'll migrate it into the canonical repository.

Manifest Integration

Retailers become first-class Atlas entities.

Tests

Repository

Validator

Manifest

Lookup

Search

Acceptance Criteria

Sprint 1 is complete when:

✓ BrandRepository

✓ CategoryRepository

✓ RetailerRepository

✓ ProductRepository

all follow the same repository contract.

Atlas Manifest reports:

Brands

Categories

Retailers

Products

correctly.

All validators pass.

Repository integrity passes.

Sentinel passes.

Atlas test suite passes 100%.

One refinement I'd like to make before we write code

During the audit, I noticed that the repositories are not yet completely uniform. BrandRepository is the most mature, ProductRepository is functional but lighter, and CategoryRepository is currently empty.

Rather than simply implementing CategoryRepository and RetailerRepository to match today's ProductRepository, I'd like to establish a single Repository Contract that all four repositories will conform to. For example, methods such as:

load()
reload()
getAll()
getById()
exists()
search()
validate()

BrandRepository already demonstrates much of this pattern. We'll use it as the reference implementation and bring the other repositories into alignment over the course of Atlas completion. That gives us consistency before Mercury begins relying on these repositories.

I think that's the right engineering approach: finish Atlas once, finish it cleanly, and give Mercury a stable foundation to build on.