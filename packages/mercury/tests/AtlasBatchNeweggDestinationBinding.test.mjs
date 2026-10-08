import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { prepareAtlasBatchNeweggDestinations } from "../destinations/AtlasBatchNeweggDestinationBinding.js";

const admission = JSON.parse(await readFile(new URL("../../../.forge-review/atlas-intake/coverage-expansion-p1/batch-a/atlas-ram-coverage-expansion-batch-a-admission.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../../atlas/atlas-manifest.json", import.meta.url), "utf8"));
const atlasProducts = await Promise.all(manifest.products.map(async entry => JSON.parse(await readFile(new URL(`../../atlas/${entry.path}`, import.meta.url), "utf8"))));
const existingDestinations = JSON.parse(await readFile(new URL("../destinations/production-destinations.json", import.meta.url), "utf8")).records.filter(value => !admission.admittedProducts.some(product => product.atlasProductId === value.atlasProductId));
const input = { admittedProducts:admission.admittedProducts, atlasProducts, existingDestinations, admissionArtifactId:admission.artifactId, reviewedBy:"operator:Clinton_Ramsook", reviewedAt:"2026-10-04T12:00:00.000Z" };
const result = prepareAtlasBatchNeweggDestinations(input);

assert.deepEqual(result, prepareAtlasBatchNeweggDestinations(input));
assert.equal(result.outcomes.length, 25);
assert.deepEqual(result.counts, { DESTINATION_READY:25, IDENTITY_REVIEW_REQUIRED:0, MULTI_ITEM_REVIEW_REQUIRED:0, ACTIONABILITY_REVIEW_REQUIRED:0, DUPLICATE_CONFLICT:0 });
for (const outcome of result.outcomes) {
  assert.equal(outcome.destination.retailerListingId, outcome.retailerListingId);
  assert.match(outcome.destination.destinationUrl, /^https:\/\/newegg\.com\/(?:.+\/)?p\//);
  assert.equal(outcome.destination.destinationUrl.includes("linksynergy"), false);
  assert.equal(outcome.destination.destinationUrl.includes("?"), false);
  assert.equal("seller" in outcome.destination, false);
  assert.equal("price" in outcome.destination, false);
  assert.equal("affiliate" in outcome.destination, false);
}

const multi = structuredClone(input); multi.admittedProducts[0].retainedNeweggEvidence = [multi.admittedProducts[0].retainedNeweggEvidence, structuredClone(multi.admittedProducts[0].retainedNeweggEvidence)];
assert.equal(prepareAtlasBatchNeweggDestinations(multi).outcomes[0].qualification, "MULTI_ITEM_REVIEW_REQUIRED");
const mismatch = structuredClone(input); mismatch.admittedProducts[0].verifiedMpn = "WRONG";
assert.equal(prepareAtlasBatchNeweggDestinations(mismatch).outcomes[0].qualification, "IDENTITY_REVIEW_REQUIRED");
const itemMismatch = structuredClone(input); itemMismatch.admittedProducts[0].retainedNeweggEvidence.sku = "WRONG-SKU";
assert.equal(prepareAtlasBatchNeweggDestinations(itemMismatch).outcomes[0].qualification, "IDENTITY_REVIEW_REQUIRED");
const collision = structuredClone(input); collision.existingDestinations.push({ ...result.outcomes[0].destination, atlasProductId:input.admittedProducts[1].atlasProductId });
assert.equal(prepareAtlasBatchNeweggDestinations(collision).outcomes[0].qualification, "DUPLICATE_CONFLICT");

const scaled = prepareAtlasBatchNeweggDestinations({ ...input, admittedProducts:Array.from({length:200}, (_, index) => ({ ...structuredClone(input.admittedProducts[index % 25]), atlasProductId:`ram_scale_fixture_${index}`, verifiedMpn:`SCALE-${index}`, retainedNeweggEvidence:{ ...structuredClone(input.admittedProducts[index % 25].retainedNeweggEvidence), sku:`SCALE-SKU-${index}`, productId:`SCALE-PRODUCT-${index}`, sourceUrl:`https://click.linksynergy.com/link?murl=${encodeURIComponent(`https://www.newegg.com/p/SCALE-PATH-${index}?item=SCALE-SKU-${index}`)}` } })), atlasProducts:Array.from({length:200},(_,index)=>({identity:{atlasProductId:`ram_scale_fixture_${index}`,manufacturerPartNumber:`SCALE-${index}`},governance:{lifecycleStatus:"ACTIVE",publicationStatus:"READY"}})), existingDestinations:[] });
assert.equal(scaled.counts.DESTINATION_READY, 200);
console.log("Atlas Batch A Newegg destination binding tests passed (25 production + 200 scale fixtures).");
