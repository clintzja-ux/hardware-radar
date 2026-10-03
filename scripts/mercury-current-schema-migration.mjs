import path from "node:path";
import { CurrentSchemaMigrationService, FileCurrentDisplaySnapshotRepository, FileCurrentSchemaMigrationRepository } from "../packages/mercury/current-display/index.js";

const values = new Map(process.argv.slice(2).map(value => { const [key, ...rest] = value.split("="); return [key, rest.join("=")]; }));
const action = values.get("--action");
const migrationId = values.get("--migration-id");
const service = new CurrentSchemaMigrationService({
    snapshotRepository: new FileCurrentDisplaySnapshotRepository({ statePath: path.resolve(values.get("--current-state") ?? ".forge-review/retail-display/current-display-snapshots.json") }),
    migrationRepository: new FileCurrentSchemaMigrationRepository({ statePath: path.resolve(values.get("--migration-state") ?? ".forge-review/retail-display/current-schema-migrations.json") })
});
let result;
if (action === "prepare") result = await service.prepare();
else if (action === "inspect" && migrationId) result = await service.inspect(migrationId);
else if (action === "execute" && migrationId) result = await service.execute(migrationId);
else throw new TypeError("CURRENT_SCHEMA_MIGRATION_COMMAND_INVALID");
const { targetSnapshot: _targetSnapshot, ...operatorResult } = result;
console.log(JSON.stringify(operatorResult, null, 2));
