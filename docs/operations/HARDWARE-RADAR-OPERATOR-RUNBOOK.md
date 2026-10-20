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

Forge intentionally shows two different operational views. **Refresh progress** reads live Newegg routine health from durable bootstrap, transport-disposition, and routine receipts; it is read-only and remains usable when no routine is active. Before the sixteen-stage routine starts, it reports the acquisition phase, durable bytes, last byte progress, lease/cleanup state, finalized-FULL status, and any terminal sanitized failure. **Market Health** and **Certified Mercury Operations** are point-in-time certified snapshots. Their displayed as-of, Current-expiry, and History counts do not advance merely because a later routine succeeds. After governed state changes, an operator may run the registered exporter above to materialize a newer ignored snapshot; this does not publish, release, deploy, call a provider, or mutate Current/History.

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

The complete certified routine has one registered command:

```powershell
npm run mercury:newegg-routine -- --mode=INSPECT
npm run mercury:newegg-routine -- --mode=INSPECT --mandate-id=<MANDATE_ID>
npm run mercury:newegg-routine -- --mode=READINESS --mandate-id=<MANDATE_ID>
npm run mercury:newegg-routine -- --mode=CERTIFY_RETAINED
npm run mercury:newegg-routine -- --mode=RUN_LIVE --mandate-id=<MANDATE_ID>
```

`INSPECT` and `READINESS` are strictly read-only and perform no provider call, recovery write, or authority consumption. `READINESS` additionally checks the mandate period/window/daily allowance, independent Current/History scopes, Rakuten credential presence, the dedicated server-side `FORGE_PRIVATE_OPERATIONS_BEARER`, pinned-host state, source rights, measured disk capacity, protected artifact inventory, and the complete production-owner set. The private bearer must contain at least 32 cryptographically random bytes in the existing Git-ignored `.env`; never place it in a command argument, URL, browser state, log, audit record, or checked-in file. Trusted Forge cookie/CSRF authentication remains authoritative for browser access.

The live-lineage adapter durably authorizes an operation before provider access, recovers only an exact atomic transport completion receipt, promotes the validated FULL, and creates independent Current/History children. A finalized artifact without that receipt fails closed and is never automatically reacquired. Storage calculation uses measured retained FULL, catalog, QA, and recomposition evidence plus the approved safety reserve; unknown measurements produce `STORAGE_HOLD`. Current and explicitly linked predecessor catalogs remain protected, legacy unverifiable lineage remains held for review, and no automatic pruning is authorized. `CERTIFY_RETAINED` executes the immutable retained FULL only inside disposable canonical state. A successful `READINESS` result establishes technical readiness only; it does not authorize `RUN_LIVE`.

### Administer bounded Newegg authority in trusted Forge

Launch trusted Forge with **Launch Hardware Radar Forge.cmd**, then open **Market Operations → Newegg operating mandate**. The launcher uses the same private repository `.env` mechanism as the registered Newegg routine; Forge reports Rakuten credential presence only and never exposes their values. The authenticated operator can create, inspect, pause, resume, revoke, or renew the bounded mandate without entering internal IDs, digests, confirmation tokens, or JSON. Creation and renewal always show a separate confirmation dialog before durable authority changes.

The production defaults are source `RAKUTEN_MAIN:44583:4746097`, a maximum 30-day term, Jamaica-local operating window `4:00 PM–11:45 PM`, preferred future scheduler start `4:30 PM`, one new FULL acquisition per local day, zero automatic retries, and independently enabled Current and History scopes. Forge shows expiry, remaining daily allowance, next eligible window, last authorized acquisition, scope state, pause/revocation state, and operator audit history. Renewal atomically retires the prior mandate; Forge will not create a second active mandate.

Mandate administration does **not** start the Newegg routine or scheduler and grants no publication, release, deployment, paid-provider, or automatic-deletion authority. At the latest certified inspection, `HardwareRadar-Newegg-Routine` is **not installed** and is not enabled. Installation and activation remain separate explicit operator-authorized actions.

A confirmed SFTP transfer failure consumes the original daily acquisition authority, records a durable terminal failure, and requires `STOP_AND_REVIEW`; it does not permit an automatic replacement acquisition. If bootstrap state remains only `INTENT_AUTHORIZED` after process interruption, treat it as an uncertain acquisition rather than assuming failure from missing TCP state. Do not rerun `RUN_LIVE`, release locks, or edit authority JSON. Preserve the operation and obtain separate authorization for canonical failure disposition.

### Install the Newegg schedule disabled

