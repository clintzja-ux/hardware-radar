import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateRakutenCurrentRefreshPreparation } from "../packages/mercury/current-refresh/index.js";

const args = new Map(process.argv.slice(2).map(value => { const at = value.indexOf("="); return at < 0 ? [value, true] : [value.slice(0, at), value.slice(at + 1)]; }));
const preparationId = String(args.get("--preparation-id") ?? "");
if (!preparationId) throw new Error("--preparation-id is required");
const root = path.resolve(String(args.get("--state-root") ?? ".forge-review/mercury/current-refresh"));
const preparation = JSON.parse(await readFile(path.join(root, "rakuten-preparations", `${preparationId}.json`), "utf8"));
validateRakutenCurrentRefreshPreparation(preparation);
console.log(JSON.stringify({ preparationId, refreshPlanId: preparation.refreshPlanId, members: preparation.members, maximumProviderOperations: preparation.maximumProviderOperations, maximumSpendUsd: preparation.maximumSpendUsd, historyEligibility: "NO", providerCallBoundary: "OPERATOR_AUTHORIZATION_REQUIRED", authority: "NONE", networkOperation: "NONE" }, null, 2));
