# Hardware Radar Forge Operator Experience Vision

**Status:** VISION / DIRECTION — NOT A CURRENT IMPLEMENTATION CONTRACT
**Scope:** Durable product and UX direction for Hardware Radar's internal operator experience
**Current implementation authority:** Existing source, policies, contracts, ADRs, tests, and operator commands

## Purpose

Forge should mature into Hardware Radar's governed internal operator experience. It should help authorized humans understand operations, focus on work that needs judgment, perform already-defined governed actions, and inspect their effects and audit history.

The mature operating model is:

> **Automated routine operation + governed human review for exceptions + engineering only for new capabilities or genuine systemic defects.**

The long-term goal is that **Hardware Radar runs Hardware Radar**. ChatGPT and Codex are development tools for architecture, new capabilities, policy design, implementation, audits, major changes, genuine systemic defects, and exceptional incident investigation. They must not be required for day-to-day operation or an already-defined review.

This document describes direction, not a final screen layout, framework, navigation vocabulary, implementation schedule, or authorization to redesign Forge.

## Ownership and action boundary

Forge is an operator projection, review, workflow, and governed-action surface. It is not a second source of truth.

- **Atlas** owns canonical hardware, product, brand, category, and retailer knowledge.
- **Mercury** owns market sources, acquisition, evidence, identity state, observations, history, rights, and market-operational state.
- **Sentinel** owns deterministic validation and safety rules.
- **Beacon** owns durable product and operational analytics where implemented.
- **Forge** presents governed state and invokes permitted workflows owned by those systems.

The mature action model is:

```text
canonical state
→ Forge projection
→ governed action eligibility
→ explicit operator action
→ canonical owner command
→ append-only or otherwise governed state change
→ updated projection
```

Forge must invoke canonical owners. It must not directly rewrite Atlas or Mercury truth merely because it is an administration application.

## Manual review doctrine

Manual review is an intentional mature capability, not a failure of automation:

> **Automate high-confidence routine cases. Route credible exceptions to governed human review. Leave unsupported cases unresolved.**

Before review, Hardware Radar should perform the mechanical work:

```text
acquire evidence
→ normalize
→ preserve provenance
→ classify
→ attempt governed automatic resolution
→ explain why automation stopped
→ assemble review evidence
→ route the exception
```

The operator then makes a bounded judgment over prepared evidence. An established review should not require ChatGPT, Codex, database inspection, ledger reconstruction, source changes, or developer assistance. `KNOWN_UNRESOLVED` is preferable to `FALSELY_RESOLVED`.

### H052 as the current model

H052 demonstrates the intended narrow philosophy:

```text
evidence first
→ automated assessment
→ explicit review eligibility
→ bounded human decision
→ append-only audit record
→ narrow effect
→ separate downstream governance
```

H052 is an architectural example, not a universal template. Review eligibility must come from its canonical governed owner; Forge must never invent it.

## Current certification-stage evidence

### Current

The current Forge surface proves useful foundations:

- Atlas and product authoring;
- existing Mercury operational and review surfaces;
- a certified Mercury read-only projection;
- P1-B cohort operations visibility;
- routine, pending, expected exception, reviewable, safely unresolved, and systemic distinctions;
- spend and safety visibility;
- explicit downstream-authority isolation.

The operator has confirmed that the HTTP-served generated Forge surface loads the explicitly selected schema-1.1 artifact and makes P1-B understandable. The present long page and compact cohort cards are certification-grade and technically useful. They are acceptable at current scale, but their success does not make continuous panel accumulation the mature UX strategy.

Current certification uses an explicit local artifact-import boundary. Private `.forge-review` operational state is not automatically published into public assets. This is an intentional safety boundary today, not a permanent deployment decision. Any future transport must preserve private-state safety through separately governed architecture.

## Core mature UX principle

> **Normal operation should be compact. Exceptional work should receive attention.**

Forge should progressively move from showing everything equally toward summarizing healthy routine work and foregrounding operator-relevant exceptions.

An operator should increasingly be able to answer:

1. Is Hardware Radar healthy?
2. What is running?
3. What completed?
4. What is pending normally?
5. What requires my judgment, and why?
6. What am I permitted to do?
7. What may safely remain unresolved?
8. Is anything systemically broken?
9. What changed since my last review?

## Conceptual workspaces

These are conceptual information areas, not mandated navigation labels or layouts. Actual UX should evolve from measured operator use.

### Overview

Answers: **What needs my attention?**

Potential content includes active cohorts, normal pending work, review backlog, systemic alerts, spend status, provider/source health, important operational changes, and relevant validation or release health.

### Atlas

Answers: **What hardware knowledge are we managing?**

This includes product and catalog authoring, validation, lifecycle, and hardware-domain workflows while Atlas remains canonical owner.

### Mercury Operations

Answers: **What market and acquisition workflows are running, and what happened?**

Potential content includes cohorts, acquisition runs, readiness, bounded progression, pending work, spend, recovery, source operations, evidence/history state, and operational exceptions.

### Reviews

Answers: **What governed human judgments are waiting?**

Potential classes include identity, H052, destination, offer comparability, publication, recommendation, and future policy-defined exceptions. Their policies and owners remain distinct.

### Publication

Answers: **What governed market claims are eligible for public presentation?**

This area may present appropriate current-display, Current Price, and publication state without collapsing their separate authorities.

### System Health

Answers: **Is Hardware Radar operating correctly?**

Potential content includes systemic integrity failures, provider/source health, validation state, storage/performance indicators, operational metrics, and incident conditions derived from their canonical owners.

