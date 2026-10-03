# IC-CERTIFIED-STATIC-PUBLICATION-RELEASE-CONTROL-P1 — Static Publication Release Control

## Status

Implemented, fixture-certified, and end-to-end replacement-lifecycle certified in isolated production-shaped state. Production release remains separately authorized.

## Purpose and ownership

This increment adds the fail-closed delivery boundary between an already-qualified, sanitized Mercury current-retail artifact and the generated static public site. Mercury continues to own current-market qualification and the public projection. Existing publication owners continue to own publication decisions. Sentinel validates the release manifest, artifact integrity, public contract, environment, expiry, and private-field exclusion. The public builder consumes the validated decision.

Release control answers only whether one exact certified artifact may be delivered on one bound static surface. It creates no market fact, qualification, publication, Cheapest, Pick, recommendation, acquisition, affiliate, deployment, or runtime authority.

## Contract

Policy `CERTIFIED-STATIC-PUBLICATION-RELEASE-CONTROL-P1-1.0` uses schema `1.0`, states `OFF` and `ON`, environments `PREVIEW` and `PRODUCTION`, and two explicitly distinct surfaces under the same release owner: legacy `PUBLIC_RAM_CURRENT_RETAIL` and certified `PUBLIC_RAM_INTELLIGENCE_PORTFOLIO`. Existing Current-only manifests retain their exact meaning and do not acquire portfolio authority.

An `ON` manifest binds:

- deterministic release and artifact IDs;
- exact artifact-relative path and canonical SHA-256 digest;
- artifact schema and `PUBLIC-RAM-CURRENT-RETAIL-001-1.0` policy;
- artifact evaluation time and exposure expiry;
- target environment and surface;
- delivery certification state, operator attribution, authority reference, and binding digest;
- reason and optional predecessor release ID.

For `PUBLIC_RAM_INTELLIGENCE_PORTFOLIO`, the same manifest additionally binds the portfolio candidate ID, artifact ID, portfolio binding digest, Sentinel certification ID, portfolio policy/schema, route-set digest, exact bundled-file digest, and Current expiry. The governed input is one immutable JSON bundle containing the already-certified portfolio manifest, certification, and exact bound public projection texts. The release manifest remains delivery authority rather than market truth.

The production builder consumes that exact bundle rather than recomputing "latest" intelligence. It materializes the certified catalog, qualified Current, effective History summaries, chronology, Terminal, and affiliate-resolved destination projection. Product and editorial pages remain deterministic renderings from those projections and committed route/content sources. The excluded September 30 snapshot remains outside the portfolio.

The binding digest covers the complete artifact binding, environment, and surface. The artifact digest canonicalizes only CRLF/LF representation. Filename reuse, later builds, altered content, another environment, and another surface cannot inherit the release.

## Fail-closed behavior

Absent, malformed, unsupported, unknown, expired, environment-mismatched, uncertified, missing, substituted, schema-mismatched, policy-mismatched, stale, or private-field-bearing inputs resolve to `OFF`. `OFF` emits the valid empty current-retail projection and preserves Atlas catalog, specification, destination, editorial, and product routes.

Release validation reuses `validatePublicCurrentRetailProjection` and independently reevaluates each offer's 36-hour public freshness at build time. The 36-hour ceiling remains this public projection's policy, not a universal source cadence. Unknown shipping and fees remain null, and bundle, conditional, destination, qualification, and affiliate semantics remain upstream-owned.

Portfolio validation reuses the existing RAM portfolio validator and requires exact agreement among candidate, artifact, binding digest, certification, route digest, and every bound file. A stale portfolio fails closed as a whole and requires recomposition/recertification; the release owner does not silently rewrite a certified portfolio. Durable History remains canonical, but an expired exact portfolio is not mutated during release.

## Operation and rollback

Replacement authorization immutably binds the exact active predecessor release in the existing `rollback` lineage. The binding carries the predecessor release ID plus its certified artifact and certification summary; it is captured before `config/publication-release.json` is replaced. The canonical continuity resolver uses that binding after replacement, while a manifest with no predecessor uses its own active artifact. Thus A→B resolves A, A→B→C resolves B, and a discarded uncommitted B leaves A as the predecessor of a later C. This is the same lineage used for rollback; the release being prepared never becomes its own predecessor merely by occupying the manifest path.

`npm run publication:release:inspect` is deterministic and read-only. `npm run publication:release:prepare` creates either an `OFF` manifest or an exact `ON` manifest and copies the already-certified sanitized artifact beneath the manifest's `artifacts/` directory. Current-only operation retains its existing arguments. Portfolio operation supplies the certified candidate directory with `--portfolio-directory`; the command resolves its manifest, certification, and bound files into one integrity-protected bundle. It computes IDs and digests; operators do not calculate them manually. Exact confirmations are `CONFIRM-STATIC-RELEASE-OFF` and `CONFIRM-STATIC-RELEASE-ON`.

Preparing a manifest creates no publication decision or deployment. Production exposure still requires existing publication authority, a production-bound manifest, explicit review, commit/push, Preview verification, and separately authorized merge/deployment. Preview binding cannot authorize Production.

Rollback is appendable lineage from a new `OFF` manifest to the prior release ID. It removes market delivery at the next separately authorized build/deployment without deleting or rewriting Atlas, Mercury evidence/history, provider results, publication audit, recovery audit, or Beacon state. Previous-artifact restoration requires a new exact manifest; there is no mutable latest pointer.

## Certification

The focused suite covers missing/malformed manifests, strict shape/version/state, explicit OFF, legacy valid ON, portfolio valid ON, candidate/artifact/binding/certification/route mismatches, artifact/digest/path/schema/policy/environment failures, missing and stale artifacts, private-field injection, deterministic replay, repository restart loading, and rollback lineage. Production-shaped clean-checkout proof materializes the certified portfolio and compares its catalog, Current, Terminal, sitemap, affiliate action, ordinary fallback, History, chronology, and snapshot exclusion with the approved exact preview. Public verification recomputes the selected release result and rejects direct artifact substitution.

No provider call, task retrieval, paid task, real publication candidate, real release manifest, production configuration, Gateway/Beacon connection, deployment, or spend occurred.

Replacement lifecycle certification additionally starts from the committed deployed release, creates an isolated replacement manifest through the same release owner, and leaves that replacement active through build, public verification, the complete Mercury and Sentinel suites, release governance, layout, public-shell, RAM-product, and RAM-Terminal validation. The canonical continuity resolver supplies both the resolved predecessor release binding and projection; tests must not reinterpret whichever manifest currently occupies the mutable configuration path as the predecessor. A production-bound manifest is built and verified with `HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT=PRODUCTION`; the default remains fail-safe `PREVIEW`. Two clean-start repetitions are required before another real replacement release attempt.
