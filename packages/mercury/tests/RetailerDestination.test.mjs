import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    RETAILER_DESTINATION_BINDING_METHOD,
    RETAILER_DESTINATION_NAVIGATION_AUTHORITY,
    RETAILER_DESTINATION_SOURCE_TYPE,
    RETAILER_DESTINATION_TYPE,
    assessRetailerDestinationBinding,
    canonicalizeRetailerDestinationUrl,
    createRetailerDestination,
    orderRetailerDestinations,
    projectRetailerDestinationForBeacon,
    retailerDestinationMaterialFingerprint,
    validateRetailerDestination
} from "../destinations/RetailerDestination.js";
import { FileRetailerDestinationRepository } from "../destinations/FileRetailerDestinationRepository.js";

let cases = 0;
const equal = (actual, expected, message) => { cases += 1; assert.equal(actual, expected, message); };
const check = (value, message) => { cases += 1; assert.ok(value, message); };
const rejects = async (operation, pattern) => { cases += 1; await assert.rejects(operation, pattern); };
const throws = (operation, pattern) => { cases += 1; assert.throws(operation, pattern); };
const productId = "ram_corsair_cmk32gx5m2b6000z30";
const product = { identity: { atlasProductId: productId, manufacturerPartNumber: "CMK32GX5M2B6000Z30" }, governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" } };
const retailer = { id: "RETAILER-0002", name: "Platinummicro", websiteUrl: "https://platinummicro.com", status: "active", affiliateProgram: { available: false, status: "unknown" } };
const productRepository = { getById: async id => id === productId ? structuredClone(product) : null };
const retailerRepository = { getById: async id => id === retailer.id ? structuredClone(retailer) : null };
const makeInput = (overrides = {}) => ({
    atlasProductId: productId,
    retailerId: retailer.id,
    marketplace: "platinummicro.com",
    destinationType: RETAILER_DESTINATION_TYPE,
    destinationUrl: "https://www.platinummicro.com/fixture/cmk32gx5m2b6000z30",
    retailerListingId: "FIXTURE-CMK32GX5M2B6000Z30",
    binding: { manufacturerPartNumber: "CMK32GX5M2B6000Z30", method: RETAILER_DESTINATION_BINDING_METHOD, scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: ["fixture:growth-005a:retailer-page:1"] },
    provenance: { sourceType: RETAILER_DESTINATION_SOURCE_TYPE },
    reviewedBy: "operator:fixture",
    reviewedAt: "2026-09-02T20:00:00Z",
    status: "ACTIVE",
    supersedesDestinationId: null,
    retirementReason: null,
    createdAt: "2026-09-02T20:00:00Z",
    createdBy: "operator:fixture",
    ...overrides
});

const destination = createRetailerDestination(makeInput({ destinationUrl: "https://WWW.PlatinumMicro.com/fixture//cmk32gx5m2b6000z30/?utm_source=fixture&gclid=tracking#section" }));
equal(destination.destinationUrl, "https://platinummicro.com/fixture/cmk32gx5m2b6000z30");
equal(destination.marketplace, "platinummicro.com");
equal(Object.isFrozen(destination), true);
equal(Object.isFrozen(destination.binding), true);
equal(validateRetailerDestination(destination).valid, true);
equal(createRetailerDestination(makeInput()).destinationId, destination.destinationId);
equal(createRetailerDestination(makeInput()).materialFingerprint, destination.materialFingerprint);
check(/^mer_dest_[a-f0-9]{24}$/.test(destination.destinationId));
check(/^[a-f0-9]{64}$/.test(destination.materialFingerprint));

const eligible = assessRetailerDestinationBinding({ destination, product, retailer });
equal(eligible.authority, RETAILER_DESTINATION_NAVIGATION_AUTHORITY);
equal(eligible.eligible, true);
equal(eligible.affiliateRequired, false);
equal(eligible.sourceRightsProfileRequired, false);
for (const key of ["observationCreated", "historicalAuthority", "canonicalObservationAuthority", "reviewAuthority", "currentMarketAuthority", "publicationAuthority", "currentPriceAuthority", "cheapestAuthority", "pickAuthority"]) equal(eligible[key], false);
equal(eligible.networkOperation, "NONE"); equal(eligible.actualSpendUsd, 0);

throws(() => createRetailerDestination(makeInput({ destinationType: "SEARCH_PAGE" })), /TYPE_UNSUPPORTED/);
for (const type of ["CATEGORY_PAGE", "HOMEPAGE", "MANUFACTURER_PAGE", "BUNDLE", "MARKETPLACE_SELLER", "USED", "REFURBISHED", "OPEN_BOX"]) throws(() => createRetailerDestination(makeInput({ destinationType: type })), /TYPE_UNSUPPORTED/);
throws(() => createRetailerDestination(makeInput({ destinationUrl: "http://platinummicro.com/fixture/product" })), /URL_INVALID/);
throws(() => createRetailerDestination(makeInput({ destinationUrl: "https://user:pass@platinummicro.com/fixture/product" })), /URL_INVALID/);
throws(() => createRetailerDestination(makeInput({ destinationUrl: "https://bit.ly/fixture" })), /URL_HOST_INVALID/);
throws(() => createRetailerDestination(makeInput({ destinationUrl: "https://platinummicro.com/fixture/product?variant=1" })), /QUERY_UNSUPPORTED/);
throws(() => createRetailerDestination(makeInput({ destinationUrl: "https://platinummicro.com/" })), /PRODUCT_PATH_REQUIRED/);
equal(canonicalizeRetailerDestinationUrl("https://platinummicro.com/fixture/product?utm_campaign=x#fragment"), "https://platinummicro.com/fixture/product");
throws(() => createRetailerDestination(makeInput({ binding: { ...makeInput().binding, evidenceReferences: [] } })), /BINDING_INVALID/);
throws(() => createRetailerDestination(makeInput({ binding: { ...makeInput().binding, scope: "BUNDLE" } })), /BINDING_INVALID/);
throws(() => createRetailerDestination({ ...makeInput(), price: 99 }), /PROHIBITED_FIELD/);
throws(() => createRetailerDestination({ ...makeInput(), affiliateEnabled: false }), /PROHIBITED_FIELD/);
const prohibitedNested = structuredClone(destination); prohibitedNested.binding.price = 99; prohibitedNested.materialFingerprint = retailerDestinationMaterialFingerprint(prohibitedNested); equal(validateRetailerDestination(prohibitedNested).valid, false); check(validateRetailerDestination(prohibitedNested).errors.includes("RETAILER_DESTINATION_PROHIBITED_FIELD"));

const dir = await mkdtemp(join(tmpdir(), "growth-005a-"));
const statePath = join(dir, "destinations.json");
const repository = new FileRetailerDestinationRepository({ statePath, productRepository, retailerRepository });
equal((await repository.retain(destination)).status, "RETAINED");
const stateAfterFirst = await readFile(statePath, "utf8");
equal((await repository.retain(destination)).status, "DUPLICATE");
equal(await readFile(statePath, "utf8"), stateAfterFirst);
equal((await repository.getAll()).length, 1);
equal((await repository.getByProduct(productId)).length, 1);
equal((await repository.getByRetailer(retailer.id)).length, 1);
equal((await repository.getByProductRetailerMarketplace(productId, retailer.id, "www.platinummicro.com")).length, 1);
equal((await repository.getEffective(productId, retailer.id, "platinummicro.com")).destinationId, destination.destinationId);
const returned = await repository.getById(destination.destinationId); equal(Object.isFrozen(returned), true); equal(Object.isFrozen(returned.binding), true);

const sameIdentityConflict = structuredClone(destination); sameIdentityConflict.reviewedBy = "operator:other"; sameIdentityConflict.materialFingerprint = retailerDestinationMaterialFingerprint(sameIdentityConflict);
await rejects(() => repository.retain(sameIdentityConflict), /REPLAY_CONFLICT/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ destinationUrl: "https://platinummicro.com/fixture/parallel" }))), /PARALLEL_ACTIVE_CONFLICT/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ destinationUrl: "https://lookalike-platinummicro.example/fixture/product" }))), /MARKETPLACE_MISMATCH/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ destinationUrl: "https://shop.platinummicro.com/fixture/product" }))), /MARKETPLACE_MISMATCH/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ marketplace: "example.com", destinationUrl: "https://example.com/fixture/product" }))), /MARKETPLACE_MISMATCH/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ atlasProductId: "ram_unknown_product" }))), /ATLAS_PRODUCT_UNKNOWN/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ retailerId: "RETAILER-9999" }))), /ATLAS_RETAILER_UNKNOWN/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ binding: { ...makeInput().binding, manufacturerPartNumber: "WRONG-MPN" } }))), /MPN_MISMATCH/);

