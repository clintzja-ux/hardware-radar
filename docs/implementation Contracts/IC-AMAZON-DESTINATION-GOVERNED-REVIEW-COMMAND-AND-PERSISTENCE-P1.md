# IC-AMAZON-DESTINATION-GOVERNED-REVIEW-COMMAND-AND-PERSISTENCE-P1

Status: implemented and fixture-certified

## Purpose and ownership

Complete the operator seam between the read-only Forge Amazon destination queue and Mercury's existing `AmazonDestinationProgressionService`. Forge presents review work. Mercury creates and durably records immutable operator decisions. A separate Mercury command may persist only an approved, still-current preparation through the existing canonical destination repository.

No new review-policy owner exists. The file-backed review repository is append-only persistence for decisions created by the existing progression owner.

## Production canonical-source adapter

Production review revalidation and approved persistence use `ProductionFlatRetailerDestinationRepository` over the existing canonical `production-destinations.json` source. The adapter implements the repository contract required by `AmazonDestinationProgressionService` without changing the canonical flat schema `{ "schemaVersion": "1.0", "records": [] }`, creating a second destination source, or moving ownership out of Mercury. Reads reuse `loadRetailerDestinationSource()` so existing schema validation, Atlas/retailer binding, audit-history supersession, collision detection, and effective-record semantics remain authoritative.

Governed retention is serialized by the repository-native single-writer lock and an in-process queue. It rereads and revalidates canonical state while holding the lock, binds the expected content digest, writes a same-directory exclusive temporary file, rechecks the canonical digest immediately before replacement, and atomically replaces the source. Temporary files are removed after success or failure. Busy writers and non-cooperating concurrent mutation fail closed; no blind read-modify-write is permitted. Existing audit records retain their order and a new record is appended deterministically. Exact replay resolves `ALREADY_BOUND` through progression without appending another audit record.

The prior production failure was a composition defect: the runtime bound `FileRetailerDestinationRepository`, whose private indexed mutable-state contract requires `version`, object-indexed `records`, `byKey`, `byProduct`, and `byRetailer`, directly to the valid flat canonical production source. The corrected production factory binds both review revalidation and approved persistence to the compatible adapter. Operator commands, arguments, confirmation tokens, and authority separation are unchanged.

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
