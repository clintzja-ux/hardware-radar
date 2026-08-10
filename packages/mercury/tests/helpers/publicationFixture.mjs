import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const canonical = JSON.parse(await readFile(fileURLToPath(new URL("../../observations/mer_obs_000000001.json", import.meta.url)), "utf8"));

export function makeAmazonApiObservation(observationId = "mer_obs_000000001", observedAt = "2026-08-10T15:00:00Z") {
  const observation = structuredClone(canonical);
  observation.observationId = observationId;
  observation.observationTime = observedAt;
  observation.sourceMethod = "API";
  observation.provenance.source.name = "Amazon Creators API";
  observation.provenance.acquisition.method = "API";
  observation.provenance.acquisition.retrievedAt = observedAt;
  observation.provenance.acquisition.retrievedBy = "service:amazon-creators-api";
  observation.provenance.acquisition.requestId = `req-${observationId}`;
  observation.provenance.transformation.adapterVersion = "1.0.0";
  observation.provenance.transformation.normalizedAt = observedAt;
  observation.compliance.licenseContext = "AMAZON_CREATORS_API";
  observation.metadata.createdAt = observedAt;
  observation.metadata.createdBy = "test:publication-fixture";
  return observation;
}
