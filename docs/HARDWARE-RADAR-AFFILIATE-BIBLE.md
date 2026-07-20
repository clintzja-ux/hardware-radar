Mirabelle Labs

Phase I
Amazon Platform Foundation

    Sprint A1
    Amazon Compliance Bible

    Sprint A2
    Amazon Operations Manual

    Sprint A3
    Sentinel Architecture

    Sprint A4
    Mercury Amazon Integration

    Sprint A5
    Forge Amazon Integration

    Sprint A6
    Hardware Radar Launch

    Sprint A1 - Chapter 1
Amazon Compliance Bible
Purpose

This chapter answers a single question:

What is Amazon Associates, and what role does it play in the Hardware Radar ecosystem?

This seems simple, but it defines our boundaries.

1.1 Mission

Hardware Radar exists to help users make informed hardware purchasing decisions through independent research, verified specifications, and current retailer information.

Amazon is:

a retailer
an affiliate partner
a source of certain product advertising content (under its license)

Amazon is not our product database.

Amazon is not our source of engineering truth.

That distinction is extremely important.

1.2 Canonical Data Ownership

This is the first architectural rule.

Information	Canonical Owner
RAM Specifications	Atlas
Product Relationships	Atlas
Buying Guides	Hardware Radar
Editorial Content	Hardware Radar
Price Observation	Mercury
Compliance Rules	Sentinel
Affiliate Links	Mercury / Publisher
Amazon Program Data	Amazon

Notice something.

Atlas remains untouched.

That's good architecture.

1.3 Amazon's Role

Amazon supplies:

affiliate relationship
product identifiers (ASINs)
approved advertising content
pricing and availability through approved mechanisms
destination for purchases

Amazon does not own:

our recommendations
our reviews
our scoring
our buying guides
our editorials
our hardware classifications

Those remain our intellectual property.

This distinction is critical because it keeps Hardware Radar differentiated rather than becoming a mirror of Amazon.

Engineering Rule AMZ-001

Title

Amazon is a retailer, not the system of record.

Requirement

Hardware Radar shall maintain its own authoritative product catalog.

Amazon data supplements the catalog but never replaces it.

Affected Systems

Atlas
Mercury
Sentinel
Engineering Rule AMZ-002

Title

Editorial Independence

Requirement

Hardware Radar recommendations shall be generated independently of Amazon.

Amazon provides purchase opportunities, not editorial decisions.

Affected Systems

Publisher
Hardware Radar
Engineering Rule AMZ-003

Title

Canonical Ownership

Each data field must have exactly one canonical owner.

Example:

Field	Owner
Capacity	Atlas
CAS Latency	Atlas
Price	Mercury
Affiliate Link	Mercury
Disclosure	Sentinel
Buying Advice	Hardware Radar

This avoids conflicting sources of truth.

Why this matters

Imagine six months from now.

Amazon temporarily removes a listing.

Without our architecture:

Product disappears.

With our architecture:

Atlas

Product still exists.

↓

Mercury

Amazon observation removed.

↓

Website

Shows:

Currently unavailable from Amazon.

We haven't lost the product.

We've only lost one observation.

That's a much more resilient system.

Chapter 2 — Amazon Account Lifecycle

There we'll document:

Eligibility requirements
Application process
Initial approval
The qualifying sales period
Ongoing account health
Suspension and termination risks
Recovery paths

Those operational rules will eventually feed into Sentinel as account-level health checks (for example, ensuring required disclosures are present before publication).

Every subsystem should have a single, well-defined responsibility.

Atlas owns product truth.
Mercury owns market observations.
Sentinel owns compliance and governance.
Forge owns creation and publication workflows.
Hardware Radar owns presentation and editorial content.
Atlas

Atlas should never know:

Amazon
Affiliate links
Prices
Retailers
Promotions
Discounts

Atlas should only know hardware.

Example:

Kingston Fury Beast DDR5

Manufacturer SKU

Memory Type

Capacity

Voltage

ECC

Speed

Timings

If Amazon disappeared tomorrow...

Atlas would still be 100% useful.

That is exactly what we want.

Mercury

I now think Mercury's purpose is slightly different than we originally described.

Instead of "price tracking," Mercury should become our Market Intelligence Engine.

For example:

Observation

Retailer

Amazon

ASIN

Current Price

Availability

Observation Time

Affiliate URL

Compliance Metadata

Verification Status

Tomorrow, when we add Newegg...

Nothing changes.

Mercury simply records another observation.

Sentinel

Sentinel has become much more important than I originally imagined.

I think Sentinel should own every rule.

Not just Amazon rules.

For example:

Architecture Rules
Price belongs in Mercury.
Specs belong in Atlas.
No duplicate product IDs.
ASIN format validation.
Compliance Rules
Amazon disclosure present.
Price freshness valid.
Affiliate link format valid.
Approved image source.
Editorial Rules
Buying guide exists.
Recommendation text present.
AI summary reviewed.
Human review completed.

Sentinel becomes the guardian of the platform.

Forge

Forge now becomes an orchestrator.

Instead of doing everything itself, Forge coordinates the other systems.

User edits product

↓

Atlas validates product data

↓

Mercury validates observation

↓

Sentinel validates compliance

↓

Forge publishes

That makes Forge much simpler and easier to extend.

Hardware Radar

This is an important mindset shift.

Hardware Radar shouldn't contain business logic.

