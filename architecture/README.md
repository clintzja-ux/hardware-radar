# Hardware Intelligence Platform Architecture

**Document ID:** HR-ARCH-000  
**Version:** 2.0  
**Status:** Canonical Architecture Index

## Purpose

This directory records the long-lived architectural structure of the Hardware Intelligence Platform. Code may change frequently; subsystem ownership and dependency boundaries change only through deliberate architectural decisions.

Hardware Radar is the first application of the platform, not the platform itself.

## Canonical subsystem map

```text
Atlas          Canonical hardware knowledge
Mercury        Market observations and market intelligence
Sentinel       Deterministic validation and publication eligibility evidence
Forge          Internal administration, authoring, review and publishing workflow
Aurora         AI-assisted reasoning and explanations
Beacon         Analytics and platform measurement
Gateway        External APIs and integrations
Observatory    Hardware-ecosystem change intelligence

Applications
└── Hardware Radar
```

## Current maturity

| Subsystem | Responsibility | Status |
|---|---|---|
| Atlas | What exists? | Certified v1.0 |
| Sentinel | Can it be trusted? | Certified foundation |
| Mercury | What is happening in the market? | v1.0 certification candidate (M008) |
| Forge | Internal administration and publishing workflow | Operational v0.2; canonical Mercury orchestration pending |
| Hardware Radar | Public presentation | Operational; consumes published Mercury market snapshots |
| Aurora | What does it mean? | Planned |
| Beacon | How is the platform performing? | Planned/foundation work |
| Gateway | How do external consumers access it? | Planned |
| Observatory | What changed in the hardware ecosystem? | Planned |

## Architectural rules

1. Every subsystem owns one primary class of responsibility.
2. Atlas is the canonical source of hardware knowledge.
3. Mercury owns time-varying market observations and derived market intelligence.
4. Sentinel validates; it does not mutate canonical data or publish content.
5. Forge orchestrates authoring, review and publication; it does not redefine platform truth.
6. Applications consume published intelligence artifacts rather than platform internals.
7. Historical observations are preserved rather than overwritten.
8. Unknown facts remain unknown; evidence takes precedence over assumption.
9. Major ownership or dependency changes require an Architecture Decision Record.

## Architecture records

Subsystem architecture documents live in this directory. Accepted architectural decisions live under `architecture/adr/`.

The repository structure should reinforce the architecture:

```text
apps/       applications and internal tools
packages/   canonical platform subsystems
public/     deployable Hardware Radar presentation and published artifacts
docs/       engineering, governance and execution records
```

## Long-term principle

The user interface is replaceable. The platform's knowledge, observations, validation contracts, provenance and architectural boundaries are long-lived assets.
