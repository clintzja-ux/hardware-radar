# Forge Application

Canonical source for the internal Hardware Radar administration application.

`public/forge/` is a generated deployment projection produced by
`npm run build:public`. Forge remains an internal application and is not linked
from the public Hardware Radar experience.

## Mercury certification boundary

Forge v0.2 retains a **legacy Mercury preview** for the existing authoring workflow. This preview is not a canonical Mercury observation and must not be written to `packages/mercury/observations/` or used for publication.

Canonical Mercury ingestion remains owned by the certified Mercury adapter → validation → observation pipeline. FM007 adds a separate certified, read-only operations panel that consumes a Mercury-owned operations projection. It renders existing identity, promotion, history/cadence, review, and publication semantics without making policy or writing state. The legacy authoring preview remains visibly isolated and noncanonical.

FM008 materializes the local projection at `.forge-review/forge/certified-mercury-operations.json`. Select that file in the certified panel; it is not automatically published or loaded as public price data.

`npm run forge:product-manager:export -- --as-of=<ISO_TIME>` materializes `.forge-review/forge/product-manager.json`. `npm run forge:operator:preview` then opens the loopback-only read-only workspace at `http://127.0.0.1:4174/`; the Product Manager and certified Mercury projections load automatically. Manual JSON selection remains under **Settings / Diagnostics** as a fallback. Static Forge cannot execute privileged changes or network checks; those controls remain disabled with an explanation until a trusted authenticated operator runtime is connected.

The current goal-oriented navigation is **Overview**, **Products**, **Retailer & Affiliate Links**, **Market Operations**, **Reviews & Exceptions**, and **Settings / Diagnostics**. Existing legacy authoring and raw JSON inspection remain available under Diagnostics rather than occupying the routine workflow.
