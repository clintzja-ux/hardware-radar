import defaultSourceRightsRegistry from "../rights/SourceRightsRegistry.js";

export const STORAGE_CLASSES = Object.freeze({ DURABLE: "DURABLE", LICENSE_CONTROLLED: "LICENSE_CONTROLLED", TEST_ONLY: "TEST_ONLY", RIGHTS_UNKNOWN: "RIGHTS_UNKNOWN" });
export const PAYLOAD_STATUSES = Object.freeze({ ACTIVE: "ACTIVE", PURGED: "PURGED" });
function addMs(iso, ms) { return new Date(new Date(iso).getTime() + ms).toISOString(); }

export function classifyObservationStorage(observation, { registry = defaultSourceRightsRegistry } = {}) {
  const licenseContext = observation?.compliance?.licenseContext ?? "UNSPECIFIED";
  const retrievedAt = observation?.provenance?.acquisition?.retrievedAt ?? observation?.observationTime;
  const rights = registry.get(licenseContext);
  if (!rights) return Object.freeze({ storageClass: STORAGE_CLASSES.RIGHTS_UNKNOWN, licenseContext, payloadExpiresAt: retrievedAt ?? null, rightsStatus: "UNKNOWN" });
  const storageClass = rights.retention.storageClass;
  const ttl = rights.retention.contentTtlMs;
  return Object.freeze({ storageClass, licenseContext, payloadExpiresAt: ttl == null ? null : addMs(retrievedAt, ttl), rightsStatus: rights.status });
}
export default classifyObservationStorage;
