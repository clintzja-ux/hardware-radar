# Mercury Package

Canonical source for the Hardware Intelligence Platform market-observation engine.

`public/data/mercury/` is a generated deployment projection produced by
`npm run build:public`. Engineering changes must be made here first.

## Adapter Framework

Mercury retailer-specific normalization is isolated under `adapters/` and accessed through the canonical `RetailerAdapter` contract and `AdapterRegistry`.

MERCURY-PRINCIPLE-001 (Adapter Isolation): retailer-specific behavior must not leak into the observation engine or consuming subsystems. Adapters normalize external representations; they do not determine trust, freshness, confidence, or publication eligibility.

The Amazon v1 adapter is a framework proof only. It performs no network access or live ingestion.