## Cohort UX direction

Mature cohort presentation should emphasize:

- human-readable purpose;
- operation and source;
- product count;
- completion, pending, and exception counts;
- authorized versus actual spend;
- system health;
- progression and recovery state;
- concise exception summaries.

Normal successful members may be summarized. Exceptions should be easy to drill into. Operators should not need to parse long pipe-delimited strings or raw IDs as the primary presentation. Any compact example remains illustrative rather than a mandatory layout.

## Review UX direction

A mature review surface should prepare the judgment rather than present an unrestricted override form.

For each reviewable item, Forge should make clear:

- **Product:** canonical Atlas identity and useful human context.
- **Why you are seeing this:** why automation stopped and why review is permitted.
- **Evidence:** relevant preserved evidence, provenance, safe references, summaries, and corroboration.
- **Automated assessment:** the governed owner's conclusion.
- **Permitted decisions:** only actions allowed by the applicable review policy.
- **Effect:** exactly what the decision changes.
- **Does not grant:** downstream authorities that remain separate.
- **Audit history:** operator, time, rationale, prior append-only decisions, and effective state.

### Review queues

As scale justifies them, Forge should progressively support grouping by exception type, filtering, sorting, age, source, manufacturer/category where useful, review eligibility, rationale, audit history, and operator assignment when justified.

Batch review actions require explicit policy proving that the same bounded decision is safe across all selected items. Convenience alone is not authority.

### Review scalability

Manual review scales only when it is exceptional, evidence-prepared, bounded, auditable, operator-driven, and non-blocking to unrelated work.

Beacon should eventually help measure automatic-resolution rate, review-eligible rate, backlog and age, completion and outcome distribution, unresolved-without-review-path rate, source/manufacturer/category patterns, repeated exceptions, and appropriate operator review time. A high recurring review rate should prompt investigation into a safe reusable policy or automation improvement—not lower confidence thresholds.

## Systemic attention

Systemic integrity failures must be visibly and behaviorally distinct from expected domain exceptions.

Examples include unauthorized spend, duplicate paid tasks, authority substitution, lineage corruption, immutable-result conflict, repository corruption, and rights-integrity failure.

These states should be loud, clearly classified, actionable, and impossible to confuse with an ordinary product-identity ambiguity or safely unresolved offer. Forge must preserve the canonical failure classification rather than flattening every problem into a generic error.

## Forge, Beacon, and Sentinel

- Forge owns operator workflow and action presentation.
- Beacon owns durable analytics, trends, health metrics, and operational intelligence. Forge may display Beacon-derived metrics but does not persist them; Beacon does not become the review application.
- Sentinel owns deterministic validation and rules. Forge may present Sentinel results but must not silently bypass them to complete an action.

## Progressive UX maturity

These ranges are scale-oriented expectations, not rigid release dates.

### 25 → 100

Focus on certification-grade cohort visibility, prepared exception visibility, clear routine/pending/review/unresolved/systemic semantics, P1-A/P1-B operational support, and measurement of real operator needs. Avoid speculative redesign.

### 100 → 1,000

Expect increasing need for clearer workspace/navigation structure, proper cohort views, filters and sorting, governed review actions, exception queues, backlog aging, operator notifications, reduced raw-ID/CLI dependence, richer recovery visibility, and persistent operational metrics where justified.

### 1,000 → 10,000+

Expect exception-driven workflows, cohort management, policy-governed batch actions, provider/source incident workflows, strong audit history, Beacon operational intelligence, routine operation without developer involvement, and engineering reserved for new capabilities and genuine systemic defects.

## Visual and interaction principles

Prefer:

- strong information hierarchy;
- concise normal-state summaries;
- exception-first attention;
- human-readable product context;
- explicit status and authority language;
- visible review eligibility, unresolved state, and systemic severity;
- drill-down instead of displaying all detail simultaneously;
- provenance and evidence available when needed;
- consistent audit context;
- accessible, readable density and responsive layout where appropriate.

Avoid:

- color as the only state indicator;
- unexplained internal IDs as primary labels;
- dense pipe-delimited text as the mature default;
- raw JSON as a requirement for ordinary understanding;
- ambiguous controls;
- hidden consequences;
- silently executed consequential actions.

## Anti-goals

Forge must not become:

- a second Atlas or Mercury;
- a mutable copy of canonical operational state;
- a raw database browser or giant JSON viewer as the primary experience;
- an unrestricted override console;
- a bypass around rights, Sentinel, spend, publication, or recommendation policy;
- an affiliate-driven decision surface;
- a dumping ground for every Beacon metric;
- a system that requires developers for established reviews.

## Public product separation

Forge is an internal operator experience. Public Hardware Radar is the customer-facing product and should remain substantially simpler. Forge contains operational complexity so the public experience can provide trustworthy, comprehensible answers without exposing internal workflows or private state.

## Direction summary

### Current

Certification-grade static Forge, explicit local certified projection import, readable P1-B cohort operations, no automatic private-state transport, and no Forge action authority from P1-B.

### Near-term

Measure operator use, preserve explicit routine/exception/systemic semantics, improve prepared exception visibility when justified, and avoid a speculative wholesale redesign.

### Mature direction

An exception-driven governed operator experience where routine work is automated and compact, authorized humans can complete established evidence-prepared reviews without development tooling, and engineering focuses on new capabilities and genuine systemic defects.

### Authority reminder

This vision grants no implementation, provider, budget, review, publication, deployment, or production authority. Every capability still requires its canonical owner, policy, implementation increment, tests, and explicit operational authorization.
