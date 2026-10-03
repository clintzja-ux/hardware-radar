# IC-AUTOMATED-CURRENT-REFRESH-LANE-CERTIFICATION-P1

Status: implemented and fixture-certified; no live acquisition or Current mutation.

## Common Current boundary

Automated and manual evidence use the existing `CurrentMarketObservationQualificationService`; this increment creates no Current, History, destination, or release owner. Exact Atlas identity, canonical retailer/merchant context, standalone semantics, condition, availability, item price, currency, observation time, freshness, rights, provenance, and conflict handling belong to the Current fact. A click destination belongs to public action and may remain suppressed without erasing an otherwise truthful market fact. Shipping is optional for the bounded item-price claim and unknown shipping is never zero.

## Retained-evidence findings

- Amazon Products is identity/discovery evidence only. It does not establish a seller-specific price-bearing offer.
- Amazon Sellers is price-bearing retained evidence, but the certified retained shape has no canonical retailer binding and no availability. It therefore remains blocked from Current without loss of History evidence.
- Google Shopping already has a production Current adapter and six-hour freshness policies for canonical Platinummicro (`RETAILER-0002`) and MemoryC (`RETAILER-0003`). It is scoped certification, not authority to map arbitrary merchants or impersonate Amazon/Newegg.
- Rakuten Newegg is Current/display/comparison capable through the existing source-local catalog/current-refresh composition. History retention remains prohibited.

The retained production inventory contains 12 Amazon canonical results in the Amazon repository (six Products and six Sellers), 49 historical-bootstrap results (six Google Sellers and 43 Amazon Sellers), two Google Products results, 197 admitted DataForSEO Amazon historical facts across 30 products, and 37 DataForSEO Google Shopping historical facts across two products. These facts are stale evidence shapes for certification and are not resurrected as Current.

## Planner contract

Plans bind `AUTOMATED-CURRENT-REFRESH-LANE-CERTIFICATION-P1-1.0`, expose identity readiness and source-selection reason, and may select only certified lane shapes. Amazon paid lanes are presently `BLOCKED`; Google is scoped to its two registered retailers; Rakuten Newegg is routine-ready but cannot write History. Existing-source continuity is deterministic and does not establish manual or automated global preference.

## Future execution boundary

`REFRESH PLAN -> PREPARE -> INSPECT -> BOUNDED AUTHORIZE -> START -> RETRIEVE/RESUME -> COMMON CURRENT QUALIFICATION -> CANONICAL HISTORY WHERE RIGHTS PERMIT -> STATIC RECOMPOSITION`.

Every paid boundary remains separately governed. This contract authorizes no provider call, paid task, Current mutation, release, or deployment.
