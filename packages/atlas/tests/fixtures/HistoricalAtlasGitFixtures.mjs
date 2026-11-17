import { execFileSync } from "node:child_process";

const REPOSITORY_ROOT = new URL("../../../../", import.meta.url);

function readJsonAt(revision, path) {
    const source = execFileSync("git", ["show", `${revision}:${path}`], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
    });
    return JSON.parse(source);
}

export function loadHistoricalAtlasSnapshot(revision) {
    const manifest = readJsonAt(revision, "packages/atlas/atlas-manifest.json");
    return {
        revision,
        manifest,
        products: manifest.products.map(({ path }) => readJsonAt(revision, `packages/atlas/${path}`)),
        brands: manifest.brands.map(({ path }) => readJsonAt(revision, `packages/atlas/${path}`))
    };
}

export function loadHistoricalAtlasProduct(revision, path) {
    return readJsonAt(revision, `packages/atlas/${path}`);
}
