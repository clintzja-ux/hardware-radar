# IC-RAKUTEN-PRODUCT-CATALOG-PRICE-SEMANTICS-UNBLOCK-P1 — Current Item Price Selection

Status: implemented and fixture-certified on 2026-09-28.

## Scope and evidence

This increment corrects the existing `RakutenNeweggProductFeedAdapter`; it creates no parser, acquisition lane, repository, authority, lifecycle, schema, or comparison system. The evidence is a written response from Rakuten Advertising Customer Support representative Madhu Chatterjee, read with the retained [Product Catalog Appendix A field definitions](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/8191594256013-Product-Catalog-Appendix-A-File-Field-Definitions). Support answered that a valid Sale Price is the current purchase/item price and reflects discounts; Sale Price takes precedence while applicable; Retail Price is a reference/list price and is the fallback when Sale Price is unavailable or outside a complete applicable window; and two blank date fields do not bound an otherwise valid Sale Price.

Support referred one-sided date interpretation back to the advertiser and did not clearly answer whether the documented Currency field applies independently to both price fields. The response also does not establish a timezone or boundary inclusivity. Those semantics remain unresolved. It does not authorize savings, discount-percentage, deal, or delivered-cost claims.

## Deterministic rule

- Valid positive Sale Price with both dates blank selects `SALE_PRICE`.
- Valid positive Sale Price with a valid complete window selects `SALE_PRICE` when evaluation is clearly inside the window.
- Outside a valid complete window, valid positive Retail Price is selected as `RETAIL_PRICE`.
- Blank, zero, malformed, nonnumeric, or negative Sale Price falls back to valid positive Retail Price.
- Valid Sale Price does not require Retail Price when both dates are blank or the complete window is clearly active.
- Two unavailable/invalid price fields produce `PRICE_NOT_EXPOSED`.
- A one-sided, malformed, reversed, or timezone/boundary-ambiguous window produces `PRICE_SEMANTICS_UNRESOLVED`.

The implementation chooses no source timezone. Complete-window evaluation uses a conservative fourteen-hour uncertainty margin around each source wall-clock boundary. Ordinary evaluations clearly inside or outside the window resolve; boundary-adjacent cases fail closed.

## Provenance and convergence

The observation preserves raw Sale Price, raw Retail Price, their validated numeric forms, selected field, raw Begin/End evidence, evaluation time, source record digest, product/SKU/MPN/UPC identity, destination, currency, and canonical source `RAKUTEN_NEWEGG_PRODUCT_CATALOG`. Selected current item price is derived evidence, not a new authoritative record.

Qualified automated observations continue through the existing source-neutral current-state and comparison owners. Existing hybrid manual/automated comparison fixtures remain authoritative. If an automated observation encounters a current same-retailer observation from another source and no certified precedence exists, current refresh preserves the prior observation and returns `CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED`.

Canonical Rakuten rights still set `historicalRetentionAllowed=false`; this increment therefore creates no Rakuten-derived history and does not expand rights. The observation retains exact provenance suitable for a future separately authorized historical lane, but current historical admission remains prohibited.

Condition, seller, shipping, availability, destination, currency, rights, freshness, publication, artifact, release, and deployment governance remain independent. A resolved price does not establish `NEW`, availability, publication authority, Cheapest, Pick, savings, or delivered cost.

## Safety and certification

Fixture coverage includes Sale/Retail precedence, blank dates, complete-window inside/outside evaluation, invalid Sale fallback, absent Retail handling, both-price failure, one-sided and malformed windows, boundary ambiguity, USD validation, availability isolation, raw/selected provenance, current-state compatibility, hybrid comparison compatibility, same-retailer source conflict, and manual-path regression. No feed download, provider call, paid task, production mutation, publication operation, artifact, release, or deployment occurred; spend was `$0.000`.
