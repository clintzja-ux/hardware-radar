## HIPCP Volume IV
Mercury Architecture & Data Dictionary Review

Document ID: HIPCP-VOL-IV
Subsystem: Mercury – Market Intelligence Engine
Version: 1.0 (Draft)
Certification Status: In Review

Executive Summary

Mercury is responsible for acquiring, validating, preserving, and serving market intelligence.

Its responsibility is fundamentally different from Atlas.

Atlas stores facts.

Mercury stores observations.

This distinction is one of the most important architectural decisions in the platform.

Mission Statement

Mercury is the canonical source of market observations for the Hardware Intelligence Platform.

It answers questions such as:

What price was observed?
Where was it observed?
When was it observed?
Who observed it?
How confident are we?
Has it changed?
What is the historical trend?

Notice that Mercury does not decide what a product is.

Atlas already does that.

Core Engineering Principle
Observations are Immutable

This is the single most important principle of Mercury.

A retailer changing a price does not modify an existing observation.

Instead:

09:00

Product A

Amazon

$79.99

↓

10:30

Product A

Amazon

$74.99

Those are two different observations.

History is preserved.

Nothing is overwritten.

Why This Matters

Because historical intelligence is impossible if observations mutate.

Instead Mercury becomes an append-only historical record.

This allows:

Price history
Trend analysis
AI reasoning
Statistical models
Retailer reliability
Historical charts

without redesigning the architecture.

Ownership

Mercury owns:

Market observations
Price observations
Availability
Inventory state
Provenance
Observation timestamps
Historical record
Freshness
Observation confidence

Mercury explicitly does NOT own:

Products
Brands
Categories
Recommendations
Validation rules
AI reasoning
Analytics
Relationship to Atlas

Every observation references Atlas.

Example

Atlas

Product ID

↓

Mercury Observation

↓

Retailer

↓

Price

↓

Timestamp

Mercury never duplicates product knowledge.

If a retailer says:

Corsair DDR5

Mercury references

ATLAS-PRODUCT-00137

Everything else comes from Atlas.

This avoids synchronization problems forever.

Observation Model

A conceptual observation consists of:

Observation ID

↓

Atlas Product ID

↓

Retailer ID

↓

Timestamp

↓

Observed Price

↓

Currency

↓

Availability

↓

Condition

↓

Shipping (future)

↓

Confidence

↓

Source

↓

Metadata

Every field has a single responsibility.

Provenance

Every observation must answer:

Where did this information originate?

Examples:

Retailer website
API
Manual verification
Future browser extension
Future partner feed

Nothing should enter Mercury without provenance.

Freshness

Mercury owns freshness.

Questions include:

How old is this observation?
Is it stale?
Has a newer observation superseded it?
Should Hardware Radar display it?

Freshness is a Mercury concern—not Atlas.

Historical Intelligence

Mercury should preserve every meaningful observation.

This enables:

Lowest price in 30 days
Average retailer price
Price volatility
Retailer response time
Trend analysis
Historical graphs

without additional infrastructure.

Confidence

Confidence should never be guessed.

Instead it should be derived from objective signals such as:

Source type
Observation age
Validation status
Cross-source agreement
Collection success

This keeps confidence explainable and reproducible.

Data Lifecycle

Every observation follows the same lifecycle:

Observed

↓

Validated

↓

Stored

↓

Certified

↓

Published

↓

Archived

↓

Historical Analysis

Every stage is deterministic.

Relationship with Sentinel

Mercury supplies observations.

Sentinel validates observations.

Example rule families:

Observation Timestamp

Freshness

Currency

Retailer Identity

Atlas Reference

Price Range

Duplicate Observation

Provenance

None of these belong in Atlas.

Relationship with Aurora

Aurora consumes Mercury.

Aurora never modifies Mercury.

Aurora reasons over:

Historical prices
Trends
Availability
Retailer reliability

The intelligence layer depends on Mercury remaining authoritative.

Relationship with Beacon

Beacon aggregates Mercury.

Examples:

Average crawl latency
Retailer coverage
Price volatility
Observation counts
Historical growth

Mercury records.

Beacon measures.

Relationship with Hardware Radar

Hardware Radar becomes a consumer of Mercury.

Instead of reading static JSON, it will request:

Current Lowest Price

↓

Current Availability

↓

Historical Trend

↓

Retailer Confidence

Hardware Radar never computes these itself.

Engineering Strengths

Mercury's proposed architecture demonstrates several strengths:

Separation from Atlas

Knowledge and observations remain distinct.

Immutable History

Supports analytics and auditing.

Explainability

Every observation has provenance and timestamps.

Future Scalability

Can support millions of observations without changing the conceptual model.

AI Readiness

Aurora receives structured historical information instead of reconstructing it.

Recommendations
Recommendation 1

Treat observations as immutable records.

Corrections should create new observations, not modify existing ones.

Recommendation 2

Assign globally unique Observation IDs.

Observations should be independently addressable for auditing, debugging, and analytics.

Recommendation 3

Implement a formal Observation State model.

Suggested states:

Collected
Validated
Certified
Published
Archived

This creates a consistent lifecycle for every observation.

Recommendation 4

Define a canonical Provenance schema.

Every observation should include enough metadata to reconstruct its origin and validation history.

Recommendation 5

Introduce an Observation Quality Score.

Unlike confidence—which reflects trustworthiness based on objective signals—a quality score can capture completeness and usefulness of the observation. Keeping these concepts separate will make downstream analytics and AI reasoning more transparent.

Overall Assessment
Area	Rating
Architecture	🟢
Atlas Integration	🟢
Historical Design	🟢
Provenance	🟢
Extensibility	🟢
AI Readiness	🟢
Long-Term Scalability	🟢
Certification Decision

Status: 🟢 ARCHITECTURE CERTIFIED

The proposed Mercury architecture satisfies the engineering principles established by the Hardware Intelligence Platform.

The distinction between canonical knowledge (Atlas) and immutable market observations (Mercury) is clear, coherent, and scalable. Mercury is approved to proceed into implementation planning.

Strategic Observation

With this review, a broader architectural pattern is now fully visible:

Subsystem	Core Question
Atlas	What exists?
Sentinel	Can it be trusted?
Mercury	What is happening?
Aurora	What does it mean?
Beacon	How is the platform performing?
Gateway	How can others access it?
Observatory	What is changing across the ecosystem?

Each subsystem owns one fundamental concern. Together, they create a layered architecture in which responsibilities are clearly separated, making the platform easier to evolve and reason about over time.