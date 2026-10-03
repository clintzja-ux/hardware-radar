import { createHash } from "node:crypto";
import { validatePublicCurrentRetailProjection } from "../../mercury/current-display/PublicCurrentRetailProjection.js";
import { verifyCurrentDisplayArtifactAuthority } from "../../mercury/publication/CurrentDisplayPublication.js";
import { validateRamPublicIntelligencePortfolio } from "../../mercury/publication/RamPublicIntelligenceReleasePortfolio.js";

export const STATIC_PUBLICATION_RELEASE_SCHEMA_VERSION = "1.0";
export const STATIC_PUBLICATION_RELEASE_POLICY_VERSION = "CERTIFIED-STATIC-PUBLICATION-RELEASE-CONTROL-P1-1.0";
export const STATIC_PUBLICATION_RELEASE_SURFACE = "PUBLIC_RAM_CURRENT_RETAIL";
export const STATIC_PUBLICATION_RELEASE_PORTFOLIO_SURFACE = "PUBLIC_RAM_INTELLIGENCE_PORTFOLIO";
export const STATIC_PUBLICATION_RELEASE_SURFACES = Object.freeze([STATIC_PUBLICATION_RELEASE_SURFACE, STATIC_PUBLICATION_RELEASE_PORTFOLIO_SURFACE]);
export const STATIC_PUBLICATION_RELEASE_STATES = Object.freeze(["OFF", "ON"]);
export const STATIC_PUBLICATION_RELEASE_ENVIRONMENTS = Object.freeze(["PREVIEW", "PRODUCTION"]);

const manifestKeys = Object.freeze(["schemaVersion", "policyVersion", "releaseId", "releaseState", "targetEnvironment", "targetSurface", "reason", "createdAt", "reviewedBy", "artifact", "certification", "rollback"]);
const currentArtifactKeys = Object.freeze(["artifactId", "relativePath", "schemaVersion", "policyVersion", "digestSha256", "evaluatedAt", "expiresAt"]);
const portfolioArtifactKeys = Object.freeze(["artifactId", "candidateId", "relativePath", "schemaVersion", "policyVersion", "digestSha256", "bindingDigest", "certificationId", "evaluatedAt", "expiresAt", "routesDigest"]);
const certificationKeys = Object.freeze(["state", "certifiedBy", "certifiedAt", "authorityType", "authorityReference", "bindingDigest"]);
const legacyRollbackKeys = Object.freeze(["previousReleaseId"]);
const rollbackKeys = Object.freeze(["previousReleaseId", "previousRelease"]);
const predecessorKeys = Object.freeze(["releaseId", "targetEnvironment", "targetSurface", "artifact", "certification"]);
const projectionKeys = Object.freeze(["schemaVersion", "policyVersion", "asOf", "state", "comparisonSemantics", "disclosure", "freshness", "counts", "winners", "products"]);
const freshnessKeys = Object.freeze(["maxAgeHours"]);
const countKeys = Object.freeze(["sourceOffers", "publicCurrentEligibleOffers", "staleOffers"]);
const winnerKeys = Object.freeze(["overall", "ddr5", "ddr4", "laptop"]);
const productKeys = Object.freeze(["atlasProductId", "status", "lowerCurrentItemPrice", "eligibleOfferCount", "offers"]);
const offerKeys = Object.freeze(["atlasProductId", "brand", "family", "series", "displayName", "ddrGeneration", "formFactor", "totalCapacityGb", "moduleCount", "capacityPerModuleGb", "speedMtps", "casLatency", "retailerId", "retailerName", "destinationId", "destinationUrl", "itemPriceUsd", "currency", "observedAt", "ageHours", "freshness", "comparisonSemantics", "comparisonEligible", "shippingUsd", "feesUsd", "taxesIncluded"]);
const forbidden = /providerTaskId|authorizationId|evidenceId|operatorNotes|rightsProfile|actualSpend|rawPayload|recovery|secret|credential/i;
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const nonEmpty = value => typeof value === "string" && value.trim().length > 0;
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const canonicalText = value => value.replaceAll("\r\n", "\n");

export function staticPublicationArtifactDigest(contents) {
  if (typeof contents !== "string") throw new TypeError("STATIC_RELEASE_ARTIFACT_TEXT_REQUIRED");
  return createHash("sha256").update(canonicalText(contents), "utf8").digest("hex");
}

