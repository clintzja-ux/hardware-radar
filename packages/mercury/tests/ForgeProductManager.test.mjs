import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createForgeProductManagerProjection, ForgeProductMutationBoundary, GovernedRetailerLinkVerificationService } from "../index.js";
import { ProductRepository } from "../../atlas/ProductRepository.js";
import { extractForgeRetailerListing, parseForgeRetailerUrl, filterForgeProducts, forgeAffiliateSupport, formatForgeOperatorError, normalizeForgeRetailers, sortForgeProducts } from "../../../apps/forge/components/ProductManagerPanel.js";

const products = Array.from({ length: 200 }, (_, index) => ({
    identity: { atlasProductId: `ram_fixture_${String(index + 1).padStart(3, "0")}`, brand: index % 2 ? "Fixture B" : "Fixture A", manufacturer: "Fixture", manufacturerPartNumber: `MPN-${index + 1}`, displayName: `Fixture RAM ${index + 1}`, slug: `fixture-ram-${index + 1}`, recordRevision: 1 },
    governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" },
    extension: { data: { classification: { memoryType: index % 2 ? "DDR4" : "DDR5", formFactor: index % 3 ? "DIMM" : "SO_DIMM" }, capacity: { capacityGb: 32, moduleCount: 2, capacityPerModuleGb: 16 } } }
}));
const destination = { destinationId: "dest-1", atlasProductId: products[0].identity.atlasProductId, retailerId: "RETAILER-0001", marketplace: "amazon.com", destinationUrl: "https://www.amazon.com/dp/B000000001", retailerListingId: "B000000001", destinationType: "PRODUCT_PAGE", status: "ACTIVE", binding: { method: "OPERATOR_EXACT_PRODUCT_REVIEW" }, reviewedAt: "2026-10-08T00:00:00Z", reviewedBy: "fixture" };
const registeredRetailers = [{ id: "RETAILER-0001", name: "Amazon", status: "active", websiteUrl: "https://www.amazon.com" }, { id: "RETAILER-0004", name: "Newegg", status: "active", websiteUrl: "https://www.newegg.com" }];
const projection = createForgeProductManagerProjection({ asOf: "2026-10-08T00:00:00Z", products, retailers: registeredRetailers, destinationSource: { schemaVersion: "1.0", records: [destination], effective: [destination] }, currentSnapshot: { offers: [{ atlasProductId: products[0].identity.atlasProductId }] }, historicalObservations: [{ atlasProductId: products[0].identity.atlasProductId }] });
assert.equal(projection.products.length, 200);
assert.equal(projection.summary.productCount, 200);
assert.equal(projection.summary.destinationCount, 1);
assert.equal(projection.products[0].capacityInvariantValid, true);
assert.equal(projection.products[0].current.available, true);
assert.equal(projection.products[0].history.observationCount, 1);
assert.equal(projection.products[1].issues.includes("RETAILER_DESTINATION_MISSING"), true);
assert.equal(projection.readOnly, true);
assert.equal(projection.mutationAuthorized, false);
assert.equal(projection.capabilities.blockedBy, "AUTHENTICATED_TRUSTED_OPERATOR_RUNTIME_NOT_CONNECTED");
assert.deepEqual(projection.retailers.map(value => value.name), ["Amazon", "Newegg"]);
assert.deepEqual(normalizeForgeRetailers([null, projection.retailers[0]]), [projection.retailers[0]]);
assert.equal(forgeAffiliateSupport(projection.retailers[1]).supported, true);
assert.equal(forgeAffiliateSupport(projection.retailers[0]).supported, false);
assert.equal(extractForgeRetailerListing("https://www.newegg.com/p/N82E16800000001?Item=N82E16800000001", projection.retailers[1]), "N82E16800000001");
assert.deepEqual(parseForgeRetailerUrl("https://www.newegg.com/timetec/p/0RM-006H-000A7?Item=9SIA56XA8D1141",projection.retailers[1]),{retailerListingId:"9SIA56XA8D1141",retailerProductId:"0RM-006H-000A7"});
assert.deepEqual(parseForgeRetailerUrl("https://www.newegg.com/timetec/p/0RM-006H-000A7?item=9sia56xa8d1141&utm_source=fixture",projection.retailers[1]),{retailerListingId:"9SIA56XA8D1141",retailerProductId:"0RM-006H-000A7"});
assert.throws(()=>parseForgeRetailerUrl("https://www.newegg.com/timetec/p/0RM-006H-000A7?Item=9SIA56XA8D1141&option=unsafe",projection.retailers[1]),/unsupported option/);
assert.equal(extractForgeRetailerListing("https://www.amazon.com/example/dp/B000000001", projection.retailers[0]), "B000000001");
assert.throws(() => extractForgeRetailerListing("https://example.com/p/N82E16800000001", projection.retailers[1]), /exact Newegg HTTPS/);
assert.match(formatForgeOperatorError("RETAILER_DESTINATION_QUERY_UNSUPPORTED"), /unsupported option/);
assert.equal(filterForgeProducts(projection.products, { query: "MPN-1" }).length > 0, true);
assert.equal(filterForgeProducts(projection.products, { memory: "DDR5" }).length, 100);
assert.equal(filterForgeProducts(projection.products, { formFactor: "SO_DIMM" }).length, 67);
assert.equal(filterForgeProducts(projection.products, { capacity: 32 }).length, 200);
assert.equal(filterForgeProducts(projection.products, { lifecycle: "ACTIVE" }).length, 200);
assert.equal(filterForgeProducts(projection.products, { retailer: "RETAILER-0001" }).length, 1);
assert.equal(filterForgeProducts(projection.products, { retailer: "MISSING" }).length, 199);
assert.equal(sortForgeProducts(projection.products, "capacity").length, 200);
assert.equal(sortForgeProducts(projection.products, "name")[0].displayName, "Fixture RAM 1");

