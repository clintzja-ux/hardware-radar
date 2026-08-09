import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function exists(file) {
    try { await stat(file); return true; }
    catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function moveIfPresent(sourceRelative, destinationRelative) {
    const source = path.join(root, sourceRelative);
    const destination = path.join(root, destinationRelative);
    if (!(await exists(source))) return;
    await mkdir(path.dirname(destination), { recursive: true });
    if (await exists(destination)) await rm(source, { force: true });
    else await rename(source, destination);
}

for (const file of [
    "PRICE-20260715-000001.json",
    "PRICE-20260716-000002.json",
    "PRICE-20260716-000003.json"
]) {
    await moveIfPresent(`packages/mercury/observations/${file}`, `packages/mercury/legacy/observations/${file}`);
}
await moveIfPresent("packages/mercury/schemas/price-observation.schema.json", "packages/mercury/legacy/schemas/price-observation.schema.json");

for (const obsolete of [
    "public/js/atlasAdapter.js",
    "public/js/atlasSmokeTest.js",
    "architecture/adr/ADR-009 #U2014 Freshness Is Derived Temporal State.md",
    "architecture/adr/ADR-010 #U2014 Confidence Is Explainable Derived State.md",
    "docs/engineering/EDRs/EDR-016 #U2014 Mercury Confidence Engine Completed.md",
    "docs/governance/ADR-008 Adapter-Based Ingestion Architecture.md",
    "docs/governance/ADR-009 Freshness Is Derived Temporal State.md"
]) {
    await rm(path.join(root, obsolete), { force: true });
}

console.log("Mercury M008 certification cleanup applied.");
