# IC-MERCURY-HISTORY-049 — Bounded DataForSEO Amazon Live Acceptance Preparation

## Status

Fixture-certified PREPARE-only boundary. H049 creates no live provider task, paid authorization, result retrieval, retained evidence, or historical observation. A prepared artifact has zero execution and spend authority.

## Existing owners and selection

Atlas remains product owner; the checked-in Mercury `RetailerDestination` source supplies reviewed Amazon destination evidence; `SourceRightsRegistry` owns `DATAFORSEO_AMAZON` rights; H046 owns ASIN identity; H047 owns operation requests, task execution, retrieval, immutable results, and spend controls; H048 owns Sellers retention and the existing DF003/HISTORY-018/E2J path. Existing identity-review, retailer, historical-observation, and historical-portfolio owners remain unchanged.

Selection is deterministic and product-generic: eligible products are `ACTIVE` + `READY`, have an effective Amazon `RETAILER-0001` product-page destination with an ASIN-shaped listing identifier, have a canonical MPN and complete Atlas identity input, and have no historical observation from `DATAFORSEO_AMAZON`. Candidates are ordered by identity-fact completeness descending and Atlas product ID ascending. Destination ASINs are corroborating input only; they do not select provider identity.

## Immutable artifact and budget

The artifact binds explicit `asOf`, selected Atlas product and identity digest, destination and corroborating ASINs, source-rights digest, H046/H047 policy versions, operation plan, `$0.0015` per-task ceiling, three-task/`$0.0045` maximum, existing `$0.010` UTC-day ceiling, reviewed current-day spend, and zero automatic retries. Its deterministic ID derives from its full binding digest. Exact replay is idempotent; changed material produces a different artifact, while same-ID conflicting content fails closed. PREPARE reserves no spend.

`executionEligible` reports only whether the full maximum envelope fits at the explicit assessment time. It is not authorization. Each future paid operation must still obtain its own existing single-use authorization and revalidate current durable spend and rights.

## Operation and operator lifecycle

`AMAZON_PRODUCTS` is required. Only `STRONG_UNIQUE_ASIN` permits a later independently authorized `AMAZON_SELLERS` action. No certified semantic currently authorizes automatic `AMAZON_ASIN` enrichment for ambiguous Products results, so ambiguity stops fail closed. Sellers processing may admit history or may legitimately stop at retained evidence/identity/comparability gates. Both are system-success outcomes when lineage, accounting, immutability, and fail-closed behavior are correct.

The exposed surface is intentionally limited to zero-cost `mercury:amazon:acceptance:prepare` and read-only `mercury:amazon:acceptance:inspect`. The later lifecycle is one action at a time: inspect, separately authorize, execute, retrieve, process, then stop for review. There is no run-all, auto-next, polling loop, or pre-authorization of conditional work.

## Replay, isolation, and scalability

The artifact repository is immutable and append-only. Existing H047 controls own authorization consumption, durable provider task recording, immutable result replay, and spend; existing retained-evidence and E2J owners provide duplicate/conflict protection. Amazon and Google source lineage cannot satisfy one another. No Current Display, Current Price, Cheapest, Pick, publication, affiliate-routing, or public authority is present.

Certification applies to the supported Amazon semantic class, not an ASIN, seller, or Atlas product. Products enter through repository data and the same selection rule. H049 does not reuse the Google-specific historical-bootstrap checkpoint because doing so would misstate source lineage; it adds only a bounded acceptance preparation artifact, not a parallel acquisition or history subsystem.
