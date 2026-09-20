# IC — Current Display Publication Candidate and Authorization P1

Status: implemented and fixture-certified.

Mercury composes one product-scoped `CURRENT_ITEM_PRICE_COMPARISON` candidate from the canonical `CurrentDisplaySnapshot`, current source rights, Atlas identity, exact destinations, and the sanitized `PublicCurrentRetailProjection`. Operators cannot enter prices. Candidate identity binds snapshot/digest, sanitized projection digest, invariant public-fact digest, included retailers, prices, observation times, destinations, lower current item price, disclosure, freshness boundary, and explicitly excluded stronger claims.

Candidate preparation grants no authority. A separate single-use authorization re-derives the current projection and revalidates snapshot, price facts, freshness, rights, eligibility, and destinations. Drift or expiry requires reprepare. Unknown condition, seller, shipping, tax, and fees stay unknown and do not block a bounded item-price claim; known incompatible offers remain excluded. Acquisition mode is provenance, not a public-schema distinction.

The separate authorized-artifact owner accepts `CURRENT_DISPLAY_PUBLICATION_AUTHORIZATION` only when the exact authorization verifies the artifact facts. Release PREPARE then accepts current-display authority only through that persisted verified artifact; a free-form file or lookalike authorization ID is rejected. Legacy certified authority types remain compatible. Publication authority permits artifact composition only; release and deployment remain separate.

Commands:

```text
npm run publication:current-display:prepare -- --snapshot-id=<id> --atlas-product-id=<id> --prepared-by=<operator>
npm run publication:current-display:inspect -- --candidate-id=<id>
npm run publication:current-display:authorize -- --candidate-id=<id> --authorized-by=<operator> --reason=<reason> --confirm=AUTHORIZE-CURRENT-DISPLAY-PUBLICATION
npm run publication:current-display:authorization:inspect -- --authorization-id=<id>
```

Certification created no real state. Subsequent governed operations created the real candidate and authorization recorded in `CURRENT-STATE`; artifact materialization remains separately gated.
