import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function snapshot(directory, { exclude = [] } = {}, prefix = "") {
    const result = new Map();
    for (const entry of (await readdir(directory)).sort()) {
        if (prefix === "" && exclude.includes(entry)) continue;
        const fullPath = path.join(directory, entry);
        const relativePath = path.posix.join(prefix, entry);
        const info = await stat(fullPath);
        if (info.isDirectory()) {
            const nested = await snapshot(fullPath, { exclude }, relativePath);
            for (const [key, value] of nested) result.set(key, value);
        } else {
            result.set(relativePath, await readFile(fullPath));
        }
    }
    return result;
}

async function verifyProjection(label, source, destination, options) {
    const [expected, actual] = await Promise.all([
        snapshot(source, options),
        snapshot(destination)
    ]);

    const errors = [];
    for (const [file, contents] of expected) {
        if (!actual.has(file)) errors.push(`${label}: missing public artifact ${file}`);
        else if (!contents.equals(actual.get(file))) errors.push(`${label}: stale public artifact ${file}`);
    }
    for (const file of actual.keys()) {
        if (!expected.has(file)) errors.push(`${label}: unexpected public artifact ${file}`);
    }
    return errors;
}

const errors = [
    ...(await verifyProjection(
        "Atlas",
        path.join(root, "packages", "atlas"),
        path.join(root, "public", "data", "atlas"),
        { exclude: ["tests", "README.md"] }
    )),
    ...(await verifyProjection(
        "Mercury",
        path.join(root, "packages", "mercury"),
        path.join(root, "public", "data", "mercury"),
        { exclude: ["tests", "README.md"] }
    )),
    ...(await verifyProjection(
        "Forge",
        path.join(root, "apps", "forge"),
        path.join(root, "public", "forge"),
        { exclude: ["README.md"] }
    ))
];

try {
    await stat(path.join(root, "public", "data", "sentinel"));
    errors.push("Sentinel: internal package must not be present in public/data.");
} catch (error) {
    if (error.code !== "ENOENT") throw error;
}

if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
} else {
    console.log("Public deployment artifacts match canonical platform sources.");
}
