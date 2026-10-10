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

### Product Manager

Generate the canonical read-only Product Manager projection from the repository root:

```powershell
$asOf = (Get-Date).ToUniversalTime().ToString("o")
npm run forge:product-manager:export -- --as-of=$asOf
```

Refresh the certified Mercury projection, then start the read-only local Forge workspace:

```powershell
npm run forge:mercury:operations:export -- --as-of=$asOf
npm run forge:operator:preview
```

Open `http://127.0.0.1:4174/`. Forge loads both ignored certified projections automatically. The Product Manager searches all current Atlas products by brand, MPN, name, or canonical ID and filters by DDR generation, form factor, capacity, lifecycle, and retailer coverage. Product details show complete canonical specifications, Amazon/Newegg destinations and prior versions, operator-supplied Newegg affiliate status and public-action precedence, Current/History availability, and recorded link-health status. Manual JSON import is a fallback under **Settings / Diagnostics**, not the normal workflow.

For authorized local self-service, double-click **`Launch Hardware Radar Forge.cmd`** in the repository folder. The launcher starts the loopback-only trusted runtime when needed and opens `http://127.0.0.1:4174/` in the default browser. No PowerShell, Git command, environment variable, token, or localhost URL needs to be copied. Forge shows **Signed in as operator:<Windows user>** when the authenticated session is ready. If startup or sign-in fails, Forge reports a specific recovery message rather than silently falling back to read-only behavior.

Product Manager reloads canonical Atlas, destination, Current/History, and affiliate-workbook state automatically after successful audited changes. It supports evidence-backed manufacturer registration, DRAFT product creation, and governed correction of supported specifications while a product remains unbound `DRAFT` / `PENDING`. Product ID, manufacturer, and MPN are locked. An eligible DRAFT may also replace the displayed manufacturer evidence URL: Forge appends the new validated source, retains prior evidence in the audit view, and warns that any existing destination requires operator revalidation. **Manage Links** loads human-readable choices from the canonical Atlas retailer registry while retaining canonical retailer IDs internally. Its separate **Retailer URL** and **Affiliate URL** sections let an operator save exact Amazon/Newegg destinations and add, replace, disable, or inspect Newegg affiliate routing through the existing governed workbook owner. Paste an ordinary Newegg URL unchanged: Forge preserves `/p/<product-page-id>` and, when present, the distinct `Item=<item-number>` listing identity; do not remove a legitimate Item parameter manually. Retailers unsupported by that owner show an explicit unavailable state rather than a misleading Save action. **Check saved retailer URL** is a separate audited read: it may report reachable, redirected, blocked/unavailable, broken, or identity review required, and never changes or retires the destination. The bounded checker supports saved retailer URLs, not affiliate-network health verification. A URL alone does not establish exact product identity. Product activation remains unavailable because no generic canonical activation owner is established. Manual projection import remains a diagnostics fallback. Browser JavaScript never writes canonical files directly; the trusted server invokes existing Atlas and Mercury owners.

Routine Forge operation does not require a clean synchronized Git branch. Canonical owners still enforce validation, immutable audit, stale-state checks, collision checks, serialization/locking, backups, and atomic writes. Forge never commits, pushes, merges, releases, or deploys. Git and command-line procedures remain engineering/recovery tools, not routine operator prerequisites.

**FORGE-OPS-001 — Trusted local operator mode.** A trusted authenticated Forge session launched through the Hardware Radar local launcher is the normal operator mode for bounded catalog and retailer-link administration. Routine operators use Forge controls; terminal and Git workflows are reserved for engineering and recovery. Browser sessions remain loopback-only, same-origin, HttpOnly-cookie authenticated, CSRF protected, operator identified, and auditable. Governance is enforced at the domain and persistence boundaries rather than by requiring a pristine Git checkout.

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

Each review card presents the expected governed ASIN and candidate URL beside current canonical Atlas product specifications. The checklist is local browser state only: completing it does not approve, reject, persist, or create evidence. `REVIEW CHECKLIST COMPLETE` means only that the operator may copy the existing governed review command. Stale or blocked preparations cannot prepare approval handoff. Rejection remains available without completing the approval checklist, using the controlled reasons below. Forge never executes the copied command.

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

Every Rakuten file transfer has a 45-minute absolute ceiling and an independent 60-second no-byte-progress stall timeout. The transport remains limited to one session, one sequential download at a time, and zero automatic retries. A terminal success receipt must show remote EOF, local-write completion, structural validation, deterministic connection cleanup, and lease release. On `SFTP_DOWNLOAD_TIMEOUT`, stop and inspect the retained terminal evidence; do not restart blindly or treat a partial file as authoritative.

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
# Trusted local Forge catalog administration

Set `FORGE_OPERATOR_ID` to the named operator and run `npm run forge:operator`, or use the normal Windows launcher described above. Forge then enables product draft creation, permitted product edits, destination creation, bounded Check Link operations, and governed Newegg affiliate add/replace/disable/history. Every write is validated, confirmed, replay-protected, and audited. The Windows launcher restarts a trusted runtime whose loaded Git revision differs from the current checkout, preventing obsolete in-memory projections from being silently reused. Stop the process to end the runtime session.

This runtime grants no provider, Current, History, publication, release, or deployment authority. Affiliate mutation is limited to the certified Newegg manual-workbook owner; do not create a sidecar affiliate file or infer affiliate support for other retailers.
