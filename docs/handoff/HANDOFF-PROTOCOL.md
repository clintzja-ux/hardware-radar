# Hardware Radar handoff protocol

The repository—not conversation history—is Hardware Radar's continuity mechanism.

> Previous ChatGPT/Codex conversation history is useful context but is not canonical project state.

## Document roles

- [HARDWARE-RADAR-HANDOFF.md](./HARDWARE-RADAR-HANDOFF.md) contains relatively stable product, architecture, technology, repository, governance, and engineering orientation.
- [CURRENT-STATE.md](./CURRENT-STATE.md) contains the living Git, implementation, readiness, external-state, test-baseline, blocker, and next-action snapshot.
- This protocol defines when and how they are maintained.

These documents navigate to canonical detail; they do not duplicate or supersede it.

## Updating `CURRENT-STATE.md`

Update it before completing a meaningful increment that changes any of the following:

- subsystem implementation or configuration state;
- readiness, deployment, provider onboarding, or production connection;
- governed evidence, review decisions, operator approvals, or authorization lifecycle;
- production transport, storage, monitoring, notifications, browser wiring, or acquisition authority;
- test-file counts or verified validation baseline;
- active increment, material blockers, recent commits, or the next safe action.

Do not update it for formatting-only work, comments, or refactors that leave the operational picture unchanged. Always derive updates from current Git/source/test/policy/diagnostic evidence, never from memory.

## Updating `HARDWARE-RADAR-HANDOFF.md`

Update the stable handoff only when a relatively durable fact changes: product direction, subsystem ownership, technology stack, repository organization, governance convention, validation model, deployment architecture, or long-term roadmap. Do not rewrite it after every DF increment.

## Handoff-before-context-switch rule

Before declaring a meaningful implementation increment complete:

1. Inspect Git status and HEAD.
2. Compare the actual result with `CURRENT-STATE.md`.
3. Update current state if implementation, governance, evidence, readiness, external state, tests, blockers, or next action materially changed.
4. Update the stable handoff only if a stable fact changed.
5. Validate the documentation and include this exact block in the final report:

```text
Handoff reviewed: YES
CURRENT-STATE updated: YES/NO
Stable handoff updated: YES/NO
Reason: <concise evidence-based reason>
```

An increment is not complete when its material state change is absent from the living handoff.

## New-session bootstrap

A fresh AI engineering session should:

1. Inspect `git branch --show-current`, `git rev-parse HEAD`, and `git status --short`.
2. Read `docs/handoff/HARDWARE-RADAR-HANDOFF.md`.
3. Read `docs/handoff/CURRENT-STATE.md`.
4. Read the implementation contract for the active or requested increment.
5. Read relevant ADRs/EDRs and operational runbooks.
6. Inspect the relevant source, policies, persistence boundaries, scripts, and tests.
7. Run safe read-only diagnostics where current operational state matters.
8. Reconcile any mismatch before editing or performing an operation.

The handoff is a starting map, not permission to skip inspection.

## Conflict and authority rule

When handoff text conflicts with an artifact, authority is resolved from the actual subject owner:

1. current Git and operational state establish what files/state exist now;
2. source and tests establish implemented behavior;
3. versioned policy establishes governed policy;
4. ADR/EDR establishes architectural rationale and ownership;
5. implementation contract establishes increment scope and certification intent;
6. the handoff summarizes those sources.

Use the more authoritative underlying artifact, stop if the conflict is safety-relevant, and correct the handoff in the same increment. Never modify source or policy merely to make it match stale handoff prose.

## Safety and maintenance rules

- Never store credentials, tokens, account IDs, private addresses, raw provider payloads, or other secrets in handoff files.
- Represent private governed state through status, digest/evidence reference, or opaque ID only when necessary.
- Preserve the distinction between implemented, tested, selected, configured, approved, prepared, deployed, connected, and enabled.
- Do not claim a provider resource exists without repository evidence or an explicitly authorized provider observation.
- Do not run provider operations merely to refresh a handoff. Record `NOT_VERIFIED_THIS_SESSION` when observation is not authorized.
- Keep the handoff concise and link to canonical contracts, ADRs, policies, tests, and runbooks rather than reproducing them.
- Update `Last updated`, branch, HEAD, working-tree description, active increment, previous increment, test baseline, blockers, and next action together when applicable.
- Include handoff changes with the meaningful increment they describe unless the handoff correction is a separate documentation-only change.

