# IC-DATAFORSEO-001 — Acquisition Foundation

## Status
IMPLEMENTED — pending user certification.

## Decision
Hardware Radar may acquire DataForSEO Merchant API Google Shopping evidence through a dedicated, rights-aware, cost-aware asynchronous task boundary. This contract does not authorize DataForSEO Amazon endpoints and does not publish acquired evidence automatically.

## Invariants
- Source identity is `DATAFORSEO_GOOGLE_SHOPPING`.
- Paid task POSTs use normal priority by default; high priority is blocked in DF001.
- A deterministic request key prevents duplicate paid task submission; a file-backed ledger is available for restart-safe protection.
- API task cost is preserved as acquisition metadata.
- Credentials are supplied only through runtime configuration and never embedded in repository data.
- Structured Advanced JSON is the supported retrieval representation.
- Product identity resolution and canonical Mercury observation creation are deferred to DF002/DF003.
- DataForSEO Amazon acquisition remains unknown and therefore fails closed.

DF001 — CERTIFIED ✅

IC-DATAFORSEO-001 — Acquisition Foundation

Verification gate	Result
Mercury	90/90 PASS
Atlas	15/15 PASS
Sentinel	7/7 PASS
Forge	PASS
Hardware Radar pages	PASS
Browser console	CLEAN
