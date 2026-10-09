# IC-FORGE-TRUSTED-OPERATOR-SELF-SERVICE-P1

## Status

Implemented core / fixture-certified / production activation prohibited. Product draft creation, permitted specification editing, destination creation, and bounded link verification are composed over existing owners. New-manufacturer and affiliate UI completion remain explicit gaps; the runtime must not create a parallel affiliate store.

## Security and authority

The initial runtime binds only `127.0.0.1`. A one-use, high-entropy bootstrap token is delivered in the URL fragment and exchanged for an HttpOnly, SameSite=Strict session cookie plus a CSRF token. Mutation requests require the exact loopback Origin, session, CSRF header, named operator, allow-listed action, unique request ID, and per-action confirmation. Canonical validation, single-writer locking, stale-state checks, atomic replacement, replay conflict detection, and append-only audit remain server-side. The browser never receives filesystem access or credentials.

The runtime grants no Current, History, price, acquisition, publication, release, deployment, or affiliate-precedence authority. Link verification is bounded to certified HTTPS retailer hosts and never retires a destination automatically.

## Ownership

Atlas retains product and brand truth through its existing manifest and record format. `FileAtlasCatalogAdministrationRepository` is a mutation adapter over that source, not a second catalog. Mercury retains destination truth through `ProductionFlatRetailerDestinationRepository`. Affiliate routing remains in the operator workbook; no second affiliate store was introduced. `FileForgeOperatorAuditRepository` records operator actions but is not a domain source of truth.

## Known gaps

- The new-manufacturer service boundary is certified, but the modern Forge form is not yet connected to it.
- Affiliate add/replace/disable remains fail-closed because a safe atomic workbook writer does not yet exist. The trusted runtime returns `FORGE_AFFILIATE_WORKBOOK_WRITER_NOT_CERTIFIED` and preserves the workbook.
- Product activation remains a separate governed lifecycle action and is not exposed by this P1.
- Product projection refresh after a successful write still requires the existing zero-provider export; the runtime does not fabricate browser-side catalog state.

These gaps prevent classification as complete self-service. They must be closed with narrow adapters/UI composition, not a new catalog, destination store, affiliate store, or orchestration framework.
