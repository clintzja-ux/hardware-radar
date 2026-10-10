import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRetailerDestination } from "../destinations/RetailerDestination.js";
import { ProductionFlatRetailerDestinationRepository } from "../destinations/ProductionFlatRetailerDestinationRepository.js";

const directory = await mkdtemp(join(tmpdir(), "forge-draft-destination-"));
const statePath = join(directory, "destinations.json");
await writeFile(statePath, `${JSON.stringify({ schemaVersion: "1.0", records: [] }, null, 2)}\n`);
const product = { identity: { atlasProductId: "ram_fixture_draft", manufacturerPartNumber: "FIX-DRAFT" }, governance: { lifecycleStatus: "DRAFT", publicationStatus: "PENDING" } };
const retailer = { id: "RETAILER-0004", name: "Newegg", websiteUrl: "https://www.newegg.com", status: "active" };
const products = { getById: async id => id === product.identity.atlasProductId ? structuredClone(product) : null, getAll: async () => [structuredClone(product)] };
const retailers = { getById: async id => id === retailer.id ? structuredClone(retailer) : null, getAll: async () => [structuredClone(retailer)] };
const repository = new ProductionFlatRetailerDestinationRepository({ statePath, productRepository: products, retailerRepository: retailers });
const destination = createRetailerDestination({
    atlasProductId: product.identity.atlasProductId,
    retailerId: retailer.id,
    marketplace: "newegg.com",
    destinationType: "PRODUCT_PAGE",
    destinationUrl: "https://www.newegg.com/p/N82E16800000001?Item=N82E16800000001&cm_sp=fixture",
    retailerListingId: "N82E16800000001",
    binding: { manufacturerPartNumber: "FIX-DRAFT", method: "OPERATOR_EXACT_PRODUCT_REVIEW", scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: ["fixture:operator-review"] },
    provenance: { sourceType: "OPERATOR_INSPECTED_PUBLIC_PAGE" },
    reviewedBy: "operator:fixture",
    reviewedAt: "2026-10-09T03:00:00.000Z",
    status: "ACTIVE",
    supersedesDestinationId: null,
    retirementReason: null,
    createdAt: "2026-10-09T03:00:00.000Z",
    createdBy: "operator:fixture"
});
assert.equal(destination.destinationUrl, "https://newegg.com/p/N82E16800000001");
assert.equal((await repository.retain(destination)).status, "RETAINED");
assert.equal((await repository.retain(destination)).status, "DUPLICATE");
assert.equal((await repository.getAll()).length, 1);
assert.equal(JSON.parse(await readFile(statePath, "utf8")).records.length, 1);
console.log("Forge DRAFT destination persistence passed (flat source, canonical URL, exact replay).");
