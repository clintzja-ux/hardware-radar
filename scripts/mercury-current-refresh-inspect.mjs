import path from "node:path";
import { FileCurrentRefreshPlanRepository, validateCurrentRefreshPlan } from "../packages/mercury/current-refresh/index.js";
const args = new Map(process.argv.slice(2).map(value => { const at = value.indexOf("="); return at < 0 ? [value, true] : [value.slice(0, at), value.slice(at + 1)]; }));
const planId = String(args.get("--plan-id") ?? "");
if (!/^mer_currentrefresh_[a-f0-9]{24}$/.test(planId)) throw new Error("--plan-id=<PLAN_ID> is required");
const plan = await new FileCurrentRefreshPlanRepository({ rootPath: path.resolve(String(args.get("--state-root") ?? ".forge-review/mercury/current-refresh")) }).get(planId);
if (!plan) throw new Error("CURRENT_REFRESH_PLAN_NOT_FOUND");
validateCurrentRefreshPlan(plan);
console.log(JSON.stringify(plan, null, 2));
