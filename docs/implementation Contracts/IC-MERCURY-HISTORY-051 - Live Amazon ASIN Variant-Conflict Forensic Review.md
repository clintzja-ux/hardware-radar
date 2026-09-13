# IC-MERCURY-HISTORY-051 — Live Amazon ASIN Variant-Conflict Forensic Review

## Status

Fixture-certified implementation correction following an offline replay of immutable production Products result `mer_providerresult_cf4506268ee32ecc59c63e95`. H051 performs no provider operation, paid task, retrieval, authorization, acceptance, history write, Atlas write, Current Display write, or publication action.

## Forensic finding

H046 correctly found one contradiction-free exact canonical-MPN result for `CMH32GX5M2B6000C38`, ASIN `B0CQQVNCB6`. It nevertheless returned `ASIN_VARIANT_CONFLICT` because its final reduction treated any contradictory row in the full Amazon search response as a target variant. Six unrelated non-exact-MPN rows supplied different capacities and therefore contaminated the result with `CAPACITY_CONFLICT`.

An Amazon search result is not an Amazon product variant merely because it appears for the query. Search co-occurrence, rank, price, rating, seller, affiliate state, destination preference, same brand, or similar family wording do not establish identity or variant relationship. A materially different complete MPN does not contaminate an exact canonical-MPN candidate.

## Corrected invariant

The corrected H051 identity policy, `MERCURY-HISTORY-051-1.0`, first identifies candidates carrying the exact canonical MPN under H046's existing token-boundary rule. Bundle, renewed/used, material-contradiction, compatibility, and multiplicity decisions are then evaluated within that exact-MPN candidate set. Therefore:

- one contradiction-free exact-MPN ASIN produces `STRONG_UNIQUE_ASIN`;
- two distinct contradiction-free exact-MPN ASINs remain `MULTIPLE_COMPATIBLE_ASINS`;
- an exact-MPN candidate with material Atlas contradictions remains `ASIN_VARIANT_CONFLICT`;
- exact-MPN bundle and renewed/used candidates retain their existing fail-closed outcomes;
- rows without the exact canonical MPN cannot create target identity, corroboration, or conflict.

Parent ASIN and modification/product-ASIN data remain evidence, not automatic equivalence. H051 does not invent parent/child authority. When an exact-MPN candidate in an explicitly linked family also contradicts material Atlas facts, the existing material-conflict rule still fails closed.

## Destination and downstream authority

The reviewed Amazon destination remains navigation evidence and sorted corroboration only. It neither selects an ASIN nor overrides provider evidence. The corrected offline replay selects `B0CQQVNCB6` because it is the sole clean exact-MPN result, not because it is rank 1 or matches the destination.

The original durable outcome `mer_amzoutcome_5c0dfb2cdd6e7618bdab9374` and assessment `mer_amzasin_2ffa3b712fcc8f44f0c4b8fa` remain immutable audit evidence under the prior implementation. H051 authorizes no mutation or downstream progression. Any reuse of the already-paid immutable result requires a new governed reassessment record through a separately controlled operator action; it must not rewrite the original outcome.

## Certification

Fixtures cover exact targets mixed with unrelated results, same-brand different MPNs, unrelated brands, unique and multiple exact ASINs, exact-candidate parent/product-ASIN conflicts, bundle, renewed, used, result ordering, price/rank neutrality, destination neutrality, zero provider work, and absence of history/publication authority. The rule is product-generic and contains no product, ASIN, brand, retailer, or Stage-A exception.
