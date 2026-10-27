import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ForgeTrustedOperatorService } from "../index.js";

const at = "2026-10-09T03:00:00.000Z";
const fixture = JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url), "utf8"));
fixture.identity.recordRevision = 1;
fixture.governance.lifecycleStatus = "DRAFT";
fixture.governance.publicationStatus = "PENDING";

let stored = structuredClone(fixture), destinations = [], auditSequence = 0;
const catalogRepository = {
    getById: async id => id === stored.identity.atlasProductId ? structuredClone(stored) : null,
    updateProduct: async (product, { expectedRevision }) => {
        if (stored.identity.recordRevision !== expectedRevision) throw new Error("ATLAS_PRODUCT_STALE_REVISION");
        if (stored.identity.atlasProductId !== product.identity.atlasProductId || stored.identity.manufacturerPartNumber !== product.identity.manufacturerPartNumber) throw new Error("ATLAS_PRODUCT_IDENTITY_IMMUTABLE");
        stored = structuredClone(product);
        return { status: "UPDATED", atlasProductId: stored.identity.atlasProductId, recordRevision: stored.identity.recordRevision };
    }
};
const service = new ForgeTrustedOperatorService({
    catalogRepository,
    destinationRepository: { getAll: async () => structuredClone(destinations), retain: async () => ({ status: "RETAINED" }) },
    affiliateOwner: { apply: async () => ({ status: "RETAINED" }) },
    linkVerifier: { verify: async () => ({ status: "WORKING" }) },
    auditRepository: { getAll: async () => [], record: async input => ({ record: { ...input, auditId: `audit-${++auditSequence}` } }) },
    now: () => at
});
const context = { authenticated: true, operatorId: "operator:fixture" };
const request = (product, expectedRevision, suffix) => ({ action: "EDIT_PRODUCT", requestId: `request-draft-${suffix}`, confirmation: "CONFIRM EDIT_PRODUCT", payload: { product, expectedRevision } });

const corrected = structuredClone(stored);
corrected.identity.displayName = "Corrected fixture name";
corrected.identity.modelName = "Corrected fixture name";
corrected.identity.slug = "corrected-fixture-name";
corrected.extension.data.classification.formFactor = "SO_DIMM";
corrected.extension.data.classification.moduleType = "SO_DIMM";
corrected.extension.data.classification.applicationClass = "LAPTOP";
corrected.identity.recordRevision = 2;
assert.equal((await service.editProduct(context, request(corrected, 1, "success-001"))).result.status, "UPDATED");
assert.equal(stored.identity.manufacturerPartNumber, fixture.identity.manufacturerPartNumber);
assert.equal(stored.identity.atlasProductId, fixture.identity.atlasProductId);
assert.equal(stored.extension.data.classification.formFactor, "SO_DIMM");

const boundChange = structuredClone(stored);
boundChange.identity.displayName = "Blocked bound draft";
boundChange.identity.modelName = "Blocked bound draft";
boundChange.identity.slug = "blocked-bound-draft";
boundChange.identity.recordRevision = 3;
destinations = [{ atlasProductId: stored.identity.atlasProductId }];
await assert.rejects(() => service.editProduct(context, request(boundChange, 2, "bound-0001")), /ATLAS_DRAFT_CORRECTION_REQUIRES_UNBOUND_DRAFT/);

destinations = [];
stored.governance.lifecycleStatus = "ACTIVE";
stored.governance.publicationStatus = "READY";
const activeBroad = structuredClone(stored);
activeBroad.identity.displayName = "Blocked active change";
activeBroad.identity.modelName = "Blocked active change";
activeBroad.identity.slug = "blocked-active-change";
activeBroad.identity.recordRevision = 3;
await assert.rejects(() => service.editProduct(context, request(activeBroad, 2, "active-0001")), /ATLAS_DRAFT_CORRECTION_REQUIRES_UNBOUND_DRAFT/);

const activePerformance = structuredClone(stored);
activePerformance.extension.data.performance.dataRateMtps += 200;
activePerformance.identity.recordRevision = 3;
assert.equal((await service.editProduct(context, request(activePerformance, 2, "performance-1"))).result.status, "UPDATED");

const identityChange = structuredClone(stored);
identityChange.identity.manufacturerPartNumber = "CHANGED-MPN";
identityChange.identity.recordRevision = 4;
await assert.rejects(() => service.editProduct(context, request(identityChange, 3, "identity-001")), /ATLAS_PRODUCT_IDENTITY_IMMUTABLE|ATLAS_PRODUCT/);

console.log("Forge governed DRAFT correction tests passed (unbound, bound, active, performance, identity).");
