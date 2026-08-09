import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const main = await readFile(fileURLToPath(new URL("../../../public/js/main.js", import.meta.url)), "utf8");
const adapter = await readFile(fileURLToPath(new URL("../../../public/js/atlasAdapter.js", import.meta.url)), "utf8");
assert.equal(main.includes("atlasAdapter"), false);
assert.equal(adapter.includes("PRICE-20260715-000001"), false);
console.log("Publication isolation tests passed.");
