import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ObservationRepository } from "../ObservationRepository.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const atlas = {
    async loadRepositories() {
        return {
            products: [{ identity: { atlasProductId: "ram_corsair_cmk32gx5m2b6000z30" } }],
            retailers: [{ id: "RETAILER-0001" }]
        };
    }
};

const repository = new ObservationRepository({
    manifestUrl: new URL("../mercury-manifest.json", import.meta.url),
    readJson,
    atlas
});

const entries = await repository.listObservationEntries();
assert.equal(entries.length, 1);
assert.equal(entries[0].observationId, "mer_obs_000000001");
assert.equal(Object.isFrozen(entries), true);

const observation = await repository.getById("MER_OBS_000000001");
assert.equal(observation.offer.price, 509.99);
assert.equal(Object.isFrozen(observation), true);
assert.equal(Object.isFrozen(observation.offer), true);
assert.equal(await repository.exists("mer_obs_000000001"), true);
assert.equal(await repository.exists("mer_obs_999999999"), false);

assert.equal((await repository.getByAtlasProductId("RAM_CORSAIR_CMK32GX5M2B6000Z30"))[0], observation);
assert.equal((await repository.getByRetailerId("retailer-0001"))[0], observation);
assert.equal((await repository.search("IN_STOCK"))[0], observation);

const validation = await repository.validate();
assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2));

const firstLoad = await repository.getAll();
const reloaded = await repository.reload();
assert.notEqual(firstLoad, reloaded);

await assert.rejects(repository.getById("mer_obs_999999999"), /Mercury observation not found/);
await assert.rejects(repository.search(""), /query must be a non-empty string/);

console.log("ObservationRepository tests passed.");
