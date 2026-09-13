import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHistoricalFactReplayRuntime, parseHistoricalFactReplayArgs } from "./mercury-historical-fact-replay-runtime.mjs";

const args = parseHistoricalFactReplayArgs(process.argv.slice(2));
const allowed = new Set(["--as-of", "--amazon-pilot-id", "--out", "--evidence-state", "--historical-state", "--decision-state", "--task-ledger", "--amazon-result-state", "--amazon-pilot-state", "--retention-state", "--sellers-proposal"]);
for (const key of args.keys()) if (!allowed.has(key)) throw new Error(`HISTORICAL_FACT_REPLAY_ARGUMENT_NOT_ALLOWED:${key}`);
const asOf = String(args.get("--as-of") || "").trim();
if (!asOf) throw new Error("HISTORICAL_FACT_REPLAY_AS_OF_REQUIRED");
if (!String(args.get("--amazon-pilot-id") || "").trim()) throw new Error("AMAZON_PILOT_ID_REQUIRED");
const outputPath = path.resolve(String(args.get("--out") || ".forge-review/mercury/historical-fact-replay-plan.json"));
const runtime = createHistoricalFactReplayRuntime(args);
const plan = await runtime.preparationService.prepare({ asOf });
const bytes = `${JSON.stringify(plan, null, 2)}\n`;
await mkdir(path.dirname(outputPath), { recursive: true });
try {
  await writeFile(outputPath, bytes, { encoding: "utf8", flag: "wx" });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  if (await readFile(outputPath, "utf8") !== bytes) throw new Error("HISTORICAL_FACT_REPLAY_PLAN_CONFLICT");
}
console.log("HISTORICAL FACT REPLAY PREPARE");
console.log("Replay plan:              ", plan.replayPlanId);
console.log("Policy:                   ", plan.factPolicyVersion);
for (const source of plan.sourceCohorts) console.log(`${source.sourceId}:`, `retained=${source.retainedCount} eligible=${source.factEligibleCount} new=${source.newFactCount} duplicate=${source.duplicateCount} blocked=${source.blockedCount}`);
console.log("Combined NEW_FACT:        ", plan.counts.newFacts);
console.log("Authorization created:    NO");
console.log("Historical writes:        0");
console.log("Provider calls:           0");
console.log("Paid tasks:               0");
console.log("Actual spend:             $0.000");
console.log("Plan path:                ", outputPath);
