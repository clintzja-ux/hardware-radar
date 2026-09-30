# IC-DATAFORSEO-AMAZON-HISTORICAL-COMPARABILITY-RECOVERY-P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / GOVERNED REASSESSMENT EXECUTED

## Purpose

Recover historical item-price comparability for retained DataForSEO Amazon Sellers facts whose exact immutable provider result already contains the canonical product title. The correction does not acquire evidence, relax identity or comparability policy, rewrite History, or create Current/public authority.

## Root cause and future path

`projectAmazonSellerRetention()` previously projected seller-level evidence but omitted the product-level title held by its exact immutable `AMAZON_SELLERS` result. `MERCURY-HISTORY-018-1.0` therefore had no descriptive evidence and correctly returned `UNKNOWN_COMPARABILITY`. The existing retention owner now copies that title to `marketEvidence.productEvidence.title` only when the result is the bound DataForSEO Amazon Sellers result, contains exactly one product result, and its ASIN equals the governed seller evidence ASIN. Missing or conflicting title lineage remains absent and therefore fails closed under the unchanged policy.

## Append-only recovery boundary

The recovery command surface is explicitly separated:

- `history:comparability:prepare`
- `history:comparability:inspect`
- `history:comparability:authorize`
- `history:comparability:execute`

PREPARE validates observation, retained-evidence, immutable-result, digest, Atlas product, exact ASIN, exact-MPN token boundary, and current source-rights lineage. AUTHORIZE grants only append-only reassessment authority. EXECUTE re-prepares and rejects drift before recording deterministic, idempotent reassessment events. It cannot call a provider, spend money, mutate Current, edit canonical History, or grant publication/release authority.

Each reassessment binds the canonical observation and retained evidence IDs, immutable result ID and digest, Atlas product, governed ASIN, prior classification, unchanged comparability policy, recovery version, recovered-title digest, rights digest, new assessment, and authorization time. Raw provider payload is not copied.

## Effective projection

`EffectiveHistoricalObservationRepository` overlays the latest valid governed reassessment onto a clone of the original observation's comparability field. Canonical History remains the durable fact owner and the reassessment store remains a qualification overlay. Development RAM Terminal, chronological series, and product-page projections consume this effective view. No competing fact store exists.

## Production recovery result

Plan `mer_histcomparerecovery_5d36c251162da2287329573c` found 197 candidates: 197 lineage-valid and projected `STANDALONE_COMPARABLE`; zero bundle, conditional, unknown, rights-blocked, identity-blocked, or other exceptions. Authorization `mer_histcompareauth_f826fac404b4f0d8dd8eacd2` permitted the zero-provider append-only execution. Exactly 197 reassessments were recorded. Canonical History remains 329 observations; effective comparability is 329 standalone and zero unknown.

## Preserved semantics

Condition, shipping, availability, price, observation time, seller, marketplace, retailer attribution, evidence, immutable result, and rights lineage are unchanged. Unknown shipping is not zero. Unknown availability remains unknown. Amazon marketplace context does not become canonical Amazon retailer identity. Public projections continue to exclude provider and seller-private fields and aggregate public-equivalent same-time observations under the existing chronology contract.

## Authority and operations

Provider calls: 0. Paid tasks: 0. Spend: `$0.000`. Mercury Current, Atlas, destinations, publication, release, deployment, URLs, affiliate links, and the operator workbook are outside this boundary. The release remains OFF.

