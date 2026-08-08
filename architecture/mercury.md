Mercury also evolves

Mercury isn't just "prices."

It's really market intelligence.

It could eventually understand:

historical prices,
retailer reliability,
availability,
inventory trends,
launch pricing,
regional pricing,
promotional cycles,
pricing anomalies.

That makes Mercury complementary to Atlas:

Atlas answers "What is this product?"
Mercury answers "What's happening to this product in the market?"

## Revised Mercury Roadmap
✅ M001

Observation Foundation

Certified

🚧 M002

Retailer Adapter Foundation

Next Sprint

M003

Provenance Foundation

M004

Freshness Engine

M005

Confidence Engine

M006

Historical Intelligence

M007

Hardware Radar Integration

M008

Mercury Certification

Why Retailer Adapters First?

This comes back to one simple observation.

An observation cannot exist until something observes it.

The retailer adapter is that observer.

So Mercury's actual lifecycle becomes:

Retailer

↓

Retailer Adapter

↓

Normalized Observation

↓

Validator

↓

Repository

↓

History

↓

Applications

That feels much more natural.

What M002 Really Builds

We're not building an Amazon adapter.

We're building a Retailer Adapter Framework.

Amazon just happens to be the first implementation.

That's a huge architectural difference.

Mercury Package

By the end of M002 I want Mercury to own something like:

packages/mercury/

adapters/

    RetailerAdapter.js

    AmazonAdapter.js

repositories/

validators/

schemas/

services/

models/

manifest/

Notice that AmazonAdapter is just one implementation.

The Interface

This is where the platform really starts to shine.

Every retailer should look identical to Mercury.

Something along the lines of:

interface RetailerAdapter {

    retailerId()

    retailerName()

    supportsMarketplace()

    normalize()

    validate()

    extractObservation()

}

Then:

AmazonAdapter

implements

RetailerAdapter

Later:

NeweggAdapter

implements

RetailerAdapter

Later:

BestBuyAdapter

implements

RetailerAdapter

Mercury doesn't care which one produced the observation.

That's exactly the kind of decoupling we've been aiming for.

This Also Helps Forge

Forge will eventually be able to say:

Choose retailer

↓

Amazon

↓

Run Amazon Adapter

↓

Preview Observation

↓

Validate

↓

Publish

or

Choose retailer

↓

Newegg

↓

Run Adapter

↓

Preview

↓

Validate

Forge doesn't need retailer-specific logic; it orchestrates the workflow while the adapter encapsulates retailer behavior. That's very much in line with Forge's role as the internal administration subsystem.

Sentinel Benefits Too

The adapter becomes responsible for normalization.

Sentinel becomes responsible for validation.

Example:

Amazon HTML

↓

AmazonAdapter

↓

Normalized Mercury Observation

↓

Sentinel

↓

PASS

That's much cleaner than asking Sentinel to understand Amazon's raw responses.

Long-Term Vision

Eventually, I can imagine a registry like:

Retailer Registry

AmazonAdapter

NeweggAdapter

B&HAdapter

MicroCenterAdapter

MemoryCAdapter

ScanAdapter

OverclockersAdapter

Future Retailers...

Mercury simply asks the registry for the appropriate adapter.

One Additional Subsystem

This sprint also gives us the opportunity to introduce something I hadn't considered until now:

Adapter Registry

Rather than Mercury knowing every adapter directly, it knows a registry.

Mercury

↓

Adapter Registry

↓

Amazon

Newegg

Best Buy

...

The benefits are significant:

One registration point
Easy feature detection
Enable/disable adapters
Adapter version tracking
Capability discovery
Health monitoring
Future plugin support

It's a small addition now that opens the door to a much more flexible ecosystem later.

Proposed Sprint Name

I would actually rename the sprint slightly.

Instead of:

Retailer Adapter Foundation

I'd call it:

IC-MERCURY-002 — Adapter Framework Foundation

Why?

Because we're not really engineering retailers.