export function staticPublicationCertificationBindingDigest({ artifact, targetEnvironment, targetSurface }) {
  return createHash("sha256").update(JSON.stringify({ artifact, targetEnvironment, targetSurface }), "utf8").digest("hex");
}

export function staticPublicationRouteSetDigest(routes) {
  return createHash("sha256").update(JSON.stringify(routes), "utf8").digest("hex");
}

export function createStaticPublicationReleaseManifest({ releaseState, targetEnvironment, targetSurface = STATIC_PUBLICATION_RELEASE_SURFACE, reason, reviewedBy, createdAt, artifactRelativePath = null, artifactText = null, expiresAt = null, authorityReference = null, currentDisplayAuthorization = null, previousReleaseId = null, previousReleaseManifest = null } = {}) {
  if (!STATIC_PUBLICATION_RELEASE_STATES.includes(releaseState)) throw new TypeError("STATIC_RELEASE_STATE_INVALID");
  if (!STATIC_PUBLICATION_RELEASE_SURFACES.includes(targetSurface)) throw new TypeError("STATIC_RELEASE_SURFACE_INVALID");
  let artifact = null;
  let certification = null;
  if (releaseState === "ON") {
    if (typeof artifactText !== "string") throw new TypeError("STATIC_RELEASE_ARTIFACT_TEXT_REQUIRED");
    const projection = JSON.parse(artifactText), artifactDigest = staticPublicationArtifactDigest(artifactText);
    const portfolioScope = targetSurface === STATIC_PUBLICATION_RELEASE_PORTFOLIO_SURFACE;
    if (portfolioScope) {
      const report = validateRamPublicIntelligencePortfolio({ manifest: projection?.manifest, fileTexts: projection?.fileTexts, evaluatedAt: createdAt });
      const portfolioCertification = projection?.certification;
      if (!report.valid || portfolioCertification?.status !== "CERTIFIED" || portfolioCertification?.candidateId !== projection?.manifest?.candidateId || portfolioCertification?.artifactId !== projection?.manifest?.artifactId || portfolioCertification?.artifactBindingDigest !== projection?.manifest?.bindingDigest || portfolioCertification?.releaseAuthority !== false || portfolioCertification?.deploymentAuthority !== false || authorityReference !== portfolioCertification?.certificationId) throw new TypeError("STATIC_RELEASE_PORTFOLIO_CERTIFICATION_INVALID");
      artifact = { artifactId: projection.manifest.artifactId, candidateId: projection.manifest.candidateId, relativePath: artifactRelativePath, schemaVersion: projection.manifest.schemaVersion, policyVersion: projection.manifest.policyVersion, digestSha256: artifactDigest, bindingDigest: projection.manifest.bindingDigest, certificationId: portfolioCertification.certificationId, evaluatedAt: projection.manifest.preparedAt, expiresAt: projection.manifest.currentValidUntil, routesDigest: staticPublicationRouteSetDigest(projection.manifest.routes) };
    } else {
      artifact = { artifactId: `pubart_${artifactDigest.slice(0, 24)}`, relativePath: artifactRelativePath, schemaVersion: projection.schemaVersion, policyVersion: projection.policyVersion, digestSha256: artifactDigest, evaluatedAt: projection.asOf, expiresAt };
      const currentDisplayAuthority = currentDisplayAuthorization !== null;
      if (currentDisplayAuthority && (authorityReference !== currentDisplayAuthorization.authorizationId || !verifyCurrentDisplayArtifactAuthority({ authorization: currentDisplayAuthorization, artifactProjection: projection, evaluatedAt: createdAt }))) throw new TypeError("STATIC_RELEASE_CURRENT_DISPLAY_AUTHORITY_INVALID");
      if (!currentDisplayAuthority && /^mer_displaypubauth_/.test(authorityReference ?? "")) throw new TypeError("STATIC_RELEASE_CURRENT_DISPLAY_AUTHORITY_UNVERIFIED");
    }
    certification = {
      state: "CERTIFIED",
      certifiedBy: reviewedBy,
      certifiedAt: createdAt,
      authorityType: portfolioScope ? "RAM_INTELLIGENCE_PORTFOLIO_CERTIFICATION" : currentDisplayAuthorization !== null ? "CURRENT_DISPLAY_PUBLICATION_AUTHORIZATION" : "PUBLICATION_AUTHORIZED_ARTIFACT",
      authorityReference,
      bindingDigest: staticPublicationCertificationBindingDigest({ artifact, targetEnvironment, targetSurface })
    };
  }
  let previousRelease = null;
  if (previousReleaseManifest !== null) {
    const report = validateStaticPublicationReleaseManifest(previousReleaseManifest);
    if (!report.valid || previousReleaseManifest.releaseState !== "ON" || previousReleaseManifest.releaseId !== previousReleaseId || previousReleaseManifest.targetEnvironment !== targetEnvironment || previousReleaseManifest.targetSurface !== targetSurface) throw new TypeError("STATIC_RELEASE_PREDECESSOR_INVALID");
    previousRelease = freeze({ releaseId: previousReleaseManifest.releaseId, targetEnvironment: previousReleaseManifest.targetEnvironment, targetSurface: previousReleaseManifest.targetSurface, artifact: structuredClone(previousReleaseManifest.artifact), certification: structuredClone(previousReleaseManifest.certification) });
  }
  const rollback = { previousReleaseId, previousRelease };
  const identity = { releaseState, targetEnvironment, targetSurface, reason, reviewedBy, createdAt, artifact, certification, rollback };
  const manifest = {
    schemaVersion: STATIC_PUBLICATION_RELEASE_SCHEMA_VERSION,
    policyVersion: STATIC_PUBLICATION_RELEASE_POLICY_VERSION,
    releaseId: `pubrel_${createHash("sha256").update(JSON.stringify(identity)).digest("hex").slice(0, 24)}`,
    releaseState,
    targetEnvironment,
    targetSurface,
    reason,
    createdAt,
    reviewedBy,
    artifact,
    certification,
    rollback
  };
  const report = validateStaticPublicationReleaseManifest(manifest);
  if (!report.valid) throw new TypeError(report.errors.join(","));
  return freeze(manifest);
}