The Windows task is always installed disabled. Installation performs no provider call and does not run the routine:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/install-newegg-routine-task.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/get-newegg-routine-task.ps1
```

The inspector treats Windows Task Scheduler's `0x41303` / pre-2000 never-run sentinel as no prior attempt, so a newly installed disabled task reports `lastScheduledAttempt: null` and `lastTaskResult: null` rather than fabricated history.

The installer requires the Windows local timezone to be fixed UTC-05:00 with no daylight-saving transitions. The policy owner remains `America/Jamaica`; the task has a daily 4:30 PM trigger and a same-account `AtLogOn` evaluation trigger. Before 4:30 PM, sign-in evaluation waits for the normal trigger. From 4:30 PM through 11:44 PM it may evaluate the current Jamaica-local day once; at or after 11:45 PM it records a missed-window result. It never creates Monday/Tuesday replacement work when the PC returns Wednesday. Durable scheduler health prevents a second same-day attempt, including after provider failure, while `IgnoreNew`, routine/acquisition locks, and daily authority protect concurrency. An operation validly started in the mandate's 4:00–11:45 PM Jamaica **start-eligibility** window may continue past 11:45 PM or across midnight, subject to the independent eight-hour Windows ceiling. Crossing the window end or parent-mandate expiry does not invalidate its completed acquisition receipt or exact lineage-bound Current/History child work; it never authorizes a second acquisition, unrelated child, retry, catch-up, or renewal. Paused, revoked, tampered, wrong-source, rights-invalid, stale, or conflicting state still fails closed. There is no generic `StartWhenAvailable`, automatic restart, or retry. Shutdown during a run is recovered only through canonical acquisition and stage receipts on a later separately permitted invocation.

The interactive user must be signed in for the task to run. A locked but signed-in session is eligible for the daily trigger while the PC is awake. The `AtLogOn` trigger covers an authenticated sign-in after cold startup; merely unlocking or resuming a sleeping, already-signed-in session is not guaranteed to fire it. The task does not wake the PC, and a sleeping or signed-out PC must not be treated as having completed an evaluation.

An authenticated operator may also use Forge → **Market Operations** → **Run Today's Routine** during the approved acquisition-start window. Forge revalidates the one enabled mandate, daily allowance, source rights, credentials, pinned host, storage, active-run state, and canonical recovery before accepting the request. If an exact incomplete operation exists, Forge disables the fresh action and offers **Resume Existing Routine** instead. The confirmation explicitly states that the action may connect to Rakuten and update independently governed Current and History. Closing or refreshing the browser does not cancel an accepted server-side operation; return to Market Operations and use **Refresh progress** to read canonical stage and terminal state. Never repeat-click after provider failure or uncertain completion—inspect the durable review result and recovery state.

Forge and Windows scheduling share the same command, recurring-authority repository, daily allowance, locks, and receipts. Neither entry point can authorize publication, release, deployment, provider retry, or automatic FULL deletion. A Forge process interruption is recovered from canonical receipts on a later explicitly confirmed **Resume Existing Routine** action; it is never treated as browser success.

Enable only after a separate scheduler-activation authorization:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/enable-newegg-routine-task.ps1
```

