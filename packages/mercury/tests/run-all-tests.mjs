const testModules = [
    "./SchemaContract.test.mjs",
    "./CanonicalObservation.test.mjs",
    "./ObservationValidator.test.mjs",
    "./ManifestValidator.test.mjs",
    "./ObservationRepository.test.mjs",
    "./MercuryFacade.test.mjs",
    "./LegacyIsolation.test.mjs",
    "./AdapterValidator.test.mjs",
    "./AdapterRegistry.test.mjs",
    "./AmazonAdapter.test.mjs",
    "./AdapterIsolation.test.mjs",
    "./ProvenanceModel.test.mjs",
    "./ProvenanceValidator.test.mjs",
    "./ProvenanceIntegration.test.mjs",
    "./FreshnessPolicy.test.mjs",
    "./FreshnessValidator.test.mjs",
    "./FreshnessEngine.test.mjs",
    "./FreshnessIntegration.test.mjs",
    "./ConfidencePolicy.test.mjs",
    "./ConfidenceValidator.test.mjs",
    "./ConfidenceEvidence.test.mjs",
    "./ConfidenceEngine.test.mjs",
    "./ConfidenceIntegration.test.mjs"
];

console.log("Running Mercury test suite...\n");
for (const testModule of testModules) await import(testModule);
console.log(`\nMercury test suite passed: ${testModules.length} files.`);
