# ADR-012 — Applications Consume Published Intelligence Artifacts

## Status
Accepted

## Decision
Public applications consume application-facing intelligence artifacts produced from validated platform knowledge and intelligence. Applications do not directly execute canonical platform subsystems and do not independently determine publication eligibility.

The canonical Hardware Radar path is:

Atlas + Mercury + Sentinel → publication service → Forge/publishing workflow → public data artifact → Hardware Radar.

## Rules
- Platform packages own knowledge, intelligence, validation, and publication eligibility.
- Forge orchestrates publishing; it does not redefine canonical intelligence rules.
- Applications render published artifacts and truthful insufficient-data states.
- Unsupported, stale, legacy, or placeholder market values must not be substituted when qualifying intelligence is unavailable.
- Published claims retain canonical evidence identifiers where applicable.
- Mercury and Sentinel implementation internals are not public deployment artifacts.

## Consequences
The public application remains decoupled from platform internals, publication rules have one canonical implementation, evidence remains traceable, and future applications can consume stable artifacts without duplicating Mercury or Sentinel logic.