Emergency stop and explicit removal are separate controls:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/disable-newegg-routine-task.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/remove-newegg-routine-task.ps1
```

The scheduled wrapper resolves the single enabled production mandate internally; no mandate ID or credential appears in the task definition. Missing, multiple, expired, paused, revoked, out-of-window, daily-consumed, overlapping, unsafe-source, pinned-host, rights, or storage states fail closed. Forge **Market Operations** combines live Windows task inspection with governed scheduler-attempt and routine receipts. `Not installed`, `Disabled`, and `Enabled` are actual task states; a missing attempt receipt is not presented as a successful run.

`RUN_LIVE` has no default and requires an exact durable mandate ID. The bounded authority owner limits mandates to 30 days, the exact Rakuten Newegg main FULL source, one new acquisition per Jamaica-local day inside the approved window, zero retries, pinned host and rights validation, and independently enabled Current and History child scopes. Each market child is single-use/exact-replay-safe and binds one exact canonical plan, preparation, source lineage, predecessor, and applicable rights/eligibility result. Recovery uses canonical receipts without consuming another daily or child authorization. The mandate grants no publication, release, deployment, paid-provider, automatic-deletion, or scheduler authority.

When `READINESS` reports overall `READY`, authority `RECOVERY_READY`, and recovery `RECOVERY_READY`, the registered command has found an exact completed acquisition and incomplete governed routine. `newAcquisitionEligibility` is reported separately and may correctly be `NEW_ACQUISITION_BLOCKED` with `NEWEGG_RECURRING_AUTHORITY_DAILY_LIMIT_REACHED`; that blocks another FULL, not recovery of the existing one. Recovery must report `providerCallsRequired: 0` and `newAcquisitionAuthorityRequired: false`. Do not run a low-level Rakuten download, create another mandate, or manually execute Current/History. After separate operator authorization, rerun the same registered `RUN_LIVE` command with the same mandate ID. It revalidates the finalized FULL, promoted catalog, exact preparations, predecessors, rights, and existing Current/History child authorities before resuming. A conflict stops locally for review. Sanitized progress is emitted for recovery classification, lineage/preparation milestones, and every routine stage; credentials and feed rows are never emitted.

Older valid raw routine-health projections are migrated only when the resumed routine reaches Forge projection. The health repository validates the complete legacy shape and source lineage, preserves a digest-bound backup, atomically writes and re-reads the current envelope, and then permits private transport. `FORGE_HEALTH_FAILURE` identifies projection or persistence failure; `FORGE_TRANSPORT_FAILURE` identifies private delivery failure; neither should be interpreted as Sentinel rejection. A separately authorized recovery of a run already complete through retention must reuse all prior receipts and execute only `FORGE_PROJECTION` and `FORGE_TRANSPORT`.

This implementation does not create a production mandate. Until a separately certified authenticated creation/pause/revoke/renewal procedure creates one and live activation is explicitly approved, `RUN_LIVE` remains fail closed before network access. Never hand-edit the authority file or substitute an environment variable, generic confirmation token, or scheduler trigger. Windows scheduling remains disabled.

Inspect readiness only when needed:

```powershell
npm run rakuten:sftp:inspect
```

Acquire authoritative state only under an approved routine run:

```powershell
npm run rakuten:sftp:download:authoritative
```

This uses the private `.env`, pinned host identity, cross-process lease, one session, and sequential downloads. It is free provider acquisition but network-bearing. Do not use TOFU, log credentials, treat a lone DELTA as authoritative, or retry an uncertain transfer blindly. Acquisition does not itself grant Current, History, or publication authority. Forge → **Newegg routine operations** shows the latest governed run.

Every Rakuten file transfer has a 45-minute absolute ceiling and an independent 60-second no-byte-progress stall timeout; directory-list operations use a 30-second ceiling. The transport remains limited to exactly one authenticated session for a new acquisition, one sequential authoritative download at a time, pinned-host verification with TOFU disabled, and zero automatic retries. A terminal success receipt must show remote EOF, local-write completion, structural validation, deterministic connection cleanup, and lease release. Success, handled failure, and cancellation all close the connection. Canonical acquisition receipts recover completed work after interruption without starting another provider acquisition. On `SFTP_DOWNLOAD_TIMEOUT`, stop and inspect the retained terminal evidence; do not restart blindly or treat a partial file as authoritative.

Routine PREFLIGHT checks disk capacity and retention readiness before network acquisition. Forge Market Operations reports sanitized connection readiness, pinned-host readiness, storage capacity/hold state, and the requirement for retention assessment; it never exposes credentials. Retention is deliberately non-destructive: raw FULL artifacts have a seven-day minimum, the current and immediate predecessor catalog states are protected, diagnostic partials remain `HOLD_FOR_REVIEW`, and QA artifacts remain retained unless a governed plan proves otherwise. Never delete `RETAIN`, `HOLD_FOR_REVIEW`, `UNKNOWN`, current, or immediate-predecessor artifacts. Automatic deletion is OFF. Any future automatic cleanup requires a separately certified authenticated authority, an immutable plan, immediate binding and dependent-run/QA revalidation, durable deletion receipts, and post-delete catalog/hash/replan verification.

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

Governed live-price publication is a separate coordination boundary over the existing certified portfolio, static release, public builder, and verifier:

```powershell
npm run publication:live-price -- --mode=INSPECT
npm run publication:live-price -- --mode=AUTHORIZE --authorized-by=<NAMED_OPERATOR> --confirmation=CONFIRM-GOVERNED-LIVE-PRICE-PUBLICATION
npm run publication:live-price -- --mode=PREPARE --authorization-id=<SINGLE_USE_AUTHORIZATION_ID> --checkout-root=<CLEAN_COMPATIBLE_CHECKOUT>
```

`PREPARE` requires a separately recorded, single-use authorization bound to the exact candidate, artifact, Sentinel certification, production environment, predecessor release, freshness deadline, named operator, and generated-path allowlist. It builds only in the supplied clean compatible checkout, runs the registered public verification chain, rejects every changed path outside the authorization, and returns `READY_FOR_RELEASE_ONLY_CHECKPOINT`. It does not commit, push, merge, deploy, acquire market data, or authorize rollback. Cloudflare Pages continues to deploy only through the established `main` branch Git integration after separate operator approval.
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

For a provider-attempted Newegg acquisition with no finalized FULL, do not delete evidence, retry, or start a replacement acquisition. Open trusted Forge and select **Reviews & Exceptions → Acquisition evidence review**. Forge discovers the preserved operation and displays only the classification supported by canonical evidence; the operator does not enter an operation ID, evidence digest, confirmation token, or classification. Review the plain-language evidence summary, select **Review and record**, and use the modern confirmation dialog. The trusted server revalidates the evidence immediately before recording. `ACQUISITION_FAILED` still requires a durable terminal SFTP/cleanup receipt; otherwise the evidence remains `ACQUISITION_REVIEW_REQUIRED`. The action preserves the original daily allowance consumption and does not itself authorize another attempt. Engineering/API invocation is not a substitute for the trusted Forge confirmation flow.

After a conclusively failed Newegg acquisition, trusted Forge may show **Authorize Another Acquisition Attempt**. Review today's attempts, successful FULL count, predecessor classification, remaining allowance, rights, pinned-host, storage, Current scope, and History scope. Each click requires a new modern confirmation and creates one audited single-use approval; it does not start provider work itself. Attempt two or three must then be started through Forge's ordinary governed Run action and receives a new operation identity. A successful FULL, active attempt, uncertain/review-required predecessor, missing approval, or fourth attempt blocks the action. The Windows scheduler never performs this approval and never retries automatically.

## Documentation roles

- `docs/handoff/CURRENT-STATE.md`: reconciled living system state now.
- `docs/handoff/HARDWARE-RADAR-HANDOFF.md`: durable architecture, ownership, and doctrine.
- This runbook: governed operator procedures.
- `config/operations/operator-command-registry.json`: machine-readable canonical command inventory.

Any increment adding, changing, deprecating, superseding, or removing an operator-facing command must update both this runbook and the registry.

## Unattended live-price publication (production inactive)

The unattended publication coordinator is certified as a production-inactive boundary over the existing Sentinel-certified candidate, governed PREPARE/build/verification owner, release-only allowlist, fast-forward-only Git integration, Cloudflare Pages observation, and live acceptance verifier. Its recurring mandate permits at most one successfully accepted Production release per Jamaica-local day, issues one exact child authority per immutable candidate, and supports pause and revocation. It never grants acquisition, market mutation, source-code deployment, automatic retry, automatic rollback, or provider authority.

There is currently no production mandate, scheduler binding, or approved unattended Git credential. Do not create JSON authority records or invoke internal service methods manually. Activation requires separate operator approval of the named production mandate and a repository-installed GitHub App with Contents write permission only. Its App ID, installation ID, private-key path, repository owner, and repository name belong only in the Git-ignored private `.env`. The registered command loads that file through Node's `--env-file=.env` boundary, creates a short-lived repository-restricted installation token, disables personal credential-helper fallback for remote Git operations, and never persists or prints the token. Cloudflare observation requires an account-scoped Pages Read token in the same private environment. Cloudflare continues to deploy from `main`; a failed deployment or live mismatch stops for operator review and must not trigger another push or rollback.

The private variable names are `HARDWARE_RADAR_PUBLICATION_GITHUB_APP_ID`, `HARDWARE_RADAR_PUBLICATION_GITHUB_APP_INSTALLATION_ID`, `HARDWARE_RADAR_PUBLICATION_GITHUB_APP_PRIVATE_KEY_PATH`, `HARDWARE_RADAR_PUBLICATION_GITHUB_REPOSITORY_OWNER`, `HARDWARE_RADAR_PUBLICATION_GITHUB_REPOSITORY_NAME`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT_NAME`, and `CLOUDFLARE_API_TOKEN`. The private-key path must resolve to the operator-owned GitHub App PEM outside tracked source. Never store PEM contents directly in `.env` or commit the PEM.

