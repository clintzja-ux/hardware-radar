## IC-MERCURY-001 — locked implementation scope
1. Canonical observation contract

The first canonical Mercury record will use:

{
  "observationId": "...",
  "schemaVersion": "1.0",
  "atlasProductId": "ram_corsair_cmk32gx5m2b6000z30",
  "retailerId": "RETAILER-0001",
  "marketplace": "amazon.com",
  "observationTime": "...",
  "sourceMethod": "MANUAL",
  "lifecycleStatus": "RETRIEVED",
  "validationStatus": "PASS",
  "supersedesObservationId": null,
  "expiresAt": null,
  "offer": {},
  "provenance": {},
  "compliance": {},
  "metadata": {}
}

This preserves the Data Dictionary’s intent while using the canonical retailer identity already established in Atlas.

2. Observation identity

The observation ID will be opaque and immutable rather than encoding mutable market values.

Proposed format:

mer_obs_000000001

Uniqueness will derive from the observation identity tuple:

atlasProductId
+ retailerId
+ marketplace
+ observationTime
+ sourceMethod

The ID identifies the stored record; duplicate detection evaluates the identity tuple.

3. Observation schema

The old price-observation.schema.json will be replaced or formally superseded by a canonical Mercury observation schema aligned with the Data Dictionary.

Sprint M001 will define structure only. Detailed provenance, freshness, confidence, and historical intelligence remain assigned to later Mercury contracts.

4. ObservationRepository

The initial API will follow the proven Atlas repository conventions:

load()
reload()
getAll()
getById()
exists()
search()
validate()

Additional deterministic lookups:

getByAtlasProductId()
getByRetailerId()

Historical calculations and “current offer” selection are explicitly deferred.

5. ObservationValidator

Sprint M001 validation will cover:

required structure;
schema version;
unique observation IDs;
unique observation identity tuples;
valid timestamps;
valid lifecycle values;
valid Atlas product references;
valid retailer references;
immutable-record conventions;
manifest consistency.

Sentinel rule integration beyond foundational referential checks remains a later implementation step. Sentinel’s draft specification already reserves MERCURY_OBSERVATION as a distinct validation subject and defines fail-closed, deterministic behavior.

6. Mercury manifest

A new manifest will register:

schema version;
canonical observations;
record count;
repository status;
supported observation type.
7. Existing sample records

The three existing price observations will not all be declared canonical.

The Corsair observation can be migrated to the new contract because its Atlas product and retailer references resolve.
The other two observations will be classified as legacy/unresolved because their products are no longer present in canonical Atlas.
They will not be deleted without an explicit migration decision because historical observations should not be silently discarded.
8. Tests

Sprint M001 will add:

canonical observation schema tests;
repository tests;
validator tests;
manifest tests;
identity and duplicate tests;
Atlas product reference tests;
retailer reference tests;
legacy-record isolation tests;
full regression integration with the existing npm test command.
Sprint M001 exit criteria

The sprint will be complete when:

Mercury has one approved canonical observation contract.
One canonical Amazon observation loads successfully.
Observation IDs and identity tuples are deterministic.
Atlas and retailer references resolve.
Legacy observations cannot enter the canonical repository accidentally.
The Mercury manifest is valid.
Sentinel, Atlas, and Mercury tests all pass.
Forge and Hardware Radar remain operational.
No freshness, confidence, or historical behavior is prematurely introduced.

The repository is ready, the branch is correct, and the implementation scope is now precise. The next action is to build IC-MERCURY-001 — Observation Foundation against hardware-radar(23).zip.