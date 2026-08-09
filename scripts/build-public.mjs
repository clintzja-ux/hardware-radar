import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Mercury } from "../packages/mercury/Mercury.js";
import { MarketPublicationService } from "../packages/mercury/publication/MarketPublicationService.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function copyDirectory(source, destination, { exclude = [] } = {}) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source)) {
        if (exclude.includes(entry)) continue;
        const sourcePath = path.join(source, entry);
        const destinationPath = path.join(destination, entry);
        const info = await stat(sourcePath);
        if (info.isDirectory()) await cp(sourcePath, destinationPath, { recursive: true });
        else await cp(sourcePath, destinationPath);
    }
}

async function json(file) { return JSON.parse(await readFile(file, "utf8")); }

async function loadManifestRecords(packageRoot, entries) {
    return Promise.all(entries.map((entry) => json(path.resolve(packageRoot, entry.path))));
}

await copyDirectory(path.join(root, "packages", "atlas"), path.join(root, "public", "data", "atlas"), { exclude: ["tests", "README.md"] });
await copyDirectory(path.join(root, "apps", "forge"), path.join(root, "public", "forge"), { exclude: ["README.md"] });

// Mercury is an internal platform package. Only its application-facing publication artifact is public.
await rm(path.join(root, "public", "data", "mercury"), { recursive: true, force: true });
await rm(path.join(root, "public", "data", "sentinel"), { recursive: true, force: true });
await rm(path.join(root, "public", "js", "atlasAdapter.js"), { force: true });
await rm(path.join(root, "public", "js", "atlasSmokeTest.js"), { force: true });

const atlasRoot = path.join(root, "packages", "atlas");
const mercuryRoot = path.join(root, "packages", "mercury");
const atlasManifest = await json(path.join(atlasRoot, "atlas-manifest.json"));
const mercuryManifest = await json(path.join(mercuryRoot, "mercury-manifest.json"));
const [products, retailers, observations] = await Promise.all([
    loadManifestRecords(atlasRoot, atlasManifest.products),
    loadManifestRecords(atlasRoot, atlasManifest.retailers),
    loadManifestRecords(mercuryRoot, mercuryManifest.observations)
]);
const generatedAt = process.env.HARDWARE_RADAR_GENERATED_AT || new Date().toISOString();
const snapshot = await new MarketPublicationService({ mercury: new Mercury() }).createSnapshot({ observations, products, retailers, generatedAt });
await writeFile(path.join(root, "public", "data", "market-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`);

console.log("Public deployment artifacts built from canonical packages and published intelligence.");
