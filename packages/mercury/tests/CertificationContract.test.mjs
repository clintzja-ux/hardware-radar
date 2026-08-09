import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mercuryRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = path.resolve(mercuryRoot, "../..");
const manifest = JSON.parse(await readFile(path.join(mercuryRoot, "mercury-manifest.json"), "utf8"));

assert.equal(manifest.mercuryVersion, "1.0.0");
assert.equal(manifest.repositoryStatus, "certified");
assert.equal(manifest.schemaVersion, "1.1");

const observationFiles = (await readdir(path.join(mercuryRoot, "observations"))).filter((name) => name.endsWith(".json"));
assert.deepEqual(observationFiles.sort(), ["mer_obs_000000001.json"]);

await assert.rejects(access(path.join(mercuryRoot, "schemas", "price-observation.schema.json")), { code: "ENOENT" });
for (const file of ["PRICE-20260715-000001.json", "PRICE-20260716-000002.json", "PRICE-20260716-000003.json"]) {
    await access(path.join(mercuryRoot, "legacy", "observations", file));
}
await access(path.join(mercuryRoot, "legacy", "schemas", "price-observation.schema.json"));

for (const obsolete of ["public/js/atlasAdapter.js", "public/js/atlasSmokeTest.js"]) {
    await assert.rejects(access(path.join(repoRoot, obsolete)), { code: "ENOENT" });
}

const forgeIds = await readFile(path.join(repoRoot, "apps", "forge", "services", "ForgeIdGenerator.js"), "utf8");
const forgeGenerator = await readFile(path.join(repoRoot, "apps", "forge", "services", "ForgeGenerator.js"), "utf8");
assert.equal(forgeIds.includes("generatePriceObservationId"), false);
assert.equal(forgeIds.includes("generateLegacyPriceObservationId"), true);
assert.equal(forgeGenerator.includes("createLegacyMercuryPreview"), true);

for (const duplicate of [
    "architecture/adr/ADR-009 #U2014 Freshness Is Derived Temporal State.md",
    "architecture/adr/ADR-010 #U2014 Confidence Is Explainable Derived State.md",
    "docs/engineering/EDRs/EDR-016 #U2014 Mercury Confidence Engine Completed.md",
    "docs/governance/ADR-008 Adapter-Based Ingestion Architecture.md",
    "docs/governance/ADR-009 Freshness Is Derived Temporal State.md"
]) {
    await assert.rejects(access(path.join(repoRoot, duplicate)), { code: "ENOENT" });
}

console.log("Mercury certification contract tests passed.");
