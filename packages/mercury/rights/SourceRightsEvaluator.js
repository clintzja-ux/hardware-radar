import defaultRegistry from "./SourceRightsRegistry.js";
import { RIGHTS_STATES } from "./SourceRightsPolicy.js";

function sourceIdFor(observation) { return observation?.compliance?.licenseContext ?? "UNSPECIFIED"; }
function stateAt(profile, path) { return path.split(".").reduce((v, key) => v?.[key], profile); }

export function evaluateSourceRight(observation, capability, { registry = defaultRegistry } = {}) {
  const sourceId = sourceIdFor(observation);
  const profile = registry.get(sourceId);
  if (!profile) return Object.freeze({ allowed: false, state: "UNKNOWN", sourceId, capability, reason: "SOURCE_RIGHTS_UNKNOWN" });
  const state = stateAt(profile, capability);
  if (!state) return Object.freeze({ allowed: false, state: "UNKNOWN", sourceId, capability, reason: "SOURCE_RIGHT_UNDECLARED" });
  return Object.freeze({ allowed: state === RIGHTS_STATES.ALLOWED, state, sourceId, capability, reason: state === RIGHTS_STATES.ALLOWED ? null : `SOURCE_RIGHT_${state}` });
}

export function evaluateAcquisitionRight(request, { registry = defaultRegistry } = {}) {
  const method = String(request?.sourceMethod ?? "").trim().toUpperCase();
  const sourceId = request?.licenseContext ?? (method === "TEST_FIXTURE" ? "TEST_FIXTURE" : "UNSPECIFIED");
  const profile = registry.get(sourceId);
  if (!profile) return Object.freeze({ allowed: false, state: "UNKNOWN", sourceId, reason: "SOURCE_RIGHTS_UNKNOWN" });
  if (method === "TEST_FIXTURE" && sourceId === "TEST_FIXTURE") return Object.freeze({ allowed: true, state: RIGHTS_STATES.ALLOWED, sourceId, reason: null });
  const key = method === "API" ? "api" : method === "MANUAL" ? "manual" : method === "IMPORT" ? "import" : null;
  if (!key || !profile.acquisition?.[key]) return Object.freeze({ allowed: false, state: "UNKNOWN", sourceId, reason: "ACQUISITION_RIGHT_UNDECLARED" });
  const state = profile.acquisition[key];
  return Object.freeze({ allowed: state === RIGHTS_STATES.ALLOWED, state, sourceId, reason: state === RIGHTS_STATES.ALLOWED ? null : `ACQUISITION_${state}` });
}
