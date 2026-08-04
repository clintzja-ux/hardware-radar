const testModules = [
    "./SchemaContract.test.mjs",
    "./CanonicalObservation.test.mjs",
    "./ObservationValidator.test.mjs",
    "./ManifestValidator.test.mjs",
    "./ObservationRepository.test.mjs",
    "./MercuryFacade.test.mjs",
    "./LegacyIsolation.test.mjs"
];

console.log("Running Mercury test suite...\n");
for (const testModule of testModules) await import(testModule);
console.log(`\nMercury test suite passed: ${testModules.length} files.`);
