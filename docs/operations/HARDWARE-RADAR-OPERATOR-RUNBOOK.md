# Hardware Radar operator runbook

This is the canonical practical guide for operating Hardware Radar from `C:\Projects\hardware-radar\hardware-radar`. The machine-readable command inventory is [`config/operations/operator-command-registry.json`](../../config/operations/operator-command-registry.json). Never place credentials in commands, logs, documentation, or Forge; provider commands load the private `.env` where configured.

## Operating model and authority

Hardware Radar operates as **automated routine operation + governed human review for exceptions + engineering only for new capabilities or systemic defects**.

| Authority | Meaning |
|---|---|
| READ ONLY | Reads canonical state or creates a rebuildable private projection. |
| ZERO-PAID MUTATION | Changes governed state but creates no paid provider task. |
| PAID PROVIDER WORK | May create provider tasks and spend, only inside an explicit authorization envelope. |
| CANONICAL PRODUCT MUTATION | Changes Atlas product/lifecycle knowledge. Not routine. |
| CANONICAL MARKET MUTATION | Changes Mercury Current or History. Requires its own governed workflow. |
| DESTINATION MUTATION | Changes retailer navigation metadata only; grants no market authority. |
| REVIEW EVIDENCE MUTATION | Records an immutable human decision; does not perform the reviewed action. |
| RELEASE/PUBLICATION | Governs public output. It is separate from Current, History, artifacts, and deployment. |
| SCHEDULER/OS MUTATION | Installs, enables, disables, or removes a Windows task. |

Identity discovery is not price acquisition. Destination review is not Current or History authority. Affiliate state never determines market truth, Cheapest, or recommendations.

## System health and Forge

Use Forge as the normal read-only operational surface. Refresh its canonical projection with:

```powershell
$asOf = (Get-Date).ToUniversalTime().ToString("o")
npm run forge:mercury:operations:export -- --as-of=$asOf
```

- **When to use:** before operator review and after governed state changes.
- **Do not use when:** canonical repositories are invalid; fix the owner rather than editing exported JSON.
- **May change:** ignored Forge projection only.
- **Cannot change:** Atlas, Mercury Current/History, destinations, providers, publication, or release.
- **Cost:** free; no network.
- **Replay:** safe.
- **Failure:** stop and inspect the named canonical owner.

## Existing asynchronous task supervision

