import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateRepository } from "../ProductValidator.js";
import RamRuleSet from "../../sentinel/extensions/ram/RamRuleSet.js";
import {
    D002_BLOCKED_MPNS,
    D002_EXISTING_ANCHOR_MPN,
    D002_RAM_LAUNCH_CANDIDATES
} from "./fixtures/D002RamLaunchCatalogFixtures.mjs";

const manifestUrl = new URL("../atlas-manifest.json", import.meta.url);
const anchorUrl = new URL("../products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url);
const manifest = JSON.parse(await readFile(fileURLToPath(manifestUrl), "utf8"));
const anchorBytes = await readFile(fileURLToPath(anchorUrl));
const anchor = JSON.parse(anchorBytes.toString("utf8"));
const records = D002_RAM_LAUNCH_CANDIDATES.map(({ record }) => record);
const requiredBrands = new Set(records.map(({ identity }) => identity.brand));
const registeredBrandIds = new Set(manifest.brands.map(({ brandId }) => brandId));

assert.equal(records.length, 21, "D-002 fixture batch must contain exactly 21 new READY candidates.");
assert.equal(manifest.counts.products, 1, "Fixture certification must not mutate production Atlas.");
assert.deepEqual(manifest.products.map(({ atlasProductId }) => atlasProductId), [
    "ram_corsair_cmk32gx5m2b6000z30"
]);
assert.equal(anchor.identity.manufacturerPartNumber, D002_EXISTING_ANCHOR_MPN);
assert.deepEqual(
    [...requiredBrands].filter((brand) => brand !== "Corsair").sort(),
    ["Crucial", "G.SKILL", "Kingston", "TeamGroup"],
    "Production admission must register the four non-Corsair brands through Atlas governance."
);
assert.deepEqual([...registeredBrandIds], [
    "BRAND-CORSAIR",
    "BRAND-CRUCIAL",
    "BRAND-GSKILL",
    "BRAND-KINGSTON",
    "BRAND-TEAMGROUP"
]);
assert.deepEqual(
    [...requiredBrands].filter((brand) => !registeredBrandIds.has(`BRAND-${brand.replaceAll(/[^A-Za-z0-9]+/g, "").toUpperCase()}`)),
    [],
    "Every D-002 fixture brand prerequisite must resolve canonically."
);
assert.equal(
    createHash("sha256").update(anchorBytes).digest("hex"),
    "566c05fe7481db350bf4be26e21489734d3245408f1c4aca08c2a9bb18628f99",
    "The existing Corsair anchor must remain byte-for-byte unchanged."
);

const report = validateRepository([anchor, ...records]);
assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));

const ids = records.map(({ identity }) => identity.atlasProductId);
const mpns = records.map(({ identity }) => identity.manufacturerPartNumber);
assert.equal(new Set(ids).size, 21, "All proposed Atlas IDs must be unique.");
assert.equal(new Set(mpns.map((mpn) => mpn.toLowerCase())).size, 21, "All proposed exact MPNs must be unique.");
assert.equal(mpns.includes(D002_EXISTING_ANCHOR_MPN), false, "The anchor must not be duplicated.");
for (const blockedMpn of D002_BLOCKED_MPNS) {
    assert.equal(mpns.includes(blockedMpn), false, `${blockedMpn} must remain outside D-002 admission.`);
}
assert.equal(mpns.includes("KF432C16BBK2/16"), true, "Slash punctuation must remain canonical.");
assert.equal(mpns.includes("KF436C16RB12K2/32"), true, "Slash punctuation must remain canonical.");
assert.equal(mpns.includes("KVR32N22D8/32"), true, "Slash punctuation must remain canonical.");
assert.equal(mpns.includes("KVR32S22S8/16"), true, "Slash punctuation must remain canonical.");

for (const product of records) {
    for (const rule of RamRuleSet.rules) {
        assert.equal(
            rule.validate(product).result,
            "PASS",
            `${product.identity.manufacturerPartNumber} failed ${rule.ruleId}`
        );
    }
    const { classification, capacity } = product.extension.data;
    assert.equal(capacity.capacityGb, capacity.moduleCount * capacity.capacityPerModuleGb);
    assert.equal(classification.buffering, "UNBUFFERED");
    assert.notEqual(classification.eccType, "SIDEBAND_ECC");
    assert.equal(product.governance.publicationStatus, "PENDING");
    assert.equal(product.governance.humanReviewRequired, true);
}

const counts = D002_RAM_LAUNCH_CANDIDATES.reduce((result, { slotId }) => {
    if (slotId.startsWith("DDR5-DESKTOP-")) result.ddr5Desktop += 1;
    else if (slotId.startsWith("DDR4-DESKTOP-")) result.ddr4Desktop += 1;
    else if (slotId.startsWith("SODIMM-")) result.sodimm += 1;
    return result;
}, { ddr5Desktop: 0, ddr4Desktop: 0, sodimm: 0 });
assert.deepEqual(counts, { ddr5Desktop: 8, ddr4Desktop: 6, sodimm: 7 });
assert.deepEqual(
    { ddr5Desktop: counts.ddr5Desktop + 1, ddr4Desktop: counts.ddr4Desktop, sodimm: counts.sodimm },
    { ddr5Desktop: 9, ddr4Desktop: 6, sodimm: 7 },
    "The certified batch plus the anchor must represent 22 of 24 launch slots."
);

for (const { slotId, record } of D002_RAM_LAUNCH_CANDIDATES) {
    const { classification } = record.extension.data;
    if (slotId.startsWith("DDR5-DESKTOP-")) {
        assert.deepEqual(
            [classification.memoryType, classification.formFactor, classification.applicationClass],
            ["DDR5", "DIMM", "DESKTOP"]
        );
    } else if (slotId.startsWith("DDR4-DESKTOP-")) {
        assert.deepEqual(
            [classification.memoryType, classification.formFactor, classification.applicationClass],
            ["DDR4", "DIMM", "DESKTOP"]
        );
    } else {
        assert.equal(classification.formFactor, "SO_DIMM");
        assert.equal(classification.applicationClass, "LAPTOP");
        assert.equal(["DDR4", "DDR5"].includes(classification.memoryType), true);
    }
}

const forbiddenKeys = new Set([
    "retailerId", "retailer", "price", "availability", "affiliate", "affiliateUrl",
    "publicationAuthority", "currentPrice", "cheapest", "pick"
]);
function assertNoMarketAuthority(value, path = "$") {
    if (Array.isArray(value)) {
        value.forEach((entry, index) => assertNoMarketAuthority(entry, `${path}[${index}]`));
        return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
        assert.equal(forbiddenKeys.has(key), false, `Forbidden market-authority field at ${path}.${key}`);
        assertNoMarketAuthority(child, `${path}.${key}`);
    }
}
records.forEach((record) => assertNoMarketAuthority(record));

console.log("D-002 RAM launch catalog fixture certification tests passed.");
