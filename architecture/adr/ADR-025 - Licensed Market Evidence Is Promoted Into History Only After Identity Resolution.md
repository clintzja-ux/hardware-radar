# ADR-025 — Licensed Market Evidence Is Promoted Into History Only After Identity Resolution

**Status:** Accepted — refined by ADR-042 and ADR-044
**Owner:** Mercury

**Implementation evidence:** DF003 durable retention and the certified E2G/E2H promotion assessment implement the fail-closed identity gate. ADR-042 makes promotion assessment explicit, while ADR-044 refines the admission representation by separating immutable historical admission from later canonical-observation promotion. Those later decisions govern wherever this ADR's original use of “canonical history” is ambiguous.

## Context

DataForSEO authorizes Hardware Radar to retain successive Google Shopping observations and derive historical pricing intelligence. Real production evidence may arrive before Hardware Radar has fully resolved either the canonical Atlas product or the canonical merchant identity.

Discarding unresolved evidence would destroy potentially valuable historical observations. Treating unresolved evidence as canonical history would contaminate historical lows, averages, trends, and current-market intelligence with uncertain identity.

## Decision

Mercury maintains a durable licensed market-evidence layer that is separate from canonical historical observations.

Unresolved licensed evidence may be retained when source rights allow retention. It does not participate in historical analytics until both product and merchant identity are resolved and all canonical observation and historical-eligibility checks pass.

Promotion:

1. reads immutable retained evidence;
2. evaluates current Atlas product and merchant resolution;
3. creates a new canonical Mercury observation without mutating the retained evidence;
4. preserves the original observation timestamp;
5. records the later promotion timestamp separately;
6. validates canonical observation structure and source rights;
7. uses an evidence-scoped idempotency key so one source observation enters canonical history at most once.

Missing source condition is normalized to explicit `UNKNOWN`, never guessed as `NEW`.

DataForSEO `base_price` maps to canonical Mercury `offer.price`. Shipping remains separate. Source `tax` and `total_price` remain losslessly preserved in the durable evidence record rather than being rewritten into canonical base price.

## Consequences

- Hardware Radar can retain market evidence today and resolve identity later without losing the original market timestamp.
- Historical intelligence remains clean and identity-safe.
- Affiliate relationships have no role in promotion eligibility.
- Evidence and canonical observations have distinct lifecycles and identities.
- Merchant or product resolution errors fail closed.
- Historical promotion is idempotent.
