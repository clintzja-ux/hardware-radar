import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
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

for (const id of ["014", "017", "019", "025"]) {
    const name = adrFiles.find((candidate) => candidate.startsWith(`ADR-${id}`));
    assert.ok(name, `ADR-${id} must have one canonical file.`);
    assert.match(await text(path.join("architecture", "adr", name)), /^\*\*Status:\*\* Accepted\b/m, `ADR-${id} must retain its reconciled accepted status.`);
}

assert.equal(existsSync(path.join(root, "docs", "test cmds.md")), false, "Operator-local command scratch documentation must not enter a release candidate.");

const currentState = await text(path.join("docs", "handoff", "CURRENT-STATE.md"));
assert.doesNotMatch(currentState, /HEAD at inspection:/, "CURRENT-STATE must not encode a commit hash that becomes stale on its own reconciliation commit.");
assert.doesNotMatch(currentState, /clean committed baseline before MAIN-PROMOTION-R1/, "CURRENT-STATE must not describe R1 as uncommitted after certification.");
assert.match(currentState, /\*\*235 subsystem test files\*\*/);
assert.match(currentState, /MAIN_BRANCH_CONTINUOUS_DEPLOYMENT_TO_CLOUDFLARE_CONFIRMED/);

const gitProbe = spawnSync("git", ["rev-parse", "--verify", "origin/main"], { cwd: root, encoding: "utf8" });
if (gitProbe.status === 0) {
    const promotionWhitespace = spawnSync("git", ["diff", "--check", "origin/main", "--"], { cwd: root, encoding: "utf8" });
    assert.equal(promotionWhitespace.status, 0, promotionWhitespace.stdout || promotionWhitespace.stderr || "Promotion range contains whitespace errors.");
}

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

for (const relativePath of [
    path.join("public", "data", "atlas", "brands", "corsair.json"),
    path.join("public", "data", "atlas", "products", "ram", "ddr5", "HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json")
]) {
    assert.doesNotMatch(await text(relativePath), /\r\n/, `${relativePath} is generated public text and must remain LF-governed.`);
}

console.log(`Release governance contract passed (${adrFiles.length} ADRs, ${atlasFiles.length} Atlas records).`);