export function validateStaticPublicationReleaseManifest(manifest) {
  const errors = [];
  if (!exactKeys(manifest, manifestKeys)) return freeze({ valid: false, errors: ["STATIC_RELEASE_MANIFEST_SHAPE_INVALID"] });
  if (manifest.schemaVersion !== STATIC_PUBLICATION_RELEASE_SCHEMA_VERSION) errors.push("STATIC_RELEASE_SCHEMA_UNSUPPORTED");
  if (manifest.policyVersion !== STATIC_PUBLICATION_RELEASE_POLICY_VERSION) errors.push("STATIC_RELEASE_POLICY_INVALID");
  if (!/^pubrel_[a-f0-9]{24}$/.test(manifest.releaseId ?? "")) errors.push("STATIC_RELEASE_ID_INVALID");
  if (!STATIC_PUBLICATION_RELEASE_STATES.includes(manifest.releaseState)) errors.push("STATIC_RELEASE_STATE_INVALID");
  if (!STATIC_PUBLICATION_RELEASE_ENVIRONMENTS.includes(manifest.targetEnvironment)) errors.push("STATIC_RELEASE_ENVIRONMENT_INVALID");
  if (!STATIC_PUBLICATION_RELEASE_SURFACES.includes(manifest.targetSurface)) errors.push("STATIC_RELEASE_SURFACE_INVALID");
  if (!nonEmpty(manifest.reason) || !validTime(manifest.createdAt) || !nonEmpty(manifest.reviewedBy)) errors.push("STATIC_RELEASE_REVIEW_INVALID");
  const legacyRollback = exactKeys(manifest.rollback, legacyRollbackKeys);
  const currentRollback = exactKeys(manifest.rollback, rollbackKeys);
  if ((!legacyRollback && !currentRollback) || (manifest.rollback.previousReleaseId !== null && !/^pubrel_[a-f0-9]{24}$/.test(manifest.rollback.previousReleaseId ?? ""))) errors.push("STATIC_RELEASE_ROLLBACK_INVALID");
  if (currentRollback && manifest.rollback.previousRelease !== null) {
    const prior = manifest.rollback.previousRelease;
    if (!exactKeys(prior, predecessorKeys) || prior.releaseId !== manifest.rollback.previousReleaseId || prior.targetEnvironment !== manifest.targetEnvironment || prior.targetSurface !== manifest.targetSurface || !prior.artifact || !prior.certification) errors.push("STATIC_RELEASE_PREDECESSOR_INVALID");
  }
  if (manifest.releaseState === "OFF") {
    if (manifest.artifact !== null || manifest.certification !== null) errors.push("STATIC_RELEASE_OFF_AUTHORITY_INVALID");
  } else {
    const portfolioScope = manifest.targetSurface === STATIC_PUBLICATION_RELEASE_PORTFOLIO_SURFACE;
    if (!exactKeys(manifest.artifact, portfolioScope ? portfolioArtifactKeys : currentArtifactKeys)) errors.push("STATIC_RELEASE_ARTIFACT_BINDING_INVALID");
    else {
      if (portfolioScope ? !/^mer_ramreleaseart_[a-f0-9]{24}$/.test(manifest.artifact.artifactId ?? "") : !/^pubart_[a-f0-9]{24}$/.test(manifest.artifact.artifactId ?? "")) errors.push("STATIC_RELEASE_ARTIFACT_ID_INVALID");
      if (portfolioScope && (!/^mer_ramreleasecand_[a-f0-9]{24}$/.test(manifest.artifact.candidateId ?? "") || !/^sent_ramreleasecert_[a-f0-9]{24}$/.test(manifest.artifact.certificationId ?? "") || !/^[a-f0-9]{64}$/.test(manifest.artifact.bindingDigest ?? "") || !/^[a-f0-9]{64}$/.test(manifest.artifact.routesDigest ?? ""))) errors.push("STATIC_RELEASE_PORTFOLIO_BINDING_INVALID");
      if (!/^artifacts\/[a-z0-9][a-z0-9._-]*\.json$/.test(manifest.artifact.relativePath ?? "")) errors.push("STATIC_RELEASE_ARTIFACT_PATH_INVALID");
      const portfolioContract = [["1.0","RAM-PUBLIC-INTELLIGENCE-RELEASE-P1-1.0"],["1.1","RAM-PUBLIC-INTELLIGENCE-RELEASE-P1-1.1"]].some(([schema,policy])=>manifest.artifact.schemaVersion===schema&&manifest.artifact.policyVersion===policy);
      if (portfolioScope ? !portfolioContract : manifest.artifact.schemaVersion !== "1.0" || manifest.artifact.policyVersion !== "PUBLIC-RAM-CURRENT-RETAIL-001-1.0") errors.push("STATIC_RELEASE_ARTIFACT_SCHEMA_INVALID");
      if (!/^[a-f0-9]{64}$/.test(manifest.artifact.digestSha256 ?? "")) errors.push("STATIC_RELEASE_ARTIFACT_DIGEST_INVALID");
      if (!validTime(manifest.artifact.evaluatedAt) || !validTime(manifest.artifact.expiresAt) || Date.parse(manifest.artifact.expiresAt) <= Date.parse(manifest.artifact.evaluatedAt)) errors.push("STATIC_RELEASE_ARTIFACT_TIME_INVALID");
    }
    if (!exactKeys(manifest.certification, certificationKeys)) errors.push("STATIC_RELEASE_CERTIFICATION_INVALID");
    else {
      if (manifest.certification.state !== "CERTIFIED" || !nonEmpty(manifest.certification.certifiedBy) || !validTime(manifest.certification.certifiedAt)) errors.push("STATIC_RELEASE_CERTIFICATION_INVALID");
      if (!["PUBLICATION_AUTHORIZED_ARTIFACT","CURRENT_DISPLAY_PUBLICATION_AUTHORIZATION","RAM_INTELLIGENCE_PORTFOLIO_CERTIFICATION"].includes(manifest.certification.authorityType) || !nonEmpty(manifest.certification.authorityReference) || !/^[a-f0-9]{64}$/.test(manifest.certification.bindingDigest ?? "")) errors.push("STATIC_RELEASE_AUTHORITY_BINDING_INVALID");
      if (manifest.certification.authorityType === "CURRENT_DISPLAY_PUBLICATION_AUTHORIZATION" && !/^mer_displaypubauth_[a-f0-9]{24}$/.test(manifest.certification.authorityReference)) errors.push("STATIC_RELEASE_CURRENT_DISPLAY_AUTHORITY_INVALID");
      if (portfolioScope && (manifest.certification.authorityType !== "RAM_INTELLIGENCE_PORTFOLIO_CERTIFICATION" || manifest.certification.authorityReference !== manifest.artifact?.certificationId)) errors.push("STATIC_RELEASE_PORTFOLIO_CERTIFICATION_INVALID");
      if (manifest.artifact && manifest.certification.bindingDigest !== staticPublicationCertificationBindingDigest({ artifact: manifest.artifact, targetEnvironment: manifest.targetEnvironment, targetSurface: manifest.targetSurface })) errors.push("STATIC_RELEASE_AUTHORITY_BINDING_INVALID");
    }
  }
  if (forbidden.test(JSON.stringify(manifest))) errors.push("STATIC_RELEASE_PRIVATE_FIELD_INVALID");
  return freeze({ valid: errors.length === 0, errors: [...new Set(errors)] });
}

