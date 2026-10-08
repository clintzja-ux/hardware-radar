import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createForgeProductManagerProjection, ForgeProductMutationBoundary, GovernedRetailerLinkVerificationService } from "../index.js";
import { filterForgeProducts } from "../../../apps/forge/components/ProductManagerPanel.js";

const products = Array.from({ length: 200 }, (_, index) => ({
    identity: { atlasProductId: `ram_fixture_${String(index + 1).padStart(3, "0")}`, brand: index % 2 ? "Fixture B" : "Fixture A", manufacturer: "Fixture", manufacturerPartNumber: `MPN-${index + 1}`, displayName: `Fixture RAM ${index + 1}`, slug: `fixture-ram-${index + 1}`, recordRevision: 1 },
    governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" },
    extension: { data: { classification: { memoryType: index % 2 ? "DDR4" : "DDR5", formFactor: index % 3 ? "DIMM" : "SO_DIMM" }, capacity: { capacityGb: 32, moduleCount: 2, capacityPerModuleGb: 16 } } }
}));
const destination = { destinationId: "dest-1", atlasProductId: products[0].identity.atlasProductId, retailerId: "RETAILER-0001", marketplace: "amazon.com", destinationUrl: "https://www.amazon.com/dp/B000000001", retailerListingId: "B000000001", destinationType: "PRODUCT_PAGE", status: "ACTIVE", binding: { method: "OPERATOR_EXACT_PRODUCT_REVIEW" }, reviewedAt: "2026-10-08T00:00:00Z", reviewedBy: "fixture" };
const projection = createForgeProductManagerProjection({ asOf: "2026-10-08T00:00:00Z", products, destinationSource: { schemaVersion: "1.0", records: [destination], effective: [destination] }, currentSnapshot: { offers: [{ atlasProductId: products[0].identity.atlasProductId }] }, historicalObservations: [{ atlasProductId: products[0].identity.atlasProductId }] });
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
assert.equal(filterForgeProducts(projection.products, { query: "MPN-1" }).length > 0, true);
assert.equal(filterForgeProducts(projection.products, { memory: "DDR5" }).length, 100);
assert.equal(filterForgeProducts(projection.products, { formFactor: "SO_DIMM" }).length, 67);
assert.equal(filterForgeProducts(projection.products, { capacity: 32 }).length, 200);
assert.equal(filterForgeProducts(projection.products, { lifecycle: "ACTIVE" }).length, 200);
assert.equal(filterForgeProducts(projection.products, { retailer: "RETAILER-0001" }).length, 1);
assert.equal(filterForgeProducts(projection.products, { retailer: "MISSING" }).length, 199);

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
assert.equal((await service({ status: 200, url: "https://www.newegg.com/p/N82E16800000001" }).verify({ url: "https://www.amazon.com/dp/B000000001", expectedRetailerHost: "www.amazon.com", expectedListingId: "B000000001" })).status, "IDENTITY_REVIEW_REQUIRED");
assert.equal((await service({ status: 403, url: "https://www.amazon.com/dp/B000000001" }).verify({ url: "https://www.amazon.com/dp/B000000001" })).status, "BLOCKED_FROM_VERIFICATION");
assert.equal((await service({ status: 404, url: "https://www.amazon.com/dp/B000000001" }).verify({ url: "https://www.amazon.com/dp/B000000001" })).status, "BROKEN");
await assert.rejects(() => service({ status: 200, url: "https://localhost/item" }).verify({ url: "https://localhost/item" }), /PROHIBITED/);

const [html, app, component] = await Promise.all([readFile(new URL("../../../apps/forge/index.html", import.meta.url), "utf8"), readFile(new URL("../../../apps/forge/app.js", import.meta.url), "utf8"), readFile(new URL("../../../apps/forge/components/ProductManagerPanel.js", import.meta.url), "utf8")]);
for (const token of ["Product Manager", "productManagerSearch", "productManagerRetailer", "Writes are disabled", "Check Link"]) assert.match(html, new RegExp(token));
assert.match(app, /ProductManagerPanel/);
assert.match(component, /authenticated operator runtime|Authenticated trusted operator runtime/);
assert.doesNotMatch(component, /fetch\s*\(/);
console.log("Forge Product Manager projection and safety tests passed (34 cases).");
