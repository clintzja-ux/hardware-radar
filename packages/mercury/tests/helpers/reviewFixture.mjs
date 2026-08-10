export function makeObservation(observationId, {
  sourceMethod = "TEST_FIXTURE",
  licenseContext = "TEST_FIXTURE",
  observedAt = "2026-08-10T15:00:00Z"
} = {}) {
  return {
    observationId,
    schemaVersion: "1.1",
    atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
    retailerId: "RETAILER-0001",
    marketplace: "amazon.com",
    observationTime: observedAt,
    sourceMethod,
    lifecycleStatus: "RETRIEVED",
    validationStatus: "PASS",
    supersedesObservationId: null,
    expiresAt: null,
    offer: { price: 99.99, currency: "USD", availability: "IN_STOCK", condition: "NEW", sellerType: "RETAILER", sourceUrl: "https://example.test/item", shipping: {}, discount: {}, affiliate: {} },
    provenance: {
      schemaVersion: "1.0",
      source: { name: "fixture", uri: "https://example.test/item", marketplace: "amazon.com" },
      acquisition: { method: sourceMethod, retrievedAt: observedAt, retrievedBy: "test", requestId: "review-fixture", rawPayloadReference: null },
      transformation: { adapterId: "test", adapterVersion: "1", normalizedAt: observedAt },
      validation: { validatorVersion: "1", complianceRuleSetVersion: "1" }
    },
    compliance: { licenseContext },
    metadata: {}
  };
}
