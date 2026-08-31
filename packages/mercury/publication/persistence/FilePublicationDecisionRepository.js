import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import PublicationDecisionRepository from "./PublicationDecisionRepository.js";
import { validatePublicationDecision } from "../PublicationDecision.js";
import { STORAGE_CLASSES } from "../../retention/RetentionPolicy.js";

const STATE_VERSION = "1.0";
function initialState() { return { version: STATE_VERSION, sequence: 0, decisions: {}, byObservation: {} }; }
function clone(value) { return structuredClone(value); }
function freeze(value) { return Object.freeze(value); }

export class FilePublicationDecisionRepository extends PublicationDecisionRepository {
  constructor({ statePath, acceptanceRepository, reviewRepository, environment = "production", now = () => new Date().toISOString() } = {}) {
    super();
    if (!statePath) throw new TypeError("statePath is required.");
    if (!acceptanceRepository) throw new TypeError("acceptanceRepository is required.");
    if (!reviewRepository) throw new TypeError("reviewRepository is required.");
    this.statePath = resolve(statePath);
    this.acceptanceRepository = acceptanceRepository;
    this.reviewRepository = reviewRepository;
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
        throw new Error("Mercury durable publication state is corrupt or unsupported.");
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
    const validation = validatePublicationDecision(decision);
    if (!validation.valid) throw new TypeError(validation.errors.join(" "));
    if (decision.canonicalObservationModified !== false) throw new TypeError("Publication decisions cannot modify canonical observations.");

    return this._withLock(async () => {
      const audit = await this.acceptanceRepository.getAuditById(decision.observationId);
      if (!audit) throw new Error(`Observation does not exist: ${decision.observationId}`);
      if (this.environment === "production" && audit.storage?.storageClass === STORAGE_CLASSES.TEST_ONLY) throw new Error("TEST_FIXTURE observations cannot receive production publication decisions.");

      if (decision.action === "PUBLISH") {
        const effectiveReview = await this.reviewRepository.getEffectiveDecision(decision.observationId);
        if (!effectiveReview || effectiveReview.decision !== "REVIEWED") throw new Error("PUBLISH requires an effective REVIEWED decision.");
        if (effectiveReview.reviewDecisionId !== decision.reviewDecisionId) throw new Error("PUBLISH must reference the effective REVIEWED decision.");
      } else if (decision.reviewDecisionId) {
        const review = await this.reviewRepository.getById(decision.reviewDecisionId);
        if (!review || review.observationId !== decision.observationId) throw new Error("reviewDecisionId does not resolve for this observation.");
      }

      const state = await this._readState();
      if (decision.governance?.authorizationId) {
        const existing = Object.values(state.decisions).find(record => record.governance?.authorizationId === decision.governance.authorizationId);
        if (existing) {
          if (existing.observationId === decision.observationId && existing.action === decision.action && existing.governance.candidateBindingDigest === decision.governance.candidateBindingDigest) return freeze(clone(existing));
          throw new Error("PUBLICATION_AUTHORIZATION_DECISION_CONFLICT");
        }
      }
      const nextSequence = state.sequence + 1;
      const publicationDecisionId = `mer_pub_${String(nextSequence).padStart(9, "0")}`;
      const recordedAt = this.now();
      const record = {
        schemaVersion: "1.0",
        publicationDecisionId,
        sequence: nextSequence,
        observationId: decision.observationId,
        reviewDecisionId: decision.reviewDecisionId ?? null,
        action: decision.action,
        authorizedBy: decision.authorizedBy,
        authorizedAt: decision.authorizedAt,
        recordedAt,
        reasonCodes: [...(decision.reasonCodes ?? [])],
        notes: decision.notes ?? "",
        canonicalObservationModified: false,
        publicationAuthorizationExplicit: true,
        ...(decision.governance ? { governance: clone(decision.governance) } : {})
      };
      state.sequence = nextSequence;
      state.decisions[publicationDecisionId] = record;
      state.byObservation[record.observationId] ??= [];
      state.byObservation[record.observationId].push(publicationDecisionId);
      await this._commit(state);
      return freeze(clone(record));
    });
  }

  async getById(publicationDecisionId) {
    const state = await this._readState();
    const record = state.decisions[publicationDecisionId];
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
export default FilePublicationDecisionRepository;