Before issuing recurring authority, inspect the canonical Production release. When its candidate, artifact, certification, and binding exactly match the latest certified routine candidate, `RUN` returns `ALREADY_DEPLOYED_CANDIDATE` before child authority, Git, or deployment work. This is a deterministic no-op and does not rewrite the historical single-use publication evidence.

Use `npm run publication:unattended -- --mode=INSPECT` for zero-action status. After separate production authorization, a named operator may create a maximum thirty-day mandate with `--mode=CREATE --operator-id=operator:<name> --valid-from=<ISO> --expires-at=<ISO> --confirmation=CREATE-UNATTENDED-PUBLICATION-MANDATE`. Pause, resume, and revoke use `--mode=PAUSED`, `--mode=ENABLED`, or `--mode=REVOKED`, the mandate ID, named operator, and the matching `<STATUS>-UNATTENDED-PUBLICATION-MANDATE` confirmation. Never edit the mandate JSON directly.

The existing Newegg scheduled command contains the certified post-success binding, but it remains production-inactive by default. Activation requires the checkpointed implementation, a valid publication mandate, ready GitHub/Cloudflare credentials, and a clean production checkout, followed by separate operator approval to set `HARDWARE_RADAR_UNATTENDED_PUBLICATION_POST_SUCCESS_ENABLED=true`, `HARDWARE_RADAR_UNATTENDED_PUBLICATION_MANDATE_ID=<ID>`, and `HARDWARE_RADAR_PUBLICATION_CHECKOUT_ROOT=<clean checkout>`. The binding revalidates durable routine, bootstrap, Sentinel, release-readiness, and publication state; records one durable invocation intent; and invokes only the registered publication command. Never rerun it automatically after failure or an uncertain interruption. Publication failure does not alter or retry the completed acquisition.
# Trusted local Forge catalog administration

