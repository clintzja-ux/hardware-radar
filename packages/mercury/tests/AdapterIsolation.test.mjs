import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mercuryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedPrefix = path.join(mercuryRoot, "adapters");

async function walk(dir) {
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...await walk(full));
        else if (/\.(js|mjs)$/.test(entry.name)) files.push(full);
    }
    return files;
}

for (const file of await walk(mercuryRoot)) {
    if (file.startsWith(allowedPrefix) || file.includes(`${path.sep}tests${path.sep}`)) continue;
    const source = await readFile(file, "utf8");
    assert.equal(/AmazonAdapter|AmazonNormalizer|adapters\/amazon/.test(source), false, `Retailer-specific implementation leaked into ${file}`);
}

console.log("Adapter isolation tests passed.");
