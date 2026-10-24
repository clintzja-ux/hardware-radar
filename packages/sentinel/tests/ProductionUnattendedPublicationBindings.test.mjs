import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileRecurringPublicationAuthorityRepository } from "../publication/UnattendedLivePricePublication.js";
import { CloudflarePagesDeploymentObserver, GitHubAppReleaseGitOwner, ProductionForgeUnattendedPublicationProvider, ProductionUnattendedPublicationCommand, RecurringPublicationMandateOperatorService, validatePublishedReleaseBinding } from "../publication/ProductionUnattendedPublicationBindings.js";
import { staticPublicationArtifactDigest } from "../validators/StaticPublicationReleaseControl.js";

const root = await mkdtemp(path.join(os.tmpdir(), "hr-publication-bindings-"));
try {
  const repository = new FileRecurringPublicationAuthorityRepository({ statePath: path.join(root, "authority.json") });
  const service = new RecurringPublicationMandateOperatorService({ repository, now: () => "2026-10-17T00:00:00Z" });
  await assert.rejects(() => service.create({ operatorId: "operator:test", validFrom: "2026-10-17T00:00:00Z", expiresAt: "2026-11-16T00:00:00Z" }), /CONFIRMATION/);
  await assert.rejects(() => service.create({ operatorId: "operator:test", validFrom: "2026-10-17T00:00:00Z", expiresAt: "2026-12-17T00:00:00Z", confirmation: "CREATE-UNATTENDED-PUBLICATION-MANDATE" }), /WINDOW_INVALID/);
  const mandate = await service.create({ operatorId: "operator:test", validFrom: "2026-10-17T00:00:00Z", expiresAt: "2026-11-16T00:00:00Z", confirmation: "CREATE-UNATTENDED-PUBLICATION-MANDATE" });
  assert.equal(mandate.status, "ENABLED");
  await service.transition({ mandateId: mandate.mandateId, status: "PAUSED", operatorId: "operator:test", confirmation: "PAUSED-UNATTENDED-PUBLICATION-MANDATE" });
  const revoked = await service.transition({ mandateId: mandate.mandateId, status: "REVOKED", operatorId: "operator:test", confirmation: "REVOKED-UNATTENDED-PUBLICATION-MANDATE" });
  assert.equal(revoked.status, "REVOKED");
  assert.equal((await service.inspect()).audit.length, 3);
  const health = await new ProductionForgeUnattendedPublicationProvider({ repository }).load({ asOf: "2026-10-17T01:00:00Z" });
  assert.equal(health.status, "REVOKED"); assert.equal(health.readOnly, true); assert.equal(health.mutationAuthorized, false);
  const observer = new CloudflarePagesDeploymentObserver({ accountId: "account", projectName: "project", tokenProvider: async () => "secret", fetchImpl: async () => ({ ok: true, json: async () => ({ result: [{ id:"deployment",environment:"production",deployment_trigger: { metadata: { commit_hash: "abc" } }, latest_stage: { status: "success",ended_on:"2026-10-23T22:08:42Z" } }] }) }) });
  const observed=await observer.observe({ commit: "abc" });assert.equal(observed.status, "SUCCESS");assert.equal(observed.deploymentId,"deployment");assert.equal(observed.environment,"production");assert.equal(observed.completedAt,"2026-10-23T22:08:42Z");
  await assert.rejects(() => new CloudflarePagesDeploymentObserver({ accountId: "account", projectName: "project", tokenProvider: async () => null }).observe({ commit: "abc" }), /CREDENTIAL_REQUIRED/);
  const artifactText=JSON.stringify({schemaVersion:"fixture",records:[]}),expected={releaseId:"release",candidateId:"candidate",artifactId:"artifact",certificationId:"certification",bindingDigest:"binding",predecessorReleaseId:"predecessor",releaseArtifactDigest:staticPublicationArtifactDigest(artifactText)},manifest={releaseId:expected.releaseId,artifact:{candidateId:expected.candidateId,artifactId:expected.artifactId,certificationId:expected.certificationId,bindingDigest:expected.bindingDigest},rollback:{previousReleaseId:expected.predecessorReleaseId}};
  assert.equal(validatePublishedReleaseBinding({manifest,artifactText,expected}).valid,true);
  for(const field of Object.keys(expected)){const report=validatePublishedReleaseBinding({manifest,artifactText,expected:{...expected,[field]:`wrong-${field}`}});assert.equal(report.valid,false,field);assert.equal(report.comparisons[field],false,field);}
  const gitResponses=new Map([["status",{stdout:" M public/index.html\n"}],["rev-parse HEAD",{stdout:"commit\n"}],["rev-parse commit^",{stdout:"parent\n"}],["ls-remote origin refs/heads/main",{stdout:"commit refs/heads/main\n"}],["diff-tree",{stdout:"public/index.html\n"}]]),gitRunner=async(_command,args)=>gitResponses.get(args[0]==="rev-parse"?args.join(" "):args[0]==="ls-remote"?args.join(" "):args[0]),gitOwner=new GitHubAppReleaseGitOwner({runner:gitRunner,checkoutRoot:root,tokenProvider:{getToken:async()=>({token:"fixture"})},askPassPath:path.join(root,"askpass")});
  await assert.rejects(()=>gitOwner.inspectPublishedCheckpoint({commit:"commit",expectedParent:"parent"}),/GIT_BINDING_INVALID/);
  gitResponses.set("status",{stdout:""});gitResponses.set("rev-parse HEAD",{stdout:"wrong\n"});await assert.rejects(()=>gitOwner.inspectPublishedCheckpoint({commit:"commit",expectedParent:"parent"}),/GIT_BINDING_INVALID/);
  await mkdir(path.join(root, "empty")); await writeFile(path.join(root, "empty", "marker"), "fixture");
  let factoryCalls=0;const deployedCandidate={candidateId:"candidate",artifactId:"artifact",certificationId:"certification",releaseId:"release",alreadyDeployed:true},command=new ProductionUnattendedPublicationCommand({repository,mandateService:service,candidateOwner:{discover:async()=>deployedCandidate},coordinatorFactory:async()=>{factoryCalls++;return{run:async()=>({})};}}),deployed=await command.run({mandateId:"unused-but-required"});
  assert.equal(deployed.status,"ALREADY_DEPLOYED_CANDIDATE");assert.equal(deployed.authorityCreated,false);assert.equal(deployed.gitOperation,false);assert.equal(factoryCalls,0);assert.equal((await command.run({mandateId:"unused-but-required"})).status,"ALREADY_DEPLOYED_CANDIDATE");
  console.log("Production unattended publication binding tests passed.");
} finally { await rm(root, { recursive: true, force: true }); }
