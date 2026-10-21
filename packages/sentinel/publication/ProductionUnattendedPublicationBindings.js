import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRecurringPublicationMandate, projectUnattendedPublicationHealth } from "./UnattendedLivePricePublication.js";

const freeze = value => Object.freeze(structuredClone(value));
const sha256 = value => createHash("sha256").update(value).digest("hex");

export class RecurringPublicationMandateOperatorService {
  constructor({ repository, now = () => new Date().toISOString() } = {}) {
    if (!repository) throw new Error("PUBLICATION_MANDATE_REPOSITORY_REQUIRED");
    Object.assign(this, { repository, now });
  }
  inspect() { return this.repository.inspect(); }
  async create({ operatorId, validFrom, expiresAt, confirmation } = {}) {
    if (confirmation !== "CREATE-UNATTENDED-PUBLICATION-MANDATE") throw new Error("PUBLICATION_MANDATE_CONFIRMATION_REQUIRED");
    const mandate = createRecurringPublicationMandate({ operatorId, validFrom, expiresAt, createdAt: this.now() });
    return this.repository.record(mandate);
  }
  transition({ mandateId, status, operatorId, confirmation } = {}) {
    if (confirmation !== `${status}-UNATTENDED-PUBLICATION-MANDATE`) throw new Error("PUBLICATION_MANDATE_CONFIRMATION_REQUIRED");
    return this.repository.transition({ mandateId, status, operatorId, at: this.now() });
  }
}

export class CertifiedRoutinePublicationCandidateOwner {
  constructor({ routineHealthPath, artifactRoot, releaseManifestPath, readJson = async file => JSON.parse(await readFile(file, "utf8")) } = {}) {
    Object.assign(this, { routineHealthPath, artifactRoot, releaseManifestPath, readJson });
  }
  async discover() {
    const healthEnvelope = await this.readJson(this.routineHealthPath), health = healthEnvelope.projection ?? healthEnvelope;
    const completed = new Set(health.lastSuccessfulRun?.completedStages ?? []), readiness = health.releaseReadiness;
    if (!completed.has("CERTIFICATION") || !completed.has("RELEASE_CERTIFICATION") || readiness?.state !== "CERTIFIED_ZERO_AUTHORITY") return null;
    const directory = path.join(this.artifactRoot, readiness.candidateId);
    const [manifest, certification, release] = await Promise.all([
      this.readJson(path.join(directory, "manifest.json")), this.readJson(path.join(directory, "certification.json")), this.readJson(this.releaseManifestPath),
    ]);
    if (manifest.candidateId !== readiness.candidateId || manifest.artifactId !== readiness.artifactId || certification.certificationId !== readiness.certificationId) throw new Error("PUBLICATION_TRIGGER_BINDING_CONFLICT");
    const alreadyDeployed = release.releaseState === "ON" && release.targetEnvironment === "PRODUCTION" && release.artifact?.candidateId === manifest.candidateId && release.artifact?.artifactId === manifest.artifactId && release.artifact?.certificationId === certification.certificationId && release.artifact?.bindingDigest === manifest.bindingDigest;
    return freeze({
      candidateId: manifest.candidateId, artifactId: manifest.artifactId, certificationId: certification.certificationId,
      bindingDigest: manifest.bindingDigest, artifactDigest: sha256(JSON.stringify(manifest)), certificationDigest: sha256(JSON.stringify(certification)),
      predecessorReleaseId: release.releaseId, freshUntil: manifest.currentValidUntil, sentinelStatus: "CERTIFIED",
      sourceRightsEligible: certification.status === "CERTIFIED", releaseId: alreadyDeployed ? release.releaseId : null, alreadyDeployed,
      trigger: { runId: health.lastSuccessfulRun.runId, certificationStageCompleted: true, releaseReadinessStageCompleted: true },
    });
  }
}

export class GitHubAppReleaseGitOwner {
  constructor({ runner, checkoutRoot, tokenProvider, askPassPath } = {}) {
    if (!runner || !checkoutRoot || !tokenProvider?.getToken || !askPassPath) throw new Error("PUBLICATION_GIT_COMPOSITION_INCOMPLETE"); Object.assign(this, { runner, checkoutRoot, tokenProvider, askPassPath });
  }
  async _remote(args){const credential=await this.tokenProvider.getToken(),env={...process.env,GIT_ASKPASS:this.askPassPath,GIT_TERMINAL_PROMPT:"0",GCM_INTERACTIVE:"Never",GIT_CONFIG_COUNT:"1",GIT_CONFIG_KEY_0:"credential.helper",GIT_CONFIG_VALUE_0:"",HARDWARE_RADAR_GITHUB_INSTALLATION_TOKEN_EPHEMERAL:credential.token};try{return await this.runner("git",args,this.checkoutRoot,{env});}finally{env.HARDWARE_RADAR_GITHUB_INSTALLATION_TOKEN_EPHEMERAL="";}}
  async inspectBase() {
    const [status, local, remote] = await Promise.all([
      this.runner("git", ["status", "--porcelain=v1", "--untracked-files=all"], this.checkoutRoot),
      this.runner("git", ["rev-parse", "HEAD"], this.checkoutRoot), this.runner("git", ["rev-parse", "origin/main"], this.checkoutRoot),
    ]);
    const changedPaths=status.stdout.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replace(/^"|"$/g,""));
    return freeze({ clean: changedPaths.length===0, changedPaths, localCommit: local.stdout.trim(), remoteCommit: remote.stdout.trim() });
  }
  async checkpoint({ prepared, expectedParent }) {
    if (prepared.allowlistValid !== true || !Array.isArray(prepared.changedPaths)) throw new Error("PUBLICATION_PREPARATION_INVALID");
    await this.runner("git", ["add", "--", ...prepared.changedPaths], this.checkoutRoot);
    await this.runner("git", ["commit", "-m", `feat(publication): deliver ${prepared.candidateId}`], this.checkoutRoot);
    const [commit, parent] = await Promise.all([this.runner("git", ["rev-parse", "HEAD"], this.checkoutRoot), this.runner("git", ["rev-parse", "HEAD^"], this.checkoutRoot)]);
    return freeze({ commit: commit.stdout.trim(), parentCommit: parent.stdout.trim(), unrelatedPaths: parent.stdout.trim() === expectedParent ? [] : ["GIT_PARENT_CONFLICT"] });
  }
  async fastForwardMain({ commit, expectedRemote }) {
    const remote = (await this._remote(["ls-remote", "origin", "refs/heads/main"])).stdout.split(/\s+/)[0];
    if (remote !== expectedRemote) throw new Error("PUBLICATION_GIT_PREDECESSOR_CONFLICT");
    await this._remote(["push", "origin", `${commit}:refs/heads/main`]);
    return freeze({ commit });
  }
}

