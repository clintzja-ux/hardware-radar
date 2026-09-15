import {mainIdentityDiscoveryCommand} from "./mercury-products-identity-discovery-runtime.mjs";
mainIdentityDiscoveryCommand("dispose-taskless").catch(error=>{process.stderr.write(`${error.message}\n`);process.exitCode=1;});
