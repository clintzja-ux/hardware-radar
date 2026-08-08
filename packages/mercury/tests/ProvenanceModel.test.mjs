import assert from "node:assert/strict";
import { createProvenance, PROVENANCE_SCHEMA_VERSION } from "../Provenance.js";

const provenance = createProvenance({
    source: { name: "Amazon product detail page", uri: "https://www.amazon.com/dp/B0CBRJ63RT", marketplace: "amazon.com" },
    acquisition: { method: "MANUAL", retrievedAt: "2026-08-08T17:00:00Z", retrievedBy: "human:test", requestId: null, rawPayloadReference: null },
    transformation: { adapterId: "mer_adapter_amazon_us", adapterVersion: "mer_adapter_amazon_us@1.0.0", normalizedAt: "2026-08-08T17:00:00Z" },
    validation: { validatorVersion: "mercury-observation-validator-1.0.0", complianceRuleSetVersion: "sentinel-mercury-draft-0.1" }
});

assert.equal(provenance.schemaVersion, PROVENANCE_SCHEMA_VERSION);
assert.equal(provenance.source.marketplace, "amazon.com");
assert.equal(provenance.acquisition.method, "MANUAL");
assert.equal(provenance.transformation.adapterId, "mer_adapter_amazon_us");
assert.equal(Object.isFrozen(provenance), true);
assert.equal(Object.isFrozen(provenance.source), true);
assert.throws(() => createProvenance({}), /source.name/);

console.log("Provenance model tests passed.");