function validatePortfolioArtifactAt({ artifact, artifactText, evaluatedAt }) {
  const errors = [];
  if (staticPublicationArtifactDigest(artifactText) !== artifact.digestSha256) errors.push("STATIC_RELEASE_ARTIFACT_DIGEST_MISMATCH");
  let bundle = null;
  try { bundle = JSON.parse(artifactText); } catch { errors.push("STATIC_RELEASE_ARTIFACT_JSON_INVALID"); }
  if (bundle) {
    const report = validateRamPublicIntelligencePortfolio({ manifest: bundle.manifest, fileTexts: bundle.fileTexts, evaluatedAt });
    if (!report.valid) errors.push(...report.errors.map(error => `STATIC_RELEASE_${error}`));
    const cert = bundle.certification;
    if (bundle.manifest?.candidateId !== artifact.candidateId || bundle.manifest?.artifactId !== artifact.artifactId || bundle.manifest?.bindingDigest !== artifact.bindingDigest || cert?.certificationId !== artifact.certificationId || cert?.candidateId !== artifact.candidateId || cert?.artifactId !== artifact.artifactId || cert?.artifactBindingDigest !== artifact.bindingDigest || cert?.status !== "CERTIFIED") errors.push("STATIC_RELEASE_PORTFOLIO_BINDING_MISMATCH");
    if (staticPublicationRouteSetDigest(bundle.manifest?.routes) !== artifact.routesDigest || bundle.manifest?.routes?.snapshotRoutes !== 0) errors.push("STATIC_RELEASE_PORTFOLIO_ROUTE_MISMATCH");
    if (report.currentMode !== "FRESH" && report.currentMode !== "EXPIRED_DURABLE_ONLY") errors.push("STATIC_RELEASE_PORTFOLIO_CURRENT_STALE");
  }
  return { errors, bundle, currentMode: bundle ? validateRamPublicIntelligencePortfolio({ manifest: bundle.manifest, fileTexts: bundle.fileTexts, evaluatedAt }).currentMode : null };
}

