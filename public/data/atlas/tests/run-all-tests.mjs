const testModules = [
    "./BrandValidator.test.mjs",
    "./BrandRepository.test.mjs",
    "./CanonicalBrandRecord.test.mjs",
    "./CategoryValidator.test.mjs",
    "./CategoryRepository.test.mjs",
    "./RetailerValidator.test.mjs",
    "./RetailerRepository.test.mjs",
    "./ProductValidator.test.mjs",
    "./ProductRepository.test.mjs",
    "./CanonicalRamProduct.test.mjs",
    "./ManifestValidator.test.mjs",
    "./RepositoryContract.test.mjs",
    "./AtlasFacade.test.mjs",
    "./AtlasIntegrityValidator.test.mjs"
];

console.log("Running Atlas test suite...\n");

for (const testModule of testModules) {
    await import(testModule);
}

console.log(`\nAtlas test suite passed: ${testModules.length} files.`);
