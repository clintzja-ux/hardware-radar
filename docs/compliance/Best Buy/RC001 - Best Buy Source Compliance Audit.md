RC001 — Best Buy Source Compliance Audit

Preliminary verdict: CONDITIONAL GO for current-price publication; NO-GO for Mercury historical retention.

Best Buy's Products API itself is an excellent technical source. It exposes pricing, availability, specifications, descriptions and images, with most product information—including pricing—updated near real time. The published operational limit is currently 50,000 calls/day and 5 calls/second per API key.

However, Best Buy's API terms impose a major constraint:

API Content may only be cached temporarily, not exceeding 72 hours, and only as necessary to improve display response times.

That means we cannot treat Best Buy API prices as permanent Mercury historical observations.

What this means for Hardware Radar

Our architecture can accommodate Best Buy, but we'd have to use the same principle we established for Amazon:

Mercury observation
│
├── durable lawful audit envelope
│
└── Best Buy API Content
        ├── price
        ├── availability
        ├── descriptions
        ├── images
        └── other API Content
                │
                ▼
          LICENSE_CONTROLLED
                │
                ▼
           ≤ 72-hour TTL

We therefore must not use Best Buy API prices for M006 Historical Intelligence unless Best Buy separately grants us permission.

That immediately changes one part of my earlier assessment: Best Buy is viable for current-price intelligence, but not as a source for our long-term historical-price database under the standard API terms.

Public price display appears possible — but with conditions

The API license permits use of the Service and Content in applications/websites made available to customers in connection with offers to sell or sales of Best Buy products/services. If a site offers commerce, Best Buy requires a Best Buy purchasing option/link and requires it to appear in the first/primary tier when there are multiple tiers.

That fits Hardware Radar reasonably well because our result cards send users to retailers rather than selling RAM ourselves.

But Best Buy also requires clear attribution of API Content and says applications using the API must display the supplied Best Buy logo wherever the API has a presence. We cannot recreate/alter the logo, make it our dominant branding, or imply Best Buy endorses Hardware Radar.

So a compliant Best Buy result probably needs something conceptually like:

Corsair Vengeance 32GB DDR5
$79.99

[Best Buy logo / required attribution]
Price observed 11:42 AM

View at Best Buy →

rather than our existing generic retailer presentation.

Affiliate monetization is more complicated

Best Buy's current affiliate program is administered through Impact. Its terms explicitly incorporate the Best Buy API Terms, and where they conflict, the API terms prevail.

The affiliate agreement also says individual product pricing, logos, images or descriptions generally cannot be placed on a publisher property without express authorization—but the agreement separately provides for API content under the API terms.

Therefore I would not assume that simply obtaining a developer API key automatically gives Hardware Radar an affiliate-safe price-comparison implementation.

The clean production configuration should be:

Best Buy Developer API
        +
Best Buy/Impact Publisher approval
        +
Hardware Radar approved property
        +
authorized affiliate links
        ↓
Hardware Radar Best Buy integration

rather than treating the developer key and affiliate relationship as unrelated.

Cross-retailer comparison needs clarification

This is the one area where I don't want us to over-interpret the terms.

The API terms prohibit using Best Buy Content on behalf of or for the benefit of a third party such as another retailer for analyzing/reviewing Best Buy pricing, products or services.

Hardware Radar is consumer-facing and independent; it isn't operating on behalf of Amazon, Newegg or another retailer. So I don't read that clause as an explicit blanket prohibition on consumer price comparison.

But neither would I treat it as affirmative authorization for our exact model.

Since Hardware Radar's defining feature is:

Compare retailer prices and identify the cheapest.

this is important enough that we should obtain written clarification from Best Buy before production deployment.

Historical Intelligence is much clearer

This one doesn't need interpretation.

A permanent record like:

2026-08-10   $79.99
2026-08-11   $76.99
2026-08-12   $81.99
...

derived from Best Buy API Content would conflict with the standard 72-hour maximum caching provision.

So our source policy should be:

BEST_BUY_API

