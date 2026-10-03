# IC-MERCURY-CURRENT-SCHEMA-1.1-CANONICAL-MIGRATION-P1

Status: executed locally on `hardware-radar-growth-1`; release and deployment not authorized.

## Purpose

Migrate the canonical Mercury Current representation from snapshot schema `1.0` to `1.1` without changing market truth, qualification, freshness, destinations, source provenance, public behavior, or downstream authority.

## Governed boundary

The existing `FileCurrentDisplaySnapshotRepository` remains the sole canonical Current owner. `CurrentSchemaMigrationService` prepares an immutable deterministic plan, inspects exact source binding, and uses the repository's atomic compare-and-replace operation. The source snapshot becomes `previous`, providing repository-native rollback without touching History.

The migration fails closed for a changed source snapshot/fingerprint, identity collision, ambiguous seller value, fact mismatch, freshness mismatch, or destination mismatch. Planning an already migrated snapshot returns `ALREADY_MIGRATED`.

## Executed migration

- Plan: `mer_curmigration_9f99c07ad84fa14f17f83e2f`
- Source: schema `1.0`, snapshot `mer_display_d5680a1ec2f164f8f860dcc4`
- Target: schema `1.1`, snapshot `mer_display_18de6e09acecb4ba3c3c3603`
- Offers: 188 → 188
- Offer identities: 188 unique
- Seller attribution: 81 known / 107 unknown
- Collisions, ambiguities, fact mismatches, freshness mismatches, destination mismatches: 0
- Identity digest: `ca607fc68e1caf56ef9b82bf1b2d195296f370b8cd14d9322f0cb08de8ca9b45`

The new snapshot ID is correct because Current snapshot identity binds serialized offer representation. The original market facts remain byte-equivalent after removing only the schema-1.1 projection fields.

## Compatibility and frozen authority

Legacy schema `1.0` remains readable. Existing manual and automated legacy refresh paths preserve schema `1.1` and project their product/channel offer through the compatibility model; they fail closed rather than collapse a future multi-offer target requiring explicit offer identity.

Actual pre/post public Current projections are identical. Terminal Current metrics are identical. History, Atlas, destinations, workbook, public artifacts, affiliate routing, Cheapest, Picks, chronology, structured data, publication, release configuration, and deployment are unchanged. No marketplace acquisition or publication authority is granted.
