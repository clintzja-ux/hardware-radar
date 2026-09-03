# Hardware Radar Codex operating protocol

This document governs how Hardware Radar uses ChatGPT and Codex as a limited development resource. Repository documentation carries durable context; conversation history does not. The practical principle is:

> Use repository documentation to avoid rediscovery; use ChatGPT for thinking that does not require repository access; use Codex for bounded repository work; review results before spending another run.

## Division of labor

ChatGPT or other conceptual work should normally handle architecture discussion, business rules, governance doctrine, policy design, implementation-contract planning, acceptance criteria, sequencing, failure and threat analysis, Codex prompt construction, and review of Codex results.

Reserve Codex for work that requires repository access: source inspection, implementation, repository-specific dependency tracing, tests, fixture certification, validation, and narrowly scoped repository diagnostics. Design hybrid work substantially before asking Codex to inspect the repository.

## Progressive-disclosure navigation

Start at the [canonical handoff](./handoff/HARDWARE-RADAR-HANDOFF.md), then follow this path:

```text
canonical handoff and repository map
→ CURRENT-STATE
→ relevant contract, ADR/EDR, runbook, or canonical document
→ relevant source and tests
```

Do not begin each task by rediscovering the repository. Broader reconnaissance is appropriate only when a concrete ambiguity cannot be resolved through this navigation path. Do not read obsolete project history merely for orientation.

## Task scoping and prompt efficiency

Prefer narrow, explicitly bounded increments. Each Codex task should state:

- objective and subsystem;
- documents and source boundaries;
- prohibited operations;
- required tests and validation;
- expected report;
- handoff requirements.

Do not combine unrelated exploration, implementation, certification, and production operations merely because they concern the same subsystem. Prompts should reference repository-owned canonical documents for established context and repeat only the current objective, new approved decisions not yet documented, safety constraints, validation, and reporting requirements.

## Implementation, certification, and review

Implementation runs may be substantial when necessary. Certification should focus on the invariants introduced by the increment and should not repeat broad reconnaissance automatically.

Run focused tests first. If implementation already passed full validation and certification changes no source or tests, do not automatically repeat the full suite unless repository policy requires it. If certification changes source or tests or exposes a relevant defect, run the required full validation.

After a meaningful Codex result, stop and return the report for operator/ChatGPT review before launching another substantial run. Do not automatically chain investigation, implementation, certification, and the next increment when review can determine whether another Codex run is necessary.

## Reproducible checkout and release validation

Use the committed `package-lock.json` and `npm ci` for a fresh checkout. Repository text is checked out with LF on every supported operating system regardless of a contributor's global `core.autocrlf`. Two legacy Atlas anchors retain explicit CRLF checkout because accepted tests certify their raw-byte digests; new byte contracts must declare any such representation explicitly. Other text-based integrity checks should normalize only CRLF/LF representation before hashing, leaving structure, ordering, whitespace, and values protected. Text-semantic readers, including the editorial Markdown parser, must likewise treat LF and CRLF input as equivalent without weakening malformed-input validation.

Before a release or protected-branch promotion, validate both the reviewed working tree and a fresh checkout of the exact candidate commit:

```text
npm ci
npm run build:public
npm test
npm run verify:public
git diff --check
```

Reconcile generated artifacts after validation and restore timestamp-only drift. A successful local working-tree run does not substitute for the clean-checkout run.

## Weekly capacity governance

Treat weekly Codex capacity as a governed development resource. These bands guide development workflow; they are not application or business policy.

| Remaining capacity | Operating guidance |
|---|---|
| 100–70% | Major planned implementation increments are acceptable. |
| 70–40% | Normal implementation, with increasingly narrow scope. |
| 40–20% | Prioritize high-value implementation and required certification. |
| 20–10% | Preserve capacity primarily for blockers, defects, required certification, and critical inspection. |
| Below 10% | Avoid discretionary Codex work; move architecture, product, policy, planning, and prompt design to ChatGPT. |

Maintain a practical reserve rather than intentionally consuming the allocation to zero.

Before substantial Codex work, maintain a prioritized implementation queue:

- **P0:** current blocker or incomplete critical increment;
- **P1:** next required implementation;
- **P2:** required certification or integration;
- **P3:** lower-priority improvement;
- **Reserve:** unexpected defect or blocker.

New ideas should normally enter the queue instead of consuming capacity immediately.

## Read-only inspection and production safety

For state questions, prefer narrowly scoped read-only diagnostics. Do not run full tests, builds, or broad source inspection unless the question or repository policy requires them. Inspection must not mutate production state merely to discover it.

Implementation or certification authority never implies authority for production acquisition, paid operations, PREPARE or EXECUTE, canonical admission, review approval, publication, DNS or Cloudflare mutation, email sending, or another consequential external operation. Production operations require explicit, operation-specific authorization.

Where relevant, report provider/network operations, paid tasks, actual spend, and protected-state impact.

## Handoff and documentation hygiene

`CURRENT-STATE.md` is a reconciled current snapshot, not an append-only log. Replace superseded state, consolidate redundancy, preserve current blockers and protected-state facts, retain the next safe action, and remove obsolete orientation when appropriate. Periodically compact it when it becomes unnecessarily verbose.

The stable handoff owns durable architecture and repository orientation. Update it only when subsystem ownership, durable architecture, canonical repository orientation, or an enduring governance or operational boundary changes. Historical implementation detail belongs in contracts, ADRs/EDRs, Git history, commit messages, or dedicated evidence records.

Maintain one clear canonical entry path into major documentation. Do not create competing indexes or duplicate this complete protocol into handoffs, contracts, or prompts.

## Git ownership

Codex does not commit or push unless the operator explicitly changes this policy. The operator reviews repository changes and performs Git commit and push manually.
