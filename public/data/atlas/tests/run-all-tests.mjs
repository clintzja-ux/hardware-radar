const testModules = [
    "./BrandValidator.test.mjs",
    "./BrandRepository.test.mjs",
    "./CanonicalBrandRecord.test.mjs",
    "./ProductValidator.test.mjs",
    "./ProductRepository.test.mjs",
    "./CanonicalRamProduct.test.mjs"
];

console.log("Running Atlas test suite...\n");

for (const testModule of testModules) {
    await import(testModule);
}

console.log(`\nAtlas test suite passed: ${testModules.length} files.`);
