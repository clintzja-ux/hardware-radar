# ADR-017 — Publication Is Explicit Governed Workflow State

**Status:** Accepted
**Subsystem:** Mercury / Forge
**Related Contract:** IC-FORGE-MERCURY-005

**Implementation evidence:** The append-only review/publication repositories, explicit `PUBLISH`/`WITHDRAW` workflow, controlled publication operator boundary, E2S composition, and fail-closed public snapshot are implemented and fixture-certified.

## Context

Mercury v1.0 can determine whether market evidence is intrinsically eligible for publication. FM003 and FM004 introduced operator review and durable append-only review history. Prior to FM005, the public build could still render directly from evidence eligibility without requiring an explicit durable publication authorization.

Evidence validity, review, publication authorization, and public rendering are distinct responsibilities. Allowing any earlier stage to imply a later stage would collapse governance boundaries and weaken auditability.

## Decision

Publication is an explicit, append-only workflow state.

A canonical observation may contribute to a public market snapshot only when all of the following are true at snapshot generation time:

1. the canonical observation payload remains available;
2. Mercury evidence eligibility passes;
3. source-specific publication policy permits the source;
4. the effective durable review decision is `REVIEWED`;
5. an explicit durable `PUBLISH` decision exists and references that effective review decision; and
6. no later `WITHDRAW` decision supersedes that authorization.

Publication decisions use the identity family `mer_pub_NNNNNNNNN` and never modify the canonical observation or review history.

The effective publication state is derived from append-only publication history. Withdrawal does not delete prior publication history.

## Consequences

- `REVIEWED` does not mean `PUBLISHED`.
- Evidence eligibility does not mean publication authorization.
- Public artifacts consume only governed published observations.
- Publication history remains auditable after withdrawal.
- Expired, purged, stale, low-confidence, rejected, held, test-fixture, or source-unauthorized evidence automatically stops contributing to future snapshots even if an earlier `PUBLISH` decision remains in history.
- Internal review/publication repository records are not exposed in the public market snapshot.

## Governing Principle

> Market evidence eligibility, operator review, publication authorization, and public rendering are distinct stages. No earlier stage implicitly grants authority to a later one.

## Promoted to Accepted
promoted ADR-017 to ACCEPTED.
