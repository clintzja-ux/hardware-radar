import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../mercury-manifest.json", import.meta.url)), "utf8"));
const canonicalFiles = await readdir(fileURLToPath(new URL("../observations/", import.meta.url)));
const legacyFiles = await readdir(fileURLToPath(new URL("../legacy/observations/", import.meta.url)));

assert.equal(canonicalFiles.some((file) => /^PRICE-/.test(file)), false, "Legacy PRICE records must not remain in the canonical observation directory.");
assert.equal(legacyFiles.filter((file) => /^PRICE-/.test(file)).length, 3, "Historical legacy observations must remain preserved in the legacy archive.");
assert.equal(manifest.observations.every((entry) => entry.path.startsWith("observations/mer_obs_")), true);
assert.equal(manifest.observations.some((entry) => /^PRICE-/.test(entry.observationId)), false);

console.log("Mercury legacy isolation tests passed.");
