import { readFile } from "node:fs/promises";
import path from "node:path";
import { evaluateStaticPublicationRelease } from "../packages/sentinel/validators/StaticPublicationReleaseControl.js";

export async function loadStaticPublicationRelease({ manifestPath, targetEnvironment, evaluatedAt } = {}) {
  let manifest = null;
  let artifactText = null;
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
  catch (error) {
    if (error?.code !== "ENOENT") manifest = {};
  }
  if (manifest?.releaseState === "ON" && typeof manifest?.artifact?.relativePath === "string") {
    try {
      const base = path.resolve(path.dirname(manifestPath));
      const artifactPath = path.resolve(base, manifest.artifact.relativePath);
      const artifactRoot = path.resolve(base, "artifacts");
      if (artifactPath !== artifactRoot && artifactPath.startsWith(`${artifactRoot}${path.sep}`)) artifactText = await readFile(artifactPath, "utf8");
    } catch { artifactText = null; }
  }
  return evaluateStaticPublicationRelease({ manifest, artifactText, targetEnvironment, evaluatedAt });
}
