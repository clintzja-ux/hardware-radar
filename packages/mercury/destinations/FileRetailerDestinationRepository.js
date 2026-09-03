import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assessRetailerDestinationBinding, retailerDestinationKey, validateRetailerDestination } from "./RetailerDestination.js";

const VERSION = "1.0";
const initial = () => ({ version: VERSION, records: {}, byKey: {}, byProduct: {}, byRetailer: {} });
const clone = structuredClone;
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };

export class FileRetailerDestinationRepository {
    constructor({ statePath, productRepository, retailerRepository } = {}) {
        if (!statePath || !productRepository?.getById || !retailerRepository?.getById) throw new TypeError("RETAILER_DESTINATION_REPOSITORY_DEPENDENCIES_REQUIRED");
        this.statePath = resolve(statePath);
        this.productRepository = productRepository;
        this.retailerRepository = retailerRepository;
        this.queue = Promise.resolve();
    }

    async _read() {
        try {
            const state = JSON.parse(await readFile(this.statePath, "utf8"));
            if (state?.version !== VERSION || !state.records || !state.byKey || !state.byProduct || !state.byRetailer) throw new Error();
            for (const [id, record] of Object.entries(state.records)) {
                const report = validateRetailerDestination(record);
                const occurrences = index => (index ?? []).filter(value => value === id).length;
                if (!report.valid || record.destinationId !== id || occurrences(state.byKey[retailerDestinationKey(record)]) !== 1 || occurrences(state.byProduct[record.atlasProductId]) !== 1 || occurrences(state.byRetailer[record.retailerId]) !== 1) throw new Error();
                if (record.supersedesDestinationId) {
                    const predecessor = state.records[record.supersedesDestinationId];
                    if (!predecessor || predecessor.status !== "ACTIVE" || retailerDestinationKey(predecessor) !== retailerDestinationKey(record)) throw new Error();
                }
            }
            for (const index of [state.byKey, state.byProduct, state.byRetailer]) for (const ids of Object.values(index)) if (!Array.isArray(ids) || ids.some(id => !state.records[id])) throw new Error();
            for (const [atlasProductId, ids] of Object.entries(state.byProduct)) if (ids.some(id => state.records[id].atlasProductId !== atlasProductId)) throw new Error();
            for (const [retailerId, ids] of Object.entries(state.byRetailer)) if (ids.some(id => state.records[id].retailerId !== retailerId)) throw new Error();
            for (const [key, ids] of Object.entries(state.byKey)) {
                const records = ids.map(id => state.records[id]);
                if (records.some(record => retailerDestinationKey(record) !== key)) throw new Error();
                const superseded = new Set(records.map(record => record.supersedesDestinationId).filter(Boolean));
                const heads = records.filter(record => !superseded.has(record.destinationId));
                if (heads.length !== 1) throw new Error();
                for (const record of records) {
                    const visited = new Set(); let cursor = record;
                    while (cursor?.supersedesDestinationId) { if (visited.has(cursor.destinationId)) throw new Error(); visited.add(cursor.destinationId); cursor = state.records[cursor.supersedesDestinationId]; }
                }
            }
            return state;
        } catch (error) {
            if (error?.code === "ENOENT") return initial();
            throw new Error("RETAILER_DESTINATION_STATE_INVALID");
        }
    }

    async _commit(state) {
        await mkdir(dirname(this.statePath), { recursive: true });
        const temporary = `${this.statePath}.tmp-${process.pid}-${Date.now()}`;
        await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
        await rename(temporary, this.statePath);
    }

    async _locked(operation) {
        const task = this.queue.then(operation, operation);
        this.queue = task.catch(() => {});
        return task;
    }

    _heads(state, key) {
        const records = (state.byKey[key] ?? []).map(id => state.records[id]);
        const superseded = new Set(records.map(record => record.supersedesDestinationId).filter(Boolean));
        return records.filter(record => !superseded.has(record.destinationId));
    }

    async retain(destination) {
        const report = validateRetailerDestination(destination);
        if (!report.valid) throw new TypeError(report.errors.join(","));
        let product = null, retailer = null;
        try { product = await this.productRepository.getById(destination.atlasProductId); } catch {}
        try { retailer = await this.retailerRepository.getById(destination.retailerId); } catch {}
        const binding = assessRetailerDestinationBinding({ destination, product, retailer });
        const bindingErrors = binding.reasons.filter(reason => reason !== "RETAILER_DESTINATION_RETIRED");
        if (bindingErrors.length) throw new Error(bindingErrors.join(","));
        return this._locked(async () => {
            const state = await this._read();
            const existing = state.records[destination.destinationId];
            if (existing) {
                if (existing.materialFingerprint !== destination.materialFingerprint) throw new Error("RETAILER_DESTINATION_REPLAY_CONFLICT");
                return freeze({ status: "DUPLICATE", destinationId: destination.destinationId });
            }
            const key = retailerDestinationKey(destination);
            const heads = this._heads(state, key);
            if (heads.length > 1) throw new Error("RETAILER_DESTINATION_ACTIVE_HEAD_CONFLICT");
            if (destination.supersedesDestinationId) {
                const predecessor = state.records[destination.supersedesDestinationId];
                if (!predecessor) throw new Error("RETAILER_DESTINATION_PREDECESSOR_NOT_FOUND");
                if (retailerDestinationKey(predecessor) !== key) throw new Error("RETAILER_DESTINATION_SUPERSESSION_BINDING_MISMATCH");
                if (predecessor.status !== "ACTIVE" || heads.length !== 1 || heads[0].destinationId !== predecessor.destinationId) throw new Error("RETAILER_DESTINATION_SUPERSESSION_PREDECESSOR_NOT_EFFECTIVE");
            } else if (heads.length) {
                throw new Error("RETAILER_DESTINATION_PARALLEL_ACTIVE_CONFLICT");
            }
            state.records[destination.destinationId] = clone(destination);
            const add = (index, indexKey) => { index[indexKey] ??= []; index[indexKey].push(destination.destinationId); };
            add(state.byKey, key);
            add(state.byProduct, destination.atlasProductId);
            add(state.byRetailer, destination.retailerId);
            await this._commit(state);
            return freeze({ status: "RETAINED", destinationId: destination.destinationId });
        });
    }

    async getById(destinationId) { const record = (await this._read()).records[destinationId]; return record ? freeze(clone(record)) : null; }
    async _query(index, key) { const state = await this._read(); return freeze((state[index][key] ?? []).map(id => freeze(clone(state.records[id])))); }
    getByProduct(atlasProductId) { return this._query("byProduct", atlasProductId); }
    getByRetailer(retailerId) { return this._query("byRetailer", retailerId); }
    getByProductRetailerMarketplace(atlasProductId, retailerId, marketplace) { return this._query("byKey", `${atlasProductId}|${retailerId}|${String(marketplace).toLowerCase().replace(/^www\./, "")}`); }
    async getAll() { const state = await this._read(); return freeze(Object.values(state.records).sort((a, b) => a.destinationId.localeCompare(b.destinationId)).map(record => freeze(clone(record)))); }
    async getEffective(atlasProductId, retailerId, marketplace) {
        const state = await this._read();
        const key = `${atlasProductId}|${retailerId}|${String(marketplace).toLowerCase().replace(/^www\./, "")}`;
        const heads = this._heads(state, key);
        if (heads.length > 1) throw new Error("RETAILER_DESTINATION_ACTIVE_HEAD_CONFLICT");
        return heads.length === 1 && heads[0].status === "ACTIVE" ? freeze(clone(heads[0])) : null;
    }
}

export default FileRetailerDestinationRepository;