const replacement = createRetailerDestination(makeInput({ destinationUrl: "https://platinummicro.com/fixture/cmk32gx5m2b6000z30-replacement", retailerListingId: "FIXTURE-REPLACEMENT", supersedesDestinationId: destination.destinationId, reviewedAt: "2026-09-02T21:00:00Z", createdAt: "2026-09-02T21:00:00Z" }));
equal((await repository.retain(replacement)).status, "RETAINED");
equal((await repository.getEffective(productId, retailer.id, "platinummicro.com")).destinationId, replacement.destinationId);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ destinationUrl: "https://platinummicro.com/fixture/bad-predecessor", supersedesDestinationId: "mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa" }))), /PREDECESSOR_NOT_FOUND/);
await rejects(() => repository.retain(createRetailerDestination(makeInput({ destinationUrl: "https://platinummicro.com/fixture/stale-predecessor", supersedesDestinationId: destination.destinationId }))), /PREDECESSOR_NOT_EFFECTIVE/);

throws(() => createRetailerDestination(makeInput({ status: "RETIRED", supersedesDestinationId: replacement.destinationId })), /RETIREMENT_INVALID/);
const retirement = createRetailerDestination(makeInput({ status: "RETIRED", supersedesDestinationId: replacement.destinationId, retirementReason: "Fixture destination withdrawn after review.", destinationUrl: replacement.destinationUrl, retailerListingId: replacement.retailerListingId, reviewedAt: "2026-09-02T22:00:00Z", createdAt: "2026-09-02T22:00:00Z" }));
equal((await repository.retain(retirement)).status, "RETAINED");
equal(await repository.getEffective(productId, retailer.id, "platinummicro.com"), null);
equal((await repository.getAll()).length, 3);
equal((await repository.retain(retirement)).status, "DUPLICATE");
equal(assessRetailerDestinationBinding({ destination: retirement, product, retailer }).eligible, false);
check(assessRetailerDestinationBinding({ destination: retirement, product, retailer }).reasons.includes("RETAILER_DESTINATION_RETIRED"));

