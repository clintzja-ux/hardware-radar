import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateStaticPublicationRelease, staticPublicationArtifactDigest } from "../validators/StaticPublicationReleaseControl.js";
import { FileSingleWriterRunLock, SINGLE_WRITER_LOCK_STATUSES } from "../../mercury/runtime/FileSingleWriterRunLock.js";

const VERSION = "GOVERNED-LIVE-PRICE-PUBLICATION-001-1.0";
const clone = value => structuredClone(value);
const freeze = value => Object.freeze(clone(value));
const digest = value => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const authorizationKeys = ["schemaVersion","policyVersion","authorizationId","candidateId","artifactId","artifactDigest","bindingDigest","certificationId","certificationDigest","targetEnvironment","predecessorReleaseId","freshUntil","authorizedPaths","authorizedBy","authorizedAt","status"];

export const DEFAULT_LIVE_PRICE_GENERATED_PATHS = Object.freeze([
  "config/publication-release.json", "config/artifacts/", "public/data/market-snapshot.json",
  "public/data/ram-catalog.json", "public/data/ram-current-retail.json", "public/data/ram-terminal.json",
  "public/data/atlas/", "public/ram/", "public/sitemap.xml"
]);

function pathAllowed(file, allowed) {
  const normalized = file.replaceAll("\\", "/").replace(/^\.\//, "");
  return allowed.some(entry => entry.endsWith("/") ? normalized.startsWith(entry) : normalized === entry);
}

export function createLivePricePublicationAuthorization(input = {}) {
  const authorizedPaths = [...new Set(input.authorizedPaths ?? DEFAULT_LIVE_PRICE_GENERATED_PATHS)].sort();
  const identity = { candidateId: input.candidateId, artifactId: input.artifactId, artifactDigest: input.artifactDigest, bindingDigest: input.bindingDigest, certificationId: input.certificationId, certificationDigest: input.certificationDigest, targetEnvironment: input.targetEnvironment, predecessorReleaseId: input.predecessorReleaseId, freshUntil: input.freshUntil, authorizedPaths, authorizedBy: input.authorizedBy, authorizedAt: input.authorizedAt };
  const authorization = { schemaVersion: "1.0", policyVersion: VERSION, authorizationId: `pubauto_${digest(identity).slice(0,24)}`, ...identity, status: "AUTHORIZED" };
  const report = validateLivePricePublicationAuthorization(authorization);
  if (!report.valid) throw new Error(report.errors.join(","));
  return freeze(authorization);
}

export function validateLivePricePublicationAuthorization(value) {
  const errors = [];
  if (!exactKeys(value, authorizationKeys)) errors.push("LIVE_PRICE_PUBLICATION_AUTHORIZATION_SHAPE_INVALID");
  if (value?.schemaVersion !== "1.0" || value?.policyVersion !== VERSION || value?.status !== "AUTHORIZED") errors.push("LIVE_PRICE_PUBLICATION_AUTHORIZATION_INVALID");
  if (!/^pubauto_[a-f0-9]{24}$/.test(value?.authorizationId ?? "") || !/^mer_ramreleasecand_[a-f0-9]{24}$/.test(value?.candidateId ?? "") || !/^mer_ramreleaseart_[a-f0-9]{24}$/.test(value?.artifactId ?? "")) errors.push("LIVE_PRICE_PUBLICATION_IDENTITY_INVALID");
  if (!/^sent_ramreleasecert_[a-f0-9]{24}$/.test(value?.certificationId ?? "") || ![value?.artifactDigest,value?.bindingDigest,value?.certificationDigest].every(item => /^[a-f0-9]{64}$/.test(item ?? ""))) errors.push("LIVE_PRICE_PUBLICATION_BINDING_INVALID");
  if (value?.targetEnvironment !== "PRODUCTION" || !/^pubrel_[a-f0-9]{24}$/.test(value?.predecessorReleaseId ?? "")) errors.push("LIVE_PRICE_PUBLICATION_SCOPE_INVALID");
  if (![value?.freshUntil,value?.authorizedAt].every(item => Number.isFinite(Date.parse(item ?? ""))) || typeof value?.authorizedBy !== "string" || !value.authorizedBy.trim()) errors.push("LIVE_PRICE_PUBLICATION_OPERATOR_INVALID");
  if (!Array.isArray(value?.authorizedPaths) || value.authorizedPaths.length === 0 || value.authorizedPaths.some(item => typeof item !== "string" || path.isAbsolute(item) || item.includes(".."))) errors.push("LIVE_PRICE_PUBLICATION_PATHS_INVALID");
  return freeze({ valid: errors.length === 0, errors: [...new Set(errors)] });
}

export class FileLivePricePublicationAuthorizationRepository {
  constructor({ statePath, runLock } = {}) { if (!statePath) throw new Error("LIVE_PRICE_PUBLICATION_STATE_REQUIRED"); this.statePath = path.resolve(statePath); this.queue = Promise.resolve(); this.runLock = runLock ?? new FileSingleWriterRunLock({ lockPath: `${this.statePath}.lock` }); }
  async _read() { try { const state = JSON.parse(await readFile(this.statePath, "utf8")); if (state?.schemaVersion !== "1.0" || !state.authorizations || !state.operations || !state.consumptions) throw new Error(); return state; } catch (error) { if (error?.code === "ENOENT") return { schemaVersion: "1.0", authorizations: {}, operations: {}, consumptions: {} }; throw new Error("LIVE_PRICE_PUBLICATION_STATE_INVALID"); } }
  async _write(state) { await mkdir(path.dirname(this.statePath), { recursive: true }); const temp = `${this.statePath}.tmp-${process.pid}-${randomUUID()}`; await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, "utf8"); await rename(temp, this.statePath); }
  async _exclusive(action) { const execute = async () => { const result = await this.runLock.runExclusive(action); if (result.status !== SINGLE_WRITER_LOCK_STATUSES.COMPLETED) throw new Error("LIVE_PRICE_PUBLICATION_STATE_BUSY"); return result.result; }; const run = this.queue.then(execute, execute); this.queue = run.catch(() => {}); return run; }
  record(authorization) { return this._exclusive(async () => { if (!validateLivePricePublicationAuthorization(authorization).valid) throw new Error("LIVE_PRICE_PUBLICATION_AUTHORIZATION_INVALID"); const state = await this._read(), prior = state.authorizations[authorization.authorizationId]; if (prior && JSON.stringify(prior) !== JSON.stringify(authorization)) throw new Error("LIVE_PRICE_PUBLICATION_AUTHORIZATION_CONFLICT"); state.authorizations[authorization.authorizationId] = clone(authorization); await this._write(state); return freeze(prior ? { status: "ALREADY_AUTHORIZED", authorization: prior } : { status: "AUTHORIZED", authorization }); }); }
  async get(id) { const value = (await this._read()).authorizations[id]; return value ? freeze(value) : null; }
  async getOperation(id) { const value = (await this._read()).operations[id]; return value ? freeze(value) : null; }
  begin({ authorizationId, checkoutRoot, startedAt }) { return this._exclusive(async () => { const state = await this._read(); if (!state.authorizations[authorizationId]) throw new Error("LIVE_PRICE_PUBLICATION_AUTHORIZATION_NOT_FOUND"); const operation = { authorizationId, checkoutRoot: path.resolve(checkoutRoot), startedAt, status: "BUILD_INTENT_RECORDED" }, prior = state.operations[authorizationId]; if (prior) { if (JSON.stringify(prior) !== JSON.stringify(operation)) throw new Error("LIVE_PRICE_PUBLICATION_OPERATION_CONFLICT"); return freeze({ status: "RECOVERED", operation: prior }); } state.operations[authorizationId] = operation; await this._write(state); return freeze({ status: "RECORDED", operation }); }); }
  async getConsumption(id) { const value = (await this._read()).consumptions[id]; return value ? freeze(value) : null; }
  consume({ authorizationId, checkpointDigest, consumedAt }) { return this._exclusive(async () => { const state = await this._read(), authorization = state.authorizations[authorizationId]; if (!authorization) throw new Error("LIVE_PRICE_PUBLICATION_AUTHORIZATION_NOT_FOUND"); const prior = state.consumptions[authorizationId]; if (prior) { if (prior.checkpointDigest !== checkpointDigest) throw new Error("LIVE_PRICE_PUBLICATION_AUTHORIZATION_ALREADY_CONSUMED"); return freeze({ status: "ALREADY_CONSUMED", consumption: prior }); } const consumption = { authorizationId, checkpointDigest, consumedAt }; state.consumptions[authorizationId] = consumption; await this._write(state); return freeze({ status: "CONSUMED", consumption }); }); }
}

