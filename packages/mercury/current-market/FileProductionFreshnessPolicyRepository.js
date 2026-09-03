import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ProductionFreshnessPolicyRepository } from "./ProductionFreshnessPolicy.js";

export class FileProductionFreshnessPolicyRepository {
    constructor({ statePath } = {}) { if (!statePath) throw new TypeError("statePath is required."); this.statePath = resolve(statePath); }
    async _load() {
        let state;
        try { state = JSON.parse(await readFile(this.statePath, "utf8")); } catch (error) { if (error?.code === "ENOENT") return []; throw new Error("PRODUCTION_FRESHNESS_POLICY_STATE_INVALID"); }
        if (state?.schemaVersion !== "1.0" || !Array.isArray(state.policies)) throw new Error("PRODUCTION_FRESHNESS_POLICY_STATE_INVALID");
        return state.policies;
    }
    async resolve(scope) { return new ProductionFreshnessPolicyRepository({ policies: await this._load() }).resolve(scope); }
}

export default FileProductionFreshnessPolicyRepository;
