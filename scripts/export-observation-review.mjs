import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FileObservationAcceptanceRepository } from "../packages/mercury/persistence/FileObservationAcceptanceRepository.js";
import { ObservationReviewService } from "../packages/mercury/review/ObservationReviewService.js";

const [statePath, observationId, outputPath = path.join(".forge-review", `${observationId ?? "observation"}.review.json`), asOf] = process.argv.slice(2);

if (!statePath || !observationId) {
  console.error("Usage: npm run review:export -- <acceptance-state.json> <observationId> [outputPath] [asOf]");
  process.exit(1);
}

const repository = new FileObservationAcceptanceRepository({ statePath, environment: "production" });
const service = new ObservationReviewService({ acceptanceRepository: repository });
const item = await service.getReviewItem(observationId, asOf ? { asOf } : {});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(item, null, 2)}\n`, "utf8");
console.log(`Forge review bundle written: ${outputPath}`);
console.log(`Review status: ${item.status}`);
