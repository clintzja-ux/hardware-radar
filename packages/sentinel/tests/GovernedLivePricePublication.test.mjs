import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { classifyCloudflareDeploymentObservation, createLivePricePublicationAuthorization, FileLivePricePublicationAuthorizationRepository, GovernedLivePricePublicationCoordinator } from "../publication/GovernedLivePricePublication.js";

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
  let builds = 0, verifications = 0, inspections = 0, changedPaths = ["public/ram/index.html"];
  const service = new GovernedLivePricePublicationCoordinator({ authorizationRepository: repository,
    buildRunner: { run: async () => { builds += 1; } }, verificationRunner: { run: async () => { verifications += 1; } },
    gitInspector: { inspect: async () => (++inspections % 2) ? { clean: true, changedPaths: [] } : { clean: false, changedPaths } }, now: () => "2026-10-17T00:30:00.000Z" });
  const result = await service.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot });
  assert.equal(result.status, "READY_FOR_RELEASE_ONLY_CHECKPOINT"); assert.equal(result.mergeAuthorized, false); assert.equal(result.deploymentAuthorized, false); assert.equal(builds, 1); assert.equal(verifications, 1);
  const replay = await service.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot }); assert.equal(replay.replay, true); assert.equal(replay.recovery, true);
  changedPaths = ["scripts/unrelated.mjs"]; await assert.rejects(() => service.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot }), /UNAUTHORIZED_PATHS/);
  const expired = new GovernedLivePricePublicationCoordinator({ authorizationRepository: repository, buildRunner: { run: async () => {} }, verificationRunner: { run: async () => {} }, gitInspector: { inspect: async () => ({ clean: true, changedPaths: [] }) }, now: () => bundle.manifest.currentValidUntil });
  await assert.rejects(() => expired.prepare({ authorizationId: authorization.authorizationId, checkoutRoot: fixtureRoot }), /FRESHNESS_EXPIRED/);
  assert.equal(classifyCloudflareDeploymentObservation({ expectedCommit:"abc",expectedReleaseId:sourceManifest.releaseId,observation:{status:"FAILED",reason:"BUILD_FAILED"} }).status,"DEPLOYMENT_FAILED");
  assert.equal(classifyCloudflareDeploymentObservation({ expectedCommit:"abc",expectedReleaseId:sourceManifest.releaseId,observation:{status:"SUCCESS",commit:"def",releaseId:sourceManifest.releaseId} }).status,"DEPLOYMENT_BINDING_MISMATCH");
  assert.equal(classifyCloudflareDeploymentObservation({ expectedCommit:"abc",expectedReleaseId:sourceManifest.releaseId,observation:{status:"SUCCESS",commit:"abc",releaseId:sourceManifest.releaseId} }).status,"DEPLOYMENT_VERIFIED");
  console.log("Governed live-price publication coordinator tests passed: 14 cases.");
} finally { await rm(fixtureRoot, { recursive: true, force: true }); }
