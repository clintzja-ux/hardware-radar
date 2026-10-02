# IC-RAKUTEN-NEWEGG-OFFER-IDENTITY-AND-CONTEXTUAL-RETAIL-CONDITION-P1

Status: implemented and fixture-certified locally. No provider call, Current mutation, History mutation, publication, release, or deployment is authorized by this contract.

## Ownership and scope

The existing schema-1.1 `CurrentOfferModel`, source-neutral `CurrentRetailRefreshOrchestrator`, and `RakutenNeweggProductFeedAdapter` remain the owners. For exact Newegg Product Catalog feeds, Rakuten field 2 (`SKU`) is interpreted as the Newegg Item number/listing identity when retained source evidence establishes that retailer-specific semantic. This interpretation is not generalized to other Rakuten advertisers. Acquisition source remains provenance and is excluded from offer identity.

An evidence-grounded offer identity is derived from Atlas product, Newegg commerce channel, actual Newegg Item identity, seller when evidenced, and condition semantics. Exact evidence-grounded identities may progress across acquisition sources when the incoming observation is newer; older or same-time incompatible cross-source evidence remains review-required. Different Item identities remain distinct simultaneous offers. Seller remains unknown when the feed does not provide it. Legacy product/channel offers remain readable and are never silently assigned an Item number they did not retain.

## Contextual condition policy

Policy `RAKUTEN-NEWEGG-CONTEXTUAL-RETAIL-CONDITION-P1-1.0` applies only to Newegg Rakuten Product Catalog evidence. It may derive `NEW` with provenance state `CONTEXTUALLY_DERIVED` only for an ordinary I/U Product Catalog record that is in stock, exposes a positive retail or sale price, and contains no contrary condition evidence. It does not assert that Rakuten explicitly supplied `NEW`.

Strong structured-title prefixes such as `Open Box -`, `Refurbished`, or `Used` produce explicit alternative-condition evidence. Ambiguous condition-like free text blocks contextual `NEW` and remains `UNKNOWN`. Explicit contrary evidence always wins. Out-of-stock, deleted, unpriced, contradictory, and unsupported-family records remain unknown unless explicit condition evidence exists. Amazon, Google, manual observations, and other Rakuten advertisers retain their independent condition semantics.

## October 2 retained replay

The retained October 2 DELTA has five Hardware Radar-bound rows: four U and one D. Two U rows for one destination remain identity review because they carry different Newegg Item numbers. The other two U rows deterministically compose fresh schema-1.1 offers with contextual `NEW`, exact Item identities, unknown seller, and zero History eligibility. Canonical Current is not mutated by this certification. The exact D remains source/offer-local and cannot remove unrelated manual evidence.

The operator-verified Crucial case establishes that `9SIB3T1KSA7837` is the live Newegg Item number and that the manual and Rakuten facts describe the same commercial offer despite a price change. The existing legacy manual Current record did not retain that Item identity, so certification does not rewrite or silently migrate it. A future governed preparation must bind that legacy evidence before same-offer canonical progression.

## Invariants

- Item identity, seller, commerce channel, feed family, and acquisition source remain separate facts.
- Source never creates uniqueness merely to avoid reconciliation.
- A price change does not create a new offer.
- Unknown seller is preserved; Newegg and Techjunkie are never inferred from feed family.
- DELTA absence grants no freshness.
- Rakuten History eligibility remains `NO`.
- Affiliate URL selection remains independent of identity, price, and condition.
- Canonical Current progression remains separately prepared, inspected, and authorized.
