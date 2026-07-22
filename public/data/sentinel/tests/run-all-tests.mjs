const testModules = [
    "./DecisionAggregator.test.mjs",
    "./RuleRegistry.test.mjs",
    "./ValidationRunner.test.mjs"
];

console.log("Running Sentinel test suite...\n");

for (const testModule of testModules) {
    await import(testModule);
}

console.log(`\nSentinel test suite passed: ${testModules.length} files.`);
