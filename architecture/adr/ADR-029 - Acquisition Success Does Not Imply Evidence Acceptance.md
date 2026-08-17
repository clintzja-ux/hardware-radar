# ADR-029 — Acquisition Success Does Not Imply Evidence Acceptance

## Status
Accepted.

## Decision
Hardware Radar records provider acquisition outcome separately from DF003 evidence outcome. A paid request may succeed and incur cost even when the returned evidence is malformed, unresolved, review-required, or historically ineligible.

DF004-C may retain valid licensed evidence through DF003, but it must not bypass product identity, merchant identity, historical eligibility, canonical observation, or publication gates.

## Consequences
Execution ledgers preserve actual provider spend independently of downstream evidence disposition. Rejected evidence does not cause a paid retry. Successful acquisition therefore never means that Mercury has accepted a canonical historical observation or that Hardware Radar may publish the offer.
