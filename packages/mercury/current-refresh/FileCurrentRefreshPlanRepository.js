import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateCurrentRefreshPlan } from "./CurrentRefreshPlan.js";

export class FileCurrentRefreshPlanRepository {
  constructor({ rootPath = path.resolve(".forge-review/mercury/current-refresh") } = {}) { this.rootPath = path.resolve(rootPath); }
  pathFor(planId) { return path.join(this.rootPath, `${planId}.json`); }
  async get(planId) { try { return JSON.parse(await readFile(this.pathFor(planId), "utf8")); } catch (error) { if (error?.code === "ENOENT") return null; throw error; } }
  async record(plan) {
    validateCurrentRefreshPlan(plan);
    const prior = await this.get(plan.planId);
    if (prior) { if (JSON.stringify(prior) !== JSON.stringify(plan)) throw new Error("CURRENT_REFRESH_PLAN_IMMUTABLE_CONFLICT"); return structuredClone(prior); }
    await mkdir(this.rootPath, { recursive: true });
    await writeFile(this.pathFor(plan.planId), `${JSON.stringify(plan, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    return structuredClone(plan);
  }
}
