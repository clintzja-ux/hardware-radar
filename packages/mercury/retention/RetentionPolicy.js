export const STORAGE_CLASSES = Object.freeze({
  DURABLE: "DURABLE",
  LICENSE_CONTROLLED: "LICENSE_CONTROLLED",
  TEST_ONLY: "TEST_ONLY"
});

export const PAYLOAD_STATUSES = Object.freeze({ ACTIVE: "ACTIVE", PURGED: "PURGED" });

function addMs(iso, ms) { return new Date(new Date(iso).getTime() + ms).toISOString(); }

export function classifyObservationStorage(observation) {
  const licenseContext = observation?.compliance?.licenseContext ?? "UNSPECIFIED";
  const retrievedAt = observation?.provenance?.acquisition?.retrievedAt ?? observation?.observationTime;

  if (licenseContext === "TEST_FIXTURE") {
    return Object.freeze({ storageClass: STORAGE_CLASSES.TEST_ONLY, licenseContext, payloadExpiresAt: null });
  }

  if (observation?.retailerId === "RETAILER-0001" && licenseContext === "AMAZON_CREATORS_API") {
    return Object.freeze({
      storageClass: STORAGE_CLASSES.LICENSE_CONTROLLED,
      licenseContext,
      payloadExpiresAt: addMs(retrievedAt, 60 * 60 * 1000)
    });
  }

  return Object.freeze({ storageClass: STORAGE_CLASSES.DURABLE, licenseContext, payloadExpiresAt: null });
}

export default classifyObservationStorage;
