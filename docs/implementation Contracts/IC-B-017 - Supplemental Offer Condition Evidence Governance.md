# IC-B-017 — Supplemental Offer Condition Evidence Governance

**Status:** B-017A runtime implemented and fixture-certified; no production supplemental evidence configured
**Increment:** B-017 / B-017A

## Purpose

Define the Mercury-owned boundary for deriving an offer's effective condition when the immutable primary observation correctly records `UNKNOWN` but a separate authorized source carries an explicit condition assertion.

Condition is an offer-level claim. Product identity, retailer identity, availability, reputation, title, warranty, ordinary retail context, affiliate participation, and absence of used/refurbished wording do not establish `NEW`.

## Preserved vocabulary and lifecycle

The canonical vocabulary remains `NEW`, `USED`, `OPEN_BOX`, `MANUFACTURER_REFURBISHED`, `SELLER_REFURBISHED`, and `UNKNOWN`. Missing or ambiguous evidence remains `UNKNOWN`; contradictory compatible assertions produce `CONFLICT` and fail closed.

```text
immutable primary observation
+ append-only supplemental condition evidence
→ deterministic effective-condition assessment
→ E2S consumes effective condition
```

DF003 evidence, historical observations, and canonical observations remain unchanged. Supplemental evidence is not an observation rewrite, product fact, retailer policy, publication decision, or Current Price authority.

## Supplemental evidence record

The immutable `SupplementalConditionEvidence` record binds:

- immutable supplemental evidence ID and material fingerprint;
- source ID and source type (`PROVIDER`, `RETAILER_API`, `RETAILER_FEED`, `RETAILER_PAGE`, `OPERATOR_CURATED`, or another explicitly governed type);
- Atlas product ID and exact manufacturer part number;
- Atlas retailer ID, canonical marketplace/domain, and seller identity;
- canonicalized offer URL and an authoritative retailer listing/SKU/offer identifier where available;
- provider listing/product identity only as source-specific corroboration, never as a substitute for retailer-offer identity;
- bundle/variant/listing class sufficient to exclude used, open-box, refurbished, conditional, or bundled siblings;
- asserted canonical condition and the explicit raw field/value supporting it;
- observed/retrieved time, collector and adapter identity, provenance, raw reference, validation result, and rights-profile digest;
- the primary evidence and canonical observation to which compatibility is being assessed.

Price may detect drift but must not identify an offer by itself. URL tracking parameters are not offer identity. When an authoritative retailer listing identifier is unavailable, the combination of exact retailer, marketplace, canonical URL path, Atlas product/MPN, seller, listing class, and contemporaneous acquisition must still prove that condition cannot bleed to another listing; otherwise the result is `UNKNOWN`.

## Temporal and rights policy

Condition compatibility must be evaluated at the same explicit time as current-market qualification. Supplemental evidence must be contemporaneous with the price observation under a separately approved source/retailer temporal policy; absence of that policy fails closed. It must not outlive the currentness window of either source, and newer evidence cannot repair an AGING or STALE price observation.

Each source needs its own explicit rights for acquisition, processing, durable retention, historical retention where applicable, comparison/public-display use where applicable, and derivation of a condition assertion. Rights do not transfer between DataForSEO, a retailer feed/page, an affiliate network, or curated operator evidence. Affiliate approval alone establishes none of these facts.

## Effective-condition assessment

The deterministic `EffectiveConditionAssessmentService` distinguishes:

- `CONFIRMED_NEW` → effective condition `NEW`;
- `CONFIRMED_NON_NEW` → the single explicit non-new canonical condition;
- `UNKNOWN` → no sufficiently bound, current, validated, and authorized assertion;
- `CONFLICT` → incompatible current assertions or unresolved listing identity.

Exact replay returns the same evidence and assessment. Same evidence identity with different material content is a conflict. Newer compatible evidence appends rather than replaces; expired, withdrawn, or superseded evidence remains audit history but is excluded from current assessment. No source priority or array ordering may resolve `NEW` versus a non-new condition. A future explicit policy may select the temporally applicable assertion only when lineage, source authority, and non-contradiction are proven.

## Implemented boundaries

- `SupplementalConditionEvidence` validates and freezes the record, canonicalizes the offer URL, and derives stable acquisition identity and material fingerprint.
- `FileSupplementalConditionEvidenceRepository` appends records atomically, returns `DUPLICATE` for exact replay, and fails closed when one acquisition identity carries different material evidence.
- `validateSupplementalOfferBinding` requires exact primary evidence, canonical observation, product/MPN, retailer, marketplace, seller, URL, listing identity where supplied, variant, and bundle agreement.
- `ConditionTemporalPolicyRepository` requires an explicit source/retailer/marketplace policy. B-017A defines no universal threshold and installs no production policy.
- Source-rights profiles carry the independent `derivation.offerCondition` capability; acquisition or public-display rights do not imply it.
- `EffectiveConditionAssessmentService` is read-only and deterministic. Active contradictory conditions return `CONFLICT`; explicitly superseded evidence remains retained but does not control the effective result.

## E2S seam

E2S accepts an optional injected effective-condition resolver and binds its assessment ID and binding digest while preserving the immutable canonical condition separately. Without that dependency, or when the result is `UNKNOWN`/`CONFLICT`, existing canonical condition semantics remain authoritative and `UNKNOWN` remains blocked. The allowed E2S condition remains exactly `NEW`. Production composition does not inject a resolver in B-017A.

Effective condition does not affect freshness, shipping, review, publication, ranking, Cheapest, Pick, or affiliate preference. Qualification remains derived and grants no downstream authority.

## Source strategy

- DataForSEO SELLERS: reuse existing normalization whenever `product_condition` is explicit; null remains null.
- Retailer-authorized API/feed: preferred supplemental source when it exposes explicit condition plus stable listing identity and grants required rights.
- Retailer page/structured data: usable only through a governed acquisition and rights profile and only when condition is explicit.
- Operator-curated evidence: transitional exception path only after the same binding, rights, provenance, temporal, replay, and contradiction requirements are implemented. The existing curated full-offer ingestion path is not a supplemental-condition boundary.
- Other providers: require separate rights, adapter, listing-identity, and temporal certification.

For the current MemoryC canary, repository evidence plus read-only public research establishes product page item `FD3190001`, MPN `CP2K16G56C46U5`, and the exact listing URL, but no explicit item-condition field or value. Category wording, returns language, stock state, and ordinary product-page presentation are insufficient. Current result: `NO_SUFFICIENT_CONDITION_EVIDENCE`.

## Fixture certification

B-017A fixtures prove: no supplement → `UNKNOWN`; exact same-offer explicit `NEW` → `CONFIRMED_NEW`; blank/generic assertions remain `UNKNOWN`; different product, retailer, marketplace, seller, variant, or bundle cannot bind; stale or ungoverned evidence has no current effect; denied condition-derivation rights fail closed; `NEW` versus `OPEN_BOX` → `CONFLICT`; explicit supersession is append-only; exact replay is deterministic; conflicting replay fails closed; and primary evidence/observations remain byte-identical. A production-shaped fresh MemoryC fixture can use confirmed supplemental `NEW` solely for E2S qualification, while an aging fixture remains blocked by freshness, confidence, and condition. Explicit primary DataForSEO condition remains compatible and bypasses the supplemental resolver.

## Safety

B-017A performs no production acquisition, paid task, supplemental retention, canonical mutation, E2S persistence, publication, public-snapshot change, or price/recommendation authorization. It creates no production source profile or temporal policy. Actual spend is `$0.000`.
