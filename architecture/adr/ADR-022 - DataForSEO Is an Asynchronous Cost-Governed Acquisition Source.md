# ADR-022 — DataForSEO Is an Asynchronous Cost-Governed Acquisition Source

## Status
ACCEPTED

## Context
DataForSEO Merchant API task creation is billable and result retrieval is asynchronous. Hardware Radar has written authorization for its Google Shopping price-comparison use case.

## Decision
Model DataForSEO Google Shopping as a source-specific asynchronous acquisition subsystem. Separate paid task creation from result retrieval, preserve task identifiers and reported cost, prevent duplicate paid task submission, and keep dataset rights scoped to Google Shopping rather than DataForSEO generally.

## Consequences
Mercury can add DataForSEO without weakening source-rights fail-closed behavior. Cost becomes explicit acquisition metadata. Matching, observation normalization, review, and publication remain separate governed stages.
