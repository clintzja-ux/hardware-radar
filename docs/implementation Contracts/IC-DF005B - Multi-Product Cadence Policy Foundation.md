# IC-DF005B — Multi-Product Cadence Policy Foundation

## Status

Implemented as a read-only, configuration-only, zero-spend Mercury increment.

## Contract

Mercury owns historical-refresh cadence policy configuration. Each schema-versioned policy has a stable explicit `policyId`, `enabled`, `minimumIntervalMs`, explicit `atlasProductIds`, optional `retailerIds`, and `automaticExecution: false`.

The policy repository lists policies in stable `policyId` order, loads by ID, resolves by Atlas product ID, rejects duplicate IDs, rejects malformed or unsupported configuration, and may validate every product scope through the Atlas product repository. An unknown Atlas product reference fails integration validation.

A canonical Atlas product has zero or one applicable cadence policy. Assignment is explicit: Atlas membership, historical observations, prices, trends, interest, traffic, and portfolio presence do not assign a policy. No wildcard or global default exists. More than one product-scoped policy is ambiguous and fails closed; Mercury never chooses an interval by speed, age, or ordering.

No policy yields `POLICY_NOT_CONFIGURED`. One disabled policy yields `DISABLED`. One enabled policy is evaluated by E2O. DF005-A obtains the same resolved policy per portfolio product and remains a non-authoritative read model.

The existing Corsair policy remains scoped only to `ram_corsair_cmk32gx5m2b6000z30`, keeps its stable ID and 24-hour interval, and retains `automaticExecution: false`. No second production policy is introduced.

Policy resolution grants no acquisition authority. It creates no plan, authorization, provider task, evidence, or history. Adaptive cadence, popularity/interest scoring, budget-aware intervals, automatic interval changes, publication freshness, and unattended LIVE execution remain outside scope.

## Safety invariants

- Inventory and resolution are immutable read operations.
- File ordering cannot determine policy selection.
- Ambiguity and malformed configuration fail closed.
- Automatic execution is rejected by the production policy repository.
- DF005-B accesses no credentials, provider network, or paid transport and spends `$0.000`.