`HardwareRadar-Mercury-ExistingTaskSupervision` is the normal automated path. It wakes every 15 minutes, uses `IgnoreNew`, checks only existing tasks, and creates no paid or replacement work. Repeated manual `RESUME` polling is not normal operation.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/get-mercury-existing-task-supervision-task.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/install-mercury-existing-task-supervision-task.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/enable-mercury-existing-task-supervision-task.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/disable-mercury-existing-task-supervision-task.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/remove-mercury-existing-task-supervision-task.ps1
```

Install/enable/disable/remove mutate Windows scheduler state. Status is read-only. Disable is the supported emergency stop. Remove only with explicit operational intent. Forge → **Existing-task supervision** shows health, due/pending/review/terminal counts, attempts, and systemic state.

## Amazon destination review

Forge → **Amazon destination review** lists current preparations and safe inspection links. Review one exact product at a time.

Approval:

```powershell
$reviewedAt = (Get-Date).ToUniversalTime().ToString("o")
npm run mercury:amazon-destination:review -- --preparation-id=<PREPARATION_ID> --decision=APPROVE --reviewed-by=<OPERATOR> --reviewed-at=$reviewedAt --approval-attestation=I-ATTEST-EXACT-AMAZON-PRODUCT-PAGE-REVIEW --confirm=RECORD-AMAZON-DESTINATION-REVIEW
```

The attestation means the operator checked: ordinary actionable Amazon page, exact Atlas product/MPN, ASIN agreement, no canonical redirect/tracking contamination, no conflicting variant, and suitability as an ordinary navigation destination.

Rejection:

```powershell
$reviewedAt = (Get-Date).ToUniversalTime().ToString("o")
npm run mercury:amazon-destination:review -- --preparation-id=<PREPARATION_ID> --decision=REJECT --reviewed-by=<OPERATOR> --reviewed-at=$reviewedAt --rejection-reason=<REASON> --confirm=RECORD-AMAZON-DESTINATION-REVIEW
```

Reasons: `WRONG_PRODUCT`, `VARIANT_CONFLICT`, `NON_ACTIONABLE_PAGE`, `REDIRECT_OR_TRACKING_CONCERN`, `PAGE_UNAVAILABLE`, `OTHER_REVIEW_REQUIRED`.

- **Authority:** immutable review evidence only.
- **Replay:** exact replay is safe; conflicting decisions fail.
- **Failure:** stop on stale/conflict; never edit the review state manually.
- **Next normal step:** inspect the durable review. Review does **not** persist.

Persist a separately accepted approval:

```powershell
npm run mercury:amazon-destination:persist -- --review-id=<REVIEW_ID> --executed-by=<OPERATOR> --confirm=PERSIST-APPROVED-AMAZON-DESTINATION
```

- **Authority:** destination mutation only.
- **Cannot change:** price, Current, History, seller, availability, affiliate state, publication, or release.
- **Replay:** safe; returns `ALREADY_BOUND` when equivalent.
- **Failure:** rejection, stale state, or collision means stop. Do not bypass the preparation.

## Paid DataForSEO workflows

Paid work always follows **PREPARE → INSPECT → AUTHORIZE → START**. PREPARE/INSPECT are zero-paid. Authorization creates authority but not spend. START may create spend up to the immutable envelope and UTC-day ceiling.

Identity discovery inspection/start:

```powershell
npm run mercury:identity-discovery:inspect -- --run-id=<RUN_ID>
npm run mercury:identity-discovery:start -- --authorization-id=<AUTHORIZATION_ID> --confirm=START-BOUNDED-IDENTITY-DISCOVERY
```

Repeat observation inspection/start:

```powershell
npm run mercury:repeat-run:inspect -- --run-id=<RUN_ID>
npm run mercury:repeat-run:start -- --authorization-id=<AUTHORIZATION_ID> --confirm=START-BOUNDED-REPEAT-RUN
```

- **Provider:** DataForSEO.
- **Budget owner:** the immutable plan/authorization plus shared UTC-day spend accounting.
- **Maximum cost:** the authorization is a ceiling, never a spending target.
- **START replay:** exact replay is idempotent; never manufacture a successor or retry blindly.
- **Pending results:** automated existing-task supervision is normal. Manual RESUME is exception-only and may continue only exact existing tasks:

```powershell
npm run mercury:identity-discovery:resume -- --run-id=<RUN_ID>
npm run mercury:repeat-run:resume -- --run-id=<RUN_ID>
```

RESUME must create zero new paid tasks. Stop if exact provider-task lineage cannot be recovered.

## Newegg / Rakuten routine input

Inspect readiness only when needed:

```powershell
npm run rakuten:sftp:inspect
```

Acquire authoritative state only under an approved routine run:

```powershell
npm run rakuten:sftp:download:authoritative
```

This uses the private `.env`, pinned host identity, cross-process lease, one session, and sequential downloads. It is free provider acquisition but network-bearing. Do not use TOFU, log credentials, treat a lone DELTA as authoritative, or retry an uncertain transfer blindly. Acquisition does not itself grant Current, History, or publication authority. Forge → **Newegg routine operations** shows the latest governed run.

## History and read-only inspection

```powershell
$asOf = (Get-Date).ToUniversalTime().ToString("o")
npm run history:portfolio -- --as-of=$asOf
```

This is read-only, free, replayable, and grants no Current/public authority.

## Release and preview

Inspect before any release work:

```powershell
npm run publication:release:inspect
```

Prepare release authority only from a certified artifact and the exact arguments required by the command:

```powershell
npm run publication:release:prepare -- <GOVERNED_ARGUMENTS>
```

Build a governed local RAM preview:

```powershell
npm run publication:ram-intelligence:preview -- <GOVERNED_ARGUMENTS>
```

Inspection is read-only. Preparation mutates release authority but is not deployment. Preview is not Production. On any artifact, binding, certification, or environment mismatch, stop rather than weakening validation.

## Retention, pruning, and low-level commands

Retention/pruning execution requires an immutable approved plan and a task-specific prompt/authorization. No general routine pruning command is currently promoted into this runbook. Never delete `RETAIN`, `HOLD_FOR_REVIEW`, `UNKNOWN`, current state, or the immediate predecessor.

Low-level `scripts/*.mjs`, fixture utilities, direct importers, recovery helpers, schema migrations, historical bootstrap internals, and test commands are `ENGINEERING_DIAGNOSTIC` or `TEST_DEVELOPMENT` unless explicitly registered above. Do not infer operator eligibility from the existence of a script.

## Exception handling

1. Stop on stale bindings, collisions, rights failures, unknown provider state, missing task lineage, systemic integrity failures, or release mismatches.
2. Preserve immutable evidence and original run truth.
3. Do not retry paid work or provider acquisition blindly.
4. Use Forge to distinguish member-local review from systemic failure.
5. Escalate engineering only for a new capability or genuine reusable/systemic defect.

## Documentation roles

- `docs/handoff/CURRENT-STATE.md`: reconciled living system state now.
- `docs/handoff/HARDWARE-RADAR-HANDOFF.md`: durable architecture, ownership, and doctrine.
- This runbook: governed operator procedures.
- `config/operations/operator-command-registry.json`: machine-readable canonical command inventory.

Any increment adding, changing, deprecating, superseding, or removing an operator-facing command must update both this runbook and the registry.
