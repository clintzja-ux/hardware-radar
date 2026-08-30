import assert from "node:assert/strict";
import { AdapterRegistry } from "../adapters/registry/AdapterRegistry.js";
import amazonAdapter from "../adapters/amazon/AmazonAdapter.js";
import dataForSeoGoogleShoppingAdapter from "../adapters/dataforseo/DataForSeoGoogleShoppingAdapter.js";

const registry = new AdapterRegistry([amazonAdapter]);
assert.equal(registry.has("mer_adapter_amazon_us"), true);
assert.equal(registry.get("MER_ADAPTER_AMAZON_US"), amazonAdapter);
assert.equal(registry.getByRetailerId("RETAILER-0001").length, 1);
assert.equal(registry.getByMarketplace("amazon.com").length, 1);
assert.equal(registry.getByCapability("NORMALIZE_OFFER").length, 1);
assert.equal(registry.getByVersion("1.1.0").length, 1);
assert.throws(() => registry.register(amazonAdapter), /Duplicate adapter registration/);
registry.register(dataForSeoGoogleShoppingAdapter);
assert.equal(registry.getByRetailerId("RETAILER-0002")[0], dataForSeoGoogleShoppingAdapter);

console.log("AdapterRegistry tests passed.");
