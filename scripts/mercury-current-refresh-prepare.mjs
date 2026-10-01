import { readFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository } from "../packages/atlas/index.js";
import { FileCurrentRefreshPlanRepository, prepareCurrentRefreshPlan } from "../packages/mercury/current-refresh/index.js";
import { calculateGovernedSpendForUtcDay } from "../packages/mercury/acquisition/planning/GovernedDailySpend.js";

const args = new Map(process.argv.slice(2).map(value => { const at = value.indexOf("="); return at < 0 ? [value, true] : [value.slice(0, at), value.slice(at + 1)]; }));
const asOf = String(args.get("--as-of") ?? "");
if (!Number.isFinite(Date.parse(asOf))) throw new Error("--as-of=<ISO_TIMESTAMP> is required");
const location = (name, fallback) => path.resolve(String(args.get(name) ?? fallback));
const currentPath = location("--current-state", ".forge-review/retail-display/current-display-snapshots.json");
const destinationPath = location("--destination-state", "packages/mercury/destinations/production-destinations.json");
const inventoryPath = location("--manual-inventory", ".forge-review/retail-display/manual-increment-inventory.json");
const historyPath = location("--history-state", ".forge-review/mercury/historical-observations.json");
const executionPath = location("--execution-state", ".forge-review/acquisition/execution-ledger.json");
const outputRoot = location("--output-root", ".forge-review/mercury/current-refresh");
const readJson = async file => JSON.parse(await readFile(file, "utf8"));
const [products, current, destinations, inventory, history, executions] = await Promise.all([
  new ProductRepository({ readJson }).getAll(), readJson(currentPath), readJson(destinationPath), readJson(inventoryPath), readJson(historyPath), readJson(executionPath)
]);
const reusableAmazonProductIds = [...new Set((history.observations ?? []).filter(value => value?.provenance?.source === "DATAFORSEO_AMAZON" && value?.provenance?.acquisition?.governedAsin).map(value => value.atlasProductId))];
const plan = prepareCurrentRefreshPlan({ products, currentSnapshot: current.current, destinations: destinations.records ?? destinations, manualInventory: inventory.items ?? [], reusableAmazonProductIds, asOf, currentUtcDaySpendUsd: calculateGovernedSpendForUtcDay(executions.runs ?? [], asOf), requestedMaximumMembers: Number(args.get("--maximum-members") ?? 50) });
await new FileCurrentRefreshPlanRepository({ rootPath: outputRoot }).record(plan);
console.log(JSON.stringify({ planId: plan.planId, state: "PREPARED_ZERO_AUTHORITY", asOf: plan.asOf, snapshot: plan.currentSnapshotId, expiring: plan.expiryBuckets, selected: plan.selectedMembers.length, blocked: plan.blockedMembers.length, maximumPaidTasks: plan.costEnvelope.maximumPaidTasks, maximumSpendUsd: plan.costEnvelope.maximumSpendUsd, utcDayRemainingUsd: plan.costEnvelope.remainingUtcDayCapacityUsd, manualRequired: plan.selectedMembers.filter(value => value.proposedLane.startsWith("MANUAL_")).length, reviewRequired: plan.selectedMembers.filter(value => value.manualReviewRequired).length, destinationExceptions: plan.destinationExceptions.length, providerCalls: 0, paidTasksCreated: 0, actualSpendUsd: 0, authority: "NONE" }, null, 2));