Current price publication        CONDITIONAL GO
Current availability             CONDITIONAL GO
Product metadata                 CONDITIONAL GO
Images                           CONDITIONAL GO
Affiliate linking                CONDITIONAL GO
Cross-retailer comparison        WRITTEN CLARIFICATION
Historical price retention       BLOCKED
Historical trend analytics       BLOCKED
API-content retention >72h       BLOCKED
Scraping BestBuy.com             BLOCKED

Scraping is particularly clear: Best Buy's affiliate terms prohibit scraping/spidering a Best Buy property without prior written approval.

There's another important requirement

Best Buy reserves the right to inspect/crawl applications to verify compliance and says developers must not interfere with that monitoring. API credentials themselves may not be sold, transferred, sublicensed or disclosed.

So a future Best Buy adapter should follow exactly the server-side secret boundary we established for Amazon:

Forge/browser          ❌ API key
Git repository         ❌ API key
Public snapshot        ❌ API key

Server acquisition     ✓ API key
My recommendation has changed slightly

I still think Best Buy is worth pursuing, but I would not start BB001 adapter implementation yet.

The next action should be surprisingly small: contact Best Buy Developer/Affiliate support with a concise description of Hardware Radar and obtain written answers to three questions:

May a consumer-facing price-comparison website display current Best Buy Products API prices alongside current prices from other retailers?
May those Best Buy price displays link through an approved Best Buy/Impact affiliate Qualifying Link?
Does the 72-hour caching restriction permit retaining non-Content audit metadata—such as SKU, retrieval timestamp, validation outcome and observation ID—after the Best Buy price/availability Content itself has been purged?

Best Buy Developer contact form

I would not even ask them for historical-price permission in the first request unless we want to pursue a separate license. Their published terms are already clear enough for us to default-block that capability.

Updated retailer assessment

Best Buy hasn't failed the audit. Rather, we've discovered that it fits the architecture much like Amazon does:

                    AMAZON             BEST BUY

Current data        ✓ conditional      ✓ conditional
Official API        ✓                 ✓
API access now      🔒 qualification   ✓ developer access
Licensed TTL        1h Offers          ≤72h Content
History             BLOCK             BLOCK
Comparison          intended model    clarify
Affiliate           Associates        Impact

That raises a broader strategic issue for Hardware Radar: major retailer APIs may consistently license current shopping data but not permanent price-history datasets.

That's not a flaw in Mercury. It actually validates why we separated source permission from platform capability. But before we eventually advertise features such as "lowest price in 90 days," we will need at least one data source whose license expressly permits historical retention—or a separate data-rights strategy.

For the immediate goal of getting real, compliant current prices onto Hardware Radar, Best Buy remains promising. I recommend we obtain those three written clarifications before committing engineering effort to its adapter.

What we're discovering is that Mercury's original concept mixed two different things:

Hardware Radar's own durable market intelligence
Retailer-licensed shopping data

Those cannot always be treated as the same dataset. Best Buy, for example, expressly limits API-content caching to 72 hours. Walmart's affiliate agreement likewise imposes rules around current pricing, licensed materials, and keeping product information current.

So I would change Mercury's data model, not abandon Mercury.

The original vision is still viable

Our long-term architecture remains:

Atlas      Hardware knowledge
Mercury    Market intelligence
Compass    Recommendations
Echo       Search
Aurora     AI explanations
Forge      Administration
Beacon     Analytics
Gateway    APIs

I would keep all eight.

But Mercury should evolve from:

"Permanent database of every retailer price we've ever observed."

into:

"Rights-aware market intelligence system that knows what it may observe, retain, derive, publish, and forget for every source."

That's actually a better platform.

Mercury should become three layers

I'd restructure the conceptual model like this:

                         MERCURY
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
 LIVE MARKET          DURABLE MARKET       DERIVED MARKET
   STATE              INTELLIGENCE          INTELLIGENCE
        │                   │                    │
 current prices        history we are        analytics we
 availability          legally entitled      are entitled
 retailer offers       to retain              to retain
        │                   │                    │
 short/source TTL      durable               source-aware

