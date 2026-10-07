# IC-GENERIC-STRONG-ASIN-TO-AMAZON-DESTINATION-PROGRESSION-P1

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED / FIVE-CANDIDATE-PREPARED
**Owner:** Mercury
**Date:** 2026-10-07

## Purpose

Provide one product-generic, zero-authority progression boundary from canonical DataForSEO Amazon `STRONG_UNIQUE_ASIN` evidence to deterministic Amazon destination review. Strong retailer identity evidence and a canonical `RetailerDestination` are separate governed claims.

## Owner composition

Atlas owns product identity, MPN, and lifecycle. The Amazon acceptance action repository owns the effective identity assessment. The immutable provider-result repository owns task/result lineage. `SourceRightsRegistry` owns rights lineage. `RetailerDestination` owns destination validation and identity; its repository owns persistence. The progression service owns only binding, candidate construction, collision assessment, operator-review preparation, and stale-state revalidation.

## Lifecycle

`prepare()` accepts only Atlas product ID plus canonical assessment ID. It resolves the governed ASIN from the canonical assessment, revalidates immutable result and rights lineage, constructs `https://amazon.com/dp/<ASIN>`, snapshots destination state, and returns a deterministic `mer_amzdestprep_*` artifact. Callers cannot supply an ASIN or URL.

`createReview()` preserves `OPERATOR_EXACT_PRODUCT_REVIEW`. Approval requires the exact prepared ordinary URL, reviewer identity, and review timestamp. Rejection grants no persistence authority. `execute()` resolves the assessment, result, rights, Atlas lifecycle, and destination inventory again; drift fails closed. Exact equivalent replay resolves `ALREADY_BOUND`. Persistence uses the existing `RetailerDestination` contract and repository.

## Authority limits

Destination progression grants navigation identity only. It does not infer seller and grants no price, availability, condition, freshness, Current, History, Cheapest, Pick, recommendation, affiliate, publication, release, or deployment authority. Candidate creation performs no network or provider operation.

## Production preparation

The five canonical manufacturer-first `STRONG_UNIQUE_ASIN` assessments produced five deterministic `ACTIONABILITY_REVIEW_REQUIRED` preparations in the private ignored review artifact. No collision or existing Amazon binding was found. No canonical destination was created. Forge does not yet project this review queue.

## Scalability

The owner contains no cohort, product, ASIN, manufacturer, or brand constants. Fixture coverage includes strong binding, blocked identity states, rights and lifecycle failures, collisions, approval/rejection, stale-safe execution, idempotent replay, seller/affiliate separation, and a 200-product compatibility check.
