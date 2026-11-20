import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRecurringPublicationMandate, projectUnattendedPublicationHealth } from "./UnattendedLivePricePublication.js";
import { staticPublicationArtifactDigest } from "../validators/StaticPublicationReleaseControl.js";
import { DEFAULT_LIVE_PRICE_GENERATED_PATHS } from "./GovernedLivePricePublication.js";
import { createPricePublicationGeneratedPathInventory } from "../../../scripts/lib/publication-generated-path-inventory.mjs";
import { projectPublicationReliabilityStatus } from "./PublicationReliabilityP2.js";

const freeze = value => Object.freeze(structuredClone(value));
const sha256 = value => createHash("sha256").update(value).digest("hex");
const forbiddenRecoveryAdvancementPath = value => value.startsWith("public/")||value.startsWith("packages/atlas/")||value.startsWith(".forge-review/")||value==="config/publication-release.json"||value.startsWith("config/artifacts/");
export const POST_DEPLOYMENT_OBSERVATION_RECOVERY_RUNTIME_PATHS=Object.freeze([
  "packages/sentinel/publication/ProductionUnattendedPublicationBindings.js",
  "packages/sentinel/publication/ProductionUnattendedPublicationFactory.js",
  "packages/sentinel/publication/UnattendedLivePricePublication.js",
  "packages/sentinel/tests/PostDeploymentReconsiderationObservationRecovery.test.mjs",
  "packages/sentinel/tests/PreCheckpointPublicationDisposition.test.mjs",
  "packages/sentinel/tests/run-all-tests.mjs",
  "scripts/unattended-live-price-publication.mjs",
].sort());
export const POST_DEPLOYMENT_OBSERVATION_GIT_CONTRACT_PATHS=Object.freeze([
  "docs/handoff/CURRENT-STATE.md",
  "docs/implementation Contracts/IC-CERTIFIED-STATIC-PUBLICATION-RELEASE-CONTROL-P1.md",
  "docs/operations/HARDWARE-RADAR-OPERATOR-RUNBOOK.md",
  "packages/sentinel/publication/ProductionUnattendedPublicationBindings.js",
  "packages/sentinel/publication/ProductionUnattendedPublicationFactory.js",
  "packages/sentinel/publication/UnattendedLivePricePublication.js",
  "packages/sentinel/tests/PostDeploymentReconsiderationObservationRecovery.test.mjs",
  "packages/sentinel/tests/ProductionUnattendedPublicationBindings.test.mjs",
].sort());

export function validatePublishedReleaseBinding({manifest,artifactText,expected}={}) {
  const comparisons={releaseId:manifest?.releaseId===expected?.releaseId,candidateId:manifest?.artifact?.candidateId===expected?.candidateId,artifactId:manifest?.artifact?.artifactId===expected?.artifactId,certificationId:manifest?.artifact?.certificationId===expected?.certificationId,bindingDigest:manifest?.artifact?.bindingDigest===expected?.bindingDigest,predecessorReleaseId:manifest?.rollback?.previousReleaseId===expected?.predecessorReleaseId,releaseArtifactDigest:staticPublicationArtifactDigest(artifactText??"")===expected?.releaseArtifactDigest};
  return freeze({valid:Object.values(comparisons).every(Boolean),comparisons});
}

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

