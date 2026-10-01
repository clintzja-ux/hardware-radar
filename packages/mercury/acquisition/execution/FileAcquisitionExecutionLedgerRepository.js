import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function clone(value) { return value == null ? value : structuredClone(value); }
function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key)=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }

export class FileAcquisitionExecutionLedgerRepository {
  constructor({ filePath } = {}) {
    if (!filePath) throw new TypeError("filePath is required.");
    this.filePath = resolve(filePath);
  }
  async _read() {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
      if (!parsed || parsed.schemaVersion !== "1.0" || !Array.isArray(parsed.runs)) throw new Error("INVALID_ACQUISITION_EXECUTION_LEDGER");
      return parsed;
    } catch (error) {
      if (error?.code === "ENOENT") return { schemaVersion: "1.0", runs: [] };
      throw error;
    }
  }
  async findByPlanId(planId) {
    const state = await this._read();
    const found = state.runs.find((run) => run.planId === planId) ?? null;
    return freeze(clone(found));
  }
  async getAll() {
    return freeze(clone((await this._read()).runs));
  }
  async append(run) {
    if (!run?.runId || !run?.planId) throw new TypeError("runId and planId are required.");
    const state = await this._read();
    const prior=state.runs.find((entry) => entry.planId === run.planId);
    if (prior) { if(stable(prior)!==stable(run)) throw new Error("ACQUISITION_EXECUTION_REPLAY_CONFLICT"); return freeze({ status: "DUPLICATE", run: clone(prior) }); }
    const next = { ...state, runs: [...state.runs, clone(run)] };
    await mkdir(dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    await rename(temp, this.filePath);
    return freeze({ status: "RECORDED", run: clone(run) });
  }
}

export default FileAcquisitionExecutionLedgerRepository;
