import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateCurrentDisplaySnapshot } from "./CurrentDisplaySnapshot.js";

const VERSION = "1.0";
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };

export class FileCurrentDisplaySnapshotRepository {
    constructor({ statePath } = {}) {
        if (!statePath) throw new TypeError("CURRENT_DISPLAY_STATE_PATH_REQUIRED");
        this.statePath = resolve(statePath);
        this.queue = Promise.resolve();
    }

    async _read() {
        try {
            const state = JSON.parse(await readFile(this.statePath, "utf8"));
            if (state?.version !== VERSION || !("current" in state) || !("previous" in state)) throw new Error();
            for (const snapshot of [state.current, state.previous].filter(Boolean)) if (!validateCurrentDisplaySnapshot(snapshot).valid) throw new Error();
            if (state.current && state.previous && state.current.snapshotId === state.previous.snapshotId) throw new Error();
            return state;
        } catch (error) {
            if (error?.code === "ENOENT") return { version: VERSION, current: null, previous: null };
            throw new Error("CURRENT_DISPLAY_STATE_INVALID");
        }
    }

    async replace(snapshot) {
        const report = validateCurrentDisplaySnapshot(snapshot);
        if (!report.valid) throw new TypeError(report.errors.join(","));
        const operation = async () => {
            const state = await this._read();
            if (state.current?.snapshotId === snapshot.snapshotId) {
                if (state.current.materialFingerprint !== snapshot.materialFingerprint) throw new Error("CURRENT_DISPLAY_REPLAY_CONFLICT");
                return freeze({ status: "DUPLICATE", snapshotId: snapshot.snapshotId, previousSnapshotId: state.previous?.snapshotId ?? null });
            }
            const next = { version: VERSION, current: snapshot, previous: state.current };
            await mkdir(dirname(this.statePath), { recursive: true });
            const temporary = `${this.statePath}.tmp-${process.pid}-${Date.now()}`;
            await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
            await rename(temporary, this.statePath);
            return freeze({ status: "REPLACED", snapshotId: snapshot.snapshotId, previousSnapshotId: state.current?.snapshotId ?? null });
        };
        const task = this.queue.then(operation, operation);
        this.queue = task.catch(() => {});
        return task;
    }

    async getState() { return freeze(structuredClone(await this._read())); }
}
