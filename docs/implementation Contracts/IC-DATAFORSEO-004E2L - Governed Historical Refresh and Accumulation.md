# IC-DATAFORSEO-004E2L — Governed Historical Refresh & Accumulation

**Status:** Implemented  
**Increment:** DF004-E2L

## Minimum safe acquisition path

The certified provider identity for `ram_corsair_cmk32gx5m2b6000z30` is `{ productId:null, dataDocId:"3844868436216882408", gid:null }`. Existing SELLERS authorization code accepts any governed stable `productId`, `dataDocId`, or `gid`; therefore `dataDocId` is sufficient.

Paid PRODUCTS and PRODUCT_INFO acquisition are not repeated while the Atlas product, governed PRODUCT_INFO provenance, and provider identity remain compatible. A refresh prepares one new SELLERS task. The future paid operation must use the existing proposal → operator review → authorization → explicit confirmation → single-use execution framework.

## Independent cycle

A new historical acquisition cycle requires:

- a new completed governed acquisition run;
- a new provider SELLERS task ID;
- that task's provider observation time;
- a task-scoped raw result-item reference;
- a subsequently retained evidence ID.

Retrieving one task multiple times or rerunning retention for its same item is replay only when material provider evidence is identical. Different material values under the same task/item identity fail closed as `ACQUISITION_EVIDENCE_CONFLICT`. Different task IDs remain distinct even if seller, URL, product, price, and currency are identical.

Acquisition identity is derived from provider source, SELLERS task ID, and raw item reference. A separate SHA-256 material-evidence fingerprint binds Atlas product, seller name/domain/URL, base/total/shipping/tax/currency, condition, availability, governed provider product identity, source method, and provider task/item identity. `observedAt` is preserved as market time but excluded from the material fingerprint so a local retrieval-time difference cannot manufacture either a new observation or a false conflict. Existing legacy evidence is detected by recomputing identity and fingerprint rather than rewritten.

E2J remains evidence-scoped: distinct evidence IDs naturally produce distinct deterministic `mer_hist_*` IDs. E2L never invokes E2J automatically.

## Identity reuse

Durable review decisions are not copied. `HISTORICAL_REFRESH_IDENTITY_REUSE` explicitly binds source evidence, target evidence, and the original decision IDs.

Product verification is applicable only when provider identity and Atlas product remain stable and no specification contradiction is present. A compatible known merchant must resolve through Atlas to the same registered retailer. An unknown seller remains `DISCOVERED` and follows the existing Atlas/review path. Conflicting identity is `BLOCKED`.

The explicit assessment may be supplied to E2G for the target evidence. E2G validates that reused decision IDs genuinely govern the source evidence. This does not broaden decision applicability globally.

## Seller disappearance

An empty SELLERS result produces `NO_SELLER_OBSERVATIONS`, retains no evidence, and explicitly records that absence does not imply out-of-stock. No zero-price, deletion, or availability observation is synthesized.

## PREPARE and spend governance

`acquisition:history-refresh:prepare` reads Atlas, retained evidence, immutable history, review state, the governed SELLERS authorization, and execution ledger. It deterministically reports the provider identity, previous observation/evidence/task, minimum operation, and existing spend limits.

PREPARE creates no provider task and spends `$0.000`. The future authorization remains limited to one paid task, `$0.001` per run, `$0.01` per day, zero automatic retries, and single use.

## Boundaries

New acquisition does not imply retention, identity reuse, promotion, or admission. The full flow remains acquisition → DF003 retention → compatibility assessment → E2G/E2H → explicit E2J admission → E2K query. No canonical, publication, ranking, current-price, or freshness policy is introduced.