That distinction becomes fundamental.

Layer 1 — Live Market State

Amazon, Best Buy and similar sources can still be extremely useful here.

Mercury answers:

Where is this RAM cheapest right now?

For example:

Corsair 32GB DDR5

Amazon       $—
Best Buy     $79.99
Newegg       $82.99
B&H          $84.50
                  ↓
           Best current offer

Licensed content expires according to source policy.

That's still the core promise of Hardware Radar.

Layer 2 — Durable Market Intelligence

Only sources granting sufficient retention rights contribute here.

Source A       CURRENT + HISTORY
Source B       CURRENT ONLY
Source C       CURRENT + 30 DAYS
Source D       CURRENT + HISTORY + DERIVATIVES

Mercury already has much of the machinery needed to understand this because of the retention/compliance architecture we've built.

Instead of:

observation.price = $79.99
forever

Mercury understands:

observation
├── source
├── rights profile
├── current-data TTL
├── history permission
├── derivative permission
├── publication permission
└── attribution requirements

That becomes an extremely valuable architectural capability.

Historical Intelligence becomes source-qualified

This is the biggest change to the original roadmap.

We shouldn't promise:

"90-day price history for every retailer."

Instead:

"Historical price intelligence where licensed data rights permit it."

Compass can know:

Amazon
Current price           ✓
90-day history          ✗

Best Buy
Current price           ✓
90-day history          ✗

Retailer X
Current price           ✓
90-day history          ✓

Then Aurora can explain the evidence honestly:

"$74.99 is the lowest price we've observed among currently available offers. Historical-low analysis isn't available for this retailer."

rather than manufacturing certainty from data we aren't entitled to retain.

But I wouldn't give up on history

Quite the opposite.

I would make historical-data rights a strategic acquisition objective.

We should investigate three categories of sources:

Retailer APIs / feeds
        +
Affiliate-network feeds
        +
Commercial/licensed datasets

and specifically search for contracts permitting:

storage + historical retention + transformation + analytics + publication.

The retailer with the biggest brand name isn't necessarily Mercury's most valuable data partner.

A smaller hardware retailer that explicitly permits long-term price retention could be more strategically valuable to Hardware Radar than Amazon.

Atlas becomes even more important

This discovery actually strengthens Atlas.

Retailers control their offer data.

They don't control our independent hardware knowledge.

Atlas can permanently know:

Corsair Vengeance CMK32GX5M2B6000C36

manufacturer
model
capacity
module count
speed
timings
DDR generation
ECC
form factor
compatibility
product relationships
etc.

Then retailers merely contribute transient offers against that canonical product:

                         ATLAS PRODUCT
                              │
          ┌───────────────────┼─────────────────┐
          ▼                   ▼                 ▼
       Amazon             Best Buy           Newegg
        Offer               Offer              Offer
          │                   │                 │
        TTL 1h             TTL 72h          policy X

Atlas remains permanent.

Offers obey source rights.

That is an excellent architecture.

Compass doesn't need permanent price history to be powerful

This is another reason I don't think the vision is endangered.

Originally we imagined Compass eventually saying:

"Buy this RAM because it's near its 90-day low."

That's useful—but it's only one recommendation signal.

Compass can eventually consider:

current price
price per GB
speed
CAS latency
capacity
kit configuration
motherboard compatibility
CPU platform
ECC requirements
seller quality
availability
warranty
shipping
retailer reliability
historical price — where permitted

So even without history for a particular retailer, Compass could say:

"This 32GB DDR5-6000 CL30 kit is currently $8 cheaper than the next equivalent kit and offers the best price/performance among compatible options."

That's still genuine hardware intelligence.

Aurora becomes more trustworthy

The rights-aware model also gives Aurora a useful capability.

Instead of blindly answering:

"This is the cheapest RAM ever."

it can understand evidence limitations:

QUESTION
"Is this a good price?"

        ↓

Aurora
        ↓

Atlas → what product is this?
Mercury → current offers?
Mercury → historical evidence permitted?
Compass → comparative value?
        ↓

