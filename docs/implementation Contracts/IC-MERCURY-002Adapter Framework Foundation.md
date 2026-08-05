IC-MERCURY-002
Adapter Framework Foundation

Status: Approved

Branch:

mercury-sprint2-adapter-framework

I actually recommend creating a new branch for this sprint instead of continuing on mercury-sprint1-observation-foundation.

That gives us:

main
    │
    └── mercury-sprint1-observation-foundation ✅
                │
                └── mercury-sprint2-adapter-framework 🚧

Exactly the same discipline we followed throughout Atlas.

Sprint Goal

Build the canonical ingestion layer for all future retailer integrations.

Notice what we're not building:

Amazon support
Newegg support
Web scraping
APIs

Those are implementations.

We're building the framework that makes all of those possible.

Deliverables
1. RetailerAdapter Interface

This becomes Mercury's most important abstraction.

Responsibilities:

Identify the retailer
Declare supported marketplaces
Validate adapter capabilities
Normalize retailer data
Produce canonical observations
Report adapter metadata

Every retailer must implement the same interface.

2. Adapter Registry

This is the heart of Mercury.

Instead of:

Mercury

↓

Amazon

Newegg

Best Buy

We have:

Mercury

↓

Adapter Registry

↓

Amazon

Newegg

Best Buy

Mercury never talks directly to retailers.

3. Amazon Adapter v1

The first concrete implementation.

Its responsibility is not to fetch live data yet.

Instead it proves that the framework works by transforming retailer-specific input into the canonical Mercury observation model.

4. Adapter Manifest

Similar to Atlas and Mercury manifests.

For each adapter we record:

Adapter ID
Version
Supported retailer
Supported marketplaces
Supported source methods
Capabilities
Status

This becomes the discovery mechanism for Mercury.

5. Adapter Validator

Separate from the Observation Validator.

It validates the adapter itself.

Checks include:

Required methods implemented
Manifest consistency
Version present
Unique adapter ID
Supported retailer exists
Capability declarations valid
6. Registry Tests

Verify:

Registration
Duplicate detection
Adapter lookup
Version lookup
Capability lookup
Marketplace lookup
7. Adapter Tests

Verify:

Amazon normalization
Output schema
Error handling
Capability reporting
8. Documentation

Update:

Engineering Log
Platform Status Report
Roadmap
Mercury documentation
Implementation Contract Register
Proposed Repository Structure

I think Mercury is now mature enough to introduce this structure:

packages/mercury/

adapters/
│
├── registry/
│   ├── AdapterRegistry.js
│   └── AdapterManifest.js
│
├── interfaces/
│   └── RetailerAdapter.js
│
├── amazon/
│   ├── AmazonAdapter.js
│   ├── AmazonNormalizer.js
│   └── manifest.json
│
├── repositories/
│
├── validators/
│
├── schemas/
│
├── services/
│
└── models/

Notice how the retailer-specific logic is isolated inside its own directory.

Architectural Principle

I'd like to formally establish a new principle for Mercury.

MERCURY-PRINCIPLE-001 — Adapter Isolation

All external retailer-specific behavior shall be isolated behind the canonical RetailerAdapter interface. No other Mercury subsystem may depend directly on retailer-specific implementations.

This principle reinforces the architecture we've been shaping.

Architecture Decision Record

I think this sprint should produce:

ADR-008 — Adapter-Based Ingestion Architecture

Decision:

External market data enters Mercury exclusively through registered adapters.

Consequences:

Retailer independence
Easier testing
Cleaner normalization
Simpler Sentinel validation
Extensible ingestion pipeline
Stable public contracts
Sprint Exit Criteria

To certify IC-MERCURY-002, we should require:

RetailerAdapter interface complete
AdapterRegistry complete
AdapterManifest complete
Amazon Adapter implemented
Adapter validation passes
Registry tests pass
Observation integration passes
Existing Mercury tests continue to pass
Atlas regression passes
Sentinel regression passes
Forge regression passes
Hardware Radar regression passes

No live ingestion yet—that comes later. This sprint is about proving the architecture, not the data acquisition.

One Final Thought

There's a subtle but important shift happening.

During Atlas, we spent a lot of time asking:

"Where should this data live?"

Now, with Mercury, the question is becoming:

"Where should this behavior live?"

That's a sign that the platform is maturing. The data model is largely established; now we're designing how the system behaves while keeping those behaviors cleanly separated.

I think that's exactly where we want to be as we move into the intelligence layer.