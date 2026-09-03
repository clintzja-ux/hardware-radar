import crypto from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const SINGLE_WRITER_LOCK_STATUSES = Object.freeze({
    ACQUIRED: "ACQUIRED",
    BUSY: "BUSY",
    COMPLETED: "COMPLETED",
    SKIPPED_LOCKED: "SKIPPED_LOCKED"
});

function validIso(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function requirePositiveInteger(value, field) {
    if (!Number.isInteger(value) || value <= 0) throw new TypeError(`${field} must be a positive integer.`);
    return value;
}

function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
}

function clone(value) {
    return value == null ? value : structuredClone(value);
}

export class FileSingleWriterRunLock {
    constructor({
        lockPath,
        staleAfterMs = 15 * 60 * 1000,
        heartbeatIntervalMs = 60 * 1000,
        now = () => new Date().toISOString(),
        ownerId = () => crypto.randomUUID()
    } = {}) {
        if (!lockPath) throw new TypeError("lockPath is required.");
        this.lockPath = resolve(lockPath);
        this.ownerPath = resolve(this.lockPath, "owner.json");
        this.staleAfterMs = requirePositiveInteger(staleAfterMs, "staleAfterMs");
        this.heartbeatIntervalMs = requirePositiveInteger(heartbeatIntervalMs, "heartbeatIntervalMs");
        if (heartbeatIntervalMs >= staleAfterMs) throw new TypeError("heartbeatIntervalMs must be less than staleAfterMs.");
        if (typeof now !== "function") throw new TypeError("now must be a function.");
        if (typeof ownerId !== "function") throw new TypeError("ownerId must be a function.");
        this.now = now;
        this.ownerIdFactory = ownerId;
    }

    async _readOwner() {
        try {
            const owner = JSON.parse(await readFile(this.ownerPath, "utf8"));
            if (!owner || typeof owner.ownerId !== "string" || !validIso(owner.acquiredAt) || !validIso(owner.heartbeatAt)) return null;
            return owner;
        } catch (error) {
            if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
            throw error;
        }
    }

    async _lockTimestampMs() {
        const owner = await this._readOwner();
        if (owner) return { owner, timestampMs: Date.parse(owner.heartbeatAt) };
        try {
            const metadata = await stat(this.ownerPath);
            return { owner: null, timestampMs: metadata.mtimeMs };
        } catch (error) {
            if (error?.code !== "ENOENT") throw error;
        }
        try {
            const metadata = await stat(this.lockPath);
            return { owner: null, timestampMs: metadata.mtimeMs };
        } catch (error) {
            if (error?.code === "ENOENT") return { owner: null, timestampMs: null };
            throw error;
        }
    }

    _isStale(timestampMs, nowIso) {
        if (!Number.isFinite(timestampMs)) return false;
        return Date.parse(nowIso) - timestampMs > this.staleAfterMs;
    }

    async _writeOwner(owner) {
        const tempPath = resolve(this.lockPath, `.owner-${process.pid}-${crypto.randomUUID()}.tmp`);
        await writeFile(tempPath, `${JSON.stringify(owner, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
        await rename(tempPath, this.ownerPath);
    }

    async _tryCreate(ownerId, acquiredAt) {
        try {
            await mkdir(dirname(this.lockPath), { recursive: true });
            await mkdir(this.lockPath);
            const owner = { schemaVersion: "1.0", ownerId, pid: process.pid, acquiredAt, heartbeatAt: acquiredAt };
            await this._writeOwner(owner);
            return freeze({ status: SINGLE_WRITER_LOCK_STATUSES.ACQUIRED, owner: clone(owner), reclaimedStaleLock: false });
        } catch (error) {
            if (error?.code === "EEXIST") return null;
            try { await rm(this.lockPath, { recursive: true, force: true }); } catch {}
            throw error;
        }
    }

    async acquire() {
        const ownerId = this.ownerIdFactory();
        const acquiredAt = this.now();
        if (!validIso(acquiredAt)) throw new TypeError("now() must return a valid ISO date-time.");

        const direct = await this._tryCreate(ownerId, acquiredAt);
        if (direct) return direct;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            const currentNow = this.now();
            const { owner, timestampMs } = await this._lockTimestampMs();
            if (timestampMs === null) {
                const retried = await this._tryCreate(ownerId, acquiredAt);
                if (retried) return retried;
                continue;
            }
            if (!this._isStale(timestampMs, currentNow)) {
                return freeze({ status: SINGLE_WRITER_LOCK_STATUSES.BUSY, owner: clone(owner) });
            }

            const quarantine = `${this.lockPath}.stale-${process.pid}-${crypto.randomUUID()}`;
            try {
                await rename(this.lockPath, quarantine);
            } catch (error) {
                if (error?.code === "ENOENT" || error?.code === "EEXIST") continue;
                return freeze({ status: SINGLE_WRITER_LOCK_STATUSES.BUSY, owner: clone(owner) });
            }
            await rm(quarantine, { recursive: true, force: true });
            const reclaimed = await this._tryCreate(ownerId, acquiredAt);
            if (reclaimed) return freeze({ ...reclaimed, reclaimedStaleLock: true });
        }
        return freeze({ status: SINGLE_WRITER_LOCK_STATUSES.BUSY, owner: clone(await this._readOwner()) });
    }

    async heartbeat(ownerId) {
        const owner = await this._readOwner();
        if (!owner || owner.ownerId !== ownerId) return false;
        const heartbeatAt = this.now();
        if (!validIso(heartbeatAt)) throw new TypeError("now() must return a valid ISO date-time.");
        await this._writeOwner({ ...owner, heartbeatAt });
        return true;
    }

    async release(ownerId) {
        const owner = await this._readOwner();
        if (!owner || owner.ownerId !== ownerId) return false;
        const quarantine = `${this.lockPath}.release-${process.pid}-${crypto.randomUUID()}`;
        try {
            await rename(this.lockPath, quarantine);
        } catch (error) {
            if (error?.code === "ENOENT") return false;
            throw error;
        }
        const movedOwner = await (async () => {
            try { return JSON.parse(await readFile(resolve(quarantine, "owner.json"), "utf8")); }
            catch { return null; }
        })();
        if (movedOwner?.ownerId !== ownerId) {
            try { await rename(quarantine, this.lockPath); } catch {}
            return false;
        }
        await rm(quarantine, { recursive: true, force: true });
        return true;
    }

    async runExclusive(fn) {
        if (typeof fn !== "function") throw new TypeError("fn must be a function.");
        const acquisition = await this.acquire();
        if (acquisition.status !== SINGLE_WRITER_LOCK_STATUSES.ACQUIRED) {
            return freeze({ status: SINGLE_WRITER_LOCK_STATUSES.SKIPPED_LOCKED, owner: clone(acquisition.owner) });
        }

        const ownerId = acquisition.owner.ownerId;
        let heartbeatFailure = null;
        const timer = setInterval(() => {
            this.heartbeat(ownerId).catch((error) => { heartbeatFailure = error; });
        }, this.heartbeatIntervalMs);
        timer.unref?.();

        try {
            const result = await fn();
            if (heartbeatFailure) throw heartbeatFailure;
            return freeze({
                status: SINGLE_WRITER_LOCK_STATUSES.COMPLETED,
                reclaimedStaleLock: acquisition.reclaimedStaleLock,
                result: clone(result)
            });
        } finally {
            clearInterval(timer);
            await this.release(ownerId);
        }
    }
}

export default FileSingleWriterRunLock;
