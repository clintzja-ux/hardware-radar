import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { classifyCloudflareDeploymentObservation, createLivePricePublicationAuthorization, FileLivePricePublicationAuthorizationRepository, GovernedLivePricePublicationCoordinator } from "../publication/GovernedLivePricePublication.js";
import { createPortableNpmRunner, resolveNpmRunInvocation } from "../../../scripts/lib/portable-npm-runner.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "hr-live-publication-"));
try {
  const sourceManifest = JSON.parse(await readFile("config/publication-release.json", "utf8"));
  const sourceArtifact = await readFile(path.join("config", sourceManifest.artifact.relativePath), "utf8");
  await mkdir(path.join(fixtureRoot, "config", "artifacts"), { recursive: true });
  await writeFile(path.join(fixtureRoot, "config", "publication-release.json"), `${JSON.stringify(sourceManifest, null, 2)}\n`);
  await writeFile(path.join(fixtureRoot, "config", sourceManifest.artifact.relativePath), sourceArtifact);
  const bundle = JSON.parse(sourceArtifact);
  const authorization = createLivePricePublicationAuthorization({
    candidateId: sourceManifest.artifact.candidateId, artifactId: sourceManifest.artifact.artifactId,
    artifactDigest: sourceManifest.artifact.digestSha256, bindingDigest: sourceManifest.artifact.bindingDigest,
    certificationId: sourceManifest.artifact.certificationId, certificationDigest: sha(JSON.stringify(bundle.certification)),
    targetEnvironment: "PRODUCTION", predecessorReleaseId: sourceManifest.rollback.previousReleaseId,
    freshUntil: bundle.manifest.currentValidUntil, authorizedPaths: ["public/", "config/publication-release.json", "config/artifacts/"],
    authorizedBy: "operator:fixture", authorizedAt: "2026-10-17T00:00:00.000Z"
  });
  const repository = new FileLivePricePublicationAuthorizationRepository({ statePath: path.join(fixtureRoot, ".state", "publication.json") });
  await repository.record(authorization);
  let builds = 0, verifications = 0, inspections = 0, changedPaths = ["public/ram/index.html"], buildEnvironment, verificationEnvironment;
  const service = new GovernedLivePricePublicationCoordinator({ authorizationRepository: repository,
    buildRunner: { run: async ({ environment }) => { builds += 1; buildEnvironment = environment; } }, verificationRunner: { run: async ({ authorization: verifiedAuthorization }) => { verifications += 1; verificationEnvironment = verifiedAuthorization.targetEnvironment; } },
    gitInspector: { inspect: async () => (++inspections % 2) ? { clean: true, changedPaths: [] } : { clean: false, changedPaths } }, now: () => "2026-10-17T00:30:00.000Z" });
  const result = await service.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot });
  assert.equal(result.status, "READY_FOR_RELEASE_ONLY_CHECKPOINT"); assert.equal(result.mergeAuthorized, false); assert.equal(result.deploymentAuthorized, false); assert.equal(builds, 1); assert.equal(verifications, 1); assert.equal(buildEnvironment, "PRODUCTION"); assert.equal(verificationEnvironment, buildEnvironment);
  const replay = await service.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot }); assert.equal(replay.replay, true); assert.equal(replay.recovery, true);
  changedPaths = ["scripts/unrelated.mjs"]; await assert.rejects(() => service.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot }), /UNAUTHORIZED_PATHS/);
  const promotionPaths=[`config/artifacts/${authorization.candidateId}.json`,"config/publication-release.json"].sort(), promotionEvidence={schemaVersion:"1.0",candidateId:authorization.candidateId,artifactId:authorization.artifactId,certificationId:authorization.certificationId,predecessorReleaseId:authorization.predecessorReleaseId,predecessorCommit:"fixture-base",originalCleanCheckout:{clean:true,localCommit:"fixture-base",remoteCommit:"fixture-base",verifiedAt:"2026-10-17T00:29:00.000Z"},promotionPaths};
  const createPromotionService=async(name,firstPaths)=>{const state=new FileLivePricePublicationAuthorizationRepository({statePath:path.join(fixtureRoot,".state",`${name}.json`)});await state.record(authorization);let runs=0,checks=0;return{state,runs:()=>runs,service:new GovernedLivePricePublicationCoordinator({authorizationRepository:state,buildRunner:{run:async()=>{runs++;}},verificationRunner:{run:async()=>{}},gitInspector:{inspect:async()=>({clean:false,changedPaths:checks++===0?firstPaths:promotionPaths})},now:()=>"2026-10-17T00:30:00.000Z"})};};
  const promoted=await createPromotionService("promoted",promotionPaths);assert.equal((await promoted.service.prepare({authorizationId:authorization.authorizationId,checkoutRoot:fixtureRoot,promotionEvidence})).status,"READY_FOR_RELEASE_ONLY_CHECKPOINT");assert.equal(promoted.runs(),1);
  const thirdFile=await createPromotionService("third-file",[...promotionPaths,"scripts/unrelated.mjs"]);await assert.rejects(()=>thirdFile.service.prepare({authorizationId:authorization.authorizationId,checkoutRoot:fixtureRoot,promotionEvidence}),/CHECKOUT_NOT_CLEAN/);assert.equal(thirdFile.runs(),0);
  const missingEvidence=await createPromotionService("missing-evidence",promotionPaths);await assert.rejects(()=>missingEvidence.service.prepare({authorizationId:authorization.authorizationId,checkoutRoot:fixtureRoot}),/CHECKOUT_NOT_CLEAN/);
  for(const [name,override] of [["wrong-candidate",{candidateId:"mer_ramreleasecand_"+"f".repeat(24)}],["wrong-certification",{certificationId:"sent_ramreleasecert_"+"f".repeat(24)}],["wrong-predecessor",{predecessorReleaseId:"pubrel_"+"f".repeat(24)}],["wrong-clean-base",{originalCleanCheckout:{...promotionEvidence.originalCleanCheckout,localCommit:"wrong"}}]]){const fixture=await createPromotionService(name,promotionPaths);await assert.rejects(()=>fixture.service.prepare({authorizationId:authorization.authorizationId,checkoutRoot:fixtureRoot,promotionEvidence:{...promotionEvidence,...override}}),/CHECKOUT_NOT_CLEAN/);}
  const artifactPath=path.join(fixtureRoot,"config",sourceManifest.artifact.relativePath);await writeFile(artifactPath,`${sourceArtifact}\n`);const tampered=await createPromotionService("tampered",promotionPaths);await assert.rejects(()=>tampered.service.prepare({authorizationId:authorization.authorizationId,checkoutRoot:fixtureRoot,promotionEvidence}),/ARTIFACT_DIGEST_MISMATCH/);await writeFile(artifactPath,sourceArtifact);
  const expired = new GovernedLivePricePublicationCoordinator({ authorizationRepository: repository, buildRunner: { run: async () => {} }, verificationRunner: { run: async () => {} }, gitInspector: { inspect: async () => ({ clean: true, changedPaths: [] }) }, now: () => bundle.manifest.currentValidUntil });
  await assert.rejects(() => expired.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot }), /FRESHNESS_EXPIRED/);
  assert.equal(classifyCloudflareDeploymentObservation({ expectedCommit:"abc",expectedReleaseId:sourceManifest.releaseId,observation:{status:"FAILED",reason:"BUILD_FAILED"} }).status,"DEPLOYMENT_FAILED");
  assert.equal(classifyCloudflareDeploymentObservation({ expectedCommit:"abc",expectedReleaseId:sourceManifest.releaseId,observation:{status:"SUCCESS",commit:"def",releaseId:sourceManifest.releaseId} }).status,"DEPLOYMENT_BINDING_MISMATCH");
  assert.equal(classifyCloudflareDeploymentObservation({ expectedCommit:"abc",expectedReleaseId:sourceManifest.releaseId,observation:{status:"SUCCESS",commit:"abc",releaseId:sourceManifest.releaseId} }).status,"DEPLOYMENT_VERIFIED");
  const windowsInvocation=resolveNpmRunInvocation({script:"build:public",platform:"win32",nodeExecutable:"C:\\Program Files\\nodejs\\node.exe",npmEntryPoint:"C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js"});
  assert.equal(windowsInvocation.command,"C:\\Program Files\\nodejs\\node.exe"); assert.deepEqual(windowsInvocation.args,["C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js","run","build:public"]);
  assert.deepEqual(resolveNpmRunInvocation({script:"build:public",platform:"linux"}),{command:"npm",args:["run","build:public"]});
  const calls=[],fixtureEnv={FIXTURE:"preserved"},runner=createPortableNpmRunner({execFile:async(command,args,options)=>{calls.push({command,args,options});return {stdout:"ok"};},cwd:fixtureRoot,baseOptions:{windowsHide:true},platform:"win32",nodeExecutable:"C:\\node\\node.exe",npmEntryPoint:"C:\\node\\npm-cli.js"});
  await runner("verify:public",{env:fixtureEnv}); assert.deepEqual(calls[0],{command:"C:\\node\\node.exe",args:["C:\\node\\npm-cli.js","run","verify:public"],options:{cwd:fixtureRoot,windowsHide:true,env:fixtureEnv}});
  await runner("publication:unattended",{args:["--mode=RUN","--mandate-id=fixture"]}); assert.deepEqual(calls[1].args,["C:\\node\\npm-cli.js","run","publication:unattended","--","--mode=RUN","--mandate-id=fixture"]);
  const failure=new Error("fixture nonzero");failure.code=7;const failing=createPortableNpmRunner({execFile:async()=>{throw failure;},cwd:fixtureRoot,platform:"win32",nodeExecutable:"C:\\node\\node.exe",npmEntryPoint:"C:\\node\\npm-cli.js"}); await assert.rejects(()=>failing("build:public"),error=>error===failure);
  assert.throws(()=>resolveNpmRunInvocation({script:"build:public",platform:"win32",nodeExecutable:"C:\\node\\node.exe",npmEntryPoint:null}),/NPM_ENTRY_POINT_UNAVAILABLE/);
  console.log("Governed live-price publication coordinator tests passed: 24 cases.");
} finally { await rm(fixtureRoot, { recursive: true, force: true }); }
