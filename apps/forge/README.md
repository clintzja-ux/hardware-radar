# Forge Application

Canonical source for the internal Hardware Radar administration application.

`public/forge/` is a generated deployment projection produced by
`npm run build:public`. Forge remains an internal application and is not linked
from the public Hardware Radar experience.

## Mercury certification boundary

Forge v0.2 retains a **legacy Mercury preview** for the existing authoring workflow. This preview is not a canonical Mercury observation and must not be written to `packages/mercury/observations/` or used for publication.

Canonical Mercury ingestion remains owned by the certified Mercury adapter → validation → observation pipeline. FM007 adds a separate certified, read-only operations panel that consumes a Mercury-owned operations projection. It renders existing identity, promotion, history/cadence, review, and publication semantics without making policy or writing state. The legacy authoring preview remains visibly isolated and noncanonical.
