# IC-AMAZON-DESTINATION-GOVERNED-REVIEW-COMMAND-AND-PERSISTENCE-P1

Status: implemented and fixture-certified

## Purpose and ownership

Complete the operator seam between the read-only Forge Amazon destination queue and Mercury's existing `AmazonDestinationProgressionService`. Forge presents review work. Mercury creates and durably records immutable operator decisions. A separate Mercury command may persist only an approved, still-current preparation through the existing canonical destination repository.

No new review-policy owner exists. The file-backed review repository is append-only persistence for decisions created by the existing progression owner.

## Production canonical-source adapter

Production review revalidation and approved persistence use `ProductionFlatRetailerDestinationRepository` over the existing canonical `production-destinations.json` source. The adapter implements the repository contract required by `AmazonDestinationProgressionService` without changing the canonical flat schema `{ "schemaVersion": "1.0", "records": [] }`, creating a second destination source, or moving ownership out of Mercury. Reads reuse `loadRetailerDestinationSource()` so existing schema validation, Atlas/retailer binding, audit-history supersession, collision detection, and effective-record semantics remain authoritative.

Governed retention is serialized by the repository-native single-writer lock and an in-process queue. It rereads and revalidates canonical state while holding the lock, binds the expected content digest, writes a same-directory exclusive temporary file, rechecks the canonical digest immediately before replacement, and atomically replaces the source. Temporary files are removed after success or failure. Busy writers and non-cooperating concurrent mutation fail closed; no blind read-modify-write is permitted. Existing audit records retain their order and a new record is appended deterministically. Exact replay resolves `ALREADY_BOUND` through progression without appending another audit record.

The prior production failure was a composition defect: the runtime bound `FileRetailerDestinationRepository`, whose private indexed mutable-state contract requires `version`, object-indexed `records`, `byKey`, `byProduct`, and `byRetailer`, directly to the valid flat canonical production source. The corrected production factory binds both review revalidation and approved persistence to the compatible adapter. Operator commands, arguments, confirmation tokens, and authority separation are unchanged.

## Candidate-relevant preparation binding

Policy `MERCURY-AMAZON-DESTINATION-PROGRESSION-1.1` determines preparation staleness from canonical dependencies relevant to that candidate, not from unrelated destination inventory changes. The binding independently retains Atlas product/MPN and lifecycle state, identity assessment and outcome, immutable provider-result lineage, rights lineage, retailer/marketplace, ASIN, candidate URL, and policy version. Its destination-state digest contains only effective destinations for the candidate Atlas product plus Amazon destinations using the candidate ASIN or canonical URL. Relevant records are canonically projected with destination identity, listing/URL, material fingerprint, effective status, and supersession identity, then sorted by destination ID before repository-native stable hashing. Derived product, ASIN, URL, and cross-product collision state remains separately bound.

Version-1.0 preparations are never rewritten. Explicit compatibility first verifies their original deterministic binding and preparation ID, then freshly resolves Atlas lifecycle/MPN, identity, result, rights, ASIN, URL, and candidate-relevant destination/collision state. Compatibility applies only when the old preparation was review-required, all independently bound facts remain equal, no relevant destination or collision exists, and current qualification remains `ACTIONABILITY_REVIEW_REQUIRED`. Otherwise it fails closed. A destination already created from an exact approved preparation resolves only as `ALREADY_BOUND`. Sequential and concurrent unrelated candidates remain independent, while the flat production repository rechecks cross-product listing/URL collisions under its single-writer lock.

## Commands

Record approval:

```text
npm run mercury:amazon-destination:review -- --preparation-id=<id> --decision=APPROVE --reviewed-by=<operator> --reviewed-at=<ISO_TIME> --approval-attestation=I-ATTEST-EXACT-AMAZON-PRODUCT-PAGE-REVIEW --confirm=RECORD-AMAZON-DESTINATION-REVIEW
```

Record rejection:

```text
npm run mercury:amazon-destination:review -- --preparation-id=<id> --decision=REJECT --reviewed-by=<operator> --reviewed-at=<ISO_TIME> --rejection-reason=<controlled reason> --confirm=RECORD-AMAZON-DESTINATION-REVIEW
```

Persist a separately inspected approval:

```text
npm run mercury:amazon-destination:persist -- --review-id=<id> --executed-by=<operator> --confirm=PERSIST-APPROVED-AMAZON-DESTINATION
```

The commands accept no product, MPN, ASIN, URL, rights, identity, provider-result, collision, or destination substitution.

## Decision semantics

Approval requires the single explicit attestation `I-ATTEST-EXACT-AMAZON-PRODUCT-PAGE-REVIEW`, representing all six certified page checks. Rejection requires one of `WRONG_PRODUCT`, `VARIANT_CONFLICT`, `NON_ACTIONABLE_PAGE`, `REDIRECT_OR_TRACKING_CONCERN`, `PAGE_UNAVAILABLE`, or `OTHER_REVIEW_REQUIRED`.

Exact review replay is idempotent. A second differing decision for the same preparation conflicts. Persistence rejects a rejection, mismatched review/preparation lineage, or stale canonical state. Exact destination replay returns `ALREADY_BOUND` without another record.

## Authority

Review and destination persistence are separate. Neither creates price, availability, condition, seller, freshness, Current, History, Cheapest, Pick, recommendation, affiliate, publication, or release authority. Provider activity and spend are zero.
