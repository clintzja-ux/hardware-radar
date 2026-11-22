import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRamPublicationShadowPlan, observeRamPublicationShadow } from "../../../scripts/lib/ram-publication-dependency-plan.mjs";

const freeze = value => Object.freeze(structuredClone(value));
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export class RamPublicationDependencyShadow {
  async inspect({ root, manifest, release } = {}) {
    try {
      const predecessorRelative = manifest?.rollback?.previousRelease?.artifact?.relativePath;
      if (!predecessorRelative) throw new Error("PUBLICATION_DEPENDENCY_PREDECESSOR_REQUIRED");
      const [predecessorArtifact, atlasManifest] = await Promise.all([
        readFile(path.resolve(path.dirname(path.resolve(root, "config/publication-release.json")), predecessorRelative), "utf8").then(JSON.parse),
        readFile(path.resolve(root, "packages/atlas/atlas-manifest.json"), "utf8").then(JSON.parse)
      ]);
      const atlasProducts = await Promise.all(atlasManifest.products.map(entry => readFile(path.resolve(root, "packages/atlas", entry.path), "utf8").then(JSON.parse)));
      const plan = createRamPublicationShadowPlan({ candidateArtifact:release.portfolio, predecessorArtifact, atlasProducts, atlasManifestEntries:atlasManifest.products, scope:"PRICE_PUBLICATION" });
      return freeze({ status:"PLANNED", plan, observationOnly:true });
    } catch (error) {
      const evidence = { status:"INPUT_EVIDENCE_INCOMPLETE", classification:error.message, observationOnly:true, affectsEligibility:false };
      return freeze({ ...evidence, diagnosticDigest:digest(evidence) });
    }
  }

  observe({ inspection, changedPaths, comparisonComplete } = {}) {
    if (inspection?.status !== "PLANNED") return inspection;
    try { return observeRamPublicationShadow({ plan:inspection.plan, changedPaths, comparisonComplete }); }
    catch (error) { const evidence={ status:"COMPARISON_INCOMPLETE", classification:error.message, planDigest:inspection.plan.planDigest, observationOnly:true, affectsEligibility:false }; return freeze({ ...evidence, diagnosticDigest:digest(evidence) }); }
  }
}
