import path from "node:path";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {ProductRepository} from "../packages/atlas/index.js";
import {HistoricalRefreshCadencePolicyRepository} from "../packages/mercury/index.js";

const option=process.argv.slice(2).find(x=>x.startsWith("--policies="));
const policyUrls=option?option.slice("--policies=".length).split(",").filter(Boolean).map(x=>path.resolve(x)):undefined;
const readJson=async resource=>JSON.parse(await readFile(resource instanceof URL?fileURLToPath(resource):resource,"utf8"));
const repository=new HistoricalRefreshCadencePolicyRepository({...(policyUrls?{policyUrls}:{}),atlasProductRepository:new ProductRepository({readJson})});
const inventory=await repository.getInventory();
console.log("HISTORICAL REFRESH CADENCE POLICIES");
console.log("");
console.log("Policies:                 ",inventory.policyCount);
console.log("Enabled:                  ",inventory.enabledCount);
console.log("Disabled:                 ",inventory.disabledCount);
console.log("Explicit product scopes:  ",inventory.explicitProductScopeCount);
console.log("Ambiguous products:       ",inventory.ambiguousProducts.length);
console.log("Automatic execution:      ",inventory.automaticExecutionCount);
for(const policy of inventory.policies){console.log("");console.log(policy.policyId);console.log("  Interval:               ",policy.minimumIntervalMs??"NOT_CONFIGURED");console.log("  Enabled:                ",policy.enabled);console.log("  Automatic execution:    ",policy.automaticExecution);console.log("  Product count:          ",policy.atlasProductIds.length);}
console.log("");
console.log("Action executed:           NO");
console.log("Paid task created:         NO");
console.log("Actual spend:              $0.000");
