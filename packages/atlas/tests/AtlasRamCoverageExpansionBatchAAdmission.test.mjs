import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateRepository } from "../ProductValidator.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../atlas-manifest.json", import.meta.url)), "utf8"));
const products = await Promise.all(manifest.products.map(async ({ path }) => JSON.parse(await readFile(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8"))));
const admitted = products.filter(product => product.identity.createdBy === "system:atlas-ram-coverage-expansion-batch-a-p1");

assert.equal(admitted.length, 25);
assert.equal(new Set(admitted.map(product => product.identity.atlasProductId)).size, 25);
assert.equal(new Set(admitted.map(product => product.identity.manufacturerPartNumber.toUpperCase())).size, 25);
assert.deepEqual([...new Set(admitted.map(product => product.identity.brand))].sort(), ["KLEVV", "Lexar", "PNY", "Patriot", "Transcend", "XPG"]);
assert.equal(admitted.filter(product => product.extension.data.classification.memoryType === "DDR4").length, 17);
assert.equal(admitted.filter(product => product.extension.data.classification.memoryType === "DDR5").length, 8);
assert.equal(admitted.filter(product => product.extension.data.classification.formFactor === "DIMM").length, 12);
assert.equal(admitted.filter(product => product.extension.data.classification.formFactor === "SO_DIMM").length, 13);

const forbiddenKeys = new Set(["retailerId", "retailer", "price", "availability", "shipping", "affiliateUrl", "destinationUrl"]);
function assertNoMarketData(value, path = "$") {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoMarketData(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenKeys.has(key), false, `Forbidden market field at ${path}.${key}`);
    assertNoMarketData(child, `${path}.${key}`);
  }
}

for (const product of admitted) {
  const { classification, capacity } = product.extension.data;
  assert.equal(capacity.capacityGb, capacity.moduleCount * capacity.capacityPerModuleGb);
  assert.equal(product.governance.lifecycleStatus, "DRAFT");
  assert.equal(product.governance.publicationStatus, "PENDING");
  assert.equal(product.governance.humanReviewRequired, true);
  assert.ok(["DDR4", "DDR5"].includes(classification.memoryType));
  for (const references of Object.values(product.provenance.fieldSources)) {
    assert.ok(references.every(reference => reference.verificationStatus === "VERIFIED"));
    assert.ok(references.every(reference => reference.sourceType.startsWith("MANUFACTURER_")));
  }
  for (const rule of RamRuleSet.rules) assert.equal(rule.validate(product).result, "PASS", `${product.identity.atlasProductId} failed ${rule.ruleId}`);
  assertNoMarketData(product);
}

assert.equal(validateRepository(products).valid, true);
console.log("ATLAS RAM coverage expansion Batch A admission tests passed (25 records).");
