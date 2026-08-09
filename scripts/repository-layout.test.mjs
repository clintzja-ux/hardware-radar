import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const requiredPath of [
    "packages/atlas/Atlas.js",
    "packages/mercury/Mercury.js",
    "packages/sentinel/core/ValidationRunner.js",
    "apps/forge/index.html",
    "public/data/atlas/Atlas.js",
    "public/data/market-snapshot.json",
    "public/forge/index.html"
]) {
    await access(path.join(root, requiredPath));
}

for (const internalPackage of ["sentinel", "mercury"]) {
    await assert.rejects(
        access(path.join(root, "public", "data", internalPackage)),
        { code: "ENOENT" }
    );
}

console.log("Repository modernization layout contract passed.");