It should contain presentation.

The website asks questions like:

What should I display?

It should never ask:

Is this Amazon compliant?

That responsibility belongs to Sentinel.

Sprint A1 Documentation Standard

I also think every chapter should follow the same structure.

Purpose

Why does this rule exist?

Official Source

Link to the Amazon document or policy.

Business Interpretation

Explain the rule in plain language.

Engineering Requirement

Translate it into something developers can implement.

Affected Systems

Which of the five layers are affected?

Atlas
Mercury
Sentinel
Forge
Website
Implementation Notes

Technical guidance.

Test Cases

How do we verify compliance?

Risk Level
Critical
High
Medium
Low

This means every rule becomes testable.

The Engineering Traceability Matrix

I think this will become one of the most valuable documents in the project.

Imagine a table like this:

Rule	Source	Sentinel Check	Forge Action	Test
AMZ-001	Amazon Operating Agreement	Disclosure present	Block if missing	Automated
AMZ-002	Amazon License	Price source verified	Block if invalid	Automated
AMZ-003	Amazon License	Data freshness	Require refresh	Automated
AMZ-004	Amazon Policy	Affiliate link valid	Prevent publish	Automated

Now, if Amazon changes a policy, we don't search the codebase—we update the rule and immediately know which checks, workflows, and tests are affected.

Mirabelle Labs Constitution v1.0

Every engineering decision must satisfy these principles.

Article I — Truth Before Speed

Principle

Hardware Radar shall prioritize accuracy, traceability, and trust over speed of publication.

Implications:

No guessed specifications.
No unverified observations.
Every published fact has a known source.
Automation never bypasses validation.
Article II — Single Source of Truth

Every type of information has exactly one owner.

Information	Owner
Product specifications	Atlas
Market observations	Mercury
Compliance rules	Sentinel
Publishing workflow	Forge
Editorial presentation	Hardware Radar

No duplication.

No conflicting ownership.

Article III — Separation of Responsibilities

Each subsystem has one responsibility.

Atlas

Knows what a product is.

Mercury

Knows what the market currently looks like.

Sentinel

Knows what is allowed.

Forge

Knows how to publish.

Hardware Radar

Knows how to present information to users.

This keeps the architecture clean and maintainable.

Article IV — Everything Has a Lifecycle

Nothing is static.

Products evolve.

Observations expire.

Policies change.

Content gets refreshed.

Every object moves through documented states.

Article V — Compliance Is a Feature

Most companies treat compliance as documentation.

We will treat compliance as executable engineering.

Sentinel exists because of this principle.

Article VI — Automation Must Be Earned

This is one of the most important principles we've discussed.

Nothing is automated until it has been:

Understood.
Documented.
Standardized.
Successfully executed manually.

Only then is it automated.

That sequence protects us from automating flawed processes.

Article VII — Retailer Independence

This is where we future-proof the platform.

Hardware Radar is not an Amazon site.

Amazon is the first integration.

The architecture must survive the loss of any single retailer.

If Amazon disappeared tomorrow:

Atlas remains.
Mercury continues observing other retailers.
Sentinel continues enforcing rules.
Forge continues publishing.
Hardware Radar continues serving users.

That's resilience by design.

Article VIII — Traceability

Every significant decision must answer three questions:

Why does this rule exist?
Where did it come from?
What part of the system implements it?

That gives us:

Policy → Requirement → Implementation → Test

This will make future maintenance far easier.

Our Living Documentation

From this constitution, everything else flows naturally.

Mirabelle Labs Constitution
            │
            ▼
Architecture Bible
            │
            ▼
Amazon Compliance Bible
            │
            ▼
Amazon Operations Manual
            │
            ▼
Data Lifecycle Specification
            │
            ▼
Sentinel Rule Specification
            │
            ▼
Implementation

Nothing is built in isolation.

The Roadmap (Refined)
Phase 1 — Foundation (Current)
Constitution
Architecture Bible
Amazon Compliance Bible
Operations Manual
Data Lifecycle
Sentinel Specification

Goal: Complete understanding before implementation.

Phase 2 — Amazon Integration
Amazon account setup
Creator API investigation
ASIN workflow
Mercury Amazon adapter
Sentinel Amazon rule engine
Forge Amazon workflow

Goal: A fully compliant Amazon publishing pipeline.

Phase 3 — Hardware Radar Launch
Replace placeholder content
Populate Atlas with real products
Publish buying guides
Enable Amazon affiliate links
Validate every page through Sentinel
Public launch

Goal: A trustworthy, compliant, public site.

Phase 4 — Operational Excellence
Automated observation refreshes
Scheduled compliance checks
Editorial workflow improvements
Analytics and monitoring
Operational dashboards

Goal: A sustainable, maintainable platform.

Phase 5 — Retailer Expansion

Only after Amazon is mature.

Add:

Newegg
B&H
Best Buy
Walmart
eBay

Each retailer becomes an adapter to the existing architecture, not a reason to redesign it.

One Last Architectural Decision

I think we should formally adopt a design philosophy that I've seen work extremely well on long-lived systems:

The platform should be boring; the user experience should be exciting.

That means:

Atlas should be predictable.
Mercury should be deterministic.
Sentinel should be strict.
Forge should be repeatable.

All of the creativity belongs in Hardware Radar itself—its editorial content, buying advice, visual presentation, and user experience.