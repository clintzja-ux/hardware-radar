# IC-GROWTH-005B.2 — Curated Value-DDR5 Atlas Evidence and Admission

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED
**Owner:** Atlas canonical product governance
**Date:** 2026-09-02

## Boundary

GROWTH-005B.2 evaluates exactly eight operator-curated DDR5 candidates against bounded first-party manufacturer evidence. Search is discovery only; Atlas identity requires an exact manufacturer product page, datasheet, configurator, support record, or equivalent first-party material. Retailer listings cannot establish canonical product identity.

An `ADMIT` result creates a normal Atlas RAM product record through the existing manifest, validators, provenance model, public projection, product-route generator, catalog, and factual comparison boundary. `HOLD` and `REJECT` create no brand or product record. Missing facts remain missing, exact-SKU ambiguity fails closed, and total capacity must equal module count multiplied by per-module capacity.

## Certified outcomes

| Candidate | Result | Reason |
|---|---|---|
| A-Tech `HMCG66AEBUA084N-ATC` | HOLD | First-party A-Tech evidence establishes a replacement for base component `HMCG66AEBUA084N`, but not the submitted suffixed identity as an exact canonical MPN. |
| PNY `MD8GSD5560046-TB` | HOLD | The exact official SKU page does not unambiguously establish the submitted one-module configuration. |
| Silicon Power `SP016GXLWU60FBDKAI Gray` | REJECT / `MPN_CONTRADICTED` | The submitted exact identity and 16GB `2×8GB` configuration are not supported by the manufacturer's order information; `Gray` is presentation text, not sufficient MPN evidence. |
| Kingston `KF560C30BBEA-8` | ADMIT | Exact official part record and datasheet establish an 8GB `1×8GB` DDR5-6000 CL30 RGB UDIMM. |
| Kingston `KF560C36BBEA-8` | ADMIT | Exact official part record and datasheet establish an 8GB `1×8GB` DDR5-6000 CL36 RGB UDIMM. |
| PNY `MD16GSD5560046-TB` | HOLD | The exact official SKU page does not unambiguously establish the submitted one-module configuration. |
| Corsair `CMK16GX5M2B5200Z40` | ADMIT | Exact official product page establishes a 16GB `2×8GB` DDR5-5200 CL40 Vengeance kit. |
| G.SKILL `F5-6000J3636F16GX1-RS5K` | ADMIT | Exact official specification establishes a 16GB `1×16GB` DDR5-6000 CL36 Ripjaws S5 module. |

No new brand record is created: all admitted products use existing Kingston, Corsair, or G.SKILL records. A-Tech, PNY, and Silicon Power remain unregistered because none of their candidates passed admission.

## Authority separation

Atlas product admission establishes factual product identity only. The operator's value-oriented selection rationale creates no price, availability, condition, shipping, retailer, destination, observation, publication, Current Price, Cheapest, Pick, ranking, recommendation, or affiliate authority. Production ordinary retailer destinations remain empty.

The standard public build deterministically adds the admitted products to `/ram/`, their Atlas-slug product routes, the sitemap, and the existing factual two-product comparison resolver. No candidate-specific UI or parallel intake path exists.