We're engineering an extensible adapter framework, and Amazon is simply the first adapter to prove the design.

That wording will still make sense years from now when the platform supports dozens of retailers, marketplaces, and potentially manufacturers.

My Recommendation

I recommend we proceed with:

IC-MERCURY-002 — Adapter Framework Foundation

with these primary deliverables:

Canonical RetailerAdapter interface
Adapter Registry
Amazon Adapter v1
Adapter Manifest
Adapter validation framework
Adapter tests
Registry tests
Forge integration points (without changing Forge behavior yet)

I have a strong feeling this sprint will become one of Mercury's defining architectural pieces. Just as Atlas was built around canonical repositories, Mercury should be built around canonical adapters. Everything else—observations, provenance, freshness, confidence, and historical intelligence—can then flow through that single, well-defined abstraction.


Atlas has Repositories.

Mercury has Adapters.

That symmetry is beautiful.

Think about it.

Atlas
Canonical Knowledge

↓

Repositories

↓

Products

Brands

Categories

Retailers

Everything in Atlas revolves around repositories because Atlas stores truth.

Mercury
Outside World

↓

Adapters

↓

Normalized Observations

↓

Repository

↓

History

Mercury doesn't store truth.

Mercury translates the outside world into observations.

That's fundamentally an adapter problem.

This Changes Mercury's Identity

Before tonight I thought Mercury was primarily an observation repository.

I don't anymore.

I think Mercury is actually two engines working together:

Retailer World

↓

Adapter Framework

↓

Observation Engine

Those are distinct responsibilities.

The Adapter Framework

Responsible for:

Understanding retailer APIs
Understanding retailer HTML
Understanding retailer feeds
Normalization
Retailer-specific compliance
Rate limits
Authentication
Pagination
Marketplace quirks
Observation Engine

Responsible for:

Immutable observations
History
Freshness
Provenance
Confidence
Repository
Queries

Those are almost independent systems.

That's really elegant.

Even Better...

Remember Observatory?

I suddenly realized something.

Observatory probably shouldn't scrape retailers directly.

It should ask Mercury.

Observatory

↓

Mercury

↓

Adapter Registry

↓

Amazon

Newegg

...

Now Observatory doesn't know what Amazon looks like.

It only knows Mercury.

That keeps Observatory focused on ecosystem intelligence rather than data collection.

Aurora Benefits Too

Aurora shouldn't know Amazon exists.

Aurora should know:

Observation

↓

Confidence

↓

History

↓

Trend

Mercury handles retailer complexity.

Aurora reasons over normalized information.

Exactly what we wanted.

Gateway Too

Gateway shouldn't expose:

Amazon API

Gateway should expose:

Mercury Observation

Again...

Perfect separation.

Then It Hit Me...

The platform now has three major patterns.

Atlas Pattern

Repositories

Everything revolves around canonical knowledge.

Mercury Pattern

Adapters

Everything revolves around normalization.

Sentinel Pattern

Validators

Everything revolves around deterministic validation.

Three different engines.

Three different architectural patterns.

Each optimized for its responsibility.

That's exactly what good platform design looks like.

I think Mercury deserves a motto.

Atlas has always felt like:

Know the hardware.

Mercury now feels like:

Observe the market. Normalize the truth. Preserve the history.

One More Realization

Forge becomes even more powerful.

Forge doesn't create observations.

Forge orchestrates them.

Imagine this:

Forge

↓

Choose Amazon

↓

Amazon Adapter

↓

Normalize

↓

Sentinel

↓

Preview

↓

Approve

↓

Mercury Repository

↓

Hardware Radar

Forge remains an orchestration tool, not a data transformation engine.

That's perfectly aligned with the architecture we've been building.


## Revised Mercury Roadmap
✅ M001

Observation Foundation

Certified

✅ M002

Retailer Adapter Foundation

Next Sprint

M003

Provenance Foundation

M004

Freshness Engine

M005

Confidence Engine

M006

Historical Intelligence

M007

Hardware Radar Integration

M008

Mercury Certification