export class PublicationRecoveryAdvancementApprovalService {
  constructor({repository,gitOwner,now=()=>new Date().toISOString()}={}){if(!repository||!gitOwner)throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_COMPOSITION_INCOMPLETE");Object.assign(this,{repository,gitOwner,now});}
  async inspect({mandateId,candidateId,approvedDescendant}={}){
    if(!mandateId||!candidateId||!approvedDescendant)throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_SCOPE_REQUIRED");
    const [operation,mandate]=await Promise.all([this.repository.getOperation(candidateId),this.repository.getMandate(mandateId)]),child=await this.repository.getChild(operation?.childAuthorizationId),at=this.now();
    const prepares=operation?.events?.filter(event=>event.type==="PREPARE_STARTED")??[],checkpoints=operation?.events?.filter(event=>event.type==="CHECKPOINT_CREATED")??[],pushes=operation?.events?.filter(event=>event.type==="MAIN_UPDATED")??[];
    if(!operation||operation.status!=="FAILED"||operation.attempts!==1||prepares.length!==1||checkpoints.length||pushes.length||!child||!mandate||mandate.status!=="ENABLED"||Date.parse(at)<Date.parse(mandate.validFrom)||Date.parse(at)>=Date.parse(mandate.expiresAt))throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_AUTHORITY_INVALID");
    const advancement=await this.gitOwner.inspectPreCheckpointMainlineAdvancement({historicalPredecessor:child.predecessorCommit,approvedDescendant});
    if(!advancement.commits.length)throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_NOT_REQUIRED");
    return freeze({status:"PUBLICATION_ADVANCEMENT_APPROVAL_READY",mandateId,candidateId,originalChildAuthorizationId:child.childAuthorizationId,advancement,operatorId:mandate.operatorId,canonicalMarketMutation:false,authorityConsumed:false});
  }
  async approve({mandateId,candidateId,approvedDescendant,operatorId,confirmation}={}){
    if(confirmation!=="APPROVE-PRE-CHECKPOINT-PUBLICATION-ADVANCEMENT")throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_CONFIRMATION_REQUIRED");
    const ready=await this.inspect({mandateId,candidateId,approvedDescendant});if(operatorId!==ready.operatorId)throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_OPERATOR_INVALID");
    return this.repository.approvePreCheckpointMainlineAdvancement({...ready,operatorId,at:this.now()});
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
  async discoverRecovery({candidateId,expected}={}) {
    const healthEnvelope=await this.readJson(this.routineHealthPath),health=healthEnvelope.projection??healthEnvelope,readiness=health.releaseReadiness;if(readiness?.candidateId!==candidateId)throw new Error("PUBLICATION_RECOVERY_TRIGGER_BINDING_CONFLICT");
    const directory=path.join(this.artifactRoot,candidateId),[manifest,certification,release]=await Promise.all([this.readJson(path.join(directory,"manifest.json")),this.readJson(path.join(directory,"certification.json")),this.readJson(this.releaseManifestPath)]);
    if(manifest.candidateId!==candidateId||manifest.artifactId!==expected?.artifactId||certification.certificationId!==expected?.certificationId||certification.candidateId!==candidateId||certification.artifactBindingDigest!==expected?.bindingDigest)throw new Error("PUBLICATION_RECOVERY_CANDIDATE_BINDING_INVALID");
    const releaseMatches=release.releaseState==="ON"&&release.targetEnvironment==="PRODUCTION"&&release.artifact?.candidateId===candidateId&&release.artifact?.artifactId===manifest.artifactId&&release.artifact?.certificationId===certification.certificationId&&release.artifact?.bindingDigest===manifest.bindingDigest;
    if(!releaseMatches)throw new Error("PUBLICATION_RECOVERY_RELEASE_CHECKPOINT_BINDING_INVALID");
    return freeze({candidateId,artifactId:manifest.artifactId,certificationId:certification.certificationId,bindingDigest:manifest.bindingDigest,artifactDigest:sha256(JSON.stringify(manifest)),certificationDigest:sha256(JSON.stringify(certification)),predecessorReleaseId:expected.predecessorReleaseId,freshUntil:manifest.currentValidUntil,sentinelStatus:certification.status,sourceRightsEligible:certification.status==="CERTIFIED",releaseId:release.releaseId,alreadyDeployed:false,trigger:{runId:health.lastSuccessfulRun?.runId??null,certificationStageCompleted:true,releaseReadinessStageCompleted:true}});
  }
}

export function createSplitRootProductionPublicationCandidateOwner({evidenceRoot,checkoutRoot,readJson}={}) {
  if(!evidenceRoot||!checkoutRoot)throw new Error("PUBLICATION_CANDIDATE_ROOTS_REQUIRED");
  return new CertifiedRoutinePublicationCandidateOwner({routineHealthPath:path.join(evidenceRoot,".forge-review/mercury/newegg-routine/routine-health.json"),artifactRoot:path.join(evidenceRoot,".forge-review/publication/ram-intelligence"),releaseManifestPath:path.join(checkoutRoot,"config/publication-release.json"),readJson});
}

export class GitHubAppReleaseGitOwner {
  constructor({ runner, checkoutRoot, tokenProvider, askPassPath, approvedObservationRecoveryRuntimeCommit=null } = {}) {
    if (!runner || !checkoutRoot || !tokenProvider?.getToken || !askPassPath) throw new Error("PUBLICATION_GIT_COMPOSITION_INCOMPLETE"); Object.assign(this, { runner, checkoutRoot, tokenProvider, askPassPath });
    this.approvedObservationRecoveryRuntimeCommit=approvedObservationRecoveryRuntimeCommit;
  }
  async _remote(args){const credential=await this.tokenProvider.getToken(),env={...process.env,GIT_ASKPASS:this.askPassPath,GIT_TERMINAL_PROMPT:"0",GCM_INTERACTIVE:"Never",GIT_CONFIG_COUNT:"1",GIT_CONFIG_KEY_0:"credential.helper",GIT_CONFIG_VALUE_0:"",HARDWARE_RADAR_GITHUB_ASKPASS_NODE:process.execPath,HARDWARE_RADAR_GITHUB_INSTALLATION_TOKEN_EPHEMERAL:credential.token};try{return await this.runner("git",args,this.checkoutRoot,{env});}finally{env.HARDWARE_RADAR_GITHUB_INSTALLATION_TOKEN_EPHEMERAL="";}}
  async inspectBase() {
    const [status, local, remote] = await Promise.all([
      this.runner("git", ["status", "--porcelain=v1", "--untracked-files=all"], this.checkoutRoot),
      this.runner("git", ["rev-parse", "HEAD"], this.checkoutRoot), this.runner("git", ["rev-parse", "origin/main"], this.checkoutRoot),
    ]);
    const changedPaths=status.stdout.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replace(/^"|"$/g,""));
    return freeze({ clean: changedPaths.length===0, changedPaths, localCommit: local.stdout.trim(), remoteCommit: remote.stdout.trim() });
  }
  async inspectPreCheckpointMainlineAdvancement({historicalPredecessor,approvedDescendant}={}) {
    if(!/^[0-9a-f]{40}$/.test(historicalPredecessor??"")||!/^[0-9a-f]{40}$/.test(approvedDescendant??""))throw new Error("PUBLICATION_ADVANCEMENT_SCOPE_INVALID");
    const currentMain=(await this._remote(["ls-remote","origin","refs/heads/main"])).stdout.trim().split(/\s+/)[0];if(currentMain!==approvedDescendant)throw new Error("PUBLICATION_ADVANCEMENT_REMOTE_MISMATCH");
    if(currentMain===historicalPredecessor){const evidence={historicalPredecessor,currentMain,commits:[],changedPaths:[]};return freeze({...evidence,advancementDigest:sha256(JSON.stringify(evidence))});}
    try{await this.runner("git",["merge-base","--is-ancestor",historicalPredecessor,currentMain],this.checkoutRoot);}catch{throw new Error("PUBLICATION_DISPOSITION_MAINLINE_DIVERGED");}
    const [commitsResult,pathsResult]=await Promise.all([
      this.runner("git",["rev-list","--reverse",`${historicalPredecessor}..${currentMain}`],this.checkoutRoot),
      this.runner("git",["diff","--name-only",historicalPredecessor,currentMain],this.checkoutRoot),
    ]),commits=commitsResult.stdout.split(/\r?\n/).filter(Boolean),changedPaths=pathsResult.stdout.split(/\r?\n/).filter(Boolean).map(value=>value.replaceAll("\\","/")).sort();
    if(!commits.length||commits.at(-1)!==currentMain||changedPaths.some(forbiddenRecoveryAdvancementPath))throw new Error("PUBLICATION_DISPOSITION_MAINLINE_ADVANCEMENT_INVALID");
    const evidence={historicalPredecessor,currentMain,commits,changedPaths};return freeze({...evidence,advancementDigest:sha256(JSON.stringify(evidence))});
  }
  async _verifyApprovedPreCheckpointAdvancement({historicalPredecessor,currentMain,advancementApproval}={}) {
    if(currentMain===historicalPredecessor&&!advancementApproval)return this.inspectPreCheckpointMainlineAdvancement({historicalPredecessor,approvedDescendant:currentMain});
    if(!advancementApproval||advancementApproval.status!=="APPROVED"||advancementApproval.historicalPredecessor!==historicalPredecessor||advancementApproval.approvedDescendant!==currentMain)throw new Error("PUBLICATION_DISPOSITION_MAINLINE_ADVANCEMENT_NOT_APPROVED");
    const observed=await this.inspectPreCheckpointMainlineAdvancement({historicalPredecessor,approvedDescendant:currentMain});
    if(observed.advancementDigest!==advancementApproval.advancementDigest||JSON.stringify(observed.commits)!==JSON.stringify(advancementApproval.interveningCommits)||JSON.stringify(observed.changedPaths)!==JSON.stringify(advancementApproval.changedPaths))throw new Error("PUBLICATION_DISPOSITION_MAINLINE_ADVANCEMENT_INVALID");
    return freeze({...observed,approvalId:advancementApproval.approvalId,approvalDigest:advancementApproval.approvalDigest});
  }
  async inspectFailedPreparationWorkspace({expectedPredecessor,authorizedPaths,allowClean=false,advancementApproval=null}={}) {
    const [status,local,remote]=await Promise.all([this.runner("git",["status","--porcelain=v1","--untracked-files=all"],this.checkoutRoot),this.runner("git",["rev-parse","HEAD"],this.checkoutRoot),this._remote(["ls-remote","origin","refs/heads/main"])]),localCommit=local.stdout.trim(),remoteCommit=remote.stdout.trim().split(/\s+/)[0];
    if(localCommit!==expectedPredecessor)throw new Error("PUBLICATION_DISPOSITION_PREDECESSOR_CONFLICT");
    const advancement=await this._verifyApprovedPreCheckpointAdvancement({historicalPredecessor:expectedPredecessor,currentMain:remoteCommit,advancementApproval});
    const entries=status.stdout.split(/\r?\n/).filter(Boolean).map(line=>({status:line.slice(0,2),path:line.slice(3).replace(/^"|"$/g,"").replaceAll("\\","/")})).sort((a,b)=>a.path.localeCompare(b.path));
    if(entries.some(entry=>![" M","??"].includes(entry.status)))throw new Error("PUBLICATION_DISPOSITION_WORKSPACE_STATE_AMBIGUOUS");
    const changedPaths=entries.map(entry=>entry.path),inventory=createPricePublicationGeneratedPathInventory({changedPaths,authorizedPaths});
    if((!entries.length&&!allowClean)||!inventory.valid)throw new Error("PUBLICATION_DISPOSITION_PATHS_INVALID");
    return freeze({clean:entries.length===0,localCommit,remoteCommit,entries,changedPaths,advancement,workspaceDigest:sha256(JSON.stringify({localCommit,remoteCommit,entries,advancementDigest:advancement.advancementDigest}))});
  }
  async restoreFailedPreparationWorkspace({expectedPredecessor,expectedEntries,authorizedPaths,advancementApproval=null}={}) {
    const inspected=await this.inspectFailedPreparationWorkspace({expectedPredecessor,authorizedPaths,advancementApproval});
    if(JSON.stringify(inspected.entries)!==JSON.stringify(expectedEntries))throw new Error("PUBLICATION_DISPOSITION_WORKSPACE_CHANGED");
    const tracked=expectedEntries.filter(entry=>entry.status===" M").map(entry=>entry.path),untracked=expectedEntries.filter(entry=>entry.status==="??").map(entry=>entry.path);
    if(tracked.length)await this.runner("git",["restore",`--source=${expectedPredecessor}`,"--worktree","--",...tracked],this.checkoutRoot);
    if(untracked.length)await this.runner("git",["clean","-f","--",...untracked],this.checkoutRoot);
    const [status,local,remote]=await Promise.all([this.runner("git",["status","--porcelain=v1","--untracked-files=all"],this.checkoutRoot),this.runner("git",["rev-parse","HEAD"],this.checkoutRoot),this._remote(["ls-remote","origin","refs/heads/main"])]),localCommit=local.stdout.trim(),remoteCommit=remote.stdout.trim().split(/\s+/)[0];
    const advancement=await this._verifyApprovedPreCheckpointAdvancement({historicalPredecessor:expectedPredecessor,currentMain:remoteCommit,advancementApproval});
    if(status.stdout.trim()||localCommit!==expectedPredecessor)throw new Error("PUBLICATION_DISPOSITION_RESTORE_INVALID");
    return freeze({clean:true,localCommit,remoteCommit,advancement,workspaceDigest:sha256(JSON.stringify({localCommit,remoteCommit,entries:[],advancementDigest:advancement.advancementDigest}))});
  }
  async inspectReconsiderationBase({historicalPredecessor,advancementApproval=null}={}) {
    const [status,local,remote]=await Promise.all([this.runner("git",["status","--porcelain=v1","--untracked-files=all"],this.checkoutRoot),this.runner("git",["rev-parse","HEAD"],this.checkoutRoot),this._remote(["ls-remote","origin","refs/heads/main"])]),localCommit=local.stdout.trim(),remoteCommit=remote.stdout.trim().split(/\s+/)[0],changedPaths=status.stdout.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replace(/^"|"$/g,""));
    if(changedPaths.length||localCommit!==remoteCommit)throw new Error("PUBLICATION_RECONSIDERATION_PREDECESSOR_INVALID");
    const advancement=await this._verifyApprovedPreCheckpointAdvancement({historicalPredecessor,currentMain:remoteCommit,advancementApproval});
    return freeze({clean:true,changedPaths:[],localCommit,remoteCommit,advancement});
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
  async inspectRecoveryCheckpoint({commit,expectedParent,candidate}) {
    const [status,local,parent,remote,files]=await Promise.all([
      this.runner("git",["status","--porcelain=v1","--untracked-files=all"],this.checkoutRoot),this.runner("git",["rev-parse","HEAD"],this.checkoutRoot),this.runner("git",["rev-parse",`${commit}^`],this.checkoutRoot),this._remote(["ls-remote","origin","refs/heads/main"]),this.runner("git",["diff-tree","--no-commit-id","--name-only","--diff-filter=ACMRT","-r",commit],this.checkoutRoot),
    ]);
    const localCommit=local.stdout.trim(),parentCommit=parent.stdout.trim(),remoteCommit=remote.stdout.trim().split(/\s+/)[0],changedPaths=files.stdout.split(/\r?\n/).map(value=>value.trim()).filter(Boolean).sort(),inventory=createPricePublicationGeneratedPathInventory({changedPaths,authorizedPaths:DEFAULT_LIVE_PRICE_GENERATED_PATHS});
    if(status.stdout.trim()||localCommit!==commit||parentCommit!==expectedParent||remoteCommit!==expectedParent||!inventory.valid)throw new Error("PUBLICATION_RECOVERY_CHECKPOINT_INVALID");
    const manifest=JSON.parse(await readFile(path.join(this.checkoutRoot,"config/publication-release.json"),"utf8")),artifactText=await readFile(path.join(this.checkoutRoot,"config",manifest.artifact?.relativePath??""),"utf8"),releaseArtifactDigest=staticPublicationArtifactDigest(artifactText);
    const binding=validatePublishedReleaseBinding({manifest,artifactText,expected:{releaseId:manifest.releaseId,candidateId:candidate.candidateId,artifactId:candidate.artifactId,certificationId:candidate.certificationId,bindingDigest:candidate.bindingDigest,predecessorReleaseId:candidate.predecessorReleaseId,releaseArtifactDigest}});
    if(!binding.valid)throw new Error("PUBLICATION_RECOVERY_RELEASE_BINDING_INVALID");
    return freeze({valid:true,commit,localCommit,parentCommit,remoteCommit,releaseId:manifest.releaseId,releaseArtifactDigest,changedPaths,checkpointDigest:sha256(JSON.stringify({commit,parentCommit,releaseId:manifest.releaseId,releaseArtifactDigest,changedPaths}))});
  }
  async _inspectObservationMainline({publishedCheckpoint,currentMain,allowApprovedRuntimeAdvancement=false}={}) {
    if(currentMain===publishedCheckpoint)return freeze({publishedCheckpoint,currentMain,commits:[],changedPaths:[],mode:"EXACT_CHECKPOINT"});
    const approved=this.approvedObservationRecoveryRuntimeCommit;
    if(!allowApprovedRuntimeAdvancement||!/^[0-9a-f]{40}$/.test(approved??"")||currentMain!==approved)throw new Error("PUBLICATION_OBSERVATION_GIT_BINDING_INVALID");
    try{await this.runner("git",["merge-base","--is-ancestor",publishedCheckpoint,currentMain],this.checkoutRoot);}catch{throw new Error("PUBLICATION_OBSERVATION_GIT_BINDING_INVALID");}
    const [commitsResult,pathsResult]=await Promise.all([
      this.runner("git",["rev-list","--reverse",`${publishedCheckpoint}..${currentMain}`],this.checkoutRoot),
      this.runner("git",["diff","--name-only",publishedCheckpoint,currentMain],this.checkoutRoot),
    ]),commits=commitsResult.stdout.split(/\r?\n/).filter(Boolean),changedPaths=pathsResult.stdout.split(/\r?\n/).filter(Boolean).map(value=>value.replaceAll("\\","/")).sort();
    if(![1,2].includes(commits.length)||commits.at(-1)!==approved||changedPaths.some(forbiddenRecoveryAdvancementPath))throw new Error("PUBLICATION_OBSERVATION_GIT_BINDING_INVALID");
    const expectedInventories=commits.length===1?[POST_DEPLOYMENT_OBSERVATION_RECOVERY_RUNTIME_PATHS]:[POST_DEPLOYMENT_OBSERVATION_RECOVERY_RUNTIME_PATHS,POST_DEPLOYMENT_OBSERVATION_GIT_CONTRACT_PATHS],commitInventories=[];
    for(let index=0;index<commits.length;index++){const result=await this.runner("git",["diff-tree","--no-commit-id","--name-only","--diff-filter=ACMRT","-r",commits[index]],this.checkoutRoot),paths=result.stdout.split(/\r?\n/).filter(Boolean).map(value=>value.replaceAll("\\","/")).sort();if(JSON.stringify(paths)!==JSON.stringify(expectedInventories[index]))throw new Error("PUBLICATION_OBSERVATION_GIT_BINDING_INVALID");commitInventories.push({commit:commits[index],changedPaths:paths});}
    const expectedChangedPaths=[...new Set(expectedInventories.flat())].sort();if(JSON.stringify(changedPaths)!==JSON.stringify(expectedChangedPaths))throw new Error("PUBLICATION_OBSERVATION_GIT_BINDING_INVALID");
    return freeze({publishedCheckpoint,currentMain,commits,changedPaths,commitInventories,mode:"APPROVED_INSTALLED_RECOVERY_RUNTIME"});
  }
  async inspectPublishedCheckpoint({commit,expectedParent,candidateId,artifactId,releaseArtifactDigest,certificationId,bindingDigest,predecessorReleaseId,releaseId,allowApprovedRuntimeAdvancement=false}) {
    const [status,local,parent,remote,files]=await Promise.all([
      this.runner("git",["status","--porcelain=v1","--untracked-files=all"],this.checkoutRoot),this.runner("git",["rev-parse","HEAD"],this.checkoutRoot),this.runner("git",["rev-parse",`${commit}^`],this.checkoutRoot),this._remote(["ls-remote","origin","refs/heads/main"]),this.runner("git",["diff-tree","--no-commit-id","--name-only","--diff-filter=ACMRT","-r",commit,"--","public"],this.checkoutRoot),
    ]);
    const localCommit=local.stdout.trim(),remoteCommit=remote.stdout.trim().split(/\s+/)[0],parentCommit=parent.stdout.trim();
    if(status.stdout.trim()||localCommit!==commit||parentCommit!==expectedParent)throw new Error("PUBLICATION_OBSERVATION_GIT_BINDING_INVALID");
    const mainline=await this._inspectObservationMainline({publishedCheckpoint:commit,currentMain:remoteCommit,allowApprovedRuntimeAdvancement});
    const publicPaths=files.stdout.split(/\r?\n/).map(value=>value.trim()).filter(Boolean).sort();
    const publicArtifacts=[];for(const relativePath of publicPaths){const bytes=await readFile(path.join(this.checkoutRoot,relativePath));const urlPath=relativePath.slice("public/".length).replace(/index\.html$/,""),url=`https://cheapestram.com/${urlPath}`;publicArtifacts.push({relativePath,url,sha256:sha256(bytes)});}
    const manifest=JSON.parse(await readFile(path.join(this.checkoutRoot,"config/publication-release.json"),"utf8")),artifactText=await readFile(path.join(this.checkoutRoot,"config",manifest.artifact?.relativePath??""),"utf8");
    if(!validatePublishedReleaseBinding({manifest,artifactText,expected:{releaseId,candidateId,artifactId,certificationId,bindingDigest,predecessorReleaseId,releaseArtifactDigest}}).valid)throw new Error("PUBLICATION_OBSERVATION_RELEASE_BINDING_INVALID");
    return freeze({localCommit,remoteCommit,parentCommit,releaseId:manifest.releaseId,candidateId:manifest.artifact.candidateId,publicArtifacts,mainline});
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
    return freeze({ status: deployment.latest_stage?.status === "success" ? "SUCCESS" : deployment.latest_stage?.status === "failure" ? "FAILED" : "PENDING", commit, deploymentId:deployment.id??null, environment:deployment.environment??null, completedAt:deployment.latest_stage?.ended_on??deployment.modified_on??null });
  }
  async inspectCommit({commit}) {
    const token=await this.tokenProvider?.();if(!token||!this.accountId||!this.projectName)throw new Error("PUBLICATION_CLOUDFLARE_OBSERVER_CREDENTIAL_REQUIRED");const response=await this.fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${this.projectName}/deployments`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw new Error("PUBLICATION_CLOUDFLARE_OBSERVATION_FAILED");const body=await response.json(),matches=(body.result??[]).filter(item=>item.deployment_trigger?.metadata?.commit_hash===commit);if(matches.length>1)throw new Error("PUBLICATION_RECOVERY_DEPLOYMENT_STATE_AMBIGUOUS");if(matches.length===0)return freeze({status:"ABSENT",commit});const deployment=matches[0];return freeze({status:deployment.latest_stage?.status==="success"?"SUCCESS":deployment.latest_stage?.status==="failure"?"FAILED":"PENDING",commit,deploymentId:deployment.id??null,environment:deployment.environment??null,completedAt:deployment.latest_stage?.ended_on??deployment.modified_on??null});
  }
}

export class PublicArtifactIntegrityVerifier {
  constructor({ fetchImpl = globalThis.fetch } = {}) { this.fetchImpl = fetchImpl; }
  async verify({ candidate, publicArtifacts = candidate?.publicArtifacts }) {
    if (!Array.isArray(publicArtifacts) || !publicArtifacts.length) throw new Error("PUBLICATION_PUBLIC_ARTIFACT_MANIFEST_REQUIRED");
    for (const artifact of publicArtifacts) {
      const response = await this.fetchImpl(artifact.url); if (!response.ok) return freeze({ status: "MISMATCH" });
      const digest = sha256(Buffer.from(await response.arrayBuffer())); if (digest !== artifact.sha256) return freeze({ status: "MISMATCH" });
    }
    return freeze({ status: "MATCH" });
  }
}

export class ProductionPublishedRamPortfolioOwner {
  constructor({ checkoutRoot } = {}) { if(!checkoutRoot)throw new Error("PUBLICATION_PORTFOLIO_CHECKOUT_REQUIRED");this.checkoutRoot=path.resolve(checkoutRoot); }
  async _jsonFiles(directory){const output=[];for(const entry of await readdir(directory,{withFileTypes:true})){const resolved=path.join(directory,entry.name);if(entry.isDirectory())output.push(...await this._jsonFiles(resolved));else if(entry.isFile()&&entry.name.endsWith(".json"))output.push(resolved);}return output;}
  async inspect({ commit, candidate } = {}) {
    if(!commit||!candidate?.candidateId)throw new Error("PUBLICATION_PORTFOLIO_SCOPE_REQUIRED");
    const catalogPath=path.join(this.checkoutRoot,"public","data","ram-catalog.json"),sitemapPath=path.join(this.checkoutRoot,"public","sitemap.xml"),catalog=JSON.parse(await readFile(catalogPath,"utf8"));
    if(catalog?.productCount!==159||!Array.isArray(catalog.products)||catalog.products.length!==159)throw new Error("PUBLICATION_PORTFOLIO_PRODUCT_COUNT_INVALID");
    const atlasFiles=await this._jsonFiles(path.join(this.checkoutRoot,"packages","atlas","products","ram")),batch=[];for(const file of atlasFiles){const record=JSON.parse(await readFile(file,"utf8"));if(record?.identity?.updatedBy==="system:atlas-spec-enrichment-batch-002")batch.push(record);}
    if(batch.length!==22)throw new Error("PUBLICATION_PORTFOLIO_BATCH_002_COUNT_INVALID");const projected=new Map(catalog.products.map(value=>[value.atlasProductId,value]));
    for(const record of batch){const actual=projected.get(record.identity.atlasProductId),data=record.extension?.data;if(!actual||actual.xmpSupport!==data?.performance?.xmpSupport||actual.expoSupport!==data?.performance?.expoSupport||actual.ratedVoltage!==data?.electrical?.ratedVoltage||actual.casLatency!==data?.performance?.casLatency||actual.primaryTimings!==data?.performance?.primaryTimings)throw new Error("PUBLICATION_PORTFOLIO_BATCH_002_SPECIFICATION_MISMATCH");}
    const paths=["public/data/ram-catalog.json","public/sitemap.xml",...catalog.products.map(value=>`public${value.publicPath}index.html`)],publicArtifacts=[];for(const relativePath of paths){const bytes=await readFile(path.join(this.checkoutRoot,relativePath)),urlPath=relativePath.slice("public/".length).replace(/index\.html$/,"");publicArtifacts.push({relativePath,url:`https://cheapestram.com/${urlPath}`,sha256:sha256(bytes)});}
    return freeze({commit,candidateId:candidate.candidateId,productCount:catalog.products.length,batch002SpecificationCount:batch.length,publicArtifacts,portfolioDigest:sha256(JSON.stringify(publicArtifacts.map(value=>({relativePath:value.relativePath,sha256:value.sha256}))))});
  }
}

export class ProductionUnattendedPublicationCommand {
  constructor({ repository, mandateService, candidateOwner, coordinatorFactory, statusContextOwner=null, now = () => new Date().toISOString() } = {}) { Object.assign(this, { repository, mandateService, candidateOwner, coordinatorFactory, statusContextOwner, now }); }
  async inspect({mandateId}={}) { if(!mandateId)throw new Error("PUBLICATION_MANDATE_ID_REQUIRED");const state = await this.mandateService.inspect(),mandate=await this.repository.getMandate(mandateId);if(!mandate)throw new Error("PUBLICATION_MANDATE_NOT_FOUND");const candidate = await this.candidateOwner.discover(); const operation = candidate ? await this.repository.getOperation(candidate.candidateId) : null, accepted=candidate&&this.repository.getAcceptedPublication?await this.repository.getAcceptedPublication(candidate.candidateId):null,asOf=this.now(),context=this.statusContextOwner?await this.statusContextOwner.inspect():null,publicationStatus=context?projectPublicationReliabilityStatus({state,selectedMandate:mandate,currentCodeHead:context.currentCodeHead,publishedCheckpoint:context.publishedCheckpoint,asOf}):null; return freeze({ status: "INSPECTED", candidate, acceptedPublication:accepted, publicationStatus, health: projectUnattendedPublicationHealth({ mandate, operation:accepted??operation, asOf }), networkOperation: "NONE", actionExecuted: false }); }
  async run({ mandateId }) { if (!mandateId) throw new Error("PUBLICATION_MANDATE_ID_REQUIRED"); const candidate=await this.candidateOwner.discover(),accepted=candidate&&this.repository.getAcceptedPublication?await this.repository.getAcceptedPublication(candidate.candidateId):null,operation=candidate?await this.repository.getOperation(candidate.candidateId):null,coordinator=operation?.status==="DEPLOYMENT_PENDING"?await this.coordinatorFactory():null;if(accepted)return freeze({...accepted,replay:true,authorityCreated:false,gitOperation:false,deploymentOperation:false,providerCalls:0,canonicalMarketMutation:false});if(operation?.status==="DEPLOYMENT_PENDING")return coordinator.continueObservation({mandateId,candidateId:candidate.candidateId});if(candidate?.alreadyDeployed)return freeze({status:"ALREADY_DEPLOYED_CANDIDATE",candidateId:candidate.candidateId,artifactId:candidate.artifactId,certificationId:candidate.certificationId,releaseId:candidate.releaseId,replay:true,authorityCreated:false,gitOperation:false,deploymentOperation:false,providerCalls:0,canonicalMarketMutation:false}); return (await this.coordinatorFactory()).run({ mandateId }); }
  async observe({mandateId,candidateId}) { if(!mandateId||!candidateId)throw new Error("PUBLICATION_OBSERVATION_SCOPE_REQUIRED");const coordinator=await this.coordinatorFactory();return coordinator.observe({mandateId,candidateId}); }
  async inspectRecovery({mandateId,candidateId,checkpointCommit}) { const coordinator=await this.coordinatorFactory({recovery:true});if(!coordinator?.inspect)throw new Error("PUBLICATION_RECOVERY_OWNER_REQUIRED");return coordinator.inspect({mandateId,candidateId,checkpointCommit}); }
  async recover({mandateId,candidateId,checkpointCommit,confirmation}) { const coordinator=await this.coordinatorFactory({recovery:true});if(!coordinator?.recover)throw new Error("PUBLICATION_RECOVERY_OWNER_REQUIRED");return coordinator.recover({mandateId,candidateId,checkpointCommit,confirmation}); }
  async inspectAdvancementApproval({mandateId,candidateId,approvedDescendant}) { const owner=await this.coordinatorFactory({advancementApproval:true});if(!owner?.inspect)throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_OWNER_REQUIRED");return owner.inspect({mandateId,candidateId,approvedDescendant}); }
  async approveAdvancement({mandateId,candidateId,approvedDescendant,operatorId,confirmation}) { const owner=await this.coordinatorFactory({advancementApproval:true});if(!owner?.approve)throw new Error("PUBLICATION_ADVANCEMENT_APPROVAL_OWNER_REQUIRED");return owner.approve({mandateId,candidateId,approvedDescendant,operatorId,confirmation}); }
  async inspectDisposition({candidateId}) { const coordinator=await this.coordinatorFactory({disposition:true});if(!coordinator?.inspect)throw new Error("PUBLICATION_DISPOSITION_OWNER_REQUIRED");return coordinator.inspect({candidateId}); }
  async disposeFailedPreparation({candidateId,confirmation}) { const coordinator=await this.coordinatorFactory({disposition:true});if(!coordinator?.dispose)throw new Error("PUBLICATION_DISPOSITION_OWNER_REQUIRED");return coordinator.dispose({candidateId,confirmation}); }
  async inspectReconsideration({mandateId,candidateId}) { const coordinator=await this.coordinatorFactory({reconsideration:true});if(!coordinator?.inspect)throw new Error("PUBLICATION_RECONSIDERATION_OWNER_REQUIRED");return coordinator.inspect({mandateId,candidateId}); }
  async reconsiderFailedPreparation({mandateId,candidateId,confirmation}) { const coordinator=await this.coordinatorFactory({reconsideration:true});if(!coordinator?.run)throw new Error("PUBLICATION_RECONSIDERATION_OWNER_REQUIRED");return coordinator.run({mandateId,candidateId,confirmation}); }
  async inspectReconsiderationObservationRecovery(input) { const coordinator=await this.coordinatorFactory({observationRecovery:true});if(!coordinator?.inspect)throw new Error("PUBLICATION_OBSERVATION_RECOVERY_OWNER_REQUIRED");return coordinator.inspect(input); }
  async recoverReconsiderationObservation(input) { const coordinator=await this.coordinatorFactory({observationRecovery:true});if(!coordinator?.recover)throw new Error("PUBLICATION_OBSERVATION_RECOVERY_OWNER_REQUIRED");return coordinator.recover(input); }
}

export class ProductionForgeUnattendedPublicationProvider {
  constructor({ repository } = {}) { if (!repository) throw new Error("PUBLICATION_MANDATE_REPOSITORY_REQUIRED"); this.repository = repository; }
  async load({ asOf,mandateId } = {}) {
    if(!mandateId)throw new Error("PUBLICATION_MANDATE_ID_REQUIRED");const state = await this.repository.inspect(),mandate=await this.repository.getMandate(mandateId);if(!mandate)throw new Error("PUBLICATION_MANDATE_NOT_FOUND");
    const operations = [...state.operations,...(state.recoveries??[]),...(state.reconsiderations??[])].sort((left, right) => String(left.acceptedAt??left.events?.at(-1)?.at ?? "").localeCompare(String(right.acceptedAt??right.events?.at(-1)?.at ?? "")));
    return projectUnattendedPublicationHealth({ mandate, operation: operations.at(-1) ?? null, asOf });
  }
}
