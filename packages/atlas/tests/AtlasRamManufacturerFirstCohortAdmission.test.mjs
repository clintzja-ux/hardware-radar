import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateRepository } from "../ProductValidator.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../atlas-manifest.json", import.meta.url)), "utf8"));
const products = await Promise.all(manifest.products.map(async ({ path }) => JSON.parse(await readFile(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8"))));
const cohort = products.filter(product => product.identity.createdBy === "system:atlas-ram-manufacturer-first-cohort-admission-p1");

assert.equal(cohort.length, 21);
assert.equal(new Set(cohort.map(product => product.identity.atlasProductId)).size, 21);
assert.equal(new Set(cohort.map(product => product.identity.manufacturerPartNumber.toUpperCase())).size, 21);
assert.deepEqual([...new Set(cohort.map(product => product.identity.brand))].sort(), ["KLEVV", "Lexar", "Silicon Power", "Timetec"]);
assert.equal(cohort.filter(product => product.extension.data.classification.memoryType === "DDR5").length, 21);
assert.equal(cohort.filter(product => product.extension.data.classification.formFactor === "DIMM").length, 3);
assert.equal(cohort.filter(product => product.extension.data.classification.formFactor === "SO_DIMM").length, 18);

for (const product of cohort) {
  const { capacity } = product.extension.data;
  assert.equal(capacity.capacityGb, capacity.moduleCount * capacity.capacityPerModuleGb);
  assert.equal(product.governance.lifecycleStatus, "DRAFT");
  assert.equal(product.governance.publicationStatus, "PENDING");
  assert.equal(product.governance.humanReviewRequired, true);
  assert.equal(product.governance.reviewedBy, null);
  for (const references of Object.values(product.provenance.fieldSources)) {
    assert.ok(references.every(reference => reference.verificationStatus === "VERIFIED"));
    assert.ok(references.every(reference => reference.sourceType.startsWith("MANUFACTURER_")));
  }
  for (const rule of RamRuleSet.rules) assert.equal(rule.validate(product).result, "PASS", `${product.identity.atlasProductId} failed ${rule.ruleId}`);
}

assert.equal(validateRepository(products).valid, true);
console.log("Atlas RAM manufacturer-first cohort admission tests passed (21 DRAFT/PENDING records).");
