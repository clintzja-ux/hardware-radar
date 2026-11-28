import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { validateRepository } from "../ProductValidator.js";
import { assessAtlasDraftActivationReadiness } from "../AtlasDraftActivation.js";
import { createRamCatalogProjection } from "../RamCatalogProjection.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";
import { generateRamProductPages } from "../../../scripts/ram-product-publishing.mjs";

const manifest = JSON.parse(await readFile(new URL("../atlas-manifest.json", import.meta.url), "utf8"));
const products = await Promise.all(manifest.products.map(async ({ path }) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"))));
const brands = await Promise.all(manifest.brands.map(async ({ path }) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"))));
const admitted = products.filter(product => product.identity.createdBy === "system:atlas-feed-expansion-batch-005");

const expected = new Map([
  ["KD58GU880-60A300L", ["DDR5", 16, 2, 8, 6000, "DIMM"]],
  ["KD5AGU880-60A300F", ["DDR5", 32, 2, 16, 6000, "DIMM"]],
  ["KD5AGU880-64B300K", ["DDR5", 16, 1, 16, 6400, "DIMM"]],
  ["KD5AGUA80-64B300V", ["DDR5", 32, 2, 16, 6400, "DIMM"]],
  ["KD5BGUA80-60A300I", ["DDR5", 64, 2, 32, 6000, "DIMM"]],
  ["CMSX32GX4M2A3200C22", ["DDR4", 32, 2, 16, 3200, "SO_DIMM"]],
  ["CMSX16GX5M1A4800C40", ["DDR5", 16, 1, 16, 4800, "SO_DIMM"]],
  ["CMSX16GX5M1A5600C48", ["DDR5", 16, 1, 16, 5600, "SO_DIMM"]],
  ["CMSX16GX5M2A4800C40", ["DDR5", 16, 2, 8, 4800, "SO_DIMM"]],
  ["CMSX16GX4M1A3200C22", ["DDR4", 16, 1, 16, 3200, "SO_DIMM"]],
  ["CMSX16GX4M2A2666C18", ["DDR4", 16, 2, 8, 2666, "SO_DIMM"]],
  ["CMH16GX5M1D6000Z38", ["DDR5", 16, 1, 16, 6000, "DIMM"]]
]);

assert.equal(manifest.counts.products, products.length);
assert.equal(admitted.length, expected.size);
assert.equal(new Set(admitted.map(product => product.identity.atlasProductId)).size, expected.size);
assert.equal(new Set(products.map(product => product.identity.manufacturerPartNumber.toUpperCase())).size, products.length);

for (const product of admitted) {
  const mpn = product.identity.manufacturerPartNumber;
  assert.ok(expected.has(mpn), mpn);
  const [memoryType, capacityGb, moduleCount, capacityPerModuleGb, dataRateMtps, formFactor] = expected.get(mpn);
  const { classification, capacity, performance } = product.extension.data;
  assert.deepEqual([classification.memoryType, capacity.capacityGb, capacity.moduleCount, capacity.capacityPerModuleGb, performance.dataRateMtps, classification.formFactor], [memoryType, capacityGb, moduleCount, capacityPerModuleGb, dataRateMtps, formFactor], mpn);
  assert.equal(capacity.capacityGb, capacity.moduleCount * capacity.capacityPerModuleGb, mpn);
  assert.equal(product.identity.recordRevision, 2, mpn);
  assert.equal(product.governance.lifecycleStatus, "ACTIVE", mpn);
  assert.equal(product.governance.publicationStatus, "READY", mpn);
  assert.equal(product.governance.humanReviewRequired, false, mpn);
  const mpnEvidence = product.provenance.fieldSources["identity.manufacturerPartNumber"];
  assert.ok(mpnEvidence.some(source => source.sourceType.startsWith("MANUFACTURER_") && source.sourceLocator.startsWith("https://") && source.verificationStatus === "VERIFIED"), mpn);
  assert.ok(mpnEvidence.some(source => source.sourceType === "RETAILER_PAGE_REFERENCE_ONLY" && source.sourceLocator.includes("rakuten_catalog_5e9d63b2ce6fc0413a9f37bb")), mpn);
  assert.equal(assessAtlasDraftActivationReadiness({ product, products, brands }).status, "ALREADY_ACTIVE", mpn);
  for (const rule of RamRuleSet.rules) assert.equal(rule.validate(product).result, "PASS", `${mpn}: ${rule.ruleId}`);
}

assert.equal(validateRepository(products).valid, true);
const publicCatalog = createRamCatalogProjection(products);
const eligibleProducts = products.filter(product =>
  product.governance.lifecycleStatus === "ACTIVE" &&
  product.governance.publicationStatus === "READY"
);
assert.equal(publicCatalog.productCount, eligibleProducts.length);
const historicalBatch005Products = products.filter(product => product.identity.createdBy !== "system:atlas-batch-006-draft-admission");
const historicalBatch005Catalog = createRamCatalogProjection(historicalBatch005Products);
assert.equal(historicalBatch005Products.length, 171);
assert.equal(historicalBatch005Catalog.productCount, 171);
assert.equal(admitted.every(product => historicalBatch005Catalog.products.some(item => item.atlasProductId === product.identity.atlasProductId)), true);
assert.equal(admitted.every(product => publicCatalog.products.some(item => item.atlasProductId === product.identity.atlasProductId)), true);
const draftLifecycle = structuredClone(admitted[0]);
draftLifecycle.governance.lifecycleStatus = "DRAFT";
draftLifecycle.governance.publicationStatus = "PENDING";
assert.equal(createRamCatalogProjection([draftLifecycle]).productCount, 0);
const unknownLifecycle = structuredClone(admitted[0]);
unknownLifecycle.governance.lifecycleStatus = "UNKNOWN";
unknownLifecycle.governance.publicationStatus = "UNKNOWN";
assert.equal(createRamCatalogProjection([unknownLifecycle]).productCount, 0);

const generationRoot = await mkdtemp(path.join(tmpdir(), "hardware-radar-atlas-batch-005-"));
try {
  const generation = await generateRamProductPages({
    catalog: publicCatalog,
    products,
    outputDir: generationRoot
  });
  assert.equal(generation.productCount, eligibleProducts.length);
  assert.equal(generation.routes.length, eligibleProducts.length);
  for (const product of admitted) {
    assert.equal(
      generation.routes.some((route) => route.path === `/ram/${product.identity.slug}/`),
      true,
      `${product.identity.manufacturerPartNumber} must receive a public route after activation`
    );
    await stat(path.join(generationRoot, "ram", product.identity.slug, "index.html"));
  }
  const readyProduct = products.find((product) =>
    product.governance.lifecycleStatus === "ACTIVE" &&
    product.governance.publicationStatus === "READY"
  );
  await stat(path.join(generationRoot, "ram", readyProduct.identity.slug, "index.html"));
} finally {
  await rm(generationRoot, { recursive: true, force: true });
}
console.log("Atlas feed-driven expansion Batch 005 regression tests passed (12 governed activations).");
