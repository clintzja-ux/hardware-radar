import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deriveCurrentDisplayPublicationEligibleSnapshot, deriveLegacySingleOfferPublicationCompatibilitySnapshot } from "../publication/CurrentDisplayPublication.js";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";

const state = JSON.parse(await readFile(".forge-review/retail-display/current-display-snapshots.json", "utf8"));
const releaseManifest = JSON.parse(await readFile("config/publication-release.json", "utf8"));
const releaseBundle = JSON.parse(await readFile(`config/${releaseManifest.artifact.relativePath}`, "utf8"));
const publishedProjection = JSON.parse(releaseBundle.fileTexts.current);
const before = JSON.stringify(state);
const current = { ...state.current, offers: state.current.offers.filter(offer => offer?.sourceIdentity?.sourceId) };
const eligible = deriveCurrentDisplayPublicationEligibleSnapshot({ snapshot: current, rightsRegistry: defaultSourceRightsRegistry });
assert.equal(current.schemaVersion, "1.1");
assert.equal(state.current.offers.length, 189);
assert.equal(current.offers.length, 117);
assert.equal(eligible.offers.length, 117);

const gskill = eligible.offers.filter(offer => offer.atlasProductId === "ram_g_skill_f5_5600s4645a16gx2_rs" && offer.retailerId === "RETAILER-0004");
assert.deepEqual(gskill.map(offer => offer.offerIdentity).sort(), ["mer_offer_5d461bd6797e88fda18ca166", "mer_offer_e7e945f7f97c4741a63ee2db"].sort());
assert.equal(new Set(gskill.map(offer => offer.destinationId)).size, 1);
assert.equal(gskill.find(offer => offer.offerIdentity === "mer_offer_5d461bd6797e88fda18ca166").seller.identityState, "UNKNOWN");
assert.equal(gskill.find(offer => offer.offerIdentity === "mer_offer_5d461bd6797e88fda18ca166").listingIdentity, "9SIA1K6KCT0998");
assert.equal(new Set(gskill.map(offer => offer.sourceIdentity.sourceId)).size, 2);

const crucial = eligible.offers.filter(offer => offer.atlasProductId === "ram_crucial_ct2k32g4sfd832a" && offer.offerIdentity === "mer_offer_eba86bfe779fd6c9c125ba0c");
assert.equal(crucial.length, 1);
assert.equal(crucial[0].offerIdentity, "mer_offer_eba86bfe779fd6c9c125ba0c");
assert.equal(crucial[0].priceUsd, 439.12);
assert.equal(crucial[0].seller.sellerName, "TECH_JUNKIE");
assert.equal(crucial[0].listingIdentity, "9SIB3T1KSA7837");

const compatibility = deriveLegacySingleOfferPublicationCompatibilitySnapshot({ eligibleSnapshot: eligible, predecessorSnapshot: state.previous, publishedProjection });
assert.equal(compatibility.offers.length, 116);
assert.equal(compatibility.offers.some(offer => offer.offerIdentity === "mer_offer_e7e945f7f97c4741a63ee2db"), true);
assert.equal(compatibility.offers.some(offer => offer.offerIdentity === "mer_offer_5d461bd6797e88fda18ca166"), false);
assert.equal(compatibility.offers.some(offer => offer.offerIdentity === "mer_offer_eba86bfe779fd6c9c125ba0c"), true);

const continuityProjection={products:[{offers:[{atlasProductId:gskill[1].atlasProductId,retailerId:gskill[1].retailerId,destinationId:gskill[1].destinationId,itemPriceUsd:gskill[1].priceUsd,observedAt:gskill[1].observedAt}]}]};
const continuity=deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:{...eligible,offers:gskill},predecessorSnapshot:{offers:gskill},publishedProjection:continuityProjection});
assert.equal(continuity.offers.length,1);
assert.equal(continuity.offers[0].offerIdentity,gskill[1].offerIdentity);

const postBuildProjection={products:publishedProjection.products.filter(product=>product.atlasProductId!==gskill[0].atlasProductId)};
assert.throws(()=>deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:{...eligible,offers:gskill},predecessorSnapshot:{offers:gskill},publishedProjection:postBuildProjection}),/CURRENT_DISPLAY_PUBLICATION_SELECTION_POLICY_REQUIRED/);
const ambiguousProjection={products:[{offers:gskill.map(offer=>({atlasProductId:offer.atlasProductId,retailerId:offer.retailerId,destinationId:offer.destinationId,itemPriceUsd:offer.priceUsd,observedAt:offer.observedAt}))}]};
assert.throws(()=>deriveLegacySingleOfferPublicationCompatibilitySnapshot({eligibleSnapshot:{...eligible,offers:gskill},predecessorSnapshot:{offers:gskill},publishedProjection:ambiguousProjection}),/CURRENT_DISPLAY_PUBLICATION_SELECTION_POLICY_REQUIRED/);

assert.throws(() => deriveCurrentDisplayPublicationEligibleSnapshot({ snapshot: { ...current, offers: [gskill[0], gskill[0]] }, rightsRegistry: defaultSourceRightsRegistry }), /CURRENT_DISPLAY_OFFER_DUPLICATE/);
assert.throws(() => deriveCurrentDisplayPublicationEligibleSnapshot({ snapshot: { ...current, schemaVersion: "1.0", offers: gskill }, rightsRegistry: defaultSourceRightsRegistry }), /CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED/);
assert.throws(() => deriveLegacySingleOfferPublicationCompatibilitySnapshot({ eligibleSnapshot: { ...eligible, offers: gskill }, predecessorSnapshot: { offers: [] } }), /CURRENT_DISPLAY_PUBLICATION_SELECTION_POLICY_REQUIRED/);
assert.equal(JSON.stringify(state), before);
console.log("Current-display schema-1.1 publication compatibility tests passed: 25 assertions.");
