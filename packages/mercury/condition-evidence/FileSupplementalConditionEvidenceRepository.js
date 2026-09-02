import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateSupplementalConditionEvidence } from "./SupplementalConditionEvidence.js";
const initial = () => ({ version: "1.0", records: {}, byObservation: {}, byPrimaryEvidence: {}, byProductRetailer: {} });
const clone = structuredClone, freeze = value => Object.freeze(value);
export class FileSupplementalConditionEvidenceRepository {
    constructor({ statePath } = {}) { if (!statePath) throw new TypeError("statePath is required."); this.statePath = resolve(statePath); this.queue = Promise.resolve(); }
    async _read() { try { const state = JSON.parse(await readFile(this.statePath, "utf8")); if (state?.version !== "1.0" || !state.records || !state.byObservation || !state.byPrimaryEvidence || !state.byProductRetailer) throw new Error(); return state; } catch (error) { if (error?.code === "ENOENT") return initial(); throw new Error("SUPPLEMENTAL_CONDITION_STATE_INVALID"); } }
    async _commit(state) { await mkdir(dirname(this.statePath), { recursive: true }); const temp = `${this.statePath}.tmp-${process.pid}-${Date.now()}`; await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, "utf8"); await rename(temp, this.statePath); }
    async _locked(fn) { const task = this.queue.then(fn, fn); this.queue = task.catch(() => {}); return task; }
    async retain(record) { const report = validateSupplementalConditionEvidence(record); if (!report.valid) throw new TypeError(report.errors.join(",")); return this._locked(async () => { const state = await this._read(), existing = state.records[record.supplementalEvidenceId]; if (existing) { if (existing.materialFingerprint !== record.materialFingerprint) throw new Error("SUPPLEMENTAL_CONDITION_EVIDENCE_CONFLICT"); return freeze({ status: "DUPLICATE", supplementalEvidenceId: record.supplementalEvidenceId }); } if (record.lifecycle.supersedesEvidenceId && !state.records[record.lifecycle.supersedesEvidenceId]) throw new Error("SUPPLEMENTAL_CONDITION_SUPERSEDED_EVIDENCE_NOT_FOUND"); state.records[record.supplementalEvidenceId] = clone(record); const add = (index, key) => { index[key] ??= []; index[key].push(record.supplementalEvidenceId); }; add(state.byObservation, record.binding.canonicalObservationId); add(state.byPrimaryEvidence, record.binding.primaryEvidenceId); add(state.byProductRetailer, `${record.product.atlasProductId}|${record.merchant.retailerId}`); await this._commit(state); return freeze({ status: "RETAINED", supplementalEvidenceId: record.supplementalEvidenceId }); }); }
    async getById(id) { const value = (await this._read()).records[id]; return value ? freeze(clone(value)) : null; }
    async _query(indexName, key) { const state = await this._read(); return freeze((state[indexName][key] ?? []).map(id => freeze(clone(state.records[id])))); }
    getByCanonicalObservation(id) { return this._query("byObservation", id); }
    getByPrimaryEvidence(id) { return this._query("byPrimaryEvidence", id); }
    getByProductRetailer(atlasProductId, retailerId) { return this._query("byProductRetailer", `${atlasProductId}|${retailerId}`); }
    async getAll() { const state = await this._read(); return freeze(Object.values(state.records).map(value => freeze(clone(value)))); }
}
export default FileSupplementalConditionEvidenceRepository;
