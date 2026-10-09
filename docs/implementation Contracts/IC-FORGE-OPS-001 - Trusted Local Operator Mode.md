# IC-FORGE-OPS-001 — Trusted Local Operator Mode

## Status

Implemented and fixture-certified. Human operator acceptance remains required before checkpoint.

## Decision

The repository-root `Launch Hardware Radar Forge.cmd` launcher is the normal entry point for bounded local Forge administration. It starts or reuses the loopback-only runtime and opens the default browser. Routine operators do not supply Git commands, PowerShell commands, environment variables, URLs, or authentication tokens.

## Security boundary

- The runtime binds only to `127.0.0.1`.
- A trusted session is established once, within a bounded startup window, only by a direct top-level browser navigation carrying the expected Fetch Metadata values.
- Cross-site navigation cannot establish a trusted session.
- The session identifier is an HttpOnly, SameSite=Strict cookie and never appears in a URL, log, screenshot, or browser history.
- Mutation requests require the authenticated session, same-origin context, CSRF value, named operator, explicit action confirmation, and unique request identity.
- Service/repository validation, audit, stale-state rejection, collision detection, locking/serialization, backup, and atomic replacement remain authoritative.

## Git relationship

A clean synchronized branch is not a routine operator prerequisite. Forge may leave canonical operator changes uncommitted for later engineering review. Forge has no authority to commit, push, merge, publish, release, deploy, or call providers.

## Supported scope

The existing trusted service retains its bounded scope: evidence-backed manufacturer registration, DRAFT product creation, permitted product edits, governed retailer destinations, bounded link verification, and governed Newegg affiliate add/replace/disable/history. This contract creates no new canonical owner and grants no Current, History, Cheapest, recommendation, publication, release, or deployment authority.

## Failure behavior

Startup and authentication failures are shown explicitly. Domain or persistence failures retain the operator's form state and report the specific fail-closed reason. Read-only preview and manual projection import remain diagnostics/recovery surfaces, not the normal trusted workflow.