Set `FORGE_OPERATOR_ID` to the named operator and run `npm run forge:operator`, or use the normal Windows launcher described above. Forge then enables product draft creation, permitted product edits, destination creation, bounded Check Link operations, and governed Newegg affiliate add/replace/disable/history. Every write is validated, confirmed, replay-protected, and audited. The Windows launcher restarts a trusted runtime whose loaded Git revision differs from the current checkout, preventing obsolete in-memory projections from being silently reused. Stop the process to end the runtime session.

This runtime grants no provider, Current, History, publication, release, or deployment authority. Affiliate mutation is limited to the certified Newegg manual-workbook owner; do not create a sidecar affiliate file or infer affiliate support for other retailers.
# Correcting an eligible DRAFT product identity in Forge

Open **Products**, select the DRAFT, choose **Edit Product**, and then **Correct Product Identity**. Forge displays the existing MPN, asks only for the corrected MPN, reuses the displayed manufacturer evidence URL, derives the canonical product ID internally, and presents one confirmation. The operation succeeds only when Atlas still reports the same revision and Current, History, and retailer destinations contain no dependency on the old ID. A dependency message means nothing changed: resolve the named governed dependency through its existing owner, reload Forge, and retry. Never manually rename an Atlas file or edit IDs in destination/history data.
# Correct a DRAFT product identity with existing links

In trusted Forge, open **Products**, select the `DRAFT` product, choose **Edit Product**, then **Correct Product Identity**. Enter the corrected manufacturer part number, retain or update the manufacturer evidence URL, review the destination reconciliation summary, and confirm once. Forge revalidates Current, History, product revision, identity uniqueness, and destination state before changing anything. On success the corrected product appears immediately under its derived identity and its governed retailer links remain available with preserved audit history.

If Forge reports a market-evidence, release, collision, or unsupported identity dependency, stop and review that named exception. Do not edit Atlas or destination JSON manually and do not remove a destination merely to bypass the check.

# Review and activate an Atlas DRAFT product

In trusted Forge, open **Products**, select a `DRAFT` / `PENDING` product, and choose **Review Readiness**. Forge shows the canonical Atlas checks, any blocking issue, independently governed retailer and market evidence, and exactly what activation does and does not change. A retailer destination is not required merely for an Atlas product to become ACTIVE, and activation never qualifies a destination, Current or History evidence, a recommendation, publication, release, or deployment.

When every Atlas requirement passes, choose **Activate Product** and confirm once. Forge revalidates the current product revision and all readiness requirements under Atlas's existing single-writer protection, changes only that product to `ACTIVE` / `READY`, refreshes Product Manager immediately, and records the operator receipt in activation history. A stale revision, duplicate identity, invalid schema/specification, unregistered manufacturer, missing verified manufacturer evidence, or non-DRAFT predecessor fails closed. If activation is replayed with the same request identity, Forge returns the existing receipt without another product revision or audit record.
