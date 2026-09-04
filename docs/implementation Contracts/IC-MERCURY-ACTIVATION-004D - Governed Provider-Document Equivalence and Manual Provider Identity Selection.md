# IC-MERCURY-ACTIVATION-004D — Governed Provider-Document Equivalence and Manual Provider Identity Selection

## Status

Implemented and fixture-certified. One zero-spend production equivalence assessment is recorded for `ram_kingston_kvr32n22d8_32`; no provider identity has been selected.

## Owners and boundary

Mercury owns two narrow, separate authorities:

- `PROVIDER_DOCUMENT_EQUIVALENCE_ASSESSMENT` may establish that distinct provider documents are non-conflicting representations of one Atlas product for selection review. It does not merge identities or select a document.
- `MANUAL_PROVIDER_IDENTITY_SELECTION` may select exactly one exact provider tuple from one current certified equivalence group for downstream provider lineage. It does not establish Atlas identity, market evidence, history, publication, ranking, recommendation, affiliate, or retailer-destination authority.

The durable PRODUCTS review remains the source record. Atlas remains the product owner. Product Info remains a later, independently authorized paid operation.

## Equivalence policy

Policy `MERCURY-ACTIVATION-004D-1.0` requires exact normalized Atlas MPN, the existing recommendation threshold, no resolver or derived Atlas contradiction, and no replacement, compatibility-only, bundle, non-new condition, or material-variant conflict. Every supplied Atlas-significant value must agree with Atlas, and jointly known significant values must agree across members. Missing values stay `null`; they are not positive evidence.

Each member preserves its exact `dataDocId`, `productId`, and `gid`. Stable sorting affects only deterministic assessment representation; it is never an automatic preference rule. Price, seller count, affiliate state, commission, identifier count, and provider result order cannot select a member.

## Records and replay

The file repository is append-only by source PRODUCTS review and equivalence assessment. An assessment binds the Atlas product/MPN, PRODUCTS task/review and review digest, member tuples, evidence digests, group digest, policy, assessment time, and material fingerprint. Exact replay returns `DUPLICATE`; changed material conflicts fail closed.

A selection PREPARE binds a chosen current member and emits an identity-specific `SELECT-PROVIDER-*` confirmation. EXECUTE additionally requires a non-placeholder operator, explicit reason, and explicit time. The immutable decision retains every eligible alternative and the selected exact tuple. Exact replay is idempotent; a conflicting second selection fails closed. Reselection requires a future explicit supersession design.

PREPARE requires a concrete ISO-8601 timestamp. A placeholder or malformed `--as-of` fails specifically as `MANUAL_PROVIDER_SELECTION_PREPARED_AT_INVALID`; it must not be misreported as an invalid equivalence assessment.

## Downstream projection

A valid selection may project `READY_FOR_PRODUCT_INFO` only through the existing acquisition checkpoint. A later Product Info proposal and authorization bind the source PRODUCTS task/review, equivalence assessment/group, selection decision, and exact provider tuple. Existing result validation continues to reject provider identity drift. This increment creates no Product Info authorization or execution.

Historical reuse remains owned by existing identity-reuse governance. A prior selection is reusable only if the same Atlas product/MPN and exact tuple remain present in a current valid equivalence assessment without contradiction; this contract creates no competing reuse authority.

## Operator workflow

```text
npm run mercury:provider-equivalence:assess -- --portfolio-cycle-id=<ID> --atlas-product=<ATLAS_ID> --as-of=<ISO_UTC>
npm run mercury:provider-selection:prepare -- --assessment-id=<ASSESSMENT_ID> --data-doc-id=<ID> --product-id=<ID> --gid=<ID> --as-of=<ISO_UTC>
npm run mercury:provider-selection:execute -- --request-id=<REQUEST_ID> --confirm=<SELECT-PROVIDER-...> --operator=<LABEL> --reason=<REASON> --as-of=<ISO_UTC>
npm run mercury:provider-selection:inspect -- --assessment-id=<ASSESSMENT_ID>
```

Nullable tuple components may be omitted, but at least one provider identifier is required and the supplied tuple must exactly equal a group member. These commands do not load provider credentials and make no provider request.

## Safety and certification

The Kingston production assessment derives one three-member group from the existing paid PRODUCTS review and leaves the checkpoint `PRODUCTS_REVIEW_REQUIRED` until an operator makes a governed selection. TEAMGROUP remains `PRODUCTS_PENDING`. The other completed weak-yield result sets receive no unintended equivalence recovery. Provider operations and incremental spend are zero.
