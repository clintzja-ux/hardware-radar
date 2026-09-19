import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const empty = () => ({ schemaVersion: "1.0", records: [] });
export class FileManualCurrentPricePreparationRepository {
  constructor({ filePath } = {}) { if (!filePath) throw new TypeError("MANUAL_CURRENT_PRICE_REPOSITORY_PATH_REQUIRED"); this.filePath = path.resolve(filePath); }
  async #read() { try { const value = JSON.parse(await readFile(this.filePath, "utf8")); if (value?.schemaVersion !== "1.0" || !Array.isArray(value.records)) throw new Error(); return value; } catch (error) { if (error.code === "ENOENT") return empty(); throw new Error("MANUAL_CURRENT_PRICE_REPOSITORY_INVALID"); } }
  async record(value) { const state = await this.#read(), prior = state.records.find(row => row.preparationId === value.preparationId); if (prior) { if (JSON.stringify(prior) !== JSON.stringify(value)) throw new Error("MANUAL_CURRENT_PRICE_PREPARATION_CONFLICT"); return { status: "EXISTING", value: prior }; } state.records.push(structuredClone(value)); state.records.sort((a,b)=>a.preparationId.localeCompare(b.preparationId)); await mkdir(path.dirname(this.filePath), { recursive: true }); const temp = `${this.filePath}.tmp`; await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, "utf8"); await rename(temp, this.filePath); return { status: "CREATED", value }; }
  async getById(id) { return (await this.#read()).records.find(row => row.preparationId === id) ?? null; }
  async getAll() { return (await this.#read()).records; }
}
