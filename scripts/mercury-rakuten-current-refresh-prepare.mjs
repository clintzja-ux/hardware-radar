import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { FileCurrentRefreshPlanRepository, prepareRakutenCurrentRefresh } from "../packages/mercury/current-refresh/index.js";

const args = new Map(process.argv.slice(2).map(value => { const at = value.indexOf("="); return at < 0 ? [value, true] : [value.slice(0, at), value.slice(at + 1)]; }));
const planId = String(args.get("--plan-id") ?? "");
const memberPath = path.resolve(String(args.get("--members") ?? ""));
const preparedAt = String(args.get("--prepared-at") ?? "");
if (!planId || !memberPath || !Number.isFinite(Date.parse(preparedAt))) throw new Error("--plan-id, --members and --prepared-at are required");
const stateRoot = path.resolve(String(args.get("--state-root") ?? ".forge-review/mercury/current-refresh"));
const plan = await new FileCurrentRefreshPlanRepository({ rootPath: stateRoot }).get(planId);
if (!plan) throw new Error("CURRENT_REFRESH_PLAN_NOT_FOUND");
const input = JSON.parse(await readFile(memberPath, "utf8"));
const preparation = prepareRakutenCurrentRefresh({ plan, members: input.members ?? input, preparedAt });
const outputRoot = path.join(stateRoot, "rakuten-preparations");
await mkdir(outputRoot, { recursive: true });
const outputPath = path.join(outputRoot, `${preparation.preparationId}.json`);
try { await writeFile(outputPath, `${JSON.stringify(preparation, null, 2)}\n`, { flag: "wx" }); } catch (error) { if (error?.code !== "EEXIST" || await readFile(outputPath, "utf8") !== `${JSON.stringify(preparation, null, 2)}\n`) throw error; }
console.log(JSON.stringify({ preparationId: preparation.preparationId, refreshPlanId: preparation.refreshPlanId, members: preparation.members.length, maximumProviderOperations: preparation.maximumProviderOperations, maximumSpendUsd: preparation.maximumSpendUsd, historyEligibility: "NO", networkOperation: "NONE", authority: "NONE" }, null, 2));
