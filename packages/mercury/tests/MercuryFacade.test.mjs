import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Mercury } from "../Mercury.js";
import { ObservationRepository } from "../ObservationRepository.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const repository = new ObservationRepository({
    manifestUrl: new URL("../mercury-manifest.json", import.meta.url),
    readJson
});
const mercury = new Mercury({ observations: repository });

assert.equal((await mercury.getObservation("mer_obs_000000001")).retailerId, "RETAILER-0001");
assert.equal((await mercury.getObservations()).length, 1);
assert.equal((await mercury.getObservationsByProduct("ram_corsair_cmk32gx5m2b6000z30")).length, 1);
assert.equal((await mercury.getObservationsByRetailer("RETAILER-0001")).length, 1);
assert.equal((await mercury.getManifest()).counts.observations, 1);

console.log("Mercury facade tests passed.");
