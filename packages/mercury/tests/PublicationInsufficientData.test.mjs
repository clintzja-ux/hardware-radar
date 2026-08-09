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
const snapshot = await service.createSnapshot({ observations: [observation], products: [product], retailers: [retailer], generatedAt: "2026-08-08T23:00:00Z" });
for (const scope of Object.values(snapshot.scopes)) {
  assert.equal(scope.status, "INSUFFICIENT_DATA");
  assert.equal(scope.cheapest, null);
}
console.log("Publication insufficient-data tests passed.");
