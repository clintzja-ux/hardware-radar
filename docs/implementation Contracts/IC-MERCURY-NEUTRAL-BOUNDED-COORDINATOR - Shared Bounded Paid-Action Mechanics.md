# IC-MERCURY-NEUTRAL-BOUNDED-COORDINATOR — Shared bounded paid-action mechanics

## Status

Fixture-certified with repeat-observation parity. Products identity-discovery composition is deliberately not implemented.

## Ownership boundary

`NeutralBoundedPaidActionCoordinator` is a concrete Mercury coordination mechanism, not a workflow language, scheduler, transport, or policy owner. It owns immutable bounded plans, opaque member keys, cohort and authorization digests, task/spend envelopes, authorization expiry, single-use START coordination, shared UTC-day spend revalidation, member progress, waiting/resume, local versus systemic failure handling, and data-driven summaries.

A typed domain adapter owns every semantic decision: member preparation and current-state validation, permitted source/operation, child task authority, provider execution/retrieval, terminal processing, domain failure classification, and domain result counts. The adapter decides its terminal boundary. The coordinator does not understand provider identity, Atlas matching, retailer evidence, retention, H058, Current Price, Cheapest, Picks, or publication.

## Authority and replay

The neutral parent authorization binds the exact plan ID/digest, member-set digest, task count, aggregate maximum spend, per-member ceilings, operator, reason, expiry, zero retries, and single-use START. It grants no historical-fact or downstream authority.

Each adapter-derived child has a durable content-addressed binding over the parent authorization ID/digest, plan ID, opaque member key, immutable domain member ID, source, operation, task ceiling, child authorization ID/digest, zero retries, and expiry. Child expiry cannot exceed parent expiry. Exact derivation is deterministic; changed binding fails closed. Domain-specific authority remains in the child and domain owner.

## Persistence and compatibility

The coordinator depends on a small operation-neutral repository interface with direct plan, authorization, run, and member operations. Repeat observation projects that interface onto the existing indexed SQLite bounded-run tables, preserving transactions, replay, concurrency, and the first production run without migration or rewrite. Other domains may be composed later through an explicit adapter; this increment creates no Products adapter, task ledger, spend ledger, identity repository, evidence repository, or history repository.

## Certification

Fixtures cover neutral plan/authorization mechanics, opaque member identities, child lineage, expiry rejection, exact replay, single-use START, waiting/resume, member-local isolation, systemic stop, adapter-owned terminal behavior, generic summaries, repeat execute/retrieve/retain/H058 parity, existing CLI parity, and data-driven cohorts of 10, 100, 1,000, and 10,000 members. The completed production run remains read-only compatible as `mer_repeatrun_c17fea3014058fe922bd539b` with five members and state `COMPLETED`.

No provider operation, paid task, production authorization/run, evidence/history mutation, or downstream mutation occurred during extraction.
