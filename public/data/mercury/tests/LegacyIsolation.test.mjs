import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../mercury-manifest.json", import.meta.url)), "utf8"));
const files = await readdir(fileURLToPath(new URL("../observations/", import.meta.url)));
const legacyFiles = files.filter((file) => /^PRICE-/.test(file));

assert.equal(legacyFiles.length, 3, "Historical legacy observations must remain preserved during M001.");
assert.equal(manifest.observations.every((entry) => entry.path.startsWith("observations/mer_obs_")), true);
assert.equal(manifest.observations.some((entry) => /^PRICE-/.test(entry.observationId)), false);

console.log("Mercury legacy isolation tests passed.");
