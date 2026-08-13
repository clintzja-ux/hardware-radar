RC002 — Newegg Affiliate Catalog
Preliminary verdict: CONDITIONAL / CLARIFICATION REQUIRED 🟡

Newegg explicitly advertises its affiliate program as providing publishers with:

a detailed product catalog updated multiple times daily;
RSS feeds;
deep linking directly to products;
text/banner links;
a dedicated affiliate team;
and, importantly, no requirement that affiliates stop using other affiliate programs.

That last point is useful for Hardware Radar because Newegg expressly contemplates affiliates operating alongside other affiliate relationships.

However, I could not find public Newegg affiliate terms that expressly grant long-term retention or historical-analysis rights over successive product-feed prices.

That distinction matters.

The rights matrix

Based on what Newegg currently publishes:

Mercury capability	RC002 result
Affiliate catalog/feed acquisition	🟢 AVAILABLE TO APPROVED AFFILIATES
RSS acquisition	🟢 AVAILABLE
Affiliate deep linking	🟢 ALLOWED
Promote products outside dashboard	🟢 ALLOWED
Participate in other affiliate programs	🟢 ALLOWED
Current product-price display from feed	🟡 LIKELY / verify feed terms
Cross-retailer comparison	🟡 CLARIFICATION REQUIRED
Durable audit metadata	🟡 CLARIFICATION REQUIRED
Long-term raw price retention	🟡 CLARIFICATION REQUIRED
Historical price analytics	🟡 CLARIFICATION REQUIRED
Durable derived statistics	🟡 CLARIFICATION REQUIRED
Manual Newegg.com price acquisition	🔴 BLOCK
Scraping/browser automation	🔴 BLOCK

The last two are clear. Newegg's current general site terms prohibit automated access, scripts/web crawlers, scraping, copying/republishing the site, and accessing the site other than through Newegg-provided interfaces unless Newegg has specifically permitted otherwise through a separate written agreement.

So our MR001 philosophy remains correct:

Newegg website
     ↓
manual/scraped acquisition
     ↓
BLOCK

Approved affiliate catalog/feed
     ↓
contractual rights evaluation
     ↓
Mercury
Don't confuse Newegg's developer API with the affiliate catalog

This is important.

The public Newegg Marketplace API is explicitly for sellers to manage items, orders, accounts and reports. Its endpoints require seller credentials/IDs. It is not the consumer-shopping catalog API we need.

Therefore our eventual architecture should not be:

Newegg Marketplace API
        ↓
Hardware Radar

Instead, the interesting path is:

Newegg Affiliate Program
        ↓
authorized product catalog/feed
        ↓
NeweggAffiliateAdapter
        ↓
Mercury

That's actually attractive because the feed exists specifically to enable affiliates to promote Newegg products.

Newegg may be a better commercial fit than Best Buy

Newegg is almost perfectly aligned with Hardware Radar's audience: computer hardware and technology are core categories in its affiliate program.

And the affiliate program explicitly supports deep links to products.

So commercially:

Hardware Radar
      ↓
"This is currently the cheapest
32GB DDR5-6000 kit we track."
      ↓
View at Newegg
      ↓
affiliate deep link
      ↓
Newegg

is very natural.

The remaining uncertainty isn't whether Newegg wants affiliates.

It clearly does.

The uncertainty is what rights accompany its affiliate product catalog.

Historical Intelligence remains unresolved

This is the key issue.

The fact that Newegg supplies:

a detailed product catalog updated multiple times daily

does not by itself mean:

you may permanently archive every version of that catalog and construct a commercial historical pricing database.

MR001 therefore tells us exactly what to do:

NEWEGG_AFFILIATE_FEED

acquisition.feed          CONDITIONAL
live.currentObservation   CONDITIONAL
publicDisplay             CONDITIONAL
comparison                CLARIFICATION_REQUIRED

historicalRetention       CLARIFICATION_REQUIRED
historicalAnalytics       CLARIFICATION_REQUIRED
derivedAnalytics          CLARIFICATION_REQUIRED

Nothing proceeds merely because the feed technically exists.

I think we should contact Newegg too

And because Newegg provides a dedicated affiliate contact channel, this is worth asking directly. Their affiliate page says applications are handled through their affiliate partnership and gives a dedicated affiliate contact for questions.

I would ask four questions this time:

1. May an approved Newegg affiliate use the provided product catalog/feed to display current Newegg product prices on an independent consumer-facing computer-hardware comparison website alongside prices from other retailers?

2. May those listings use Newegg affiliate deep links to the corresponding products?

3. May we retain successive price observations from the affiliate product catalog for internal historical price analysis and consumer-facing price trends?

4. If long-term price retention is not permitted, may we retain non-content operational metadata such as Newegg item number, retrieval timestamp, internal observation ID, validation outcome and compliance/audit information after the underlying feed content has been removed?

Those four answers would tell MR001 almost everything it needs.

But I wouldn't wait for Newegg either

We now have:

Amazon
API foundation              ✅
Live access                 🔒 qualification

Best Buy
API                         ✅
Current-price use           🟡 clarification pending
History                     🔴 standard terms

Newegg
Affiliate catalog           ✅
Deep linking                ✅
Multi-affiliate use         ✅
Current comparison          🟡 clarification
History                     🟡 clarification

Mercury Rights Architecture ✅