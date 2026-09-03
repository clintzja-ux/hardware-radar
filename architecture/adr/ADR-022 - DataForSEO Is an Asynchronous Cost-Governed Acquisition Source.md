# ADR-022 — DataForSEO Is an Asynchronous Cost-Governed Acquisition Source

## Status
ACCEPTED

## Context
DataForSEO Merchant API task creation is billable and result retrieval is asynchronous. DataForSEO Support supplied written confirmation that Hardware Radar's described consumer hardware price-comparison use case is permitted. The response confirms that Hardware Radar may store successive product, seller, and pricing results; use retained results for trends, averages, historical lows, and other derived pricing statistics; publicly display and compare current merchant prices; identify the lowest available offer; display historical pricing; and use separately approved retailer affiliate links alongside that data. It also states that the described use requires no separate special license or subscription beyond the pay-as-you-go Merchant API.

This is operator-supplied external evidence. No private account, credential, or support-account metadata belongs in the repository.

## Decision
Model DataForSEO Google Shopping as a source-specific asynchronous acquisition subsystem. Separate paid task creation from result retrieval, preserve task identifiers and reported cost, prevent duplicate paid task submission, and keep dataset rights scoped to Google Shopping rather than DataForSEO generally.

The canonical operating premise is `DATAFORSEO_MARKET_INTELLIGENCE_USE_AUTHORIZED`: DataForSEO Merchant API evidence within the confirmed Hardware Radar use case is an intended independent Mercury market source, not speculative optionality. Ordinary implementation must not repeatedly reopen that generic permission question.

Rights must be revisited only for a materially different DataForSEO product or API and terms, a materially changed provider term, a new data category or redistribution model, a new jurisdictional/legal requirement, conflicting written guidance, or a proposed use materially outside the confirmed consumer hardware price-comparison case.

## Consequences
Mercury can use DataForSEO without weakening source-rights fail-closed behavior. Permission to use data is not public-claim authority. Cost, identity, retention, historical and canonical admission, freshness, comparability, Current Price, publication, Cheapest, and derived-intelligence eligibility remain separate governed decisions. Affiliate approval remains independent.

A retailer product URL returned with permitted market evidence may be proposed independently as a `RetailerDestination` candidate. It remains `sourceUrl`/`offerUrl` evidence unless and until ADR-059's exact-product navigation review admits a separate `destinationUrl`; acquisition never transfers destination authority automatically.
