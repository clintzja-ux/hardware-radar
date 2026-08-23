# ADR-043 — Product and Merchant Identity Reviews Are Independent Audit Records

**Status:** Accepted  
**Date:** 2026-08-22

## Context

Retained DataForSEO evidence can remain promotion-ineligible because product identity is `PROBABLE`, merchant identity is `DISCOVERED`, or both. Repeated observations cannot resolve either identity question, and a generic observation approval would conflate distinct facts and create a force-promote path.

## Decision

Product verification and merchant registration are separate immutable, append-only Mercury review decisions. Product review permits only `PROBABLE -> VERIFIED`; merchant review permits only `DISCOVERED -> REGISTERED`. Each record names its subject, transition, outcome, operator, time, reason, evidence references, contradiction status, and audit provenance.

Approved decisions are projected over specifically referenced retained evidence. Projection never edits raw evidence or Atlas. It supplies reviewed identity state to E2G reassessment, which recomputes DF003 eligibility and applies the canonical E2H policy. Review does not itself create history, canonical observations, or publication authorization.

Rejected decisions produce no identity upgrade. Replayed approvals are idempotent. Conflicting canonical state fails closed. There is no generic state setter or force-promote override.

## Consequences

- Product review cannot register a merchant, and merchant review cannot verify a product.
- Human promotion-related decisions have durable audit history.
- Previously retained evidence can be reassessed without reacquisition.
- Observation count and ordinary price/availability changes do not substitute for identity review or count as identity contradictions.
- Publication remains a separate, stricter workflow.
- PREPARE and reassessment are local and zero-spend; unattended LIVE remains out of scope.
