# IC-MERCURY-SCALE-RAMP-CANARY-SELECTION — Deterministic Paid-Canary Selection

Status: `IMPLEMENTED / FIXTURE-CERTIFIED`
Policy: `MERCURY_SCALE_RAMP_CANARY_SELECTION / 1.0`

Mercury selects review-only paid-canary members from a canonical, already-eligible source/operation pool. Atlas supplies stable product attributes; canonical readiness owners establish eligibility. The selector owns neither readiness, rights, destinations, provider transport, spend, authorization, nor downstream authority.

V1 normalizes an explicit allowlisted candidate shape and rejects duplicates, missing dimensions, invalid sizes, unsupported versions, and arbitrary metadata. Primary strata are manufacturer + memory generation + form factor. Strata are ordered by SHA-256 over policy/stage/source/operation/stratum material. Members are ordered by SHA-256 additionally binding Atlas product ID, capacity, and module count, with Atlas ID as collision tie-break. Round-robin passes select one available member per ordered stratum until the explicit requested size is reached.

The candidate-pool digest binds policy, stage ID/digest, source, operation, and the normalized eligible set. The selected-member digest additionally binds requested size and exact selection order. Input order, affiliate/commercial metadata, retailer preference, provider outcomes, prior yield, current spend, and wall time cannot influence selection.

Output is `REVIEW_ONLY` and `authority: NONE`: no reservation, PREPARE, authorization, task, result, or execution authority exists. A future PREPARE and START must independently revalidate current Atlas, rights, destination, identity, spend, and policy state. Changing strata, hash material, ordering, tie-breaking, traversal, or normalization requires a new policy version; catalog/readiness/pool/size changes remain V1 inputs and produce new digests.

Fixture certification covers replay, caller-order invariance, forbidden influence, validation failures, imbalanced/exhausted/single/multiple strata, source/operation isolation, current-owner composition, and synthetic mechanics through 10,000 candidates. These scale fixtures certify selector mechanics only, not provider throughput or production scale.