const beforeDestination = structuredClone(destination), beforeProduct = structuredClone(product), beforeRetailer = structuredClone(retailer);
const withAffiliateFalse = assessRetailerDestinationBinding({ destination, product, retailer: { ...retailer, affiliateProgram: { available: false, status: "not-enrolled" } } });
const withAffiliateTrue = assessRetailerDestinationBinding({ destination, product, retailer: { ...retailer, affiliateProgram: { available: true, status: "active" } } });
equal(withAffiliateFalse.eligible, true); equal(withAffiliateTrue.eligible, true); equal(withAffiliateFalse.destinationId, withAffiliateTrue.destinationId);
assert.deepEqual(destination, beforeDestination); cases += 1; assert.deepEqual(product, beforeProduct); cases += 1; assert.deepEqual(retailer, beforeRetailer); cases += 1;

const beacon = projectRetailerDestinationForBeacon(destination);
assert.deepEqual(beacon, { destinationId: destination.destinationId, atlasProductId: productId, retailerId: retailer.id, marketplace: "platinummicro.com" }); cases += 1;
equal("destinationUrl" in beacon, false);
const otherRetailer = { id: "RETAILER-0001", name: "Amazon" };
const otherDestination = createRetailerDestination({ ...makeInput(), retailerId: otherRetailer.id, marketplace: "amazon.com", destinationUrl: "https://amazon.com/fixture/product", retailerListingId: "FIXTURE-AMAZON" });
assert.deepEqual(orderRetailerDestinations([destination, otherDestination], [retailer, otherRetailer]).map(item => item.retailerId), ["RETAILER-0001", "RETAILER-0002"]); cases += 1;

const malformedState = JSON.parse(await readFile(statePath, "utf8")); malformedState.byKey = {};
await writeFile(statePath, `${JSON.stringify(malformedState)}\n`);
await rejects(() => repository.getAll(), /STATE_INVALID/);

equal((await import("../index.js")).RETAILER_DESTINATION_NAVIGATION_AUTHORITY, RETAILER_DESTINATION_NAVIGATION_AUTHORITY);
console.log(`GROWTH-005A retailer destination tests passed (${cases} cases).`);

