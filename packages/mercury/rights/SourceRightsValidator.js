import { RIGHTS_STATES } from "./SourceRightsPolicy.js";
const allowed = new Set(Object.values(RIGHTS_STATES));
const required = ["acquisition.api","acquisition.manual","acquisition.import","live.currentObservation","live.publicDisplay","live.comparison","retention.historical","retention.durableAuditMetadata","derivation.analytics","derivation.historicalAnalytics","presentation.attribution"];
function at(o,p){return p.split(".").reduce((v,k)=>v?.[k],o);}
export function validateSourceRightsProfile(profile) {
  const errors=[];
  if (!profile || typeof profile !== "object") return Object.freeze({valid:false,errors:Object.freeze(["PROFILE_REQUIRED"])});
  if (!profile.sourceId) errors.push("SOURCE_ID_REQUIRED");
  for (const path of required) if (!allowed.has(at(profile,path))) errors.push(`INVALID_RIGHT:${path}`);
  if (!profile.retention || !(profile.retention.contentTtlMs === null || (Number.isFinite(profile.retention.contentTtlMs) && profile.retention.contentTtlMs >= 0))) errors.push("INVALID_RETENTION_TTL");
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}
