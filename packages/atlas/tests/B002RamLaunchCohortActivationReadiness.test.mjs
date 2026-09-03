import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { validateAtlasIntegrity } from "../AtlasIntegrityValidator.js";
import { validateRepository } from "../ProductValidator.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";
import { D002_RAM_LAUNCH_CANDIDATES } from "./fixtures/D002RamLaunchCatalogFixtures.mjs";
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
const canonicalById = new Map(canonicalProducts.map((product) => [product.identity.atlasProductId, product]));
const d002ById = new Map(D002_RAM_LAUNCH_CANDIDATES.map(({ record }) => [record.identity.atlasProductId, record]));
const anchorId = "ram_corsair_cmk32gx5m2b6000z30";
const anchorUrl = new URL("../products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url);
const anchorBytes = await readFile(anchorUrl);

assert.equal(B002_ACTIVATION_PRODUCT_IDS.length, 6);
assert.equal(new Set(B002_ACTIVATION_PRODUCT_IDS).size, 6);
assert.equal(B002_ACTIVATION_PRODUCT_IDS.includes(anchorId), false);
assert.equal(
    createHash("sha256").update(anchorBytes).digest("hex"),
    "566c05fe7481db350bf4be26e21489734d3245408f1c4aca08c2a9bb18628f99",
    "The existing Corsair anchor must remain byte-for-byte unchanged."
);

for (const atlasProductId of B002_ACTIVATION_PRODUCT_IDS) {
    const canonical = canonicalById.get(atlasProductId);
    const preTransition = d002ById.get(atlasProductId);
    assert.ok(canonical, `Missing canonical B-002A product ${atlasProductId}.`);
    assert.ok(preTransition, `Missing D-002 source fixture ${atlasProductId}.`);
    const expected = createB002ActivationFixture(preTransition);
    assert.deepEqual(canonical, expected, `${atlasProductId} differs from its exact authorized revision.`);
    assert.equal(canonical.identity.recordRevision, 2);
    assert.equal(canonical.identity.updatedAt, B002_ACTIVATION_REVIEWED_AT);
    assert.equal(canonical.identity.updatedBy, B002_ACTIVATION_REVIEWER);
    assert.equal(canonical.governance.lifecycleStatus, "ACTIVE");
    assert.equal(canonical.governance.publicationStatus, "READY");
    assert.equal(canonical.governance.engineeringValidationStatus, "PASS");
    assert.equal(canonical.governance.humanReviewRequired, false);
    assert.equal(canonical.governance.reviewedBy, B002_ACTIVATION_REVIEWER);
    assert.equal(canonical.governance.reviewedAt, B002_ACTIVATION_REVIEWED_AT);

    assert.equal(canonical.identity.atlasProductId, preTransition.identity.atlasProductId);
    assert.equal(canonical.identity.manufacturerPartNumber, preTransition.identity.manufacturerPartNumber);
    assert.equal(canonical.identity.brand, preTransition.identity.brand);
    assert.deepEqual(canonical.provenance, preTransition.provenance);
    assert.deepEqual(canonical.extension, preTransition.extension);

    const { classification, capacity } = canonical.extension.data;
    assert.equal(capacity.capacityGb, capacity.moduleCount * capacity.capacityPerModuleGb);
    assert.equal(classification.formFactor === "DIMM", classification.applicationClass === "DESKTOP");
    assert.equal(classification.formFactor === "SO_DIMM", classification.applicationClass === "LAPTOP");
    for (const rule of RamRuleSet.rules) {
        assert.equal(rule.validate(canonical).result, "PASS", `${atlasProductId} failed ${rule.ruleId}`);
    }
}

for (const [atlasProductId, preTransition] of d002ById) {
    if (B002_ACTIVATION_PRODUCT_IDS.includes(atlasProductId)) continue;
    assert.deepEqual(
        canonicalById.get(atlasProductId),
        preTransition,
        `Out-of-batch product ${atlasProductId} must remain unchanged from D-002B.`
    );
}

const productReport = validateRepository(canonicalProducts);
assert.equal(productReport.valid, true, JSON.stringify(productReport.errors, null, 2));
const integrityReport = validateAtlasIntegrity({ manifest, products: canonicalProducts, brands, categories, retailers });
assert.equal(integrityReport.valid, true, JSON.stringify(integrityReport.errors, null, 2));

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
B002_ACTIVATION_PRODUCT_IDS.forEach((atlasProductId) => assertNoDownstreamAuthority(canonicalById.get(atlasProductId)));

assert.throws(
    () => createB002ActivationFixture(canonicalById.get(anchorId)),
    /B002_PRODUCT_NOT_IN_AUTHORIZED_FIXTURE_BATCH/
);
assert.throws(
    () => createB002ActivationFixture(canonicalById.get(B002_ACTIVATION_PRODUCT_IDS[0])),
    /B002_PRODUCT_NOT_READY_FOR_ACTIVATION_REVIEW/
);

console.log("B-002A canonical RAM launch cohort activation certification tests passed.");