const boundary = new ForgeProductMutationBoundary();
assert.equal((await boundary.assess({ action: "CREATE_PRODUCT", operator: null, authenticated: false })).status, "UNAUTHORIZED");
assert.equal((await boundary.assess({ action: "ADD_DESTINATION", operator: "fixture", authenticated: true })).status, "RUNTIME_NOT_CONNECTED");
const canonicalProduct = JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url), "utf8"));
const connected = new ForgeProductMutationBoundary({ productRepository: { getAll: async () => [canonicalProduct] }, destinationRepository: {}, affiliateOwner: {}, auditRepository: {} });
assert.equal((await connected.assess({ action: "EDIT_PRODUCT", operator: "fixture", authenticated: true, product: canonicalProduct })).status, "READY_FOR_GOVERNED_EXECUTION");
const badCapacity = structuredClone(canonicalProduct); badCapacity.extension.data.capacity.capacityGb += 1;
assert.equal((await connected.assess({ action: "EDIT_PRODUCT", operator: "fixture", authenticated: true, product: badCapacity })).reasons.includes("ATLAS_CAPACITY_INVARIANT_FAILED"), true);
const duplicate = structuredClone(canonicalProduct); duplicate.identity.atlasProductId = "ram_fixture_duplicate"; duplicate.identity.slug = "fixture-duplicate";
assert.equal((await connected.assess({ action: "CREATE_PRODUCT", operator: "fixture", authenticated: true, product: duplicate })).reasons.includes("DUPLICATE_REPOSITORY_IDENTITY"), true);

const at = "2026-10-08T00:01:00Z";
const service = response => new GovernedRetailerLinkVerificationService({ request: async () => response, now: () => at, timeoutMs: 100 });
assert.equal((await service({ status: 200, url: "https://www.amazon.com/dp/B000000001" }).verify({ url: "https://www.amazon.com/dp/B000000001", expectedRetailerHost: "www.amazon.com", expectedListingId: "B000000001" })).status, "WORKING");
assert.equal((await service({ status: 200, url: "https://www.newegg.com/p/N82E16800000001" }).verify({ url: "https://newegg.com/p/N82E16800000001", expectedRetailerHost: "newegg.com", expectedListingId: "N82E16800000001" })).status, "REDIRECTED");
assert.equal((await service({ status: 200, url: "https://www.newegg.com/p/N82E16800000001" }).verify({ url: "https://www.amazon.com/dp/B000000001", expectedRetailerHost: "www.amazon.com", expectedListingId: "B000000001" })).status, "IDENTITY_REVIEW_REQUIRED");
assert.equal((await service({ status: 403, url: "https://www.amazon.com/dp/B000000001" }).verify({ url: "https://www.amazon.com/dp/B000000001" })).status, "BLOCKED_FROM_VERIFICATION");
assert.equal((await service({ status: 404, url: "https://www.amazon.com/dp/B000000001" }).verify({ url: "https://www.amazon.com/dp/B000000001" })).status, "BROKEN");
await assert.rejects(() => service({ status: 200, url: "https://localhost/item" }).verify({ url: "https://localhost/item" }), /PROHIBITED/);

const [html, app, component, shell, server, canonicalProducts] = await Promise.all([readFile(new URL("../../../apps/forge/index.html", import.meta.url), "utf8"), readFile(new URL("../../../apps/forge/app.js", import.meta.url), "utf8"), readFile(new URL("../../../apps/forge/components/ProductManagerPanel.js", import.meta.url), "utf8"), readFile(new URL("../../../apps/forge/components/ForgeShell.js", import.meta.url), "utf8"), readFile(new URL("../../../scripts/serve-forge-operator-preview.mjs", import.meta.url), "utf8"), new ProductRepository({ readJson: async resource => JSON.parse(await readFile(resource, "utf8")) }).getAll()]);
for (const token of ["Product Manager", "productManagerSearch", "productManagerRetailer", "Read-only by design", "productManagerSort", "productManagerPrevious"]) assert.match(html, new RegExp(token));
assert.match(app, /ProductManagerPanel/);
assert.match(app, /ForgeShell/);
assert.match(component, /trusted authenticated|authenticated trusted operator runtime/i);
assert.match(component, /Check Link/);
assert.match(component, /Correct draft product/);
assert.match(component, /Validate and save correction/);
assert.match(component, /Select a registered retailer/);
assert.match(component, /Validate and save retailer URL/);
assert.match(component, /Add affiliate URL/);
assert.match(component, /Disable affiliate URL/);
assert.match(component, /Registered retailer data is unavailable/);
assert.match(component, /operator-data\/product-manager\.json/);
for (const goal of ["Overview", "Products", "Retailer & Affiliate Links", "Market Operations", "Reviews & Exceptions", "Settings / Diagnostics"]) assert.match(shell, new RegExp(goal.replace("&", "&(?:amp;)?")));
assert.match(server, /127\.0\.0\.1/);
assert.match(server, /\["GET", "HEAD"\]/);
assert.doesNotMatch(server, /listen\([^,]+,\s*["']0\.0\.0\.0/);
const realCatalogProjection = createForgeProductManagerProjection({ asOf: "2026-10-08T00:00:00Z", products: canonicalProducts, destinationSource: { schemaVersion: "1.0", records: [], effective: [] }, currentSnapshot: { offers: [] }, historicalObservations: [] });
assert.equal(realCatalogProjection.products.length >= 158, true);
assert.equal(filterForgeProducts(realCatalogProjection.products, { query: "CORSAIR" }).length, 19);
console.log("Forge Product Manager and modern operator UX tests passed (46 cases).");
