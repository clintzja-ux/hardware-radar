import path from "node:path";
import { FileManualCurrentPricePreparationRepository } from "../packages/mercury/current-display/index.js";
const arg=process.argv.slice(2).find(value=>value.startsWith("--preparation-id="));
if(!arg)throw new Error("USAGE: --preparation-id=<id>");
const preparationId=arg.slice("--preparation-id=".length),value=await new FileManualCurrentPricePreparationRepository({filePath:path.resolve(".forge-review/retail-display/manual-current-price-preparations.json")}).getById(preparationId);
if(!value)throw new Error(`MANUAL_CURRENT_PRICE_PREPARATION_NOT_FOUND:${preparationId}`);
console.log(JSON.stringify(value,null,2));
