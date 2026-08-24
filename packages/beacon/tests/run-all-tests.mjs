const tests=["./ProductInterestSignal.test.mjs","./ProductInterestCadenceIsolation.test.mjs","./ProductInterestCli.test.mjs"];
console.log("Running Beacon test suite...\n");for(const test of tests)await import(test);console.log(`\nBeacon test suite passed: ${tests.length} files.`);