function validateArtifactAt({ artifact, artifactText, evaluatedAt }) {
  const errors = [];
  if (staticPublicationArtifactDigest(artifactText) !== artifact.digestSha256) errors.push("STATIC_RELEASE_ARTIFACT_DIGEST_MISMATCH");
  let projection = null;
  try { projection = JSON.parse(artifactText); } catch { errors.push("STATIC_RELEASE_ARTIFACT_JSON_INVALID"); }
  if (projection) {
    const report = validatePublicCurrentRetailProjection(projection);
    if (!report.valid) errors.push(...report.errors.map(error => `STATIC_RELEASE_${error}`));
    if (forbidden.test(JSON.stringify(projection))) errors.push("STATIC_RELEASE_PRIVATE_FIELD_INVALID");
    if (!exactKeys(projection, projectionKeys) || !exactKeys(projection.freshness, freshnessKeys) || !exactKeys(projection.counts, countKeys) || !exactKeys(projection.winners, winnerKeys)) errors.push("STATIC_RELEASE_PUBLIC_ARTIFACT_SHAPE_INVALID");
    const projectedOffers = [];
    for (const product of projection.products ?? []) {
      if (!exactKeys(product, productKeys) || (product.lowerCurrentItemPrice !== null && !exactKeys(product.lowerCurrentItemPrice, offerKeys))) errors.push("STATIC_RELEASE_PUBLIC_ARTIFACT_SHAPE_INVALID");
      for (const offer of product.offers ?? []) { if (!exactKeys(offer, offerKeys)) errors.push("STATIC_RELEASE_PUBLIC_ARTIFACT_SHAPE_INVALID"); projectedOffers.push(offer); }
    }
    for (const winner of Object.values(projection.winners ?? {})) if (winner !== null && !exactKeys(winner, offerKeys)) errors.push("STATIC_RELEASE_PUBLIC_ARTIFACT_SHAPE_INVALID");
    if ((projection.state === "AVAILABLE") !== (projectedOffers.length > 0) || projection.counts?.publicCurrentEligibleOffers !== projectedOffers.length) errors.push("STATIC_RELEASE_PUBLIC_ARTIFACT_STATE_INVALID");
    if (projection.schemaVersion !== artifact.schemaVersion || projection.policyVersion !== artifact.policyVersion || projection.asOf !== artifact.evaluatedAt) errors.push("STATIC_RELEASE_ARTIFACT_BINDING_MISMATCH");
    for (const product of projection.products ?? []) for (const offer of product.offers ?? []) {
      const ageHours = (Date.parse(evaluatedAt) - Date.parse(offer.observedAt)) / 3_600_000;
      if (!Number.isFinite(ageHours) || ageHours < 0 || ageHours > 36) errors.push("STATIC_RELEASE_ARTIFACT_STALE");
    }
  }
  return { errors, projection };
}

