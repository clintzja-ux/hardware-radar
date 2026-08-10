import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import ReviewDecisionRepository from "./ReviewDecisionRepository.js";
import { validateReviewDecision } from "../ObservationReviewDecision.js";
import { STORAGE_CLASSES } from "../../retention/RetentionPolicy.js";

const STATE_VERSION = "1.0";
function initialState() { return { version: STATE_VERSION, sequence: 0, decisions: {}, byObservation: {} }; }
function clone(value) { return structuredClone(value); }
function freeze(value) { return Object.freeze(value); }

export class FileReviewDecisionRepository extends ReviewDecisionRepository {
  constructor({ statePath, acceptanceRepository, environment = "production", now = () => new Date().toISOString() } = {}) {
    super();
    if (!statePath) throw new TypeError("statePath is required.");
    if (!acceptanceRepository) throw new TypeError("acceptanceRepository is required.");
    this.statePath = resolve(statePath);
    this.acceptanceRepository = acceptanceRepository;
    this.environment = environment;
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
      if (parsed?.version !== STATE_VERSION || !Number.isInteger(parsed.sequence) || typeof parsed.decisions !== "object" || typeof parsed.byObservation !== "object") {
        throw new Error("Mercury durable review state is corrupt or unsupported.");
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

  async recordDecision(decision) {
    const validation = validateReviewDecision(decision);
    if (!validation.valid) throw new TypeError(validation.errors.join(" "));
    if (decision.canonicalObservationModified !== false) throw new TypeError("Review decisions cannot modify canonical observations.");

    return this._withLock(async () => {
      const audit = await this.acceptanceRepository.getAuditById(decision.observationId);
      if (!audit) throw new Error(`Observation does not exist: ${decision.observationId}`);
      if (this.environment === "production" && audit.storage?.storageClass === STORAGE_CLASSES.TEST_ONLY) {
        throw new Error("TEST_FIXTURE observations cannot receive production review decisions.");
      }

      const state = await this._readState();
      const nextSequence = state.sequence + 1;
      const reviewDecisionId = `mer_rev_${String(nextSequence).padStart(9, "0")}`;
      const recordedAt = this.now();
      const record = {
        schemaVersion: "1.0",
        reviewDecisionId,
        sequence: nextSequence,
        observationId: decision.observationId,
        decision: decision.decision,
        reviewedBy: decision.reviewedBy,
        reviewedAt: decision.reviewedAt,
        recordedAt,
        reasonCodes: [...(decision.reasonCodes ?? [])],
        notes: decision.notes ?? "",
        canonicalObservationModified: false
      };

      state.sequence = nextSequence;
      state.decisions[reviewDecisionId] = record;
      state.byObservation[record.observationId] ??= [];
      state.byObservation[record.observationId].push(reviewDecisionId);
      await this._commit(state);
      return freeze(clone(record));
    });
  }

  async getById(reviewDecisionId) {
    const state = await this._readState();
    const record = state.decisions[reviewDecisionId];
    return record ? freeze(clone(record)) : null;
  }

  async getHistoryForObservation(observationId) {
    const state = await this._readState();
    const ids = state.byObservation[observationId] ?? [];
    const records = ids.map((id) => state.decisions[id]).filter(Boolean).sort((a, b) => a.sequence - b.sequence);
    return freeze(records.map((record) => freeze(clone(record))));
  }

  async getEffectiveDecision(observationId) {
    const history = await this.getHistoryForObservation(observationId);
    return history.length ? history[history.length - 1] : null;
  }
}

export default FileReviewDecisionRepository;
