# IC-FORGE-MERCURY-003 — Observation Review Workflow

## Status

Implemented candidate — awaiting exit verification.

## Objective

Provide a safe Forge operational review layer over durable Mercury observations without giving Forge authority to mutate canonical market evidence or authorize publication.

## Deliverables

- ObservationReviewService over the durable acceptance repository.
- Retention-aware review bundles with AVAILABLE, PAYLOAD_PURGED, and NOT_FOUND states.
- Separate review-decision contract supporting REVIEWED, HOLD, and REJECTED.
- Forge Observation Review panel for local review-bundle inspection and decision drafting.
- Local-only review bundle export command.
- Explicit prohibition on publication actions inside the review workflow.
- Regression coverage for canonical immutability, payload retention, review decision validation, Forge isolation, and export behavior.

## Operating Workflow

1. Export a local review bundle from a Mercury durable acceptance state:

   `npm run review:export -- <acceptance-state.json> <observationId> [outputPath] [asOf]`

2. Load the resulting JSON file into Forge's Observation Review panel.
3. Inspect canonical audit/provenance/storage evidence and any currently lawful payload fields.
4. Draft REVIEWED, HOLD, or REJECTED workflow metadata.
5. Copy/export the decision metadata for the next workflow layer.

FM003 does not persist review decisions and does not publish observations. Durable review-decision persistence and publication orchestration remain separate contracts.

## Exit Criteria

- Review service reads durable observations without mutation.
- Purged licensed payload cannot be reconstructed by review.
- Review decisions are separate metadata.
- Forge cannot produce a PUBLISH decision.
- Forge review panel performs no direct Mercury writes.
- Review bundles are local operator artifacts and excluded from version control.
- Existing Mercury, Atlas, Sentinel, Forge, and Hardware Radar behavior remains operational.


## IC-FORGE-MERCURY-003 — CERTIFIED ✅
Mercury        50/50 PASS
Atlas          15/15 PASS
Sentinel        7/7 PASS
Forge               PASS
Hardware Radar      PASS
Console             CLEAN