import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { FileCurrentDisplaySnapshotRepository, reassessLifecycleHeldRetailEvidence } from "../packages/mercury/current-display/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
if (args.get("--confirm") !== "REASSESS-LIFECYCLE-HELD-RETAIL-EVIDENCE") throw new Error("RETAIL_LIFECYCLE_REASSESS_CONFIRMATION_REQUIRED");
const reviewedBy = String(args.get("--reviewed-by") ?? "").trim(), reassessedAt = String(args.get("--reassessed-at") ?? "");
if (!reviewedBy || !Number.isFinite(Date.parse(reassessedAt))) throw new Error("RETAIL_LIFECYCLE_REASSESS_AUDIT_REQUIRED");
const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const holdPath = path.resolve(".forge-review/retail-discovery/retail-discovery-lifecycle-held.json");
const rowsPath = path.resolve(".forge-review/retail-discovery/final-manual-pass-inspection.json");
const auditPath = path.resolve(".forge-review/retail-discovery/retail-lifecycle-reassessment-001.json");
const destinationPath = path.resolve("packages/mercury/destinations/production-destinations.json");
const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: path.resolve(".forge-review/retail-display/current-display-snapshots.json") });
const [heldArtifact, workbook, destinationState, products, retailers, snapshotState] = await Promise.all([readJson(holdPath), readJson(rowsPath), readJson(destinationPath), new ProductRepository({ readJson }).getAll(), new RetailerRepository({ readJson }).getAll(), snapshotRepository.getState()]);
const result = reassessLifecycleHeldRetailEvidence({ heldArtifact, rows: workbook.rows, products, retailers, destinations: destinationState.records, currentSnapshot: snapshotState.current, reviewedBy, reassessedAt });
if (result.audit.counts.destinationBlocked || result.audit.counts.lifecycleBlocked) throw new Error("RETAIL_LIFECYCLE_REASSESS_BLOCKED");
if (result.additions.length) { const temporary = `${destinationPath}.${process.pid}.tmp`; await writeFile(temporary, `${JSON.stringify({ ...destinationState, records: [...destinationState.records, ...result.additions] }, null, 2)}\n`); await rename(temporary, destinationPath); }
const replacement = await snapshotRepository.replace(result.snapshot);
await writeFile(auditPath, `${JSON.stringify({ ...result.audit, snapshotStatus: replacement.status, resultingSnapshotId: result.snapshot.snapshotId }, null, 2)}\n`);
console.log(JSON.stringify({ reassessmentId: result.audit.reassessmentId, ...result.audit.counts, destinationRecordsBefore: destinationState.records.length, destinationRecordsAfter: destinationState.records.length + result.additions.length, predecessorSnapshotId: snapshotState.current.snapshotId, resultingSnapshotId: result.snapshot.snapshotId, previousSnapshotId: replacement.previousSnapshotId, providerOperations: 0, actualSpendUsd: 0 }, null, 2));
