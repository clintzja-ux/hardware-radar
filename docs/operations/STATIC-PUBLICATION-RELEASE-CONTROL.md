# Static publication release control

This runbook describes the repository-owned delivery switch for the certified public RAM current-retail artifact. It does not grant current-market or publication authority and does not authorize deployment.

## Inspect

```text
npm run publication:release:inspect -- --environment=PREVIEW --evaluated-at=<ISO-8601>
```

Omitting `--manifest` inspects `config/publication-release.json`. An absent manifest reports `OFF`. Use `--manifest=<path>` to inspect a review artifact without changing repository configuration.

For current-display artifacts, `--authority-reference` must identify a persisted, verifiable `CURRENT_DISPLAY_PUBLICATION_AUTHORIZATION`; a free-form lookalike is rejected. Existing unrelated certified authority types remain supported. Publication authorization does not itself enable release.

Before current-display release preparation, materialize and inspect the separately persisted artifact:

```text
npm run publication:current-display:artifact:build -- --authorization-id=<id> --built-by=<operator>
npm run publication:current-display:artifact:inspect -- --artifact-id=<mer_displaypubart_*>
```

Build is single-use with deterministic exact replay. It creates no release state and does not extend the authorization expiry.

## Prepare OFF

```text
npm run publication:release:prepare -- --state=OFF --environment=PREVIEW --reviewed-by=<operator> --reason=<reason> --created-at=<ISO-8601> --previous-release-id=<prior-or-omit> --confirmation=CONFIRM-STATIC-RELEASE-OFF --output=<manifest-path>
```

## Prepare ON

Only use an artifact already qualified and publication-authorized by its existing owners.

```text
npm run publication:release:prepare -- --state=ON --environment=PREVIEW --reviewed-by=<operator> --reason=<reason> --created-at=<ISO-8601> --expires-at=<ISO-8601> --authority-reference=<mer_displaypubauth_*> --artifact-id=<mer_displaypubart_*> --previous-release-id=<prior-or-omit> --confirmation=CONFIRM-STATIC-RELEASE-ON --output=<manifest-path>
```

For current-display authority, the command resolves and verifies the persisted artifact rather than trusting a free-form path. Unrelated legacy certified artifact types retain their existing `--artifact=<sanitized-json-path>` compatibility. The command copies the verified projection under `artifacts/` beside the manifest and writes no provider, Mercury market, Gateway, Beacon, or deployment state.

Preview and Production require distinct manifests. Preview success is not Production authorization. A future real release must stop after preparation for operator review, then pass the repository's separate Preview and production deployment gates.

## Build behavior

The builder reads `HARDWARE_RADAR_STATIC_RELEASE_MANIFEST` when explicitly supplied, otherwise `config/publication-release.json`. `HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT` defaults to `PREVIEW`. Any failed check produces a valid empty `ram-current-retail.json`; catalog and specification pages remain available.

No browser or public endpoint can change release state. Do not place credentials, raw provider payloads, internal evidence, task or authorization identifiers, rights internals, spend data, recovery data, or operator notes in either artifact.
