# IC-RAKUTEN-NEWEGG-016 — Delta Multiplicity Semantics Investigation

## Status and scope

RAKUTEN-NEWEGG-016 investigates, offline, multiple live delta rows that resolve to one canonical Newegg `RetailerDestination`. It changes no adapter selection behavior. It opens no SFTP connection, downloads nothing, and mutates no production Current Display, Atlas, destination, history, publication, winner, or affiliate state.

## Provider documentation

The investigation uses the operator-supplied Rakuten Advertising *Product Catalog Appendix A - File Field Definitions* (September 8, 2026) as current field-definition authority and *Product Catalog Data Feed Implementation Guidelines for Publishers* (December 2023) for supporting structure, Appendix B classes, samples, SFTP, and delta behavior where not contradicted.

Documented facts are limited to the following relevant rules:

- SKU Number is required, is unique for a majority of advertisers, and may be duplicated by some advertisers.
- A delta contains advertiser-feed records processed as inserted, updated, or deleted; field 39 carries `I`, `U`, or `D`.
- advertisers may process feeds multiple times per day;
- periodic full-file retrieval is the reconciliation strategy described by the existing adapter contract.

The captured documents do not establish Product ID as globally unique, immutable, or a chronological event identity. They do not define order or precedence for multiple rows resolving to one SKU, Product ID, retailer listing, or destination within one generated delta. Multiple feed processing during a day does not establish ordering inside one file. No documented transition table exists for repeated `U→U`, `I→U`, `U→D`, `D→I`, or `I→D` sequences.

## Live structural evidence

The ignored staged delta contains two `U` rows at physical lines 1,685 and 3,695 that resolve through the decoded Product URL to one canonical Newegg destination. Safe comparison establishes:

- Product ID: different;
- SKU: different;
- decoded Product URL target: same;
- Buy URL target: absent in both;
- MPN: same;
- UPC: same;
- Class ID and currency: same;
- retail price: different;
- sale price: absent in both;
- source shipping: different;
- availability: same;
- Modification: `U→U` in physical order.

This corrects the earlier contextual assumption that the two rows share one exact SKU. They do not. The evidence is consistent with distinct provider products or offers converging on one canonical retailer destination, but the available provider contract does not prove that interpretation. It also does not prove repeat updates or retransmission. The provider-identity conclusion remains unresolved.

## Governance decision

Product ID and SKU remain preserved source evidence; neither replaces Atlas identity or Mercury destination ownership. Exact decoded destination corroboration does not authorize collapsing distinct provider identities. Price, shipping, and physical order are not identity or precedence signals. A delete is not assumed to override an update, or vice versa, without provider authority.

`RakutenNeweggProductFeedAdapter` therefore retains its existing invariant: exactly one applicable row is required for a destination refresh. Multiple applicable rows return `INVALID_SOURCE_RESULT`, represented operationally as `LIVE_ADAPTER_MULTIPLICITY_UNRESOLVED`. Both rows remain available only in bounded ignored diagnostics.

A future full-file reconciliation may establish later source state, but no implemented production full-file reconciliation currently resolves this delta ambiguity automatically. Until Rakuten supplies precedence or stable identity semantics, the destination remains blocked for this delta.

## Provider question

Operator-ready, unsent question:

> When a Product Catalog delta contains multiple rows that resolve to the same SKU, Product ID, or retailer product destination during one generated delta, is record ordering significant, and should publishers apply first-row, last-row, Modification sequence, Product ID, or another provider-defined precedence rule? How should distinct Product IDs or SKUs that resolve to the same retailer product URL be handled?

No live product values or identifiers are required in the question.

## Certification

Fixture coverage proves that two distinct provider Product IDs and SKUs resolving through one exact destination URL remain fail closed, do not mutate their inputs, and gain no display, comparison, or historical authority. This is certification of safe unresolved behavior, not certification of a collapse rule.
