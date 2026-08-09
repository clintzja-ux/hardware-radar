# Mercury Legacy Archive

This directory contains pre-M001 Mercury artifacts retained solely for engineering history and migration reference.

Contents beneath `legacy/` are **non-canonical**.

They must not:

- appear in `mercury-manifest.json`;
- be loaded by `ObservationRepository`;
- be published to Hardware Radar;
- be used as canonical ID or schema examples;
- be treated as supported write targets by Forge.

Canonical Mercury observations use `mer_obs_NNNNNNNNN` identifiers and `schemas/observation.schema.json`.
