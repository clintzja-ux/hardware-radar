import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";
import { VALIDATION_RESULTS } from "../../sentinel/types/ValidationResult.js";

const productUrl = new URL(
    "../products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json",
    import.meta.url
);
const product = JSON.parse(await readFile(fileURLToPath(productUrl), "utf8"));

for (const rule of RamRuleSet.rules) {
    const result = rule.validate(product);
    assert.equal(
        result.result,
        VALIDATION_RESULTS.PASS,
        `${rule.ruleId} failed: ${JSON.stringify(result.evidence, null, 2)}`
    );
}

assert.equal(product.extension.data.performance.bandwidthGbps, 48);
assert.equal(
    product.extension.data.capacity.capacityGb,
    product.extension.data.capacity.moduleCount * product.extension.data.capacity.capacityPerModuleGb
);

console.log("Canonical RAM product tests passed.");
