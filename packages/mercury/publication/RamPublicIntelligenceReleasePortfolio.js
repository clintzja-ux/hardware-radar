import { createHash } from "node:crypto";
import { validatePublicCurrentRetailProjection } from "../current-display/PublicCurrentRetailProjection.js";
import { validateRamTerminalPublicIntelligence } from "../historical-admission/RamTerminalPublicIntelligence.js";
import { validatePublicChronologicalPriceSeries } from "../historical-admission/PublicChronologicalPriceSeries.js";

export const RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_SCHEMA_VERSION = "1.1";
export const RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_POLICY_VERSION = "RAM-PUBLIC-INTELLIGENCE-RELEASE-P1-1.1";
export const LEGACY_RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_SCHEMA_VERSION = "1.0";
export const LEGACY_RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_POLICY_VERSION = "RAM-PUBLIC-INTELLIGENCE-RELEASE-P1-1.0";

const privatePattern = /\.forge-review|providerTaskId|evidenceId|authorizationId|operator|workbook|rawPayload|researchUrl|sourceUrl|rightsDigest|credential|secret|observationId/i;
const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(",")}]`
  : value && typeof value === "object"
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`
    : JSON.stringify(value);
const digest = value => createHash("sha256").update(typeof value === "string" ? value.replaceAll("\r\n", "\n") : canonical(value), "utf8").digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));

export function portfolioFileDigest(text) { return digest(text); }

export function createRamPublicIntelligencePortfolioManifest({ preparedAt, preparedBy, inputs, routes, files, counts, currentValidUntil } = {}) {
  if (!validTime(preparedAt) || typeof preparedBy !== "string" || !preparedBy.trim()) throw new TypeError("RAM_PUBLIC_INTELLIGENCE_PREPARATION_INVALID");
  const authorityDomains = {
    durablePortfolio: { state: "CERTIFIABLE", expiresAt: null },
    ephemeralCurrent: { state: currentValidUntil ? "FRESH_UNTIL" : "EMPTY", expiresAt: currentValidUntil ?? null }
  };
  const identity = { schemaVersion: RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_SCHEMA_VERSION, policyVersion: RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_POLICY_VERSION, preparedAt, inputs, routes, files, counts, currentValidUntil, authorityDomains };
  const bindingDigest = digest(identity);
  return freeze({
    schemaVersion: RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_SCHEMA_VERSION,
    policyVersion: RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_POLICY_VERSION,
    artifactType: "RAM_PUBLIC_INTELLIGENCE_RELEASE_PORTFOLIO",
    candidateId: `mer_ramreleasecand_${bindingDigest.slice(0, 24)}`,
    artifactId: `mer_ramreleaseart_${bindingDigest.slice(0, 24)}`,
    bindingDigest,
    preparedAt,
    preparedBy,
    inputs,
    routes,
    files,
    counts,
    currentValidUntil,
    authorityDomains,
    currentFreshnessPolicy: "PUBLIC-RAM-CURRENT-RETAIL-001-1.0",
    historyPolicy: "EFFECTIVE_COMPARABILITY",
    snapshotIncluded: false,
    releaseAuthority: false,
    deploymentAuthority: false
  });
}

