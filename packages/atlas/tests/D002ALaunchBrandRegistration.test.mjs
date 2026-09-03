import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BrandRepository } from "../BrandRepository.js";
import { validateBrandRepository } from "../BrandValidator.js";
import { D002_RAM_LAUNCH_CANDIDATES } from "./fixtures/D002RamLaunchCatalogFixtures.mjs";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const manifestUrl = new URL("../atlas-manifest.json", import.meta.url);
const manifest = await readJson(manifestUrl);
const repository = new BrandRepository({ manifestUrl, readJson });
const brands = await repository.getAll();
const corsairBytes = await readFile(fileURLToPath(new URL("../brands/corsair.json", import.meta.url)));
const expectedBrandDigests = {
    "corsair.json": "5d1fb0aaf886ea8f57049ce6d883ce4d225dede803d932ebd4b1b5c0750ce0e8",
    "crucial.json": "33b96f051833a6c38c02f38d46f0df4e7289362ceae3573721c7b8caf6fc7b0e",
    "gskill.json": "0a9ae7da023db3422ec0214178cf43da01befc49264c47b71a69c0ed139167ac",
    "kingston.json": "a9bc0c269088bd57c180ce65deed69195f4575369b4b72cd863d2a477df48aa2",
    "teamgroup.json": "7047e189e26b3bdc5e1784eea168f94a45be0a7dc5a98acda2a082a41042e992"
};

assert.equal(manifest.counts.brands, 5);
assert.ok(manifest.counts.products >= 22, "The D-002B product batch must remain present after later governed admissions.");
assert.equal(brands.length, 5);
assert.equal(validateBrandRepository(brands).valid, true);
assert.equal(new Set(brands.map(({ brandId }) => brandId)).size, 5);
assert.equal(new Set(brands.map(({ displayName }) => displayName.toLowerCase())).size, 5);
assert.equal(new Set(brands.map(({ legalName }) => legalName.toLowerCase())).size, 5);
assert.equal((await repository.getById("BRAND-GSKILL")).displayName, "G.SKILL");
assert.equal((await repository.getByDisplayName("G.SKILL")).brandId, "BRAND-GSKILL");
assert.equal(
    createHash("sha256").update(corsairBytes).digest("hex"),
    "5d1fb0aaf886ea8f57049ce6d883ce4d225dede803d932ebd4b1b5c0750ce0e8",
    "Existing Corsair brand record must remain byte-for-byte unchanged."
);
for (const [filename, expectedDigest] of Object.entries(expectedBrandDigests)) {
    const bytes = await readFile(fileURLToPath(new URL(`../brands/${filename}`, import.meta.url)));
    assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        expectedDigest,
        `${filename} must remain byte-for-byte unchanged during D-002B.`
    );
}

const brandsByDisplayName = new Map(brands.map((brand) => [brand.displayName, brand]));
for (const { record } of D002_RAM_LAUNCH_CANDIDATES) {
    assert.equal(
        brandsByDisplayName.has(record.identity.brand),
        true,
        `Missing canonical brand for ${record.identity.brand}.`
    );
}

const serialized = JSON.stringify(brands);
for (const prohibited of ["retailerId", "price", "availability", "affiliate", "publicationAuthority", "currentPrice", "cheapest", "pick"]) {
    assert.equal(serialized.includes(`\"${prohibited}\"`), false, `Brand registry must not create ${prohibited}.`);
}

console.log("D-002A canonical launch brand registration tests passed.");
