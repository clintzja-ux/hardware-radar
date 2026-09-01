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

assert.equal(manifest.counts.brands, 5);
assert.equal(manifest.counts.products, 1, "D-002A must not admit product fixtures.");
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
