IC-ATLAS-001
Atlas Brand Foundation

Status

APPROVED FOR IMPLEMENTATION
Purpose

Provide the canonical manufacturer identity layer for Atlas.

Every Atlas product will reference a Brand.

Every future subsystem will consume Brand objects through the repository rather than duplicating manufacturer information.

Responsibilities

The Brand subsystem owns:

manufacturer identity
canonical naming
aliases
website
country
supported hardware families
lifecycle status

It does not own:

products
prices
retailers
market observations
validation policy
presentation
Deliverables
1. Canonical Brand Schema
Brand.schema.json
2. Canonical Brand Records

Initial manufacturers:

Corsair
G.Skill
Kingston
Crucial
TeamGroup
ADATA
XPG
Patriot
Silicon Power
Lexar
Mushkin

These will become Atlas reference records.

3. BrandRepository

Responsibilities:

load
lookup
cache
search
validate
immutable returns

Public API:

load()

getAll()

getById()

getBySlug()

getByDisplayName()

exists()

search()

reload()

validate()
4. BrandValidator

Repository integrity only.

Checks:

duplicate IDs
duplicate slugs
duplicate display names
malformed URLs
schema compliance

No Sentinel rule duplication.

5. Test Suite
BrandRepository.test.mjs

BrandValidator.test.mjs

CanonicalBrandRecords.test.mjs

Integrated into

npm test


Implementation Plan

Rather than building everything in one large commit, I'd like to implement this in five small, verifiable phases.

Phase 1 — Brand Model

Deliverables:

Brand.schema.json

brands/
    corsair.json

Goal:

Establish the canonical model using exactly one manufacturer.

Why?

Exactly the same reason we built one canonical RAM product first.

Every future manufacturer will inherit from this reference.

Phase 2 — Brand Repository

Deliverables:

BrandRepository.js

Capabilities:

load()
cache()
lookup()
immutable objects
search()
validate()

At this stage there will still only be one brand.

Phase 3 — Validator

Deliverables:

BrandValidator.js

Checks:

schema
duplicate IDs
duplicate slugs
malformed URLs
duplicate aliases
Phase 4 — Tests
BrandRepository.test.mjs

BrandValidator.test.mjs

CanonicalBrandRecord.test.mjs

Then:

npm test

Everything must still pass.

Phase 5 — Repository Expansion

Once the framework is stable we add:

Corsair

G.Skill

Kingston

Crucial

TeamGroup

ADATA

XPG

Patriot

Silicon Power

Lexar

Mushkin

Notice the order.

We build the framework first.

Then populate it.

Why only one manufacturer first?

Because we've already learned this lesson with Atlas Products.

If we immediately create 11 manufacturers and later decide:

"Brand should have a manufacturerGroup field."

then we edit 11 records.

If we engineer one canonical record first:

we edit one record,

approve it,

and clone the pattern.

That dramatically reduces rework.

Architecture Alignment Review (AAR)

Before every Implementation Contract, I'll produce a very short Architecture Alignment Review.

For IC-ATLAS-001 it looks like this:

Alignment

✅ Atlas owns canonical manufacturer identity.

This matches the subsystem ownership defined in the execution standard. Atlas owns canonical identity, while Mercury owns observations, Sentinel owns validation, Forge owns authoring workflows, and Hardware Radar owns presentation.

Dependencies

Brand Foundation depends on:

Atlas schemas
ProductRepository
ProductValidator

No dependency on Mercury.

No dependency on Sentinel.

Architectural Risk

Low

The implementation introduces a new repository without changing subsystem boundaries or public contracts.

Required EDRs

None beyond the repository abstraction already accepted (EDR-007).

Recommendation

Proceed.

AAR-001 — Atlas Brand Foundation

Status: ✅ Approved

No conflicts were found with:

Atlas Architecture
Engineering Handbook
Engineering Execution Standard
Existing EDRs
Existing Sentinel architecture
Existing ProductRepository implementation

Recommendation: Proceed with implementation.

IC-ATLAS-001 — Phase 1

Instead of trying to build the entire Brand subsystem in one pass, we'll establish the canonical reference implementation.

Deliverables
1. Brand Schema

File

public/data/atlas/schemas/Brand.schema.json

The first version will define:

{
  "brandId": "BRAND-CORSAIR",
  "slug": "corsair",
  "displayName": "Corsair",
  "legalName": "Corsair Memory, Inc.",
  "website": "https://www.corsair.com/",
  "country": "United States",
  "manufacturerType": "MEMORY",
  "status": "ACTIVE",
  "aliases": [],
  "supportedCategories": [
    "CAT-RAM-DDR5",
    "CAT-RAM-DDR4"
  ]
}
2. Canonical Brand Record

We'll engineer exactly one manufacturer:

brands/
    corsair.json

Everything else will follow this model.

3. BrandRepository

Public API:

class BrandRepository {

    async load();

    async reload();

    getAll();

    getById(id);

    getBySlug(slug);

    getByDisplayName(name);

    exists(id);

    search(query);

    validate();
}
Engineering rules
Immutable returns
Internal cache
Manifest-driven loading
Deterministic behavior
No UI knowledge
No Sentinel knowledge
No Mercury knowledge
4. BrandValidator

Responsibilities only:

schema validation
duplicate IDs
duplicate slugs
duplicate aliases
duplicate display names
malformed URLs

No engineering rules.

No business logic.

5. Test Suite
BrandRepository.test.mjs

BrandValidator.test.mjs

CanonicalBrandRecord.test.mjs

Tests include:

load
lookup
immutable objects
cache
duplicate detection
malformed schema
malformed URL
search
repository validation
New Repository Pattern

Something became obvious while reviewing your architecture.

Every Atlas repository should eventually converge on exactly the same public interface.

Repository

load()

reload()

getAll()

getById()

exists()

validate()

Optional methods:

getBySlug()

getByDisplayName()

search()

That consistency means every repository is immediately familiar to another engineer.

Canonical Atlas Pattern

After IC-ATLAS-001, Atlas begins looking like this:

Atlas

Products
│
├── ProductRepository
├── ProductValidator

Brands
│
├── BrandRepository
├── BrandValidator

Categories
│
├── CategoryRepository
├── CategoryValidator

Retailers
│
├── RetailerRepository
├── RetailerValidator

Every repository follows the same philosophy.

IC-ATLAS-001 Phase 1 Complete

The Atlas Brand Foundation has been implemented against the uploaded repository.

Delivered
Canonical Brand.schema.json
One reference brand record: BRAND-CORSAIR
Fully implemented BrandRepository
New BrandValidator
Manifest-driven brand loading
Immutable repository returns
Brand lookup by ID, slug, and display name
Brand search and existence checks
Repository integrity validation
Automated repository, validator, and canonical-record tests
Atlas public exports updated
Brand tests integrated into npm test

The three legacy prototype brand records were removed and replaced with the single canonical Corsair reference record, consistent with the approved reference-first approach.

Verification

npm test passed completely:

Sentinel: 7 test files passed
Atlas: 6 test files passed
Brand JSON Schema validation: passed
Files

Download the completed repository

Download the implementation patch