export function evaluateStaticPublicationRelease({ manifest = null, artifactText = null, targetEnvironment, evaluatedAt } = {}) {
  const off = reason => freeze({ releaseState: "OFF", exposed: false, reason, releaseId: manifest?.releaseId ?? null, artifactId: manifest?.artifact?.artifactId ?? null, artifactDigest: manifest?.artifact?.digestSha256 ?? null, targetEnvironment: targetEnvironment ?? null, targetSurface: manifest?.targetSurface ?? STATIC_PUBLICATION_RELEASE_SURFACE, projection: null, portfolio: null });
  if (manifest === null) return off("STATIC_RELEASE_MANIFEST_ABSENT");
  const report = validateStaticPublicationReleaseManifest(manifest);
  if (!report.valid) return off(report.errors[0]);
  if (manifest.releaseState === "OFF") return off("STATIC_RELEASE_EXPLICITLY_OFF");
  if (!STATIC_PUBLICATION_RELEASE_ENVIRONMENTS.includes(targetEnvironment)) return off("STATIC_RELEASE_BUILD_ENVIRONMENT_INVALID");
  if (manifest.targetEnvironment !== targetEnvironment) return off("STATIC_RELEASE_ENVIRONMENT_MISMATCH");
  if (!validTime(evaluatedAt) || Date.parse(evaluatedAt) < Date.parse(manifest.artifact.evaluatedAt)) return off("STATIC_RELEASE_CERTIFICATION_EXPIRED");
  const splitPortfolio = manifest.targetSurface === STATIC_PUBLICATION_RELEASE_PORTFOLIO_SURFACE && manifest.artifact.schemaVersion === "1.1";
  if (!splitPortfolio && Date.parse(evaluatedAt) > Date.parse(manifest.artifact.expiresAt)) return off("STATIC_RELEASE_CERTIFICATION_EXPIRED");
  if (typeof artifactText !== "string") return off("STATIC_RELEASE_ARTIFACT_MISSING");
  if (manifest.targetSurface === STATIC_PUBLICATION_RELEASE_PORTFOLIO_SURFACE) {
    const artifact = validatePortfolioArtifactAt({ artifact: manifest.artifact, artifactText, evaluatedAt });
    if (artifact.errors.length) return off(artifact.errors[0]);
    return freeze({ releaseState: "ON", exposed: true, reason: artifact.currentMode === "EXPIRED_DURABLE_ONLY" ? "STATIC_RELEASE_DURABLE_PORTFOLIO_EXPOSED_CURRENT_EXPIRED" : "STATIC_RELEASE_CERTIFIED_PORTFOLIO_EXPOSED", releaseId: manifest.releaseId, artifactId: manifest.artifact.artifactId, artifactDigest: manifest.artifact.digestSha256, targetEnvironment, targetSurface: manifest.targetSurface, currentMode: artifact.currentMode, projection: null, portfolio: artifact.bundle });
  }
  const artifact = validateArtifactAt({ artifact: manifest.artifact, artifactText, evaluatedAt });
  if (artifact.errors.length) return off(artifact.errors[0]);
  return freeze({ releaseState: "ON", exposed: true, reason: "STATIC_RELEASE_CERTIFIED_ARTIFACT_EXPOSED", releaseId: manifest.releaseId, artifactId: manifest.artifact.artifactId, artifactDigest: manifest.artifact.digestSha256, targetEnvironment, targetSurface: STATIC_PUBLICATION_RELEASE_SURFACE, projection: artifact.projection, portfolio: null });
}
