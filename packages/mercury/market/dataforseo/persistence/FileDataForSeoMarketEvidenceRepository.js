import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const STATE_VERSION = "1.0";

function initialState() {
    return { version: STATE_VERSION, records: {}, idempotency: {} };
}

function clone(value) { return structuredClone(value); }
function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
}
function requireObject(value, field) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${field} must be an object.`);
    return value;
}
function requireString(value, field) {
    if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string.`);
    return value.trim();
}

export function evidenceAcquisitionIdentity(candidate) {
    const evidence = requireObject(candidate?.marketEvidence, "candidate.marketEvidence");
    const seller = requireObject(evidence.seller, "candidate.marketEvidence.seller");
    const provenance = requireObject(evidence.provenance, "candidate.marketEvidence.provenance");
    return [
        evidence.source,
        requireString(provenance.sourceTaskId, "sourceTaskId"),
        provenance.rawPayloadReference ?? requireString(seller.url, "seller.url")
    ].join("|");
}

export function materialEvidenceFingerprint(candidate) {
    const evidence = requireObject(candidate?.marketEvidence, "candidate.marketEvidence");
    const provenance = requireObject(evidence.provenance, "candidate.marketEvidence.provenance");
    const material = {
        source: evidence.source,
        sourceMethod: evidence.sourceMethod,
        acquisition: {
            sourceTaskId: provenance.sourceTaskId,
            rawPayloadReference: provenance.rawPayloadReference ?? null
        },
        atlasProductId: candidate?.identity?.atlasProductId ?? null,
        seller: {
            name: evidence.seller?.name ?? null,
            domain: evidence.seller?.domain ?? null,
            url: evidence.seller?.url ?? null
        },
        pricing: {
            basePrice: evidence.pricing?.basePrice ?? null,
            totalPrice: evidence.pricing?.totalPrice ?? null,
            shippingPrice: evidence.pricing?.shippingPrice ?? null,
            tax: evidence.pricing?.tax ?? null,
            currency: evidence.pricing?.currency ?? null
        },
        offer: {
            condition: evidence.offer?.condition ?? null,
            availability: evidence.offer?.availability ?? null
        },
        providerIdentity: {
            productId: evidence.productEvidence?.productId ?? null,
            dataDocId: evidence.productEvidence?.dataDocId ?? null,
            gid: evidence.productEvidence?.gid ?? null
        }
    };
    return crypto.createHash("sha256").update(JSON.stringify(material)).digest("hex");
}

function replayResultOrConflict(record, candidate) {
    if (!record) throw new Error("DATAFORSEO_EVIDENCE_IDEMPOTENCY_STATE_INVALID");
    const retainedFingerprint = record.materialEvidenceFingerprint ?? materialEvidenceFingerprint(record.candidate);
    if (retainedFingerprint !== materialEvidenceFingerprint(candidate)) {
        const error = new Error("ACQUISITION_EVIDENCE_CONFLICT");
        error.code = "ACQUISITION_EVIDENCE_CONFLICT";
        throw error;
    }
    return freeze({ status: "DUPLICATE", evidenceId: record.evidenceId });
}

function evidenceId(key) {
    return `dfev_${crypto.createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
}

export class FileDataForSeoMarketEvidenceRepository {
    constructor({ statePath, now = () => new Date().toISOString() } = {}) {
        if (!statePath) throw new TypeError("statePath is required.");
        this.statePath = resolve(statePath);
        this.now = now;
        this.queue = Promise.resolve();
    }

    async _withLock(fn) {
        const task = this.queue.then(fn, fn);
        this.queue = task.catch(() => {});
        return task;
    }

    async _readState() {
        try {
            const parsed = JSON.parse(await readFile(this.statePath, "utf8"));
            if (parsed?.version !== STATE_VERSION || typeof parsed.records !== "object" || typeof parsed.idempotency !== "object") {
                throw new Error("DataForSEO market evidence state is corrupt or unsupported.");
            }
            return parsed;
        } catch (error) {
            if (error?.code === "ENOENT") return initialState();
            throw error;
        }
    }

    async _commit(state) {
        await mkdir(dirname(this.statePath), { recursive: true });
        const tempPath = `${this.statePath}.tmp-${process.pid}-${Date.now()}`;
        await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
        await rename(tempPath, this.statePath);
    }

    async retain({ candidate, merchantResolution, eligibility } = {}) {
        requireObject(candidate, "candidate");
        requireObject(merchantResolution, "merchantResolution");
        requireObject(eligibility, "eligibility");
        if (eligibility.rawEvidenceRetentionEligible !== true) throw new Error("DATAFORSEO_RAW_EVIDENCE_RETENTION_NOT_ALLOWED");

        const key = evidenceAcquisitionIdentity(candidate);
        const fingerprint = materialEvidenceFingerprint(candidate);
        const id = evidenceId(key);
        return this._withLock(async () => {
            const state = await this._readState();
            const existing = state.idempotency[key];
            if (existing) return replayResultOrConflict(state.records[existing], candidate);
            const legacyExisting = Object.values(state.records).find((record) => {
                try { return evidenceAcquisitionIdentity(record.candidate) === key; } catch { return false; }
            });
            if (legacyExisting) return replayResultOrConflict(legacyExisting, candidate);

            const record = {
                evidenceId: id,
                evidenceVersion: "1.0",
                retainedAt: this.now(),
                idempotencyKey: key,
                materialEvidenceFingerprint: fingerprint,
                candidate: clone(candidate),
                merchantResolution: clone(merchantResolution),
                eligibilityAtRetention: clone(eligibility)
            };
            state.records[id] = record;
            state.idempotency[key] = id;
            await this._commit(state);
            return freeze({ status: "RETAINED", evidenceId: id });
        });
    }

    async getById(id) {
        requireString(id, "evidenceId");
        const state = await this._readState();
        const record = state.records[id];
        return record ? freeze(clone(record)) : null;
    }

    async getAll() {
        const state = await this._readState();
        return freeze(Object.values(state.records).map((record) => freeze(clone(record))));
    }
}

export default FileDataForSeoMarketEvidenceRepository;
