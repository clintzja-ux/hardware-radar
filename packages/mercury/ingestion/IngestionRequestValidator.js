const METHODS = Object.freeze(["API", "MANUAL", "FEED", "IMPORT", "AUTOMATED_CHECK", "TEST_FIXTURE"]);
function issue(code, field, message) { return Object.freeze({ code, field, message }); }
function str(v) { return typeof v === "string" && v.trim() !== ""; }
export function validateIngestionRequest(request) {
  const errors = [];
  if (!request || typeof request !== "object" || Array.isArray(request)) errors.push(issue("INVALID_REQUEST", "$", "Ingestion request must be an object."));
  else {
    for (const field of ["atlasProductId", "retailerId", "marketplace", "sourceMethod", "retrievedAt", "retrievedBy"]) if (!str(request[field])) errors.push(issue("MISSING_FIELD", field, `${field} is required.`));
    if (str(request.sourceMethod) && !METHODS.includes(request.sourceMethod.trim().toUpperCase())) errors.push(issue("INVALID_SOURCE_METHOD", "sourceMethod", "Unsupported ingestion source method."));
    if (!request.sourcePayload || typeof request.sourcePayload !== "object" || Array.isArray(request.sourcePayload)) errors.push(issue("INVALID_PAYLOAD", "sourcePayload", "sourcePayload must be an object."));
    if (str(request.retrievedAt) && !Number.isFinite(Date.parse(request.retrievedAt))) errors.push(issue("INVALID_RETRIEVED_AT", "retrievedAt", "retrievedAt must be an ISO date-time."));
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
export { METHODS as INGESTION_SOURCE_METHODS };
