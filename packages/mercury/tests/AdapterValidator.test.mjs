import assert from "node:assert/strict";
import amazonAdapter from "../adapters/amazon/AmazonAdapter.js";
import { ADAPTER_MANIFEST } from "../adapters/adapter-manifest.js";
import { validateAdapter, validateAdapterManifest } from "../adapters/AdapterValidator.js";

const retailerIds = new Set(["retailer-0001", "retailer-0002"]);
assert.equal(validateAdapter(amazonAdapter, { retailerIds }).valid, true);
assert.equal(validateAdapterManifest(ADAPTER_MANIFEST, { retailerIds }).valid, true);

const bad = { ...ADAPTER_MANIFEST.adapters[0], retailerId: "RETAILER-9999" };
const report = validateAdapterManifest({ frameworkVersion: "1.0.0", adapters: [bad] }, { retailerIds });
assert.equal(report.valid, false);
assert.equal(report.errors.some((error) => error.code === "UNKNOWN_RETAILER"), true);

console.log("AdapterValidator tests passed.");
