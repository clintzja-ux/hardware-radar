import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createLivePricePublicationAuthorization, FileLivePricePublicationAuthorizationRepository, GovernedLivePricePublicationCoordinator } from "../packages/sentinel/publication/GovernedLivePricePublication.js";
import { createPortableNpmRunner } from "./lib/portable-npm-runner.mjs";

const exec = promisify(execFile);
const args = Object.fromEntries(process.argv.slice(2).filter(value => value.startsWith("--") && value.includes("=")).map(value => value.slice(2).split(/=(.*)/s).slice(0, 2)));
const mode = (args.mode ?? "INSPECT").toUpperCase();
const root = path.resolve(args["checkout-root"] ?? ".");
const manifestPath = path.resolve(root, args["release-manifest"] ?? "config/publication-release.json");
const repository = new FileLivePricePublicationAuthorizationRepository({ statePath: path.resolve(args["authorization-state"] ?? ".forge-review/publication/live-price-authorizations.json") });

if (mode === "INSPECT") {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const artifact = JSON.parse(await readFile(path.resolve(path.dirname(manifestPath), manifest.artifact.relativePath), "utf8"));
  console.log(JSON.stringify({ status: "LIVE_PRICE_PUBLICATION_INSPECTED", releaseId: manifest.releaseId, candidateId: manifest.artifact.candidateId, artifactId: manifest.artifact.artifactId, certificationId: manifest.artifact.certificationId, predecessorReleaseId: manifest.rollback.previousReleaseId, targetEnvironment: manifest.targetEnvironment, freshUntil: artifact.manifest.currentValidUntil, mergeAuthorized: false, deploymentAuthorized: false, providerCalls: 0, canonicalMutation: false }, null, 2));
  process.exit(0);
}
if (mode === "AUTHORIZE") {
  if (args.confirmation !== "CONFIRM-GOVERNED-LIVE-PRICE-PUBLICATION") throw new Error("LIVE_PRICE_PUBLICATION_EXPLICIT_CONFIRMATION_REQUIRED");
  if (!args["authorized-by"]) throw new Error("LIVE_PRICE_PUBLICATION_OPERATOR_REQUIRED");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")), artifactText = await readFile(path.resolve(path.dirname(manifestPath), manifest.artifact.relativePath), "utf8"), bundle = JSON.parse(artifactText);
  const authorization = createLivePricePublicationAuthorization({ candidateId:manifest.artifact.candidateId,artifactId:manifest.artifact.artifactId,artifactDigest:manifest.artifact.digestSha256,bindingDigest:manifest.artifact.bindingDigest,certificationId:manifest.artifact.certificationId,certificationDigest:createHash("sha256").update(JSON.stringify(bundle.certification)).digest("hex"),targetEnvironment:"PRODUCTION",predecessorReleaseId:manifest.rollback.previousReleaseId,freshUntil:bundle.manifest.currentValidUntil,authorizedBy:args["authorized-by"],authorizedAt:new Date().toISOString() });
  const result = await repository.record(authorization);
  console.log(JSON.stringify({ status:result.status,authorizationId:authorization.authorizationId,candidateId:authorization.candidateId,artifactId:authorization.artifactId,certificationId:authorization.certificationId,predecessorReleaseId:authorization.predecessorReleaseId,freshUntil:authorization.freshUntil,authorizedBy:authorization.authorizedBy,mergeAuthorized:false,deploymentAuthorized:false,rollbackAuthorized:false,providerCalls:0,canonicalMarketMutation:false },null,2));
  process.exit(0);
}
if (mode !== "PREPARE") throw new Error("LIVE_PRICE_PUBLICATION_MODE_INVALID");
if (!args["authorization-id"]) throw new Error("LIVE_PRICE_PUBLICATION_AUTHORIZATION_ID_REQUIRED");

const run = async (command, commandArgs, options = {}) => exec(command, commandArgs, { cwd: root, windowsHide: true, maxBuffer: 32 * 1024 * 1024, ...options });
const runNpm = createPortableNpmRunner({ execFile: exec, cwd: root, baseOptions: { windowsHide: true, maxBuffer: 32 * 1024 * 1024 } });
const coordinator = new GovernedLivePricePublicationCoordinator({ authorizationRepository: repository,
  gitInspector: { inspect: async () => { const { stdout } = await run("git", ["status", "--porcelain=v1", "--untracked-files=all"]); const changedPaths = stdout.split(/\r?\n/).filter(Boolean).map(line => line.slice(3).replace(/^"|"$/g, "")); return { clean: changedPaths.length === 0, changedPaths }; } },
  buildRunner: { run: async ({ generatedAt, environment }) => runNpm("build:public", { env: { ...process.env, HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT: environment, HARDWARE_RADAR_GENERATED_AT: generatedAt } }) },
  verificationRunner: { run: async ({ authorization }) => { const env = { ...process.env, HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT: authorization.targetEnvironment }; for (const script of ["verify:public","test:ram-products","test:ram-catalog","test:ram-terminal","test:retailer-destinations","test:release-governance","test:layout"]) await runNpm(script, { env }); } }
});
const result = await coordinator.prepare({ authorizationId: args["authorization-id"], checkoutRoot: root, releaseManifestPath: path.relative(root, manifestPath) });
console.log(JSON.stringify({ ...result, checkpointCreated: false, nextAction: "OPERATOR_REVIEW_THEN_SEPARATELY_AUTHORIZE_RELEASE_ONLY_GIT_CHECKPOINT", providerCalls: 0, canonicalMarketMutation: false }, null, 2));
