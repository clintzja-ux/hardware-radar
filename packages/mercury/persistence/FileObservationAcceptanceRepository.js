import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import ObservationAcceptanceRepository from "./ObservationAcceptanceRepository.js";
import classifyObservationStorage, { PAYLOAD_STATUSES, STORAGE_CLASSES } from "../retention/RetentionPolicy.js";

const STATE_VERSION = "1.0";
function initialState() { return { version: STATE_VERSION, sequence: 0, records: {}, idempotency: {} }; }
function clone(value) { return structuredClone(value); }
function freeze(value) { return Object.freeze(value); }
function validIso(v) { return typeof v === "string" && Number.isFinite(Date.parse(v)); }

function durableProvenance(observation, storage) {
  if (storage.storageClass !== STORAGE_CLASSES.LICENSE_CONTROLLED) return clone(observation.provenance);
  const p = observation.provenance ?? {};
  return {
    schemaVersion: p.schemaVersion ?? null,
    source: { marketplace: p.source?.marketplace ?? observation.marketplace },
    acquisition: {
      method: p.acquisition?.method ?? observation.sourceMethod,
      retrievedAt: p.acquisition?.retrievedAt ?? observation.observationTime,
      retrievedBy: p.acquisition?.retrievedBy ?? null,
      requestId: p.acquisition?.requestId ?? null
    },
    transformation: {
      adapterId: p.transformation?.adapterId ?? null,
      adapterVersion: p.transformation?.adapterVersion ?? null,
      normalizedAt: p.transformation?.normalizedAt ?? null
    },
    validation: clone(p.validation ?? {})
  };
}

function buildAuditEnvelope(observation, storage, acceptedAt) {
  return {
    observationId: observation.observationId,
    schemaVersion: observation.schemaVersion,
    atlasProductId: observation.atlasProductId,
    retailerId: observation.retailerId,
    marketplace: observation.marketplace,
    observationTime: observation.observationTime,
    sourceMethod: observation.sourceMethod,
    lifecycleStatus: observation.lifecycleStatus,
    validationStatus: observation.validationStatus,
    provenance: durableProvenance(observation, storage),
    compliance: { licenseContext: observation.compliance?.licenseContext ?? "UNSPECIFIED" },
    storage: {
      storageClass: storage.storageClass,
      payloadStatus: PAYLOAD_STATUSES.ACTIVE,
      payloadExpiresAt: storage.payloadExpiresAt,
      acceptedAt,
      purgedAt: null,
      purgeReason: null
    }
  };
}

export class FileObservationAcceptanceRepository extends ObservationAcceptanceRepository {
  constructor({ statePath, environment = "production", now = () => new Date().toISOString(), retentionPolicy = classifyObservationStorage } = {}) {
    super();
    if (!statePath) throw new TypeError("statePath is required.");
    this.statePath = resolve(statePath);
    this.environment = environment;
    this.now = now;
    this.retentionPolicy = retentionPolicy;
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
      if (parsed?.version !== STATE_VERSION || !Number.isInteger(parsed.sequence) || typeof parsed.records !== "object" || typeof parsed.idempotency !== "object") {
        throw new Error("Mercury durable acceptance state is corrupt or unsupported.");
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

  async allocateObservationId() {
    return this._withLock(async () => {
      const state = await this._readState();
      state.sequence += 1;
      await this._commit(state);
      return `mer_obs_${String(state.sequence).padStart(9, "0")}`;
    });
  }

  async findByIdempotencyKey(key) {
    const state = await this._readState();
    const observationId = state.idempotency[key];
    if (!observationId) return null;
    const record = state.records[observationId];
    return record?.auditEnvelope ? freeze(clone(record.auditEnvelope)) : null;
  }

  async accept(observation, idempotencyKey) {
    return this._withLock(async () => {
      const state = await this._readState();
      const existingId = state.idempotency[idempotencyKey];
      if (existingId) return freeze({ status: "DUPLICATE", observationId: existingId });
      if (state.records[observation.observationId]) throw new Error(`Observation already exists: ${observation.observationId}`);

      const storage = this.retentionPolicy(observation);
      if (this.environment === "production" && storage.storageClass === STORAGE_CLASSES.TEST_ONLY) {
        throw new Error("TEST_FIXTURE observations cannot enter the production durable repository.");
      }

      const acceptedAt = this.now();
      const auditEnvelope = buildAuditEnvelope(observation, storage, acceptedAt);
      state.records[observation.observationId] = {
        idempotencyKey,
        auditEnvelope,
        payload: clone(observation)
      };
      state.idempotency[idempotencyKey] = observation.observationId;
      await this._commit(state);
      return freeze({ status: "ACCEPTED", observationId: observation.observationId, storage: freeze(clone(auditEnvelope.storage)) });
    });
  }

  async purgeExpired({ asOf = this.now() } = {}) {
    if (!validIso(asOf)) throw new TypeError("asOf must be a valid ISO date-time.");
    return this._withLock(async () => {
      const state = await this._readState();
      const nowMs = Date.parse(asOf);
      const purged = [];
      for (const [observationId, record] of Object.entries(state.records)) {
        const storage = record.auditEnvelope?.storage;
        if (storage?.payloadStatus !== PAYLOAD_STATUSES.ACTIVE || !storage?.payloadExpiresAt) continue;
        if (Date.parse(storage.payloadExpiresAt) <= nowMs) {
          record.payload = null;
          storage.payloadStatus = PAYLOAD_STATUSES.PURGED;
          storage.purgedAt = asOf;
          storage.purgeReason = "SOURCE_RETENTION_EXPIRED";
          purged.push(observationId);
        }
      }
      if (purged.length) await this._commit(state);
      return freeze(purged);
    });
  }

  async getById(observationId, { asOf = this.now() } = {}) {
    await this.purgeExpired({ asOf });
    const state = await this._readState();
    const payload = state.records[observationId]?.payload;
    return payload ? freeze(clone(payload)) : null;
  }

  async getAuditById(observationId) {
    const state = await this._readState();
    const envelope = state.records[observationId]?.auditEnvelope;
    return envelope ? freeze(clone(envelope)) : null;
  }

  async getAll({ asOf = this.now() } = {}) {
    await this.purgeExpired({ asOf });
    const state = await this._readState();
    return freeze(Object.values(state.records).filter(r => r.payload).map(r => freeze(clone(r.payload))));
  }

  async getByAtlasProductId(atlasProductId, options) {
    return freeze((await this.getAll(options)).filter(o => o.atlasProductId === atlasProductId));
  }

  async getByRetailerId(retailerId, options) {
    return freeze((await this.getAll(options)).filter(o => o.retailerId === retailerId));
  }
}
export default FileObservationAcceptanceRepository;
