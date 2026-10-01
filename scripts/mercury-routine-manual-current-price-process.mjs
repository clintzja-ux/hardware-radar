import { createProductionRoutineManualCurrentPriceProcessingService } from "../packages/mercury/current-display/index.js";

const args=process.argv.slice(2),preparationIds=args.filter(value=>value.startsWith("--preparation-id=")).map(value=>value.slice("--preparation-id=".length)),get=name=>args.find(value=>value.startsWith(`${name}=`))?.slice(name.length+1);
if(!preparationIds.length||!get("--processed-at"))throw new Error("USAGE: --preparation-id=<id> [--preparation-id=<id> ...] --processed-at=<iso-time> [--processed-by=<operator>]");
const result=await (await createProductionRoutineManualCurrentPriceProcessingService()).processCohort({preparationIds,processedAt:get("--processed-at"),processedBy:get("--processed-by")??"ROUTINE_MANUAL_PROCESSOR"});
console.log("ROUTINE MANUAL CURRENT-PRICE PROCESSING");
console.log(`Attempted: ${result.attempted} | Progressed: ${result.routineProgressed} | Current: ${result.currentUpdated} | History: ${result.historyRetained} | Comparisons: ${result.comparisonsAvailable} | Already: ${result.alreadyProcessed} | Review: ${result.reviewRequired} | Incomplete: ${result.incomplete} | Failed safe: ${result.failedSafe}`);
for(const value of result.results)console.log(`${value.preparationId} | product=${value.atlasProductId??"UNKNOWN"} | retailer=${value.retailer??"UNKNOWN"} | ${value.status} | current=${value.current.status} | history=${value.history.status} | comparison=${value.comparison?.status??"NONE"}${value.exceptions.length?` | reason=${value.exceptions.join(",")} | next=${value.nextOperatorAction}`:""}`);
