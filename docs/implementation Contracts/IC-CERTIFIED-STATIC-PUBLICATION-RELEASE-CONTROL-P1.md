# IC-CERTIFIED-STATIC-PUBLICATION-RELEASE-CONTROL-P1 — Static Publication Release Control

## Status

Implemented and fixture-certified. Production use is not proven or authorized.

## Purpose and ownership

This increment adds the fail-closed delivery boundary between an already-qualified, sanitized Mercury current-retail artifact and the generated static public site. Mercury continues to own current-market qualification and the public projection. Existing publication owners continue to own publication decisions. Sentinel validates the release manifest, artifact integrity, public contract, environment, expiry, and private-field exclusion. The public builder consumes the validated decision.

Release control answers only whether one exact certified artifact may be delivered on one bound static surface. It creates no market fact, qualification, publication, Cheapest, Pick, recommendation, acquisition, affiliate, deployment, or runtime authority.

## Contract

Policy `CERTIFIED-STATIC-PUBLICATION-RELEASE-CONTROL-P1-1.0` uses schema `1.0`, states `OFF` and `ON`, environments `PREVIEW` and `PRODUCTION`, and surface `PUBLIC_RAM_CURRENT_RETAIL`.

An `ON` manifest binds:

- deterministic release and artifact IDs;
- exact artifact-relative path and canonical SHA-256 digest;
- artifact schema and `PUBLIC-RAM-CURRENT-RETAIL-001-1.0` policy;
- artifact evaluation time and exposure expiry;
- target environment and surface;
- delivery certification state, operator attribution, authority reference, and binding digest;
- reason and optional predecessor release ID.

The binding digest covers the complete artifact binding, environment, and surface. The artifact digest canonicalizes only CRLF/LF representation. Filename reuse, later builds, altered content, another environment, and another surface cannot inherit the release.

## Fail-closed behavior

Absent, malformed, unsupported, unknown, expired, environment-mismatched, uncertified, missing, substituted, schema-mismatched, policy-mismatched, stale, or private-field-bearing inputs resolve to `OFF`. `OFF` emits the valid empty current-retail projection and preserves Atlas catalog, specification, destination, editorial, and product routes.

Release validation reuses `validatePublicCurrentRetailProjection` and independently reevaluates each offer's 36-hour public freshness at build time. The 36-hour ceiling remains this public projection's policy, not a universal source cadence. Unknown shipping and fees remain null, and bundle, conditional, destination, qualification, and affiliate semantics remain upstream-owned.

## Operation and rollback

`npm run publication:release:inspect` is deterministic and read-only. `npm run publication:release:prepare` creates either an `OFF` manifest or an exact `ON` manifest and copies the already-certified sanitized artifact beneath the manifest's `artifacts/` directory. It computes IDs and digests; operators do not calculate them manually. Exact confirmations are `CONFIRM-STATIC-RELEASE-OFF` and `CONFIRM-STATIC-RELEASE-ON`.

Preparing a manifest creates no publication decision or deployment. Production exposure still requires existing publication authority, a production-bound manifest, explicit review, commit/push, Preview verification, and separately authorized merge/deployment. Preview binding cannot authorize Production.

Rollback is appendable lineage from a new `OFF` manifest to the prior release ID. It removes market delivery at the next separately authorized build/deployment without deleting or rewriting Atlas, Mercury evidence/history, provider results, publication audit, recovery audit, or Beacon state. Previous-artifact restoration requires a new exact manifest; there is no mutable latest pointer.

## Certification

The focused suite covers missing/malformed manifests, strict shape/version/state, explicit OFF, valid ON, artifact/digest/path/schema/policy/environment/certification/binding failures, missing and stale artifacts, private-field injection, deterministic replay, repository restart loading, and rollback lineage. Public verification recomputes the release result and rejects direct artifact substitution.

No provider call, task retrieval, paid task, real publication candidate, real release manifest, production configuration, Gateway/Beacon connection, deployment, or spend occurred.
