import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { validateAmazonHistoricalAcceptance } from "./AmazonHistoricalAcceptancePreparation.js";
const stable = value => JSON.stringify(value);
const freeze = value => { const copy=structuredClone(value); const deep=item=>{if(item&&typeof item==="object"&&!Object.isFrozen(item)){Object.freeze(item);for(const child of Object.values(item))deep(child);}return item;};return deep(copy); };
export class FileAmazonHistoricalAcceptanceRepository {
  constructor({ statePath } = {}) { if (!statePath) throw new TypeError("AMAZON_ACCEPTANCE_STATE_PATH_REQUIRED"); this.statePath = statePath; this.queue = Promise.resolve(); }
  async _read() { try { const value = JSON.parse(await readFile(this.statePath, "utf8")); if (value?.schemaVersion !== "1.0" || !Array.isArray(value.artifacts)) throw new Error("AMAZON_ACCEPTANCE_REPOSITORY_INVALID"); return value; } catch (error) { if (error?.code === "ENOENT") return { schemaVersion: "1.0", artifacts: [] }; throw error; } }
  async getById(id) { const rows = (await this._read()).artifacts.filter(row => row.acceptanceArtifactId === id); if (rows.length > 1) throw new Error("AMAZON_ACCEPTANCE_REPOSITORY_CONFLICT"); return rows[0] ? freeze(rows[0]) : null; }
  async record(value) { validateAmazonHistoricalAcceptance(value); const run = async () => { const state = await this._read(), prior = state.artifacts.find(row => row.acceptanceArtifactId === value.acceptanceArtifactId); if (prior) { if (stable(prior) !== stable(value)) throw new Error("AMAZON_ACCEPTANCE_ARTIFACT_CONFLICT"); return { status: "DUPLICATE", artifact: freeze(prior) }; } await mkdir(dirname(this.statePath), { recursive: true }); const next = { ...state, artifacts: [...state.artifacts, structuredClone(value)] }, temp = `${this.statePath}.${process.pid}.${crypto.randomUUID()}.tmp`; await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`); await rename(temp, this.statePath); return { status: "PREPARED", artifact: freeze(value) }; }; const result = this.queue.then(run, run); this.queue = result.catch(() => {}); return result; }
}
