FM001  Controlled Canonical Ingestion        ✅
FM002  Durable Observation Repository        ✅
FM003  Observation Review                    ✅
FM004  Durable Review Decisions              ✅
FM005  Governed Publication                  ✅
FM006  Amazon Acquisition Foundation         ✅

        AMAZON LIVE GATE                     🔒
        Await qualifying sales / eligibility

FM007  First Non-Amazon Production Source    ← NEXT
FM008  End-to-End Production Proof
FM009  Operational Acquisition Automation

        ↓ when Amazon eligibility arrives

FM-A01 Amazon Live Readiness
FM-A02 First Live Creators API Observation
FM-A03 Amazon Production Certification

Keep Amazon on Hardware Radar now using Amazon's approved manual affiliate-link tools to work toward qualification, while we develop a second retailer as our first automated production data source.

There's an important distinction between manually listing/linking Amazon products and manually copying Amazon market data into Mercury.

Amazon explicitly allows Associates to create product-specific affiliate links through tools such as SiteStripe and Product Links. Those links contain the Associate tracking ID and can generate qualifying commissions when visitors click through and purchase.

So I would allow something like:

Hardware Radar

Corsair Vengeance DDR5 32GB

[Check price on Amazon]

where Check price on Amazon is the proper Amazon Special Link generated through the approved Associates tooling.

I would not manually type an Amazon price such as $79.99 into Mercury or treat a copied Amazon product page as a verified Mercury observation. That would undermine the compliance boundary we deliberately established.

Why I think this is the best strategy

Your immediate Amazon objective is actually Associates approval, not API access.

Amazon's current application-review documentation says a new Associate needs at least three qualifying sales within the first 180 days before Amazon reviews the application, and personal orders do not qualify. Amazon also says the site should contain robust original content; it gives roughly 10 posts as a rule of thumb.

So Hardware Radar should start doing its actual affiliate job now.

Meanwhile, we shouldn't wait for Amazon before proving Mercury in production. We'll find another retailer with a permitted acquisition mechanism and use that retailer for the first:

REAL PRICE
   ↓
Mercury
   ↓
Forge Review
   ↓
Governed Publication
   ↓
Hardware Radar

That accomplishes two goals simultaneously:

TRACK A — AMAZON

Approved Amazon product links
        ↓
Hardware Radar traffic
        ↓
Clicks
        ↓
Qualifying purchases
        ↓
3 qualifying sales
        ↓
Associates application review
        ↓
Full acceptance
        ↓
Creators API eligibility
        ↓
Amazon → Mercury automation


TRACK B — PLATFORM

Second retailer
        ↓
Permitted acquisition
        ↓
Mercury
        ↓
Forge
        ↓
Publication
        ↓
First real automated prices

There is one more nuance we should document. Amazon's current Creators API documentation says API access itself requires at least 10 qualifying sales within the past 30 days, in addition to being enrolled/accepted and registering for API access. Amazon also says API access can later be lost after 30 consecutive days without qualified referring sales and restored after qualifying referred sales ship.

So we shouldn't architect Hardware Radar around the assumption that Amazon API availability is permanent.

That reinforces our retailer-neutral Mercury design.

One Amazon rule I would be very careful about

Don't purchase through your own affiliate links or organize friends/family/associates to do so just to reach the qualification threshold. Amazon expressly prohibits purchases through your own Special Links and asking friends, relatives, or associates to purchase through them.

The three sales should arise organically from actual Hardware Radar visitors.

What I recommend next

I would therefore not start another engineering sprint immediately.

First, let's make the existing Hardware Radar Amazon listings useful for qualification using approved Special Links without pretending we have Amazon price intelligence yet.

At the same time, I want to research which retailer should become our first real automated Mercury source—for example, whether Best Buy, Newegg, Walmart, B&H, or another hardware retailer offers an affiliate/API/feed arrangement whose terms actually permit the price-observation model we're building.

That retailer-selection exercise should be compliance-first, just as we handled Amazon.

So the next two concrete tasks are:

Amazon Qualification Mode — compliant Amazon affiliate product links on Hardware Radar, no manually copied Amazon prices.
Retailer #2 Acquisition Assessment — choose the best legally and technically viable retailer for Mercury's first real production observations.

That gets us working toward the Amazon sales requirement without making Hardware Radar wait for Amazon.