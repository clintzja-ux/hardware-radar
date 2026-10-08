# IC-HARDWARE-RADAR-OPERATOR-COMMAND-REGISTRY-AND-RUNBOOK-P1

Status: implemented and certified

Hardware Radar maintains one machine-readable operator command registry at `config/operations/operator-command-registry.json` and one human operator guide at `docs/operations/HARDWARE-RADAR-OPERATOR-RUNBOOK.md`.

The registry distinguishes routine, exception-review, paid, scheduler, release, inspection, engineering/test, and deprecated surfaces. Operator entries declare authority, mutation scope, provider/network/cost behavior, replay semantics, failure handling, canonical ownership, observability, and exact implementation/documentation references. Credentials and transient run/authorization IDs are prohibited.

The runbook is organized by operational goal. Existing-provider-task supervision is automated; repeated manual RESUME is exception-only. Amazon destination review and persistence remain separate. Paid START operations remain explicitly authorized and bounded. Forge is the normal read-only operator visibility surface.

Deterministic validation checks registry schema, unique IDs, classifications/statuses, inventory counts, referenced package commands and files, inspectable confirmation tokens, credential-like material, replacement references, documentation pointers, and the durable change-governance rule.

Any increment that adds, changes, deprecates, supersedes, or removes an operator-facing command must reconcile both registry and runbook. This documentation boundary creates no new subsystem or operational authority.
