# IC-ATLAS-006 — RAM Launch Cohort Lifecycle Activation Readiness

**Increment:** B-002  
**Status:** Fixture-certified; production activation not performed  
**Owner:** Atlas lifecycle governance

## Boundary

B-002 certifies the proposed `DRAFT/PENDING` to `ACTIVE/READY` record revisions for exactly six B-001 cohort products. Atlas owns canonical product lifecycle and publication-readiness fields. Sentinel validates the resulting RAM records. Mercury may consume only the resulting Atlas state; it does not activate Atlas products.

The current `DRAFT/PENDING` state is intentional. D-002B admitted manufacturer-backed canonical records with engineering validation `PASS`, complete required provenance, and `humanReviewRequired=true`, but did not perform lifecycle review. Canonical admission therefore did not imply activation.

## Exact fixture batch

- `ram_crucial_cp2k16g56c46u5`
- `ram_teamgroup_ctced532g6000hc30dc01`
- `ram_g_skill_f4_3200c16d_32gvk`
- `ram_kingston_kvr32n22d8_32`
- `ram_crucial_ct16g56c46s5`
- `ram_g_skill_f5_5600s4040a16gx2_rs`

The existing Corsair anchor is explicitly excluded.

## Certified record revision

For each exact source record, the fixture increments `identity.recordRevision`, updates the audit timestamp/operator, changes `governance.lifecycleStatus` to `ACTIVE`, changes `governance.publicationStatus` to `READY`, completes the required review fields, and records a B-002 change reason. Identity, exact MPN, brand binding, provenance, RAM classification, capacity, and specifications remain unchanged.

Activation readiness requires the source record to remain exactly `DRAFT/PENDING`, engineering validation `PASS`, and `humanReviewRequired=true`. A product outside the batch or a changed source lifecycle fails closed.

## Authority separation

`ACTIVE/READY` makes a canonical Atlas product eligible for existing operational candidate construction. It establishes no retailer availability, market evidence, provider identity, acquisition or spend authorization, rights, freshness policy, historical/canonical observation, review, E2S qualification, publication, Current Price, Cheapest, Pick, or recommendation authority.

B-002 defines no production mutation command and performs no lifecycle transition. Production activation remains a separate explicit Atlas authoring/operator action against only the certified batch.

## Verification

Fixture certification proves product/schema validation, Atlas relationship integrity, Sentinel RAM rules, capacity arithmetic, category/form-factor semantics, exact identity preservation, exclusion of the Corsair anchor, absence of unrelated product or retailer changes, and absence of downstream authority fields.