export function validateRamPublicIntelligencePortfolio({ manifest, fileTexts, evaluatedAt } = {}) {
  const errors = [];
  const legacy = manifest?.schemaVersion === LEGACY_RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_SCHEMA_VERSION && manifest?.policyVersion === LEGACY_RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_POLICY_VERSION;
  const splitAuthority = manifest?.schemaVersion === RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_SCHEMA_VERSION && manifest?.policyVersion === RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_POLICY_VERSION;
  if ((!legacy && !splitAuthority) || manifest?.artifactType !== "RAM_PUBLIC_INTELLIGENCE_RELEASE_PORTFOLIO") errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_HEADER_INVALID");
  if (!/^mer_ramreleasecand_[a-f0-9]{24}$/.test(manifest?.candidateId ?? "") || !/^mer_ramreleaseart_[a-f0-9]{24}$/.test(manifest?.artifactId ?? "") || !/^[a-f0-9]{64}$/.test(manifest?.bindingDigest ?? "")) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_IDENTITY_INVALID");
  if (!validTime(manifest?.preparedAt) || !validTime(evaluatedAt) || manifest?.releaseAuthority !== false || manifest?.deploymentAuthority !== false || manifest?.snapshotIncluded !== false) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_AUTHORITY_INVALID");
  if (!Number.isInteger(manifest?.counts?.products) || manifest.counts.products < 1 || manifest?.routes?.productRoutes !== manifest.counts.products || manifest?.routes?.snapshotRoutes !== 0) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_MEMBERSHIP_INVALID");
  if (!fileTexts || typeof fileTexts !== "object") errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_FILES_REQUIRED");
  for (const [name, binding] of Object.entries(manifest?.files ?? {})) {
    const text = fileTexts?.[name];
    if (typeof text !== "string" || portfolioFileDigest(text) !== binding?.digestSha256 || Buffer.byteLength(text, "utf8") !== binding?.bytes) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_FILE_BINDING_INVALID");
  }
  let catalog, current, terminal, staleCurrent, staleTerminal, chronology, destinations;
  try {
    catalog = JSON.parse(fileTexts?.catalog ?? "null"); current = JSON.parse(fileTexts?.current ?? "null"); terminal = JSON.parse(fileTexts?.terminal ?? "null");
    staleCurrent = JSON.parse(fileTexts?.staleCurrent ?? "null"); staleTerminal = JSON.parse(fileTexts?.staleTerminal ?? "null"); chronology = JSON.parse(fileTexts?.chronology ?? "null"); destinations = JSON.parse(fileTexts?.destinations ?? "null");
  } catch { errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_JSON_INVALID"); }
  if (catalog?.productCount !== manifest?.counts?.products || catalog?.products?.length !== manifest?.counts?.products) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_CATALOG_INVALID");
  if (!validatePublicCurrentRetailProjection(current).valid || !validatePublicCurrentRetailProjection(staleCurrent).valid || staleCurrent?.products?.length !== 0) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_CURRENT_INVALID");
  if (!validateRamTerminalPublicIntelligence(terminal).valid || !validateRamTerminalPublicIntelligence(staleTerminal).valid) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_TERMINAL_INVALID");
  if (!validatePublicChronologicalPriceSeries(chronology)) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_CHRONOLOGY_INVALID");
  if (!Array.isArray(destinations)) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_DESTINATIONS_INVALID");
  if (terminal?.lenses?.ALL_RAM?.historyCoverage?.comparableObservationCount !== chronology?.eligibleObservationCount || staleTerminal?.lenses?.ALL_RAM?.historyCoverage?.comparableObservationCount !== chronology?.eligibleObservationCount) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_HISTORY_INDEPENDENCE_INVALID");
  if (staleTerminal?.lenses?.ALL_RAM?.coverage?.productsCurrentlyPriced !== 0 || terminal?.lenses?.ALL_RAM?.coverage?.productsTracked !== manifest?.counts?.products || staleTerminal?.lenses?.ALL_RAM?.coverage?.productsTracked !== manifest?.counts?.products) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_STALE_CURRENT_INVALID");
  if (splitAuthority && (manifest?.authorityDomains?.durablePortfolio?.state !== "CERTIFIABLE" || manifest?.authorityDomains?.durablePortfolio?.expiresAt !== null || manifest?.authorityDomains?.ephemeralCurrent?.expiresAt !== (manifest.currentValidUntil ?? null) || !["FRESH_UNTIL", "EMPTY"].includes(manifest?.authorityDomains?.ephemeralCurrent?.state))) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_AUTHORITY_DOMAINS_INVALID");
  if (privatePattern.test(Object.values(fileTexts ?? {}).join("\n"))) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_PRIVATE_DATA_INVALID");
  const rebuilt = { schemaVersion: manifest?.schemaVersion, policyVersion: manifest?.policyVersion, preparedAt: manifest?.preparedAt, inputs: manifest?.inputs, routes: manifest?.routes, files: manifest?.files, counts: manifest?.counts, currentValidUntil: manifest?.currentValidUntil, ...(splitAuthority ? { authorityDomains: manifest?.authorityDomains } : {}) };
  if (manifest?.bindingDigest !== digest(rebuilt)) errors.push("RAM_PUBLIC_INTELLIGENCE_PORTFOLIO_BINDING_INVALID");
  const fresh = manifest?.currentValidUntil && Date.parse(evaluatedAt) <= Date.parse(manifest.currentValidUntil);
  return freeze({ valid: errors.length === 0, errors: [...new Set(errors)], authorityModel: splitAuthority ? "SPLIT_DURABLE_AND_CURRENT" : "LEGACY_COUPLED", durableMode: splitAuthority ? "AVAILABLE" : fresh ? "AVAILABLE" : "UNAVAILABLE", currentMode: fresh ? "FRESH" : splitAuthority ? "EXPIRED_DURABLE_ONLY" : "STALE_FAIL_CLOSED" });
}

export function certifyRamPublicIntelligencePortfolio({ manifest, fileTexts, evaluatedAt, certifiedBy } = {}) {
  const report = validateRamPublicIntelligencePortfolio({ manifest, fileTexts, evaluatedAt });
  if (!report.valid || typeof certifiedBy !== "string" || !certifiedBy.trim()) throw new Error(`RAM_PUBLIC_INTELLIGENCE_CERTIFICATION_FAILED:${report.errors.join(",")}`);
  const binding = { candidateId: manifest.candidateId, artifactId: manifest.artifactId, bindingDigest: manifest.bindingDigest, evaluatedAt, status: "CERTIFIED" };
  const certificationDigest = digest(binding);
  return freeze({
    schemaVersion: "1.0",
    policyVersion: manifest.policyVersion,
    certificationId: `sent_ramreleasecert_${certificationDigest.slice(0, 24)}`,
    status: "CERTIFIED",
    certifiedAt: evaluatedAt,
    certifiedBy,
    candidateId: manifest.candidateId,
    artifactId: manifest.artifactId,
    artifactBindingDigest: manifest.bindingDigest,
    currentModeAtCertification: report.currentMode,
    releaseAuthority: false,
    deploymentAuthority: false
  });
}
