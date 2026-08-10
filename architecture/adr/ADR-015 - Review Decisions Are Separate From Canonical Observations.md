# ADR-015 — Review Decisions Are Separate From Canonical Observations

## Status

Accepted candidate — IC-FORGE-MERCURY-003

## Context

Forge requires an operational review workflow for accepted Mercury observations. Canonical Mercury observations are immutable evidence records, while operator review is mutable workflow metadata. Combining both would allow administrative actions to rewrite market truth and would make publication state part of the observation itself.

## Decision

Forge and Mercury shall treat observation review as a separate workflow layer. Review services may inspect durable observation payload and audit envelopes. Review decisions may classify an observation as REVIEWED, HOLD, or REJECTED, but they do not alter the canonical observation and do not authorize publication.

Review bundles must respect source retention boundaries. When a licensed payload has expired or been purged, Forge may inspect the lawful audit envelope but shall not reconstruct or display the expired licensed payload.

## Consequences

- Canonical observations remain immutable.
- Review actions are auditable workflow metadata rather than market data.
- HOLD and REJECTED decisions cannot corrupt historical observations.
- REVIEWED does not mean publishable; publication remains a separate policy decision.
- Source-retention rules remain enforceable during administrative review.
- Forge can evolve independently from Mercury observation storage.
