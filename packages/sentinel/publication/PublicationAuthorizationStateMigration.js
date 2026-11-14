import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateLivePricePublicationAuthorization } from "./GovernedLivePricePublication.js";

const sha256 = text => createHash("sha256").update(text).digest("hex"), freeze = value => Object.freeze(structuredClone(value));
const sections = ["authorizations", "operations", "consumptions"], digestPattern = /^[a-f0-9]{64}$/;
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const stableText = value => `${JSON.stringify(stable(value), null, 2)}\n`, recordDigest = value => sha256(JSON.stringify(stable(value)));
const validState = value => exactKeys(value, ["schemaVersion", ...sections]) && value.schemaVersion === "1.0" && sections.every(section => value[section] && typeof value[section] === "object" && !Array.isArray(value[section]));

async function readState(file) {
  try { const text = await readFile(file, "utf8"), value = JSON.parse(text); if (!validState(value)) throw new Error(); return { text, value, digest: sha256(text) }; }
  catch (error) { if (error?.code === "ENOENT") return null; throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_STATE_INVALID"); }
}
async function readAudit(file) { try { return JSON.parse(await readFile(file, "utf8")); } catch (error) { if (error?.code === "ENOENT") return null; throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_AUDIT_INVALID"); } }
async function atomicWrite(file, text) { await mkdir(path.dirname(file), { recursive: true }); const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`; try { await writeFile(temporary, text, { encoding: "utf8", flag: "wx" }); await rename(temporary, file); } finally { await rm(temporary, { force: true }); } }
async function atomicCreate(file, text) { await mkdir(path.dirname(file), { recursive: true }); try { await writeFile(file, text, { encoding: "utf8", flag: "wx" }); } catch (error) { if (error?.code !== "EEXIST") throw error; if (await readFile(file, "utf8") !== text) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_BACKUP_CONFLICT"); } }

function validateRepository(state) {
  if (!validState(state)) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_STATE_INVALID");
  for (const [id, authorization] of Object.entries(state.authorizations)) {
    if (id !== authorization?.authorizationId || !validateLivePricePublicationAuthorization(authorization).valid) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_AUTHORIZATION_INVALID");
    const identity = { candidateId: authorization.candidateId, artifactId: authorization.artifactId, artifactDigest: authorization.artifactDigest, bindingDigest: authorization.bindingDigest, certificationId: authorization.certificationId, certificationDigest: authorization.certificationDigest, targetEnvironment: authorization.targetEnvironment, predecessorReleaseId: authorization.predecessorReleaseId, freshUntil: authorization.freshUntil, authorizedPaths: authorization.authorizedPaths, authorizedBy: authorization.authorizedBy, authorizedAt: authorization.authorizedAt };
    if (id !== `pubauto_${sha256(JSON.stringify(identity)).slice(0, 24)}`) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_IDENTITY_INVALID");
  }
  for (const [id, operation] of Object.entries(state.operations)) if (!state.authorizations[id] || !exactKeys(operation, ["authorizationId", "checkoutRoot", "startedAt", "status"]) || operation.authorizationId !== id || operation.status !== "BUILD_INTENT_RECORDED" || !path.isAbsolute(operation.checkoutRoot) || !Number.isFinite(Date.parse(operation.startedAt))) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_OPERATION_INVALID");
  for (const [id, consumption] of Object.entries(state.consumptions)) if (!state.authorizations[id] || !exactKeys(consumption, ["authorizationId", "checkpointDigest", "consumedAt"]) || consumption.authorizationId !== id || !digestPattern.test(consumption.checkpointDigest) || !Number.isFinite(Date.parse(consumption.consumedAt))) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_CONSUMPTION_INVALID");
}

function mergeStates(legacy, canonical) {
  const union = { schemaVersion: "1.0", authorizations: {}, operations: {}, consumptions: {} }, shared = {};
  for (const section of sections) {
    shared[section] = 0;
    for (const id of [...new Set([...Object.keys(legacy[section]), ...Object.keys(canonical[section])])].sort()) {
      const left = legacy[section][id], right = canonical[section][id];
      if (left && right) { if (recordDigest(left) !== recordDigest(right)) throw new Error(`PUBLICATION_AUTHORIZATION_RECONCILIATION_${section.toUpperCase()}_CONFLICT`); shared[section] += 1; }
      union[section][id] = structuredClone(left ?? right);
    }
  }
  for (const [field, code] of [["candidateId", "CANDIDATE"], ["certificationId", "CERTIFICATION"]]) {
    const seen = new Map(); for (const [id, authorization] of Object.entries(union.authorizations)) { const prior = seen.get(authorization[field]); if (prior && prior !== id) throw new Error(`PUBLICATION_AUTHORIZATION_RECONCILIATION_${code}_COLLISION`); seen.set(authorization[field], id); }
  }
  const checkpoints = new Map(); for (const [id, consumption] of Object.entries(union.consumptions)) { const prior = checkpoints.get(consumption.checkpointDigest); if (prior && prior !== id) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_CHECKPOINT_COLLISION"); checkpoints.set(consumption.checkpointDigest, id); }
  return { union, shared };
}
const counts = value => Object.fromEntries(sections.map(section => [section, Object.keys(value[section]).length]));
const recordDigests = value => Object.fromEntries(sections.map(section => [section, Object.fromEntries(Object.entries(value[section]).map(([id, record]) => [id, recordDigest(record)]))]));
const containsRecords = (canonical, expected) => sections.every(section => Object.entries(expected?.[section] ?? {}).every(([id, digest]) => canonical.value[section][id] && recordDigest(canonical.value[section][id]) === digest));

export class PublicationAuthorizationStateMigration {
  constructor({ legacyStatePath, canonicalStatePath, auditPath, now = () => new Date().toISOString(), writeAtomic = atomicWrite, createAtomic = atomicCreate } = {}) {
    if (![legacyStatePath, canonicalStatePath, auditPath].every(value => typeof value === "string" && path.isAbsolute(value))) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_PATHS_INVALID");
    Object.assign(this, { legacyStatePath: path.resolve(legacyStatePath), canonicalStatePath: path.resolve(canonicalStatePath), auditPath: path.resolve(auditPath), now, writeAtomic, createAtomic });
  }
  async inspect() {
    const [legacy, canonical, audit] = await Promise.all([readState(this.legacyStatePath), readState(this.canonicalStatePath), readAudit(this.auditPath)]);
    if (audit?.kind === "AUTHORIZATION_HISTORY_RECONCILIATION") {
      if (audit.status === "PREPARED") return freeze({ status: "RECONCILIATION_INTERRUPTED", reconciliationId: audit.reconciliationId, recoveryAllowed: false });
      const expectedId = `pubauthrec_${sha256(`${audit.legacyDigest}:${audit.canonicalPreimageDigest}:${audit.unionDigest}:${this.canonicalStatePath}`).slice(0, 24)}`, expectedBackupPath = `${this.canonicalStatePath}.pre-reconciliation-${audit.canonicalPreimageDigest}.json`, digestShapeValid = sections.every(section => audit.recordDigests?.[section] && typeof audit.recordDigests[section] === "object" && !Array.isArray(audit.recordDigests[section]) && Object.values(audit.recordDigests[section]).every(value => digestPattern.test(value)) && audit.counts?.union?.[section] === Object.keys(audit.recordDigests[section]).length);
      const valid = audit.schemaVersion === "1.0" && audit.status === "COMPLETED" && audit.reconciliationId === expectedId && audit.legacyStatePath === this.legacyStatePath && audit.canonicalStatePath === this.canonicalStatePath && audit.canonicalPreimageBackupPath === expectedBackupPath && digestShapeValid && [audit.legacyDigest, audit.canonicalPreimageDigest, audit.unionDigest].every(value => digestPattern.test(value ?? "")) && audit.lifecycle?.map(value => value.type).join("|") === "PREPARED|COMPLETED";
      const backup = valid ? await readState(audit.canonicalPreimageBackupPath) : null;
      if (!valid || !legacy || legacy.digest !== audit.legacyDigest || !canonical || !backup || backup.digest !== audit.canonicalPreimageDigest || !containsRecords(canonical, audit.recordDigests)) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_AUDIT_INVALID");
      return freeze({ status: "CANONICAL_STATE_RECONCILED", reconciliationId: audit.reconciliationId, legacyDigest: audit.legacyDigest, canonicalPreimageDigest: audit.canonicalPreimageDigest, unionDigest: audit.unionDigest, canonicalDigest: canonical.digest, counts: audit.counts, recoveryAllowed: false });
    }
    if (audit) { const valid = audit.schemaVersion === "1.0" && audit.status === "COMPLETED" && audit.legacyStatePath === this.legacyStatePath && audit.canonicalStatePath === this.canonicalStatePath && digestPattern.test(audit.stateDigest ?? "") && audit.canonicalDigest === audit.stateDigest; if (!valid || !canonical) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_AUDIT_INVALID"); return freeze({ status: "CANONICAL_STATE_MIGRATED", legacyDigest: audit.stateDigest, canonicalDigest: canonical.digest, recoveryAllowed: false }); }
    if (!legacy && !canonical) return freeze({ status: "MIGRATION_SOURCE_MISSING", recoveryAllowed: false });
    if (!legacy) return freeze({ status: "CANONICAL_STATE_PRESENT", canonicalDigest: canonical.digest, recoveryAllowed: false });
    if (canonical && canonical.digest !== legacy.digest) return freeze({ status: "MIGRATION_CONFLICT", legacyDigest: legacy.digest, canonicalDigest: canonical.digest, recoveryAllowed: false });
    if (canonical) return freeze({ status: "MIGRATION_ALREADY_COMPLETE", legacyDigest: legacy.digest, canonicalDigest: canonical.digest, recoveryAllowed: false });
    return freeze({ status: "MIGRATION_READY", legacyDigest: legacy.digest, canonicalDigest: null, recoveryAllowed: true });
  }
  _plan(legacy, canonical) {
    validateRepository(legacy.value); validateRepository(canonical.value); const { union, shared } = mergeStates(legacy.value, canonical.value), unionText = stableText(union), unionDigest = sha256(unionText);
    return freeze({ status: "RECONCILIATION_PREPARED_READ_ONLY", reconciliationId: `pubauthrec_${sha256(`${legacy.digest}:${canonical.digest}:${unionDigest}:${this.canonicalStatePath}`).slice(0, 24)}`, legacyDigest: legacy.digest, canonicalPreimageDigest: canonical.digest, unionDigest, counts: { legacy: counts(legacy.value), canonical: counts(canonical.value), union: counts(union), shared }, recordDigests: recordDigests(union), validation: { schemaValid: true, identitiesValid: true, referencesValid: true, collisions: 0, consumedStatePreserved: true }, legacyStatePath: this.legacyStatePath, canonicalStatePath: this.canonicalStatePath, canonicalPreimageBackupPath: `${this.canonicalStatePath}.pre-reconciliation-${canonical.digest}.json`, unionText });
  }
  async prepareReconciliation({ expectedLegacyDigest, expectedCanonicalDigest } = {}) {
    if (![expectedLegacyDigest, expectedCanonicalDigest].every(value => digestPattern.test(value ?? ""))) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_DIGESTS_REQUIRED");
    const [legacy, canonical] = await Promise.all([readState(this.legacyStatePath), readState(this.canonicalStatePath)]);
    if (!legacy || !canonical || legacy.digest !== expectedLegacyDigest || canonical.digest !== expectedCanonicalDigest) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_SOURCE_CHANGED");
    const { unionText, ...plan } = this._plan(legacy, canonical); return freeze(plan);
  }
  async reconcile({ expectedLegacyDigest, expectedCanonicalDigest, expectedUnionDigest, operatorId, confirmation } = {}) {
    if (confirmation !== "RECONCILE-LIVE-PRICE-PUBLICATION-AUTHORIZATION-HISTORY" || typeof operatorId !== "string" || !operatorId.trim()) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_CONFIRMATION_REQUIRED");
    if (!digestPattern.test(expectedUnionDigest ?? "")) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_UNION_DIGEST_REQUIRED");
    const existing = await readAudit(this.auditPath);
    if (existing?.kind === "AUTHORIZATION_HISTORY_RECONCILIATION" && existing.status === "COMPLETED") { if (existing.legacyDigest !== expectedLegacyDigest || existing.canonicalPreimageDigest !== expectedCanonicalDigest || existing.unionDigest !== expectedUnionDigest) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_REPLAY_CONFLICT"); const inspection = await this.inspect(); return freeze({ ...existing, idempotent: true, inspectionStatus: inspection.status }); }
    let plan;
    if (existing?.kind === "AUTHORIZATION_HISTORY_RECONCILIATION" && existing.status === "PREPARED") {
      if (existing.legacyDigest !== expectedLegacyDigest || existing.canonicalPreimageDigest !== expectedCanonicalDigest || existing.unionDigest !== expectedUnionDigest || existing.operatorId !== operatorId) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_INTERRUPTED_CONFLICT");
      const legacy = await readState(this.legacyStatePath), canonical = await readState(this.canonicalStatePath), backup = await readState(existing.canonicalPreimageBackupPath);
      if (!legacy || legacy.digest !== expectedLegacyDigest || !backup || backup.digest !== expectedCanonicalDigest || !canonical || ![expectedCanonicalDigest, expectedUnionDigest].includes(canonical.digest)) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_INTERRUPTED_INVALID"); plan = this._plan(legacy, backup);
    } else { if (existing) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_AUDIT_CONFLICT"); const [legacy, canonical] = await Promise.all([readState(this.legacyStatePath), readState(this.canonicalStatePath)]); if (!legacy || !canonical || legacy.digest !== expectedLegacyDigest || canonical.digest !== expectedCanonicalDigest) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_SOURCE_CHANGED"); plan = this._plan(legacy, canonical); }
    if (plan.unionDigest !== expectedUnionDigest) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_UNION_MISMATCH");
    const preparedAt = existing?.preparedAt ?? this.now(), backupPath = plan.canonicalPreimageBackupPath;
    if (!existing) {
      const [legacy, canonical] = await Promise.all([readState(this.legacyStatePath), readState(this.canonicalStatePath)]); if (!legacy || legacy.digest !== expectedLegacyDigest || !canonical || canonical.digest !== expectedCanonicalDigest) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_CONCURRENT_CHANGE");
      await this.createAtomic(backupPath, canonical.text);
      await this.writeAtomic(this.auditPath, `${JSON.stringify({ schemaVersion: "1.0", kind: "AUTHORIZATION_HISTORY_RECONCILIATION", reconciliationId: plan.reconciliationId, status: "PREPARED", legacyStatePath: this.legacyStatePath, canonicalStatePath: this.canonicalStatePath, canonicalPreimageBackupPath: backupPath, legacyDigest: expectedLegacyDigest, canonicalPreimageDigest: expectedCanonicalDigest, unionDigest: expectedUnionDigest, counts: plan.counts, recordDigests: plan.recordDigests, operatorId, preparedAt, lifecycle: [{ type: "PREPARED", at: preparedAt }] }, null, 2)}\n`);
    }
    const [legacyBefore, canonicalBefore] = await Promise.all([readState(this.legacyStatePath), readState(this.canonicalStatePath)]); if (!legacyBefore || legacyBefore.digest !== expectedLegacyDigest || !canonicalBefore || ![expectedCanonicalDigest, expectedUnionDigest].includes(canonicalBefore.digest)) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_CONCURRENT_CHANGE");
    if (canonicalBefore.digest !== expectedUnionDigest) await this.writeAtomic(this.canonicalStatePath, plan.unionText);
    const [legacy, canonical, backup] = await Promise.all([readState(this.legacyStatePath), readState(this.canonicalStatePath), readState(backupPath)]); if (!legacy || legacy.digest !== expectedLegacyDigest || !canonical || canonical.digest !== expectedUnionDigest || !backup || backup.digest !== expectedCanonicalDigest) throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_COMMIT_INVALID");
    const prepared = await readAudit(this.auditPath), completedAt = this.now(), completed = { ...prepared, status: "COMPLETED", completedAt, lifecycle: [...prepared.lifecycle, { type: "COMPLETED", at: completedAt }] }; await this.writeAtomic(this.auditPath, `${JSON.stringify(completed, null, 2)}\n`);
    if ((await this.inspect()).status !== "CANONICAL_STATE_RECONCILED") throw new Error("PUBLICATION_AUTHORIZATION_RECONCILIATION_VERIFICATION_FAILED"); return freeze(completed);
  }
  async migrate({ expectedLegacyDigest, operatorId, confirmation } = {}) {
    if (confirmation !== "MIGRATE-LIVE-PRICE-PUBLICATION-AUTHORIZATION-STATE" || typeof operatorId !== "string" || !operatorId.trim()) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_CONFIRMATION_REQUIRED"); const inspection = await this.inspect(); if (inspection.status !== "MIGRATION_READY" || inspection.legacyDigest !== expectedLegacyDigest) throw new Error(`PUBLICATION_AUTHORIZATION_MIGRATION_NOT_READY:${inspection.status}`);
    const legacy = await readState(this.legacyStatePath), migrationId = `pubauthmig_${sha256(`${legacy.digest}:${this.canonicalStatePath}`).slice(0, 24)}`, preparedAt = this.now(), prepared = { schemaVersion: "1.0", migrationId, status: "PREPARED", legacyStatePath: this.legacyStatePath, canonicalStatePath: this.canonicalStatePath, stateDigest: legacy.digest, operatorId, preparedAt };
    await this.writeAtomic(this.auditPath, `${JSON.stringify(prepared, null, 2)}\n`); await this.writeAtomic(this.canonicalStatePath, legacy.text); const canonical = await readState(this.canonicalStatePath); if (canonical.digest !== legacy.digest) throw new Error("PUBLICATION_AUTHORIZATION_MIGRATION_HASH_MISMATCH"); const completed = { ...prepared, status: "COMPLETED", completedAt: this.now(), canonicalDigest: canonical.digest }; await this.writeAtomic(this.auditPath, `${JSON.stringify(completed, null, 2)}\n`); return freeze(completed);
  }
}
