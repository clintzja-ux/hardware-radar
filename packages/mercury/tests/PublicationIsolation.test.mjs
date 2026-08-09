import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const main = await readFile(fileURLToPath(new URL("../../../public/js/main.js", import.meta.url)), "utf8");
assert.equal(main.includes("atlasAdapter"), false);

for (const obsolete of ["../../../public/js/atlasAdapter.js", "../../../public/js/atlasSmokeTest.js"]) {
    await assert.rejects(access(fileURLToPath(new URL(obsolete, import.meta.url))), { code: "ENOENT" });
}

console.log("Mercury publication isolation tests passed.");
