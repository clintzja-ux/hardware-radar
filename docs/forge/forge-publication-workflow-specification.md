# Forge Publication Workflow Specification

**Document ID:** FORGE-WORKFLOW-SPECIFICATION  
**Version:** 0.1  
**Status:** Canonical Draft  
**Owner:** Mirabelle Labs

---

# 1. Purpose

Forge is the orchestration layer of the Mirabelle Labs platform.

Forge never determines technical truth or compliance.

Its responsibility is to coordinate work, approvals, publication, refreshes, and archival based on validated inputs from Atlas, Mercury, and Sentinel.

---

# 2. Platform Responsibility

| System | Responsibility |
|---|---|
| Atlas | Canonical product truth |
| Mercury | Market observations |
| Sentinel | Validation and compliance |
| Forge | Workflow orchestration |
| Hardware Radar | Public presentation |

---

# 3. Publication Lifecycle

```text
DRAFT
   ↓
IN_REVIEW
   ↓
READY
   ↓
SCHEDULED
   ↓
PUBLISHED
   ↓
MONITORING
   ↓
NEEDS_REFRESH
   ↓
UPDATED
   ↓
PUBLISHED
```

Exceptional states:

```text
BLOCKED
HIDDEN
REMOVED
ARCHIVED
```

---

# 4. State Definitions

## DRAFT
Work in progress. May contain incomplete Atlas references or no retailer observations.

## IN_REVIEW
Human review is underway. Sentinel validation may still be incomplete.

## READY
All required Sentinel checks have passed and required approvals exist.

## SCHEDULED
Approved for publication at a specified time.

## PUBLISHED
Visible on Hardware Radar.

## MONITORING
Published while awaiting periodic revalidation.

## NEEDS_REFRESH
Published content requires new Mercury observations or revalidation.

## UPDATED
Refresh completed and awaiting publication.

## BLOCKED
Critical validation or compliance failure.

## HIDDEN
Temporarily removed from public view while retaining workflow history.

## REMOVED
Withdrawn from public publication.

## ARCHIVED
Historic record retained for audit purposes.

---

# 5. Allowed State Transitions

| From | To |
|---|---|
| DRAFT | IN_REVIEW |
| IN_REVIEW | READY |
| READY | SCHEDULED |
| READY | PUBLISHED |
| SCHEDULED | PUBLISHED |
| PUBLISHED | MONITORING |
| MONITORING | NEEDS_REFRESH |
| NEEDS_REFRESH | UPDATED |
| UPDATED | PUBLISHED |
| Any | BLOCKED |
| PUBLISHED | HIDDEN |
| HIDDEN | PUBLISHED |
| HIDDEN | REMOVED |
| REMOVED | ARCHIVED |

Any undefined transition must be rejected.

---

# 6. Publication Gates

Before READY:

- Atlas record valid
- Mercury observation selected
- Sentinel passes
- Required disclosures render correctly
- Editorial review complete

Before PUBLISHED:

- Validation current
- Observation not expired
- Correct affiliate destination
- Current template version
- Required approvals

---

# 7. Approval Roles

| Role | Responsibilities |
|---|---|
| Contributor | Draft creation |
| Reviewer | Editorial review |
| Compliance Reviewer | Compliance approval |
| Publisher | Final publication |
| Administrator | Emergency actions |

No user may bypass Sentinel.

---

# 8. Refresh Workflow

```text
Observation expires
      ↓
NEEDS_REFRESH
      ↓
Retrieve new Mercury observation
      ↓
Sentinel validation
      ↓
UPDATED
      ↓
PUBLISHED
```

Old observations remain immutable.

---

# 9. Emergency Workflow

Emergency triggers include:

- Amazon policy change
- Credential compromise
- Incorrect affiliate links
- Invalid disclosures
- Major data integrity issue

Workflow:

```text
Trigger
   ↓
HIDDEN
   ↓
Investigation
   ↓
Fix
   ↓
Sentinel validation
   ↓
Republish
```

---

# 10. Audit Requirements

Every transition records:

- transition ID
- previous state
- new state
- actor
- timestamp
- Sentinel validation run
- Atlas revision
- Mercury observation IDs
- reason
- approval evidence

Audit history is append-only.

---

# 11. Scheduled Publishing

Forge supports future publication.

Before release:

- rerun freshness checks
- rerun Sentinel
- verify selected observations
- verify disclosures

If validation fails:

Scheduled publication is cancelled and state becomes BLOCKED or NEEDS_REFRESH.

---

# 12. Revalidation Triggers

Automatic revalidation when:

- Atlas changes
- Mercury refreshes
- Sentinel rules change
- Template changes
- Amazon compliance changes
- Credentials rotate

---

# 13. Kill Switch

Forge supports retailer-level suppression.

Example:

Amazon disabled

↓

All Amazon affiliate CTAs hidden

↓

Atlas products remain

↓

Editorial content remains

↓

Mercury history retained

---

# 14. Metrics

Forge should track:

- average review time
- blocked publications
- refresh latency
- stale publications
- validation success rate
- publication frequency

---

# 15. API Contract

Example publication request:

```json
{
  "atlasProductId":"ram_corsair_x",
  "selectedObservation":"obs_12345",
  "template":"ddr5_product",
  "requestedBy":"editor",
  "action":"publish"
}
```

Forge returns:

```json
{
  "decision":"READY",
  "publicationState":"PUBLISHED",
  "validationRun":"val_001"
}
```

---

# 16. UI Requirements

The workflow dashboard should show:

- current state
- Sentinel summary
- Atlas revision
- Mercury observation age
- approvals
- publication history
- pending actions
- refresh countdown

---

# 17. Definition of Done

Forge is complete when:

- all workflow states implemented
- transition rules enforced
- Sentinel integrated
- audit trail immutable
- scheduled publishing operational
- refresh automation operational
- emergency suppression tested

---

# Canonical Summary

Forge orchestrates.

It never owns product truth, retailer observations, or compliance decisions.

Forge publishes only validated content, preserves a complete audit trail, and coordinates the lifecycle of every public page.