ANSWER

For example:

"At $79.99, this is currently the cheapest verified offer Hardware Radar tracks for this kit. I can't characterize it as a historical low because the sources contributing to this comparison don't permit us to retain sufficient historical pricing."

That kind of provenance-aware answer is exactly what an AI hardware assistant should do.

We should also diversify away from retailer-controlled data

Longer term, Hardware Radar shouldn't depend exclusively on retailers.

There are potentially:

manufacturers, distributors, affiliate networks, licensed product-data providers, merchant feeds, direct retailer partnerships and commercial datasets.

Some may offer much more favorable data rights than public retailer APIs.

We can eventually approach retailers directly and say:

Hardware Radar sends purchase-ready computer-hardware buyers to retailers. We'd like an authorized product/price feed and permission to retain observations for price-trend analysis.

At sufficient traffic volume, that's a very different conversation than anonymously consuming a public API.

And our own first-party data becomes valuable

Beacon will eventually create data that belongs to Hardware Radar:

Hardware Radar search demand
product views
outbound retailer clicks
category popularity
comparison behavior
conversion signals where available
alert demand
user preference signals

Subject to our own privacy policy and applicable law, that becomes first-party intelligence.

Eventually Hardware Radar could know things such as:

DDR5-6000 32GB kits are the most frequently compared RAM configuration this month.

That's not retailer price history.

That's Hardware Radar market intelligence.

And it's strategically valuable.

One thing I would change immediately

Remember the homepage feature we once considered:

"Lowest price in X days."

I would formally change its design rule now.

It becomes:

LOWEST PRICE IN X DAYS

May only appear when:

✓ underlying source permits historical retention
✓ required historical period exists
✓ observation provenance is complete
✓ comparison methodology is valid
✓ Sentinel approves claim

Otherwise the UI simply doesn't show it.

That's a better trust model anyway.

This also changes Mercury's definition

I think our Product Bible should eventually redefine Mercury.

Old conceptual definition

Mercury records and analyzes hardware prices over time.

New definition

Mercury is Hardware Radar's rights-aware market intelligence system. It observes retailer offers, maintains current market state, preserves historical evidence where permitted, enforces source-specific retention and usage rights, and provides trustworthy market signals to the rest of the platform.

That is significantly stronger.

The revised long-term roadmap

I would keep our destination intact:

PHASE 1
Cheapest RAM Finder
        ↓
CURRENT VERIFIED OFFERS

PHASE 2
Hardware Price Intelligence
        ↓
MULTIPLE RETAILERS
RIGHTS-AWARE MARKET STATE

PHASE 3
Hardware Intelligence Platform
        ↓
ATLAS + MERCURY + COMPASS

PHASE 4
Hardware Buying Assistant
        ↓
ECHO + AURORA

PHASE 5
Hardware Decision Platform
        ↓
FIRST-PARTY + LICENSED + RETAILER
INTELLIGENCE

So no, I don't think the retailer terms handicap Mercury fatally.

They've exposed an incorrect assumption early enough for us to fix it:

Observing a fact does not automatically grant us unlimited rights to retain and reuse the source data from which that fact was obtained.

And discovering that now—before we had millions of observations sitting in a database—is fortunate.

My recommendation

I would not pivot Hardware Radar away from the original vision.

I would make one architectural evolution:

Turn data rights into a first-class dimension of Mercury.

Then continue building.

Best Buy can still potentially help answer "Where is this cheapest now?" Its official API exposes current pricing and availability, even though its API-content caching terms limit how we can retain that content. Walmart likewise demonstrates that affiliate ecosystems can expressly permit current price information while imposing update and licensed-material requirements.

Meanwhile we deliberately search for our history-capable sources.

If we execute that correctly, the eventual competitive advantage isn't simply:

"Hardware Radar has lots of prices."

It becomes:

Hardware Radar knows hardware, knows the current market, knows which evidence it can trust and retain, and can explain the best purchasing decision without abusing retailer data.

That's still the Hardware Radar we set out to build—just with a much more defensible foundation.