import assert from "node:assert/strict";
import {currentDisplayPublicationDigest,deriveLegacySingleOfferPublicationCompatibilitySnapshot} from "../publication/CurrentDisplayPublication.js";
import {CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION} from "../current-display/CurrentDisplaySnapshot.js";

const evaluatedAt="2026-11-16T19:13:40.000Z";
const offer=(id,observedAt,extra={})=>({offerIdentity:id,atlasProductId:"ram_g_skill_f5_5600s4645a16gx2_rs",retailerId:"RETAILER-0004",retailer:"Newegg",destinationId:"mer_dest_91b153ed9aa7891d05ebd485",priceUsd:id.endsWith("a")?588.08:549.99,currency:"USD",observedAt,itemPriceEligible:true,sourceIdentity:{sourceId:"RAKUTEN_NEWEGG_PRODUCT_CATALOG"},...extra});
const oldA=offer("mer_offer_5d461bd6797e88fda18ca166","2026-10-02T10:51:03.000Z"),oldB=offer("mer_offer_77fab51b74d40becbd942cff","2026-11-12T19:09:32.000Z"),freshA=offer("fresh-a","2026-11-16T18:00:00.000Z"),freshB=offer("fresh-b","2026-11-16T18:30:00.000Z");
const snapshot=offers=>({schemaVersion:CURRENT_DISPLAY_MULTI_OFFER_SCHEMA_VERSION,snapshotId:"fixture-current",offers});
const project=offers=>deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot(offers),predecessorSnapshot:snapshot([]),evaluatedAt});
const published=offers=>({products:[{atlasProductId:freshA.atlasProductId,offers:offers.map(value=>({atlasProductId:value.atlasProductId,retailerId:value.retailerId,destinationId:value.destinationId,itemPriceUsd:value.priceUsd,observedAt:value.observedAt}))}]});

// 1. Exact November 16 shape: both identities are stale, so no continuity winner is required.
assert.deepEqual(project([oldA,oldB]).offers.map(value=>value.offerIdentity).sort(),[oldA.offerIdentity,oldB.offerIdentity].sort());
// 2. A single fresh identity is governed by freshness; stale evidence remains available for stale accounting.
assert.deepEqual(project([oldA,freshA]).offers.map(value=>value.offerIdentity).sort(),[oldA.offerIdentity,freshA.offerIdentity].sort());
// 3. Multiple fresh identities may use unique predecessor continuity.
assert.equal(deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot([freshA,freshB]),predecessorSnapshot:snapshot([freshB]),evaluatedAt}).offers[0].offerIdentity,freshB.offerIdentity);
// 4. Direct published continuity remains supported.
assert.equal(deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot([freshA,freshB]),predecessorSnapshot:snapshot([]),publishedProjection:published([freshA]),evaluatedAt}).offers[0].offerIdentity,freshA.offerIdentity);
// 5. Explicit replacement is accepted only when its prior identity is anchored in the published projection.
const prior=offer("prior","2026-11-15T18:00:00.000Z");
assert.equal(deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot([freshA,freshB]),predecessorSnapshot:snapshot([]),publishedProjection:published([prior]),continuityTransitions:[{priorOffer:prior,offer:freshB}],evaluatedAt}).offers[0].offerIdentity,freshB.offerIdentity);
// 6. An unanchored historical transition cannot select a winner.
assert.throws(()=>deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot([freshA,freshB]),predecessorSnapshot:snapshot([]),continuityTransitions:[{priorOffer:prior,offer:freshB}],evaluatedAt}),/SELECTION_POLICY_REQUIRED/);
// 7. Missing continuity fails closed for multiple fresh offers.
assert.throws(()=>project([freshA,freshB]),/SELECTION_POLICY_REQUIRED/);
// 8. Contradictory continuity fails closed, including disagreement between predecessor and published evidence.
assert.throws(()=>deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot([freshA,freshB]),predecessorSnapshot:snapshot([]),publishedProjection:published([freshA,freshB]),evaluatedAt}),/SELECTION_POLICY_REQUIRED/);
assert.throws(()=>deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot([freshA,freshB]),predecessorSnapshot:snapshot([freshA]),publishedProjection:published([freshB]),evaluatedAt}),/SELECTION_POLICY_REQUIRED/);
// 9. Marketplace and first-party listing identity is preserved; no seller/listing preference is introduced.
const marketplace={...freshA,sellerName:"Marketplace Seller"},firstParty={...freshB,sellerName:null};
assert.equal(deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:snapshot([marketplace,firstParty]),predecessorSnapshot:snapshot([marketplace]),evaluatedAt}).offers[0].offerIdentity,marketplace.offerIdentity);
// 10-11. Durable replay and idempotent recomposition are deterministic.
const replayInput={eligibleSnapshot:snapshot([freshA,freshB]),predecessorSnapshot:snapshot([freshB]),evaluatedAt};
assert.equal(currentDisplayPublicationDigest(deriveLegacySingleOfferPublicationCompatibilitySnapshot(replayInput)),currentDisplayPublicationDigest(deriveLegacySingleOfferPublicationCompatibilitySnapshot(replayInput)));
assert.throws(()=>deriveLegacySingleOfferPublicationCompatibilitySnapshot({...replayInput,evaluatedAt:"invalid"}),/TIME_INVALID/);
// 12. The public Current policy's Amazon 24-hour boundary is honored independently of the 36-hour feed boundary.
const amazon=offer("amazon","2026-11-15T18:30:00.000Z",{sourceIdentity:{sourceId:"AMAZON_MANUAL_PUBLISHER_OBSERVATION"}}),newegg=offer("newegg","2026-11-15T18:30:00.000Z");
assert.deepEqual(project([amazon,newegg]).offers.map(value=>value.offerIdentity).sort(),[amazon.offerIdentity,newegg.offerIdentity].sort());

console.log("Current display publication freshness/continuity regression passed: 12 cases.");
