# Session 017 — Repository Modernization

## Outcome

Implemented IC-PLATFORM-001 and established the platform-oriented source layout.

## Structural result

```text
hardware-radar/
├── apps/
│   └── forge/
├── packages/
│   ├── atlas/
│   ├── mercury/
│   └── sentinel/
├── public/
├── docs/
├── scripts/
└── package.json
```

The public directory remains the deployment root. Atlas, Mercury, and Forge
runtime files are generated from canonical package/application sources.

## Deferred

The public website remains directly authored under `public/` because the
current project has no bundling or deployment pipeline for an `apps/web`
source tree. Moving it is intentionally deferred to a future application build
contract rather than being mixed into this structural migration.
