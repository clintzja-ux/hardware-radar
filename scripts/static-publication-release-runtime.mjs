import { readFile } from "node:fs/promises";
import path from "node:path";
import { evaluateStaticPublicationRelease, staticPublicationArtifactDigest } from "../packages/sentinel/validators/StaticPublicationReleaseControl.js";

async function readBoundArtifact(manifestPath, binding) {
  if (typeof binding?.relativePath !== "string") return null;
  const base = path.resolve(path.dirname(manifestPath));
  const artifactPath = path.resolve(base, binding.relativePath);
  const artifactRoot = path.resolve(base, "artifacts");
  if (artifactPath === artifactRoot || !artifactPath.startsWith(`${artifactRoot}${path.sep}`)) return null;
  return readFile(artifactPath, "utf8");
}

export async function loadStaticPublicationContinuityProjection({ manifestPath } = {}) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const release = manifest.rollback?.previousRelease ?? manifest;
  const artifactText = await readBoundArtifact(manifestPath, release.artifact);
  if (artifactText === null) throw new Error("STATIC_RELEASE_PREDECESSOR_ARTIFACT_MISSING");
  if (staticPublicationArtifactDigest(artifactText) !== release.artifact.digestSha256) throw new Error("STATIC_RELEASE_PREDECESSOR_ARTIFACT_DIGEST_MISMATCH");
  const parsed = JSON.parse(artifactText);
  const projection = parsed?.fileTexts?.current ? JSON.parse(parsed.fileTexts.current) : parsed;
  return { releaseId: release.releaseId, artifact: release.artifact, projection };
}

export async function loadStaticPublicationRelease({ manifestPath, targetEnvironment, evaluatedAt } = {}) {
  let manifest = null;
  let artifactText = null;
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
  catch (error) {
    if (error?.code !== "ENOENT") manifest = {};
  }
  if (manifest?.releaseState === "ON" && typeof manifest?.artifact?.relativePath === "string") {
    try {
      artifactText = await readBoundArtifact(manifestPath, manifest.artifact);
    } catch { artifactText = null; }
  }
  return evaluateStaticPublicationRelease({ manifest, artifactText, targetEnvironment, evaluatedAt });
}