export class CloudflarePagesDeploymentObserver {
  constructor({ fetchImpl = globalThis.fetch, accountId, projectName, tokenProvider } = {}) { Object.assign(this, { fetchImpl, accountId, projectName, tokenProvider }); }
  async observe({ commit }) {
    const token = await this.tokenProvider?.();
    if (!token || !this.accountId || !this.projectName) throw new Error("PUBLICATION_CLOUDFLARE_OBSERVER_CREDENTIAL_REQUIRED");
    const response = await this.fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${this.projectName}/deployments`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("PUBLICATION_CLOUDFLARE_OBSERVATION_FAILED");
    const body = await response.json(), deployment = body.result?.find(item => item.deployment_trigger?.metadata?.commit_hash === commit);
    if (!deployment) return freeze({ status: "PENDING" });
    return freeze({ status: deployment.latest_stage?.status === "success" ? "SUCCESS" : deployment.latest_stage?.status === "failure" ? "FAILED" : "PENDING", commit });
  }
}

export class PublicArtifactIntegrityVerifier {
  constructor({ fetchImpl = globalThis.fetch } = {}) { this.fetchImpl = fetchImpl; }
  async verify({ candidate }) {
    if (!Array.isArray(candidate.publicArtifacts) || !candidate.publicArtifacts.length) throw new Error("PUBLICATION_PUBLIC_ARTIFACT_MANIFEST_REQUIRED");
    for (const artifact of candidate.publicArtifacts) {
      const response = await this.fetchImpl(artifact.url); if (!response.ok) return freeze({ status: "MISMATCH" });
      const digest = sha256(Buffer.from(await response.arrayBuffer())); if (digest !== artifact.sha256) return freeze({ status: "MISMATCH" });
    }
    return freeze({ status: "MATCH" });
  }
}

export class ProductionUnattendedPublicationCommand {
  constructor({ repository, mandateService, candidateOwner, coordinatorFactory, now = () => new Date().toISOString() } = {}) { Object.assign(this, { repository, mandateService, candidateOwner, coordinatorFactory, now }); }
  async inspect() { const state = await this.mandateService.inspect(), candidate = await this.candidateOwner.discover(); const operation = candidate ? await this.repository.getOperation(candidate.candidateId) : null, mandate = state.mandates.find(item => item.status === "ENABLED") ?? null; return freeze({ status: "INSPECTED", candidate, health: projectUnattendedPublicationHealth({ mandate, operation, asOf: this.now() }), networkOperation: "NONE", actionExecuted: false }); }
  async run({ mandateId }) { if (!mandateId) throw new Error("PUBLICATION_MANDATE_ID_REQUIRED"); const candidate=await this.candidateOwner.discover();if(candidate?.alreadyDeployed)return freeze({status:"ALREADY_DEPLOYED_CANDIDATE",candidateId:candidate.candidateId,artifactId:candidate.artifactId,certificationId:candidate.certificationId,releaseId:candidate.releaseId,replay:true,authorityCreated:false,gitOperation:false,deploymentOperation:false,providerCalls:0,canonicalMarketMutation:false}); const coordinator = await this.coordinatorFactory(); return coordinator.run({ mandateId }); }
}

export class ProductionForgeUnattendedPublicationProvider {
  constructor({ repository } = {}) { if (!repository) throw new Error("PUBLICATION_MANDATE_REPOSITORY_REQUIRED"); this.repository = repository; }
  async load({ asOf } = {}) {
    const state = await this.repository.inspect(), mandate = state.mandates.find(item => item.status === "ENABLED") ?? state.mandates.at(-1) ?? null;
    const operations = [...state.operations].sort((left, right) => String(left.events?.at(-1)?.at ?? "").localeCompare(String(right.events?.at(-1)?.at ?? "")));
    return projectUnattendedPublicationHealth({ mandate, operation: operations.at(-1) ?? null, asOf });
  }
}