export class GovernedLivePricePublicationCoordinator {
  constructor({ authorizationRepository, buildRunner, verificationRunner, gitInspector, now = () => new Date().toISOString() } = {}) { if (!authorizationRepository || !buildRunner || !verificationRunner || !gitInspector) throw new Error("LIVE_PRICE_PUBLICATION_COMPOSITION_INCOMPLETE"); Object.assign(this, { authorizationRepository, buildRunner, verificationRunner, gitInspector, now }); }
  async prepare({ authorizationId, checkoutRoot, releaseManifestPath = "config/publication-release.json" } = {}) {
    const authorization = await this.authorizationRepository.get(authorizationId); if (!authorization) throw new Error("LIVE_PRICE_PUBLICATION_AUTHORIZATION_NOT_FOUND");
    const evaluatedAt = this.now(); if (Date.parse(evaluatedAt) >= Date.parse(authorization.freshUntil)) throw new Error("LIVE_PRICE_PUBLICATION_FRESHNESS_EXPIRED");
    const root = path.resolve(checkoutRoot), manifestPath = path.resolve(root, releaseManifestPath), manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const artifactText = await readFile(path.resolve(path.dirname(manifestPath), manifest.artifact.relativePath), "utf8");
    const release = evaluateStaticPublicationRelease({ manifest, artifactText, targetEnvironment: "PRODUCTION", evaluatedAt });
    if (!release.exposed || release.currentMode !== "FRESH") throw new Error(`LIVE_PRICE_PUBLICATION_RELEASE_INELIGIBLE:${release.reason}`);
    const bindings = [[manifest.artifact.candidateId,authorization.candidateId],[manifest.artifact.artifactId,authorization.artifactId],[staticPublicationArtifactDigest(artifactText),authorization.artifactDigest],[manifest.artifact.bindingDigest,authorization.bindingDigest],[manifest.artifact.certificationId,authorization.certificationId],[digest(JSON.stringify(release.portfolio.certification)),authorization.certificationDigest],[manifest.rollback.previousReleaseId,authorization.predecessorReleaseId],[manifest.targetEnvironment,authorization.targetEnvironment]];
    if (bindings.some(([actual,expected]) => actual !== expected)) throw new Error("LIVE_PRICE_PUBLICATION_BINDING_MISMATCH");
    const before = await this.gitInspector.inspect({ root }), priorOperation = await this.authorizationRepository.getOperation(authorizationId);
    if (!before.clean && (!priorOperation || before.changedPaths.some(file => !pathAllowed(file, authorization.authorizedPaths)))) throw new Error("LIVE_PRICE_PUBLICATION_CHECKOUT_NOT_CLEAN");
    const operation = await this.authorizationRepository.begin({ authorizationId, checkoutRoot: root, startedAt: priorOperation?.startedAt ?? evaluatedAt });
    await this.buildRunner.run({ root, generatedAt: manifest.createdAt, environment: "PRODUCTION" }); await this.verificationRunner.run({ root, authorization, release });
    if (Date.parse(this.now()) >= Date.parse(authorization.freshUntil)) throw new Error("LIVE_PRICE_PUBLICATION_FRESHNESS_EXPIRED");
    const after = await this.gitInspector.inspect({ root }), unauthorized = after.changedPaths.filter(file => !pathAllowed(file, authorization.authorizedPaths));
    if (unauthorized.length) throw new Error(`LIVE_PRICE_PUBLICATION_UNAUTHORIZED_PATHS:${unauthorized.join(",")}`);
    const checkpoint = { schemaVersion:"1.0",status:"READY_FOR_RELEASE_ONLY_CHECKPOINT",authorizationId,releaseId:manifest.releaseId,candidateId:authorization.candidateId,predecessorReleaseId:authorization.predecessorReleaseId,evaluatedAt:operation.operation.startedAt,freshUntil:authorization.freshUntil,changedPaths:[...after.changedPaths].sort(),recovery:operation.status==="RECOVERED",mergeAuthorized:false,deploymentAuthorized:false,rollbackAuthorized:false };
    const checkpointIdentity = { ...checkpoint }; delete checkpointIdentity.recovery;
    const checkpointDigest=digest(checkpointIdentity), consumption=await this.authorizationRepository.consume({authorizationId,checkpointDigest,consumedAt:checkpoint.evaluatedAt}); return freeze({...checkpoint,checkpointDigest,replay:consumption.status==="ALREADY_CONSUMED"});
  }
}

export function classifyCloudflareDeploymentObservation({ expectedCommit, expectedReleaseId, observation } = {}) {
  if (!observation || observation.status === "PENDING") return freeze({ status: "DEPLOYMENT_PENDING", retryAuthorized: false, rollbackAuthorized: false });
  if (observation.status === "FAILED") return freeze({ status: "DEPLOYMENT_FAILED", reason: observation.reason ?? "CLOUDFLARE_DEPLOYMENT_FAILED", retryAuthorized: false, rollbackAuthorized: false });
  if (observation.status !== "SUCCESS" || observation.commit !== expectedCommit || observation.releaseId !== expectedReleaseId) return freeze({ status: "DEPLOYMENT_BINDING_MISMATCH", retryAuthorized: false, rollbackAuthorized: false });
  return freeze({ status: "DEPLOYMENT_VERIFIED", retryAuthorized: false, rollbackAuthorized: false });
}
