# IC-AMAZON-DESTINATION-OPERATOR-REVIEW-FORGE-PROJECTION-P1

Status: implemented and fixture-certified

## Purpose

Expose Mercury-owned Amazon destination review preparations in Forge as a safe, read-only operator queue. This projection improves discovery and comprehension; it creates no destination, review decision, Current/History fact, publication authority, provider work, or spend.

## Owners and flow

`AmazonDestinationProgressionService` remains the canonical preparation, revalidation, review, and destination-persistence policy owner. `ProductionForgeAmazonDestinationReviewProvider` reads the private preparation queue and revalidates each item through that owner. `CertifiedMercuryOperationsExporter` carries the sanitized projection into schema 1.1. `CertifiedMercuryOperationsPanel` renders the queue in Forge.

Forge may display product identity, MPN, ASIN, ordinary Amazon candidate URL, identity/result/rights lineage, collision state, review status, and the review checklist. It must not contain credentials, raw provider payloads, approval controls, or persistence authority. Candidate links use a new browser tab with `noopener noreferrer`.

## Status semantics

- `AWAITING_OPERATOR_REVIEW`: exact preparation binding still revalidates.
- `ALREADY_BOUND`: equivalent canonical destination already exists.
- `STALE`: the current preparation binding differs; a fresh preparation is required.
- `BLOCKED`: current canonical revalidation fails closed.
- `APPROVED` and `REJECTED` are reserved projection counts for durable review outcomes once the existing Mercury review boundary is exposed operationally.

Queue discovery is data-driven from the canonical private preparation artifact. No product or cohort identity is hard-coded. Fixture certification covers automatic discovery, stale/bound/blocked distinctions, safe browser links, zero authority, and a 200-item queue.

## Operator handoff

The canonical service boundary is `AmazonDestinationProgressionService.createReview`, followed by its separately governed execution/persistence boundary. This increment intentionally adds no CLI or Forge action. The next bounded increment is a thin governed review command/persistence surface over the existing Mercury owner; batch approval is not implied.

## Safety

Network operations, provider calls, paid tasks, and spend are zero. Atlas, destinations, Current, History, workbook, affiliate evidence, public publication state, and release state are not mutated. No ADR is required because ownership is unchanged.
