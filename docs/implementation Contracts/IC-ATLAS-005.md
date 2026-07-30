IC-ATLAS-005

Title: Atlas Canonical Cleanup & Exit Review

This is the final engineering sprint for Atlas.

Unlike previous sprints, this one is about refinement and certification rather than expansion.

Objectives
Phase 1 — Canonical Audit

Review Atlas end-to-end to ensure there is exactly one canonical path for each repository and validation flow.

Phase 2 — Legacy Cleanup

Remove or consolidate:

Deprecated code
Legacy helper functions
Duplicate validation logic
Obsolete interfaces
Temporary compatibility layers that are no longer needed
Phase 3 — Repository Simplification

Refine the public Atlas API so it's minimal, consistent, and easy for Mercury and future subsystems to consume.

Phase 4 — Exit Review

Validate the original Atlas completion criteria:

Every product references a valid brand.
Every product references a valid category.
Every repository validates successfully.
Every identifier is deterministic.
Manifest integrity is confirmed.
Repository health is clean.
Forge targets a single canonical Atlas implementation.
All automated tests pass.
Phase 5 — Atlas v1.0 Certification

Produce the engineering documentation declaring Atlas complete and ready to serve as the platform's knowledge engine.

IC-ATLAS-005 — Canonical Cleanup & Exit Review

Implemented:

Removed Forge’s legacy Atlas record generation.
Removed the obsolete legacy Atlas template and result field.
Updated Forge to use canonical Atlas brand identifiers.
Replaced Hardware Radar’s parallel hard-coded Atlas file registry with the Atlas.js facade.
Aligned the active homepage Mercury observation with the canonical Atlas product identity.
Marked the Atlas manifest as stable.
Added a canonical-target regression audit.
Added the Atlas v1.0 Exit Review and Session 015 documentation.

The older Mercury observations that reference products outside the current Atlas manifest were deliberately left untouched. Their migration belongs in Mercury, where provenance and historical observation rules can be handled explicitly.