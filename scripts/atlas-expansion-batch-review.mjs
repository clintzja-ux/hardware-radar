import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reviewAtlasExpansionBatch, validateRepository } from "../packages/atlas/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
if (args.get("--confirm") !== "ACTIVATE-ATLAS-EXPANSION-77") throw new Error("ATLAS_BATCH_REVIEW_CONFIRMATION_REQUIRED");
const reviewedBy = args.get("--reviewed-by");
const reviewedAt = args.get("--reviewed-at");
const reason = args.get("--reason");
const atlasRoot = fileURLToPath(new URL("../packages/atlas/", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(atlasRoot, "atlas-manifest.json"), "utf8"));
const readRecords = entries => Promise.all(entries.map(async entry => JSON.parse(await readFile(path.join(atlasRoot, entry.path), "utf8"))));
const products = await readRecords(manifest.products);
const brands = await readRecords(manifest.brands);
const result = reviewAtlasExpansionBatch({ products, brands, reviewedBy, reviewedAt, reason });
const resultingById = new Map(result.outcomes.map(outcome => [outcome.atlasProductId, outcome.product]));
const resultingProducts = products.map(product => resultingById.get(product.identity.atlasProductId) ?? product);
const validation = validateRepository(resultingProducts);
if (!validation.valid) throw new Error(`ATLAS_BATCH_REVIEW_RESULT_INVALID:${JSON.stringify(validation.errors)}`);

for (const entry of manifest.products) {
    const outcome = result.outcomes.find(item => item.atlasProductId === entry.atlasProductId);
    if (!outcome || outcome.status !== "ACTIVATED") continue;
    const target = path.join(atlasRoot, entry.path);
    const temporary = `${target}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(outcome.product, null, 2)}\n`, "utf8");
    await rename(temporary, target);
}

const auditPath = path.join(atlasRoot, "reviews", "atlas-activation-001.json");
await mkdir(path.dirname(auditPath), { recursive: true });
let existing = null;
try { existing = JSON.parse(await readFile(auditPath, "utf8")); } catch (error) { if (error?.code !== "ENOENT") throw error; }
if (existing && JSON.stringify(existing) !== JSON.stringify(result.decision)) throw new Error("ATLAS_BATCH_REVIEW_AUDIT_CONFLICT");
if (!existing) {
    const temporary = `${auditPath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(result.decision, null, 2)}\n`, "utf8");
    await rename(temporary, auditPath);
}

console.log("ATLAS EXPANSION BATCH LIFECYCLE REVIEW\n");
console.log("Decision:", result.decision.decisionId);
console.log("Requested:", result.decision.counts.requested);
console.log("Activated:", result.decision.counts.activated);
console.log("Blocked:  ", result.decision.counts.blocked);
console.log("Provider operations: 0");
console.log("Actual spend:       $0.000");
