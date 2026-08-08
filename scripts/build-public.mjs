import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function copyDirectory(source, destination, { exclude = [] } = {}) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });

    for (const entry of await readdir(source)) {
        if (exclude.includes(entry)) continue;
        const sourcePath = path.join(source, entry);
        const destinationPath = path.join(destination, entry);
        const info = await stat(sourcePath);
        if (info.isDirectory()) {
            await cp(sourcePath, destinationPath, { recursive: true });
        } else {
            await cp(sourcePath, destinationPath);
        }
    }
}

await copyDirectory(
    path.join(root, "packages", "atlas"),
    path.join(root, "public", "data", "atlas"),
    { exclude: ["tests", "README.md"] }
);

await copyDirectory(
    path.join(root, "packages", "mercury"),
    path.join(root, "public", "data", "mercury"),
    { exclude: ["tests", "README.md"] }
);

await copyDirectory(
    path.join(root, "apps", "forge"),
    path.join(root, "public", "forge"),
    { exclude: ["README.md"] }
);

await rm(path.join(root, "public", "data", "sentinel"), {
    recursive: true,
    force: true
});

console.log("Public deployment artifacts built from canonical packages and apps.");
