import crypto from "node:crypto";
import { RIGHTS_STATES } from "../rights/SourceRightsPolicy.js";

export const PRODUCTS_IDENTITY_READINESS_POLICY_VERSION = "MERCURY-PRODUCTS-IDENTITY-READINESS-1.0";
export const PRODUCTS_IDENTITY_READINESS_STATES = Object.freeze({
  READY_FOR_DISCOVERY: "READY_FOR_DISCOVERY",
  ALREADY_RESOLVED: "ALREADY_RESOLVED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  RIGHTS_BLOCKED: "RIGHTS_BLOCKED",
  UNSUPPORTED: "UNSUPPORTED"
});

const SUPPORTED = new Set(["DATAFORSEO_GOOGLE_SHOPPING", "DATAFORSEO_AMAZON"]);
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const reference = (kind, value) => value ? { kind, id: value.outcomeId ?? value.assessmentId ?? value.bindingDigest ?? null, digest: value.bindingDigest ?? value.resultDigest ?? digest(value), state: value.state ?? value.status ?? null, governedIdentity: value.governedAsin ? { asin: value.governedAsin } : null } : null;

export class ProductsIdentityDiscoveryReadinessOwner {
  constructor({ productRepository, rightsRegistry, googleIdentityResolver, amazonArtifactRepository, amazonActionRepository } = {}) {
    if (!productRepository?.getById || !rightsRegistry?.require || !googleIdentityResolver?.resolve || !amazonArtifactRepository?.getAll || !amazonActionRepository?.getEffectiveOutcomeForArtifact) throw new TypeError("PRODUCTS_IDENTITY_READINESS_DEPENDENCIES_REQUIRED");
    Object.assign(this, { productRepository, rightsRegistry, googleIdentityResolver, amazonArtifactRepository, amazonActionRepository });
  }

  async assess({ atlasProductId, sourceId, asOf } = {}) {
    if (typeof atlasProductId !== "string" || !atlasProductId || typeof sourceId !== "string" || !sourceId || !Number.isFinite(Date.parse(asOf))) throw new Error("PRODUCTS_IDENTITY_READINESS_INPUT_INVALID");
    const product = await this.productRepository.getById(atlasProductId);
    if (!product || !SUPPORTED.has(sourceId)) return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.UNSUPPORTED, reasons: [!product ? "ATLAS_PRODUCT_UNSUPPORTED" : "SOURCE_UNSUPPORTED"], rights: null, identityReferences: [] });
    let rights;
    try { rights = this.rightsRegistry.require(sourceId); } catch { return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.RIGHTS_BLOCKED, reasons: ["SOURCE_RIGHTS_UNKNOWN"], rights: null, identityReferences: [] }); }
    if (rights.acquisition?.api !== RIGHTS_STATES.ALLOWED || rights.retention?.historical !== RIGHTS_STATES.ALLOWED || rights.retention?.durableAuditMetadata !== RIGHTS_STATES.ALLOWED) return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.RIGHTS_BLOCKED, reasons: ["PRODUCTS_ACQUISITION_OR_RETENTION_RIGHTS_BLOCKED"], rights, identityReferences: [] });
    if (sourceId === "DATAFORSEO_GOOGLE_SHOPPING") {
      const identity = await this.googleIdentityResolver.resolve(atlasProductId), ref = reference("GOOGLE_GOVERNED_PROVIDER_IDENTITY", identity);
      if (identity.status === "REUSABLE") return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.ALREADY_RESOLVED, reasons: ["REUSABLE_GOVERNED_GOOGLE_IDENTITY"], rights, identityReferences: [ref] });
      if (identity.status === "REVIEW_REQUIRED") return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.REVIEW_REQUIRED, reasons: [identity.reason ?? "GOOGLE_IDENTITY_REVIEW_REQUIRED"], rights, identityReferences: [ref] });
      if (identity.status !== "ABSENT") throw new Error("GOOGLE_IDENTITY_READINESS_STATE_INVALID");
      return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.READY_FOR_DISCOVERY, reasons: ["NO_REUSABLE_GOVERNED_GOOGLE_IDENTITY"], rights, identityReferences: [] });
    }
    const artifacts = (await this.amazonArtifactRepository.getAll()).filter(item => item.atlasProductId === atlasProductId);
    const outcomes = [];
    for (const artifact of artifacts) { const outcome = await this.amazonActionRepository.getEffectiveOutcomeForArtifact(artifact.acceptanceArtifactId); if (outcome) outcomes.push(outcome); }
    const refs = outcomes.map(item => reference("AMAZON_EFFECTIVE_PRODUCTS_IDENTITY", item));
    const resolved = outcomes.filter(item => item.state === "STRONG_UNIQUE_ASIN" || item.identityResolution === "STRONG_OPERATOR_CONFIRMED_ASIN");
    if (resolved.length > 1 && new Set(resolved.map(item => item.governedAsin)).size > 1) return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.REVIEW_REQUIRED, reasons: ["CONFLICTING_GOVERNED_AMAZON_IDENTITIES"], rights, identityReferences: refs });
    if (resolved.length) return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.ALREADY_RESOLVED, reasons: [resolved.some(item => item.identityResolution === "STRONG_OPERATOR_CONFIRMED_ASIN") ? "OPERATOR_CONFIRMED_AMAZON_IDENTITY" : "STRONG_UNIQUE_AMAZON_IDENTITY"], rights, identityReferences: refs });
    const reviewable = outcomes.find(item => item.state === "INSUFFICIENT_ASIN_EVIDENCE" && (item.sellersAuthorizationEligible === false || item.nextPermittedAction === "STOP"));
    if (reviewable) return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.REVIEW_REQUIRED, reasons: ["H052_OPERATOR_REVIEW_REQUIRED"], rights, identityReferences: refs });
    return this.#result({ atlasProductId, sourceId, asOf, state: PRODUCTS_IDENTITY_READINESS_STATES.READY_FOR_DISCOVERY, reasons: [outcomes.length ? "NO_REUSABLE_EFFECTIVE_AMAZON_IDENTITY" : "NO_GOVERNED_AMAZON_PRODUCTS_IDENTITY"], rights, identityReferences: refs });
  }

  #result({ atlasProductId, sourceId, asOf, state, reasons, rights, identityReferences }) {
    const sourceRightsDigest = rights ? digest(rights) : null;
    const identityStateDigest = digest(identityReferences);
    const binding = { policyVersion: PRODUCTS_IDENTITY_READINESS_POLICY_VERSION, atlasProductId, sourceId, state, reasons, identityReferences, sourceRightsDigest, identityStateDigest, asOf };
    return freeze({ ...binding, readinessState: state, currentGovernedIdentityReferences: identityReferences, readinessBindingDigest: digest(binding), assessedAt: asOf, providerCallPerformed: false });
  }
}

