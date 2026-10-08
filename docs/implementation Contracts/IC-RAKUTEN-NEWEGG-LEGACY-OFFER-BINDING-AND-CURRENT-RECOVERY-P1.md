# IC — Rakuten Newegg Legacy Offer Binding and Current Recovery P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / OPERATOR-AUTHORIZED / CANONICAL CURRENT EXECUTED

## Ownership and purpose

Mercury Current remains the sole owner of canonical current-market offers. This increment adds no competing Current repository or policy owner. The existing Current refresh boundary now persists immutable, content-addressed recovery artifacts under `.forge-review/mercury/current-refresh/legacy-offer-recovery/`: an operator-verified identity-enrichment binding, one recovery plan, and member preparations. These artifacts may describe a proposed mutation but cannot execute it.

The binding enriches the legacy manual Crucial offer with Newegg Item `9SIB3T1KSA7837`. It preserves the original manual observation, price, timestamp, seller, destination, provenance, and workbook evidence. Its only effect is to provide listing identity established by operator review. Re-derivation proves the enriched manual offer and newer Rakuten observation share deterministic offer identity `mer_offer_eba86bfe779fd6c9c125ba0c`.

## Prepared semantics

- Crucial `ram_crucial_ct2k32g4sfd832a`: same commercial offer; `$430.60` at `2026-10-01T02:00:00Z` progresses to `$439.12` at `2026-10-02T10:51:03Z`; seller `TECH_JUNKIE` remains governed by the exact Item/seller binding; availability is `AVAILABLE`; condition is `NEW` with `CONTEXTUALLY_DERIVED` provenance under `RAKUTEN-NEWEGG-CONTEXTUAL-RETAIL-CONDITION-P1-1.0`.
- G.Skill `ram_g_skill_f5_5600s4645a16gx2_rs`: Rakuten Item `9SIA1K6KCT0998` has deterministic identity `mer_offer_5d461bd6797e88fda18ca166`, distinct from manual listing `N82E16820374494`; both offers may coexist. Its seller remains unknown and its canonical action is channel/product-level.
- Crucial `ram_crucial_ct16g56c46s5`: Items `9SIC6E1M4N1100` and `9SIC89BM7N3054` remain `IDENTITY_REVIEW_REQUIRED` and are excluded.
- Crucial `ram_crucial_ct32g56c46u5`: Item `9SIA12KK066781` remains an exact Rakuten-source withdrawal; no canonical offer is removed because no current canonical Rakuten-owned offer has that identity.

Both proposed members pass the common identity, USD price, condition, availability, freshness, rights, and destination/actionability boundaries at the explicit preparation time. Both expire at `2026-10-03T22:51:03Z` under the existing 36-hour rule. This recovery remained Current-only; later Newegg Product Catalog History rights do not retroactively turn its preparations into History authority.

## Authority and stale-state protection

Plan `mer_currecovery_590cf94f688ad17caa61888b` binds source Current snapshot `mer_display_18de6e09acecb4ba3c3c3603`, fingerprint `18de6e09acecb4ba3c3c3603065a883291cd1537dfd44b56f8d32923c2e1a816`, retained catalog state `rakuten_catalog_aff4b8f083a0f404fab182eb`, DELTA digest `c7ce6b5c4f3425ee1e157b2538ab0cbc2a4443e28e70f38bce33126c766fbd84`, the governed binding, and the exact proposed diff. Future progression must resolve these immutable artifacts and revalidate both source owners; drift fails closed.

The proposed semantic diff is 188 → 189 offers: one update, one addition, zero removals, one identity enrichment, and 187 unchanged offers. Preparations are `mer_currecoveryprep_9e7c39f8d36daefb9242154e` and `mer_currecoveryprep_aaa5debdf2c33c508bbbc7f4`.

The operator explicitly authorized only this plan and its two preparations. `retail-current:rakuten-newegg:recovery:execute` requires all three exact IDs plus their deterministic confirmation, resolves the immutable artifacts, revalidates Current and retained Rakuten lineage, rebuilds the inspected snapshot, and uses `FileCurrentDisplaySnapshotRepository.replaceIfCurrent` for atomic compare-and-swap persistence. Canonical Current advanced to `mer_display_64e9570356f18c96c972e735` with 189 offers. Restart readback reproduced the same snapshot; exact replay returns `ALREADY_EXECUTED` without another write.

Execution changed no History, destination, affiliate, workbook, publication, release, or deployment state. Provider calls and paid tasks were zero and spend was `$0.000`. The unresolved multi-Item case and source-scoped delete remained excluded. The permitted zero-authority RAM portfolio recomposition then failed closed before candidate creation because `deriveCurrentDisplayPublicationEligibleSnapshot` still enforces legacy product/retailer uniqueness and classified the legitimate two-offer G.Skill state as `CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED`. No certification or release authority was created. The next prerequisite is a narrow schema-1.1 multi-offer publication-eligibility correction; release and deployment remain unauthorized.
