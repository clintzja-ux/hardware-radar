# IC-DATAFORSEO-004E2L.1 — Refresh Authorization & Single-Use Execution

**Status:** Implemented  
**Increment:** DF004-E2L.1

## Authorization boundary

Historical-refresh LIVE authorization is created only from a persisted E2L refresh plan in `PENDING_OPERATOR_REVIEW`. The immutable authorization binding includes the refresh-plan digest and ID, Atlas product, VERIFIED product decision, REGISTERED merchant decision, canonical retailer, stable provider identity, prior observation/evidence/SELLERS task, exact `SELLERS` operation, and spend policy.

The request uses the existing 15-minute authorization lifetime and the refresh-specific confirmation `SPEND-REFRESH-0.001`. It permits exactly one paid task, at most `$0.001`, zero automatic retries, and remains subject to the unchanged `$0.01` daily ceiling. PREPARE loads the durable execution ledger and binds the spend already recorded for that UTC day into the controlled plan. Missing, expired, malformed, substituted, or mismatched state fails closed.

## Single-use execution and audit

Execution reuses Mercury's `SingleUseAuthorizedLiveAcquisitionExecutor`, authorization-consumption repository, `ControlledAcquisitionExecutor`, acquisition-execution ledger, and DataForSEO task ledger. Authorization is consumed before transport execution; replay cannot create a second task. A refresh cycle ID is included only in the local task-ledger request key, allowing a genuinely new governed SELLERS cycle while preventing duplicate creation within that cycle. Provider request fields remain the stable product identity plus locale.

The execution command can create only the authorized SELLERS task. It does not retrieve results, retain evidence, project identity, assess promotion, admit history, or publish. Any later result proceeds independently through DF003, E2G/E2H, E2J, and E2K.

## Operational commands

- `npm run acquisition:history-refresh:live:prepare` is local, writes the pending authorization request, performs no provider call, and spends `$0.000`.
- `npm run acquisition:history-refresh:live:execute -- --authorization-id=<ID> --confirm=SPEND-REFRESH-0.001` is the explicit one-shot LIVE boundary.

No unattended LIVE authority, retry authority, result retrieval, historical admission, canonical promotion, or publication authority is introduced.
