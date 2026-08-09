import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Mercury } from "../Mercury.js";
import { MarketPublicationService } from "../publication/MarketPublicationService.js";

const read = async (url) => JSON.parse(await readFile(fileURLToPath(url), "utf8"));
const observation = await read(new URL("../observations/mer_obs_000000001.json", import.meta.url));
const product = await read(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url));
const retailer = await read(new URL("../../atlas/retailers/RETAILER-0001-amazon.json", import.meta.url));
const service = new MarketPublicationService({ mercury: new Mercury() });
const snapshot = await service.createSnapshot({ observations: [observation], products: [product], retailers: [retailer], generatedAt: "2026-07-15T20:45:00Z" });
assert.equal(snapshot.scopes.overall.status, "AVAILABLE");
assert.equal(snapshot.scopes.ddr5.status, "AVAILABLE");
assert.equal(snapshot.scopes.ddr4.status, "INSUFFICIENT_DATA");
assert.equal(snapshot.scopes.overall.cheapest.observationId, "mer_obs_000000001");
assert.equal(snapshot.scopes.overall.cheapest.atlasProductId, "ram_corsair_cmk32gx5m2b6000z30");
assert.equal(snapshot.scopes.overall.cheapest.price, 509.99);
console.log("Market publication service tests passed.");
