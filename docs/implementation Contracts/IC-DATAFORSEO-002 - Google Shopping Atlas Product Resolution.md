# IC-DATAFORSEO-002 — Google Shopping → Atlas Product Resolution

Status: IMPLEMENTED — verification pending

## Objective
Establish a fail-closed identity boundary between DataForSEO Google Shopping product evidence and canonical Atlas products.

## Scope
- Structured DataForSEO product-evidence extraction.
- Product Info task support for richer identity/specification evidence.
- Deterministic identifier comparison.
- Structured RAM attribute comparison.
- Canonical RAM capacity-invariant enforcement.
- Resolution outcomes: CONFIRMED, PROBABLE, AMBIGUOUS, REJECTED.
- Evidence-preserving resolution decisions.
- Automatic continuation permitted only for CONFIRMED resolutions.

## Non-goals
- Seller-offer normalization into Mercury observations.
- Automatic publication.
- Live paid API calls in tests.
- Generic fuzzy title matching.
- Authorization of DataForSEO Amazon data.

## Invariants
1. External product IDs never become Atlas IDs.
2. Text similarity cannot override conflicting deterministic or structured evidence.
3. Conflicting deterministic identifiers fail closed.
4. RAM capacity must equal module count multiplied by capacity per module whenever all three are known.
5. PROBABLE and AMBIGUOUS resolutions are not automatically Mercury-eligible.
6. Tests use fake transports and fixtures only.


DF002 — CERTIFIED ✅

IC-DATAFORSEO-002 — Google Shopping → Atlas Product Resolution

Verification gate	Result
Mercury	97/97 PASS
Atlas	15/15 PASS
Sentinel	7/7 PASS
Forge	PASS
Hardware Radar	PASS
Browser console	CLEAN