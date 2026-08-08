# Mercury Package

Canonical source for the Hardware Intelligence Platform market-observation engine.

`public/data/mercury/` is a generated deployment projection produced by
`npm run build:public`. Engineering changes must be made here first.

## Adapter Framework

Mercury retailer-specific normalization is isolated under `adapters/` and accessed through the canonical `RetailerAdapter` contract and `AdapterRegistry`.

MERCURY-PRINCIPLE-001 (Adapter Isolation): retailer-specific behavior must not leak into the observation engine or consuming subsystems. Adapters normalize external representations; they do not determine trust, freshness, confidence, or publication eligibility.

The Amazon v1 adapter is a framework proof only. It performs no network access or live ingestion.

## Freshness Engine

MERCURY-PRINCIPLE-002 (Derived Freshness): observation freshness is derived temporal state, not canonical stored truth. The engine evaluates immutable observation timestamps against an explicit versioned policy and explicit evaluation time. `expiresAt`, when present, is an independent absolute boundary that forces a stale result once reached.

The M004 default policy exists to prove the mechanism only. Retailer- and compliance-specific production thresholds require later explicit policy decisions.
