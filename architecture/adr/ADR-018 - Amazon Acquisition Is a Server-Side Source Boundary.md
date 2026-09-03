# ADR-018 — Amazon Acquisition Is a Server-Side Source Boundary

Status: PROPOSED

## Decision
Amazon Creators API acquisition is isolated behind a server-side acquisition client. Credentials and bearer tokens are injected into the token provider and never enter Forge, browser code, canonical observations, logs, or public artifacts. Acquisition produces an FM001 ingestion request; it does not construct canonical observations.

GetItems by known ASIN is the initial production operation. Atlas remains authoritative for product identity. Requests are limited to the minimum OffersV2 resources required for price, availability, condition, and merchant information.

Authentication is credential-version aware through an injected token-fetch strategy. Rate governance, bounded retry, token invalidation, and partial/no-offer outcomes are acquisition concerns and do not authorize fallback to manual Amazon data.

## Consequences
- Amazon API transport can be tested without live credentials.
- Mercury canonical semantics remain unchanged.
- Live production calls remain gated by account eligibility, credentials, Partner Tag, allocation, and verified Atlas↔ASIN mapping.
- FC001 retention and publication rules remain authoritative downstream.

## Promoted ADR-018 to ACCEPTED