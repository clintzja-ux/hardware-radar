import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createStaticPublicationReleaseManifest } from "../packages/sentinel/validators/StaticPublicationReleaseControl.js";
import { FileCurrentDisplayPublicationRepository } from "../packages/mercury/publication/persistence/FileCurrentDisplayPublicationRepository.js";
import { FileCurrentDisplayPublicationArtifactRepository } from "../packages/mercury/publication/persistence/FileCurrentDisplayPublicationArtifactRepository.js";
import { verifyCurrentDisplayPublicationArtifact } from "../packages/mercury/publication/CurrentDisplayPublicationArtifact.js";

const args = Object.fromEntries(process.argv.slice(2).filter(value => value.startsWith("--") && value.includes("=")).map(value => value.slice(2).split(/=(.*)/s).slice(0, 2)));
const state = (args.state ?? "").toUpperCase();
const confirmation = state === "ON" ? "CONFIRM-STATIC-RELEASE-ON" : "CONFIRM-STATIC-RELEASE-OFF";
if (args.confirmation !== confirmation) throw new Error(`STATIC_RELEASE_EXPLICIT_CONFIRMATION_REQUIRED:${confirmation}`);
const output = path.resolve(args.output ?? "config/publication-release.json");
const createdAt = args["created-at"] ?? new Date().toISOString();
let artifactText = null;
let currentDisplayAuthorization = null;
let artifactRelativePath = null;
let sourceArtifact = null;
let targetSurface = undefined;
if (state === "ON") {
  if (args["portfolio-directory"]) {
    const directory = path.resolve(args["portfolio-directory"]);
    const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
    const certification = JSON.parse(await readFile(path.join(directory, "certification.json"), "utf8"));
    const fileTexts = Object.fromEntries(await Promise.all(Object.entries(manifest.files ?? {}).map(async ([name, binding]) => [name, await readFile(path.join(directory, binding.file), "utf8")])));
    artifactText = `${JSON.stringify({ manifest, certification, fileTexts }, null, 2)}\n`;
    sourceArtifact = null;
    artifactRelativePath = `artifacts/${manifest.candidateId}.json`;
    targetSurface = "PUBLIC_RAM_INTELLIGENCE_PORTFOLIO";
    args["authority-reference"] = certification.certificationId;
  } else if (/^mer_displaypubauth_/.test(args["authority-reference"] ?? "")) {
    if (!/^mer_displaypubart_[a-f0-9]{24}$/.test(args["artifact-id"] ?? "")) throw new Error("STATIC_RELEASE_CERTIFIED_ARTIFACT_ID_REQUIRED");
    const publications = new FileCurrentDisplayPublicationRepository({ statePath: path.resolve(args["current-display-publication-state"] ?? ".forge-review/retail-display/current-display-publication.json") });
    const artifacts = new FileCurrentDisplayPublicationArtifactRepository({ statePath: path.resolve(args["current-display-artifact-state"] ?? ".forge-review/retail-display/current-display-publication-artifacts.json") });
    currentDisplayAuthorization = await publications.getAuthorization(args["authority-reference"]);const candidate=await publications.getCandidate(currentDisplayAuthorization?.binding?.candidateId),artifact=await artifacts.getArtifact(args["artifact-id"]);
    if(!artifact||artifact.authorization.authorizationId!==args["authority-reference"]||!verifyCurrentDisplayPublicationArtifact({artifact,authorization:currentDisplayAuthorization,candidate,evaluatedAt:createdAt}))throw new Error("STATIC_RELEASE_CERTIFIED_ARTIFACT_INVALID");
    artifactText=artifact.content.projectionText;sourceArtifact=null;artifactRelativePath=`artifacts/${artifact.artifactId}.json`;
  } else {sourceArtifact = path.resolve(args.artifact ?? "");artifactText = await readFile(sourceArtifact, "utf8");artifactRelativePath = `artifacts/${path.basename(sourceArtifact)}`;}
}
const manifest = createStaticPublicationReleaseManifest({
  releaseState: state,
  targetEnvironment: (args.environment ?? "").toUpperCase(),
  targetSurface,
  reason: args.reason,
  reviewedBy: args["reviewed-by"],
  createdAt,
  artifactRelativePath,
  artifactText,
  expiresAt: args["expires-at"] ?? null,
  authorityReference: args["authority-reference"] ?? null,
  currentDisplayAuthorization,
  previousReleaseId: args["previous-release-id"] ?? null
});
await mkdir(path.dirname(output), { recursive: true });
if (state === "ON") {
  await mkdir(path.join(path.dirname(output), "artifacts"), { recursive: true });
  if(sourceArtifact) await copyFile(sourceArtifact, path.join(path.dirname(output), artifactRelativePath)); else await writeFile(path.join(path.dirname(output), artifactRelativePath),artifactText,"utf8");
}
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: "STATIC_RELEASE_PREPARED", output, releaseId: manifest.releaseId, releaseState: manifest.releaseState, targetEnvironment: manifest.targetEnvironment, artifactId: manifest.artifact?.artifactId ?? null, artifactDigest: manifest.artifact?.digestSha256 ?? null, providerCalls: 0, paidTasks: 0, actualSpendUsd: 0 }, null, 2));
