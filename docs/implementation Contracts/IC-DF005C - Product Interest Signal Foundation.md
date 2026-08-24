# IC-DF005C — Product Interest Signal Foundation

## Status

Implemented as a read-only, analytics-only, zero-spend Beacon foundation.

## Ownership

ADR-020 establishes Beacon as the canonical owner of behavioral and demand intelligence. Product-interest signals therefore belong to Beacon. Mercury may consume a future approved Beacon summary as context, but does not own raw website analytics and cannot use DF005-C to change cadence.

## Signal contract

A signal contains `schemaVersion`, stable `signalId`, valid `atlasProductId`, conservative `signalType`, source, `observedAt`, explicit window start/end, non-negative value, unit, `evidenceKind` (`RAW` or `AGGREGATED`), provenance, and optional metadata. Signals are immutable, replay-safe by unique ID, sorted deterministically, and rejected when malformed, duplicated, privacy-prohibited, or bound to an unknown Atlas product.

Signals are product-centric. User names, email addresses, IP addresses, persistent user IDs, advertising IDs, and fingerprinting fields are prohibited. DF005-C adds no collection instrumentation or third-party analytics service.

## Summary contract

The read-only summary requires explicit `atlasProductId` and `asOf`. It exposes `NO_DATA` or `OBSERVED`, signal count, stable signal-type and source sets, first/latest observed times using parsed instants, separate per-type counts and unit totals, and each original window. It never combines unlike types or windows through implicit weighting. Raw signals remain unchanged.

No popularity/demand/heat/engagement score, rank, HOT/WARM/COLD tier, cadence class, or automatic assignment exists. Summary output carries no acquisition or cadence authority and spends `$0.000`.

## Production boundary

The repository contains public third-party page tags but no governed product-bound Beacon event export or production product-interest dataset. The default command therefore uses an empty signal repository and reports `NO_DATA`; no Corsair interest values are fabricated. Future legitimate ingestion requires a separate privacy-reviewed increment.

Interest may become a future governed cadence-policy input only through a separately designed and approved policy increment. DF005-C does not change E2O, DF005-B policy resolution, the 24-hour production policy, automatic execution, scheduler authority, refresh state, or spend.

Beacon may decorate a DF005-A portfolio copy with an `interest` context containing availability, count, types, latest time, and evidence state. The decorator never mutates Mercury's portfolio and preserves cadence, cycle, next-action, and spend fields unchanged.
