import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const digest = (value) => createHash("sha256").update(value).digest("hex");
async function jsonFiles(relativeDirectory) {
    const directory = path.join(root, relativeDirectory);
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
        const relativePath = path.join(relativeDirectory, entry.name);
        if (entry.isDirectory()) return jsonFiles(relativePath);
        return entry.name.endsWith(".json") ? [relativePath] : [];
    }));
    return nested.flat();
}

const attributes = await text(".gitattributes");
assert.match(attributes, /^\* text=auto eol=lf$/m, "Repository text checkout must be deterministic LF on every OS.");
assert.match(attributes, /^\/packages\/atlas\/brands\/corsair\.json text eol=crlf$/m);
assert.match(attributes, /^\/packages\/atlas\/products\/ram\/ddr5\/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30\.json text eol=crlf$/m);

const lock = JSON.parse(await text("package-lock.json"));
const manifest = JSON.parse(await text("package.json"));
assert.equal(lock.lockfileVersion, 3);
assert.equal(lock.packages[""].name, manifest.name);
assert.equal(lock.packages[""].version, manifest.version);

const adrFiles = (await readdir(path.join(root, "architecture", "adr")))
    .filter((name) => /^ADR-\d{3}.*\.md$/.test(name));
const fileIds = adrFiles.map((name) => name.match(/^ADR-(\d{3})/)[1]);
assert.equal(new Set(fileIds).size, fileIds.length, "Every ADR identifier must have exactly one canonical file.");

const adrIndex = await text("docs/governance/ADR-INDEX.md");
const indexIds = [...adrIndex.matchAll(/^\| ADR-(\d{3}) \|/gm)].map((match) => match[1]);
assert.equal(new Set(indexIds).size, indexIds.length, "Every ADR identifier must occur exactly once in the index table.");
assert.deepEqual([...indexIds].sort(), [...fileIds].sort(), "The ADR index must cover every canonical ADR file and no nonexistent ADR.");
assert.match(adrIndex, /ADR-005 through ADR-007 are intentionally unused/);

const atlasFiles = [
    ...await jsonFiles(path.join("packages", "atlas", "brands")),
    ...await jsonFiles(path.join("packages", "atlas", "products")),
    ...await jsonFiles(path.join("packages", "atlas", "retailers"))
];
let newlineBearingAtlasFiles = 0;
for (const relativePath of atlasFiles) {
    const canonical = await text(relativePath);
    JSON.parse(canonical);
    if (canonical.includes("\n")) {
        newlineBearingAtlasFiles += 1;
        const lf = canonical.replaceAll("\r\n", "\n");
        const crlf = lf.replaceAll("\n", "\r\n");
        assert.deepEqual(JSON.parse(crlf), JSON.parse(lf), `${relativePath} remains semantically identical under CRLF.`);
        assert.equal(digest(crlf.replaceAll("\r\n", "\n")), digest(lf), `${relativePath} canonical integrity must ignore only newline representation.`);
    }
}
assert.ok(newlineBearingAtlasFiles > 0, "Atlas integrity coverage requires newline-bearing canonical records.");

console.log(`Release governance contract passed (${adrFiles.length} ADRs, ${atlasFiles.length} Atlas records).`);
