import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRepository } from "../ProductValidator.js";
import { assessAtlasDraftActivationReadiness } from "../AtlasDraftActivation.js";
import { createRamCatalogProjection } from "../RamCatalogProjection.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";
import { createRamProductSitemapRoutes, generateRamDiscoveryLinks, generateRamProductPages } from "../../../scripts/ram-product-publishing.mjs";

const manifest = JSON.parse(await readFile(new URL("../atlas-manifest.json", import.meta.url), "utf8"));
const products = await Promise.all(manifest.products.map(async ({ path }) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"))));
const brands = await Promise.all(manifest.brands.map(async ({ path }) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"))));
const admitted = products.filter(product => product.identity.createdBy === "system:atlas-batch-006-draft-admission");
const destinations = JSON.parse(await readFile(new URL("../../mercury/destinations/production-destinations.json", import.meta.url), "utf8"));
const onboarding = JSON.parse(await readFile(new URL("./fixtures/AtlasBatch006DestinationOnboardingManifest.json", import.meta.url), "utf8"));

const expected = new Map([
  ["F4-3200C22S-16GRS", ["DDR4",16,1,16,3200,"SO_DIMM"]], ["F4-3200C16S-16GVK", ["DDR4",16,1,16,3200,"DIMM"]],
  ["F4-3200C16D-16GVKB", ["DDR4",16,2,8,3200,"DIMM"]], ["F4-3600C18D-16GVK", ["DDR4",16,2,8,3600,"DIMM"]],
  ["F4-3600C18D-32GVK", ["DDR4",32,2,16,3600,"DIMM"]], ["F4-2666C19S-32GRS", ["DDR4",32,1,32,2666,"SO_DIMM"]],
  ["F5-5600J3636C8GH2-FX5", ["DDR5",16,2,8,5600,"DIMM"]], ["F5-6000J3038F8GH2-FX5", ["DDR5",16,2,8,6000,"DIMM"]],
  ["F5-4800S4039A16GX1-RS", ["DDR5",16,1,16,4800,"SO_DIMM"]], ["TLZGD416G3200HC16FDC01", ["DDR4",16,2,8,3200,"DIMM"]],
  ["TED416G3200C22-S01", ["DDR4",16,1,16,3200,"SO_DIMM"]], ["FLBD516G5200HC40CDC01", ["DDR5",16,2,8,5200,"DIMM"]],
  ["TTCED432G3200HC16FDC01", ["DDR4",32,2,16,3200,"DIMM"]], ["FLBD516G6000HC38ADC01", ["DDR5",16,2,8,6000,"DIMM"]],
  ["TLZGD432G3600HC18JDC01", ["DDR4",32,2,16,3600,"DIMM"]], ["TED48G3200C22-S01", ["DDR4",8,1,8,3200,"SO_DIMM"]],
  ["CMK16GX5M1D6000Z38", ["DDR5",16,1,16,6000,"DIMM"]], ["CMSX32GX4M2A2666C18", ["DDR4",32,2,16,2666,"SO_DIMM"]],
  ["AGI240008UD138", ["DDR4",8,1,8,2400,"DIMM"]], ["AGI320A08UD138-ST", ["DDR4",8,1,8,3200,"DIMM"]],
  ["AGI240016UD138", ["DDR4",16,1,16,2400,"DIMM"]], ["AD4S26668G19-SGN", ["DDR4",8,1,8,2666,"SO_DIMM"]],
  ["JM3200HSE-16G", ["DDR4",16,1,16,3200,"SO_DIMM"]], ["JM3200HLE-16G", ["DDR4",16,1,16,3200,"DIMM"]],
  ["SP008GBLFU320X02", ["DDR4",8,1,8,3200,"DIMM"]], ["SP016GBLFU320X02", ["DDR4",16,1,16,3200,"DIMM"]],
  ["SP004GBLFU240X02", ["DDR4",4,1,4,2400,"DIMM"]], ["LD4AU008G-B3200GSST", ["DDR4",8,1,8,3200,"DIMM"]]
]);

assert.equal(manifest.counts.products, 199);
assert.equal(manifest.counts.brands, 14);
assert.equal(admitted.length, expected.size);
assert.equal(new Set(products.map(product => product.identity.atlasProductId)).size, products.length);
assert.equal(new Set(products.map(product => product.identity.manufacturerPartNumber.toUpperCase())).size, products.length);
assert.equal(validateRepository(products).valid, true);

for (const product of admitted) {
  const mpn = product.identity.manufacturerPartNumber;
  assert.ok(expected.has(mpn), mpn);
  const data = product.extension.data;
  assert.deepEqual([data.classification.memoryType,data.capacity.capacityGb,data.capacity.moduleCount,data.capacity.capacityPerModuleGb,data.performance.dataRateMtps,data.classification.formFactor], expected.get(mpn), mpn);
  assert.equal(data.capacity.capacityGb, data.capacity.moduleCount * data.capacity.capacityPerModuleGb, mpn);
  assert.ok(product.identity.recordRevision >= 1, mpn);
  const evidence = product.provenance.fieldSources["identity.manufacturerPartNumber"];
  assert.ok(evidence.some(source => source.sourceType.startsWith("MANUFACTURER_") && source.sourceLocator.startsWith("https://") && source.verificationStatus === "VERIFIED"), mpn);
  assert.ok(evidence.some(source => source.sourceType === "RETAILER_PAGE_REFERENCE_ONLY" && source.sourceLocator.includes("rakuten_catalog_c6a7566e5b46c08326622d7c")), mpn);
  assert.ok(["READY_TO_ACTIVATE", "ALREADY_ACTIVE"].includes(assessAtlasDraftActivationReadiness({ product, products, brands }).status), mpn);
  for (const rule of RamRuleSet.rules) assert.equal(rule.validate(product).result, "PASS", `${mpn}: ${rule.ruleId}`);
}

const establishedProducts = products.filter(product => product.identity.createdBy !== "system:atlas-batch-006-draft-admission");
const draftFixtures = admitted.map(product => {
  const fixture = structuredClone(product);
  fixture.governance.lifecycleStatus = "DRAFT";
  fixture.governance.publicationStatus = "PENDING";
  fixture.governance.humanReviewRequired = true;
  return fixture;
});
const activeFixtures = admitted.map(product => {
  const fixture = structuredClone(product);
  fixture.governance.lifecycleStatus = "ACTIVE";
  fixture.governance.publicationStatus = "READY";
  fixture.governance.humanReviewRequired = false;
  return fixture;
});
const draftProducts = [...establishedProducts, ...draftFixtures];
const publicCatalog = createRamCatalogProjection(draftProducts);
assert.equal(publicCatalog.productCount, 171);
assert.equal(draftFixtures.every(product => !publicCatalog.products.some(item => item.atlasProductId === product.identity.atlasProductId)), true);
const activatedCatalog = createRamCatalogProjection(activeFixtures);
assert.equal(activatedCatalog.productCount, admitted.length);
assert.equal(activeFixtures.every(product => activatedCatalog.products.some(item => item.atlasProductId === product.identity.atlasProductId)), true);
const unknown = structuredClone(admitted[0]);
unknown.governance.lifecycleStatus = "UNKNOWN";
unknown.governance.publicationStatus = "UNKNOWN";
assert.equal(createRamCatalogProjection([unknown]).productCount, 0);
assert.equal(destinations.records.length, 240);
assert.equal(admitted.every(product => !destinations.records.some(destination => destination.atlasProductId === product.identity.atlasProductId)), true);
assert.equal(onboarding.admittedProducts.length, admitted.length);
assert.equal(onboarding.admittedProducts.filter(item => item.classification === "APPROVED_DIRECT_NEWEGG_CANDIDATE").length, 17);
assert.equal(onboarding.admittedProducts.filter(item => item.classification === "MARKETPLACE_DESTINATION_DEFERRED").length, 11);
assert.equal(onboarding.deferredAdmission[0].mpn, "F4-3200C16S-8GVKB");

const output = await mkdtemp(path.join(tmpdir(), "hardware-radar-atlas-batch-006-"));
try {
  const publicRoot = fileURLToPath(new URL("../../../public/", import.meta.url));
  await mkdir(path.join(output,"ram"), { recursive:true });
  for (const file of ["ram/index.html","ddr4.html","ddr5.html","sodimm.html"]) {
    await cp(path.join(publicRoot,file), path.join(output,file), { recursive:false });
  }
  await generateRamDiscoveryLinks({ catalog:publicCatalog, outputDir:output });
  const generated = await generateRamProductPages({ catalog:publicCatalog, products:draftProducts, outputDir:output });
  assert.equal(generated.productCount, 171);
  const sitemapRoutes = createRamProductSitemapRoutes(establishedProducts.filter(product => product.governance.lifecycleStatus === "ACTIVE" && product.governance.publicationStatus === "READY"));
  assert.equal(sitemapRoutes.length, 171);
  for (const product of admitted) {
    assert.equal(generated.routes.some(route => route.path === `/ram/${product.identity.slug}/`), false, product.identity.atlasProductId);
    assert.equal(sitemapRoutes.some(route => route.path === `/ram/${product.identity.slug}/`), false, product.identity.atlasProductId);
    await assert.rejects(stat(path.join(output,"ram",product.identity.slug,"index.html")));
  }
  const discovery = await Promise.all(["ram/index.html","ddr4.html","ddr5.html","sodimm.html"].map(file => readFile(path.join(output,file),"utf8")));
  for (const product of admitted) assert.equal(discovery.some(html => html.includes(`/ram/${product.identity.slug}/`)), false, product.identity.atlasProductId);
} finally {
  await rm(output,{recursive:true,force:true});
}

console.log("Atlas Batch 006 admission and lifecycle-contract tests passed (28 identities; 1 evidence deferral)." );
