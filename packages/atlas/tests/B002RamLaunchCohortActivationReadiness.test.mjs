import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateAtlasIntegrity } from "../AtlasIntegrityValidator.js";
import { validateRepository } from "../ProductValidator.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";
import {
    B002_ACTIVATION_PRODUCT_IDS,
    B002_ACTIVATION_REVIEWED_AT,
    B002_ACTIVATION_REVIEWER,
    createB002ActivationFixture
} from "./fixtures/B002RamLaunchCohortActivationFixtures.mjs";

const manifest = JSON.parse(await readFile(new URL("../atlas-manifest.json", import.meta.url), "utf8"));
const readManifestRecords = async (entries) => Promise.all(entries.map(async ({ path }) =>
    JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"))
));
const canonicalProducts = await readManifestRecords(manifest.products);
const brands = await readManifestRecords(manifest.brands);
const categories = await readManifestRecords(manifest.categories);
const retailers = await readManifestRecords(manifest.retailers);
const canonicalBefore = JSON.stringify(canonicalProducts);
const retailerBefore = JSON.stringify(retailers);
const anchorUrl = new URL("../products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url);
const anchorBefore = await readFile(anchorUrl);
const anchorDigest = createHash("sha256").update(anchorBefore).digest("hex");

assert.equal(B002_ACTIVATION_PRODUCT_IDS.length, 6);
assert.equal(new Set(B002_ACTIVATION_PRODUCT_IDS).size, 6);
assert.equal(B002_ACTIVATION_PRODUCT_IDS.includes("ram_corsair_cmk32gx5m2b6000z30"), false);

const sourceById = new Map(canonicalProducts.map((product) => [product.identity.atlasProductId, product]));
const sourceProducts = B002_ACTIVATION_PRODUCT_IDS.map((atlasProductId) => {
    const product = sourceById.get(atlasProductId);
    assert.ok(product, `Missing canonical B-002 candidate ${atlasProductId}.`);
    assert.equal(product.governance.lifecycleStatus, "DRAFT");
    assert.equal(product.governance.publicationStatus, "PENDING");
    assert.equal(product.governance.engineeringValidationStatus, "PASS");
    assert.equal(product.governance.humanReviewRequired, true);
    assert.equal(product.governance.reviewedBy, null);
    assert.equal(product.governance.reviewedAt, null);
    assert.match(product.governance.changeReason, /operator review/i);
    return product;
});

const activatedProducts = sourceProducts.map(createB002ActivationFixture);
const activatedById = new Map(activatedProducts.map((product) => [product.identity.atlasProductId, product]));
const hypotheticalRepository = canonicalProducts.map((product) =>
    activatedById.get(product.identity.atlasProductId) ?? product
);

const productReport = validateRepository(hypotheticalRepository);
assert.equal(productReport.valid, true, JSON.stringify(productReport.errors, null, 2));
const integrityReport = validateAtlasIntegrity({
    manifest,
    products: hypotheticalRepository,
    brands,
    categories,
    retailers
});
assert.equal(integrityReport.valid, true, JSON.stringify(integrityReport.errors, null, 2));

for (const [index, product] of activatedProducts.entries()) {
    const source = sourceProducts[index];
    assert.equal(product.identity.atlasProductId, source.identity.atlasProductId);
    assert.equal(product.identity.manufacturerPartNumber, source.identity.manufacturerPartNumber);
    assert.equal(product.identity.brand, source.identity.brand);
    assert.equal(product.identity.recordRevision, source.identity.recordRevision + 1);
    assert.equal(product.identity.updatedAt, B002_ACTIVATION_REVIEWED_AT);
    assert.equal(product.identity.updatedBy, B002_ACTIVATION_REVIEWER);
    assert.equal(product.governance.lifecycleStatus, "ACTIVE");
    assert.equal(product.governance.publicationStatus, "READY");
    assert.equal(product.governance.engineeringValidationStatus, "PASS");
    assert.equal(product.governance.humanReviewRequired, false);
    assert.equal(product.governance.reviewedBy, B002_ACTIVATION_REVIEWER);
    assert.equal(product.governance.reviewedAt, B002_ACTIVATION_REVIEWED_AT);
    assert.deepEqual(product.provenance, source.provenance);
    assert.deepEqual(product.extension, source.extension);

    const { classification, capacity } = product.extension.data;
    assert.equal(capacity.capacityGb, capacity.moduleCount * capacity.capacityPerModuleGb);
    assert.equal(classification.formFactor === "DIMM", classification.applicationClass === "DESKTOP");
    assert.equal(classification.formFactor === "SO_DIMM", classification.applicationClass === "LAPTOP");
    for (const rule of RamRuleSet.rules) {
        assert.equal(rule.validate(product).result, "PASS", `${product.identity.atlasProductId} failed ${rule.ruleId}`);
    }
}

const forbiddenKeys = new Set([
    "retailerId", "retailer", "price", "availability", "rights", "acquisitionAuthority",
    "publicationAuthority", "currentPrice", "cheapest", "pick", "recommendation"
]);
function assertNoDownstreamAuthority(value, path = "$") {
    if (Array.isArray(value)) {
        value.forEach((entry, index) => assertNoDownstreamAuthority(entry, `${path}[${index}]`));
        return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
        assert.equal(forbiddenKeys.has(key), false, `Forbidden downstream-authority field at ${path}.${key}`);
        assertNoDownstreamAuthority(child, `${path}.${key}`);
    }
}
activatedProducts.forEach((product) => assertNoDownstreamAuthority(product));

assert.equal(JSON.stringify(canonicalProducts), canonicalBefore, "Fixture construction must not mutate Atlas products.");
assert.equal(JSON.stringify(retailers), retailerBefore, "Fixture construction must not mutate Atlas retailers.");
const anchorAfter = await readFile(fileURLToPath(anchorUrl));
assert.equal(createHash("sha256").update(anchorAfter).digest("hex"), anchorDigest);
assert.deepEqual(
    hypotheticalRepository.filter(({ identity }) => !B002_ACTIVATION_PRODUCT_IDS.includes(identity.atlasProductId)),
    canonicalProducts.filter(({ identity }) => !B002_ACTIVATION_PRODUCT_IDS.includes(identity.atlasProductId)),
    "No product outside the exact B-002 batch may change."
);

assert.throws(
    () => createB002ActivationFixture(sourceById.get("ram_corsair_cmk32gx5m2b6000z30")),
    /B002_PRODUCT_NOT_IN_AUTHORIZED_FIXTURE_BATCH/
);
assert.throws(
    () => createB002ActivationFixture({
        ...sourceProducts[0],
        governance: { ...sourceProducts[0].governance, lifecycleStatus: "ACTIVE" }
    }),
    /B002_PRODUCT_NOT_READY_FOR_ACTIVATION_REVIEW/
);

console.log("B-002 RAM launch cohort activation readiness fixture tests passed.");
