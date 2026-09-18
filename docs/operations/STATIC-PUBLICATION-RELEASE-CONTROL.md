# Static publication release control

This runbook describes the repository-owned delivery switch for the certified public RAM current-retail artifact. It does not grant current-market or publication authority and does not authorize deployment.

## Inspect

```text
npm run publication:release:inspect -- --environment=PREVIEW --evaluated-at=<ISO-8601>
```

Omitting `--manifest` inspects `config/publication-release.json`. An absent manifest reports `OFF`. Use `--manifest=<path>` to inspect a review artifact without changing repository configuration.

## Prepare OFF

```text
npm run publication:release:prepare -- --state=OFF --environment=PREVIEW --reviewed-by=<operator> --reason=<reason> --created-at=<ISO-8601> --previous-release-id=<prior-or-omit> --confirmation=CONFIRM-STATIC-RELEASE-OFF --output=<manifest-path>
```

## Prepare ON

Only use an artifact already qualified and publication-authorized by its existing owners.

```text
npm run publication:release:prepare -- --state=ON --environment=PREVIEW --reviewed-by=<operator> --reason=<reason> --created-at=<ISO-8601> --expires-at=<ISO-8601> --authority-reference=<governed-reference> --artifact=<sanitized-json-path> --previous-release-id=<prior-or-omit> --confirmation=CONFIRM-STATIC-RELEASE-ON --output=<manifest-path>
```

The command computes the artifact digest and deterministic identities, copies the artifact under `artifacts/` beside the manifest, and writes no provider, Mercury, publication, Gateway, Beacon, or production state.

Preview and Production require distinct manifests. Preview success is not Production authorization. A future real release must stop after preparation for operator review, then pass the repository's separate Preview and production deployment gates.

## Build behavior

The builder reads `HARDWARE_RADAR_STATIC_RELEASE_MANIFEST` when explicitly supplied, otherwise `config/publication-release.json`. `HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT` defaults to `PREVIEW`. Any failed check produces a valid empty `ram-current-retail.json`; catalog and specification pages remain available.

No browser or public endpoint can change release state. Do not place credentials, raw provider payloads, internal evidence, task or authorization identifiers, rights internals, spend data, recovery data, or operator notes in either artifact.
