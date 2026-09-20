# IC — Authorized Current Display Artifact Boundary P1

Status: implemented and fixture-certified.

This boundary materializes one immutable, inspectable static artifact from an exact persisted `CURRENT_DISPLAY_PUBLICATION` authorization. It accepts no price, retailer, destination, product, comparison, or claim override. Immediately before materialization it resolves the authorization and candidate, revalidates the canonical snapshot, freshness, rights, destinations, conflicts, eligibility, and invariant public facts, then reuses `PublicCurrentRetailProjection` and the existing RAM product-page renderer.

Artifact identity is deterministic over authorized content and lineage; `builtAt` and `builtBy` are audit metadata outside the material digest. The artifact manifest binds authorization, candidate, snapshot, projection, public-facts, product scope, claim class, included facts, excluded claims, destination-bearing content files, disclosure, and expiry. A separate consumption record binds the single-use authorization to the first successful artifact. Exact replay returns that artifact; drift conflicts, and failed builds do not record consumption.

Commands:

```text
npm run publication:current-display:artifact:build -- --authorization-id=<id> --built-by=<operator>
npm run publication:current-display:artifact:inspect -- --artifact-id=<id>
```

Artifact materialization creates no release manifest and grants no release or deployment authority. Release PREPARE remains separate and, for `mer_displaypubauth_*`, must resolve a persisted `mer_displaypubart_*` artifact and verify its complete lineage; an arbitrary file plus a lookalike authority string is rejected.

```text
PUBLICATION AUTHORIZATION != ARTIFACT
ARTIFACT != RELEASE
RELEASE != DEPLOYMENT
```

Certification uses isolated fixture state only. It materializes the existing product-page wording, preserves item-price ordering and the shipping/tax/fee disclosure, omits unknown ancillary facts and stronger claims, verifies exact destinations and product scope, and performs no provider, production, release, or deployment operation.
