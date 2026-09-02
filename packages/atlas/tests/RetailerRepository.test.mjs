import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { RetailerRepository } from "../RetailerRepository.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const repository = new RetailerRepository({
    manifestUrl: new URL("../atlas-manifest.json", import.meta.url),
    readJson
});

const entries = await repository.listRetailerEntries();
assert.equal(entries.length, 3);
assert.equal(entries[0].retailerId, "RETAILER-0001");
assert.equal(entries[1].retailerId, "RETAILER-0002");
assert.equal(entries[2].retailerId, "RETAILER-0003");
assert.equal(Object.isFrozen(entries), true);

const retailer = await repository.loadRetailer("RETAILER-0001");
assert.equal(retailer.name, "Amazon");
assert.equal(Object.isFrozen(retailer), true);
assert.equal(Object.isFrozen(retailer.affiliateProgram), true);

const platinummicro = await repository.loadRetailer("RETAILER-0002");
assert.equal(platinummicro.name, "Platinummicro");
assert.equal(platinummicro.websiteUrl, "https://platinummicro.com");
assert.equal(await repository.getBySlug("PLATINUMMICRO"), platinummicro);
assert.equal(await repository.getByName("platinummicro"), platinummicro);
const memoryc = await repository.loadRetailer("RETAILER-0003");
assert.equal(memoryc.name, "MemoryC");
assert.equal(memoryc.websiteUrl, "https://www.memoryc.com");
assert.equal(memoryc.affiliateProgram.available, false);
assert.equal(memoryc.affiliateProgram.status, "unknown");
assert.equal(await repository.getBySlug("MEMORYC"), memoryc);
assert.equal(await repository.getByName("memoryc"), memoryc);

assert.equal(await repository.getById("retailer-0001"), retailer);
assert.equal(await repository.getBySlug("AMAZON"), retailer);
assert.equal(await repository.getByName("amazon"), retailer);
assert.equal(await repository.exists("RETAILER-0001"), true);
assert.equal(await repository.exists("RETAILER-9999"), false);

const searchResults = await repository.search("USD");
assert.equal(searchResults.length, 3);
assert.equal(searchResults[0], retailer);

const validationReport = await repository.validate();
assert.equal(validationReport.valid, true);

const firstLoad = await repository.getAll();
const reloaded = await repository.reload();
assert.notEqual(reloaded, firstLoad);

await assert.rejects(repository.loadRetailer("RETAILER-9999"), /Atlas retailer not found/);
await assert.rejects(repository.getBySlug(""), /slug must be a non-empty string/);
console.log("RetailerRepository tests passed.");
