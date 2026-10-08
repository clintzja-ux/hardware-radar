import crypto from "node:crypto";
import {
  RETAILER_DESTINATION_BINDING_METHOD,
  RETAILER_DESTINATION_SOURCE_TYPE,
  RETAILER_DESTINATION_TYPE,
  createRetailerDestination
} from "./RetailerDestination.js";

export const AMAZON_DESTINATION_LEGACY_PROGRESSION_POLICY_VERSION = "MERCURY-AMAZON-DESTINATION-PROGRESSION-1.0";
export const AMAZON_DESTINATION_PROGRESSION_POLICY_VERSION = "MERCURY-AMAZON-DESTINATION-PROGRESSION-1.1";
export const AMAZON_RETAILER_ID = "RETAILER-0001";
export const AMAZON_MARKETPLACE = "amazon.com";
export const AMAZON_DESTINATION_REVIEW_CONFIRMATION = "RECORD-AMAZON-DESTINATION-REVIEW";
export const AMAZON_DESTINATION_PERSIST_CONFIRMATION = "PERSIST-APPROVED-AMAZON-DESTINATION";
export const AMAZON_DESTINATION_APPROVAL_ATTESTATION = "I-ATTEST-EXACT-AMAZON-PRODUCT-PAGE-REVIEW";
export const AMAZON_DESTINATION_REJECTION_REASONS = Object.freeze(["WRONG_PRODUCT", "VARIANT_CONFLICT", "NON_ACTIONABLE_PAGE", "REDIRECT_OR_TRACKING_CONCERN", "PAGE_UNAVAILABLE", "OTHER_REVIEW_REQUIRED"]);

const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { const copy = structuredClone(value); const deep = item => { if (item && typeof item === "object" && !Object.isFrozen(item)) { Object.freeze(item); for (const child of Object.values(item)) deep(child); } return item; }; return deep(copy); };
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));

export function canonicalAmazonProductUrl(asin) {
  if (!/^[A-Z0-9]{10}$/.test(asin ?? "")) throw new Error("AMAZON_DESTINATION_ASIN_INVALID");
  return `https://amazon.com/dp/${asin}`;
}

function relevantDestinationState(destinations, { atlasProductId, asin, candidateUrl }) {
  return [...destinations]
    .filter(value => value.atlasProductId === atlasProductId || (value.retailerId === AMAZON_RETAILER_ID && (value.retailerListingId === asin || value.destinationUrl === candidateUrl)))
    .map(value => ({ destinationId: value.destinationId, atlasProductId: value.atlasProductId, retailerId: value.retailerId, marketplace: value.marketplace, retailerListingId: value.retailerListingId, destinationUrl: value.destinationUrl, materialFingerprint: value.materialFingerprint, status: value.status, supersedesDestinationId: value.supersedesDestinationId ?? null }))
    .sort((a, b) => a.destinationId.localeCompare(b.destinationId));
}

function collisions(destinations, { atlasProductId, asin, candidateUrl }) {
  const active = destinations.filter(value => value.status === "ACTIVE" && value.retailerId === AMAZON_RETAILER_ID);
  const product = active.find(value => value.atlasProductId === atlasProductId) ?? null;
  const listing = active.find(value => value.retailerListingId === asin) ?? null;
  const url = active.find(value => value.destinationUrl === candidateUrl) ?? null;
  const crossProduct = [listing, url].find(value => value && value.atlasProductId !== atlasProductId) ?? null;
  return freeze({ productDestinationId: product?.destinationId ?? null, listingDestinationId: listing?.destinationId ?? null, urlDestinationId: url?.destinationId ?? null, crossProductDestinationId: crossProduct?.destinationId ?? null });
}

export class AmazonDestinationProgressionService {
  constructor({ productRepository, retailerRepository, identityRepository, resultRepository, rightsRegistry, destinationRepository } = {}) {
    if (!productRepository?.getById || !retailerRepository?.getById || !identityRepository?.getEffectiveOutcomeByAssessmentId || !resultRepository?.getCanonicalResultById || !rightsRegistry?.verifyLineage || !destinationRepository?.getAll) throw new TypeError("AMAZON_DESTINATION_PROGRESSION_DEPENDENCIES_REQUIRED");
    this.products = productRepository; this.retailers = retailerRepository; this.identities = identityRepository; this.results = resultRepository; this.rights = rightsRegistry; this.destinations = destinationRepository;
  }

  async prepare({ atlasProductId, assessmentId } = {}) {
    if (!atlasProductId || !assessmentId) throw new TypeError("AMAZON_DESTINATION_PREPARE_INPUT_REQUIRED");
    const [product, retailer, identity, destinations] = await Promise.all([this.products.getById(atlasProductId), this.retailers.getById(AMAZON_RETAILER_ID), this.identities.getEffectiveOutcomeByAssessmentId(assessmentId), this.destinations.getAll()]);
    if (!product || product.identity?.atlasProductId !== atlasProductId) throw new Error("AMAZON_DESTINATION_ATLAS_PRODUCT_MISSING");
    if (product.governance?.lifecycleStatus !== "ACTIVE" || product.governance?.publicationStatus !== "READY") throw new Error("AMAZON_DESTINATION_ATLAS_PRODUCT_NOT_ACTIVE_READY");
    if (!retailer || retailer.name !== "Amazon" || retailer.status !== "active") throw new Error("AMAZON_DESTINATION_RETAILER_INVALID");
    if (!identity || identity.assessmentId !== assessmentId || identity.atlasProductId !== atlasProductId || identity.state !== "STRONG_UNIQUE_ASIN") throw new Error("AMAZON_DESTINATION_IDENTITY_NOT_STRONG_UNIQUE");
    const result = await this.results.getCanonicalResultById(identity.canonicalResultId);
    if (!result || result.sourceId !== "DATAFORSEO_AMAZON" || result.operation !== "AMAZON_PRODUCTS" || result.atlasProductId !== atlasProductId || result.resultDigest !== identity.resultDigest) throw new Error("AMAZON_DESTINATION_RESULT_LINEAGE_INVALID");
    const rights = this.rights.verifyLineage(result.sourceId, result.sourceRightsProfileDigest);
    if (!rights.verified) throw new Error("AMAZON_DESTINATION_RIGHTS_LINEAGE_INVALID");
    const candidateUrl = canonicalAmazonProductUrl(identity.governedAsin), collision = collisions(destinations, { atlasProductId, asin: identity.governedAsin, candidateUrl });
    if (collision.crossProductDestinationId) throw new Error("AMAZON_DESTINATION_CROSS_PRODUCT_COLLISION");
    const equivalent = collision.productDestinationId && (collision.listingDestinationId === collision.productDestinationId || collision.urlDestinationId === collision.productDestinationId);
    const relevantState = relevantDestinationState(destinations, { atlasProductId, asin: identity.governedAsin, candidateUrl });
    const binding = { policyVersion: AMAZON_DESTINATION_PROGRESSION_POLICY_VERSION, atlasProductId, manufacturerPartNumber: product.identity.manufacturerPartNumber, atlasLifecycleStatus: product.governance.lifecycleStatus, atlasPublicationStatus: product.governance.publicationStatus, assessmentId, identityState: identity.state, asin: identity.governedAsin, outcomeId: identity.outcomeId, canonicalResultId: result.canonicalResultId, resultDigest: result.resultDigest, providerTaskId: result.providerTaskId, sourceRightsProfileDigest: result.sourceRightsProfileDigest, retailerId: AMAZON_RETAILER_ID, marketplace: AMAZON_MARKETPLACE, candidateUrl, destinationBindingScope: "CANDIDATE_RELEVANT", destinationStateDigest: digest(relevantState), collision };
    const bindingDigest = digest(binding), preparationId = `mer_amzdestprep_${bindingDigest.slice(0, 24)}`;
    return freeze({ schemaVersion: "1.0", preparationType: "AMAZON_DESTINATION_OPERATOR_REVIEW", preparationId, ...binding, bindingDigest, qualification: equivalent ? "ALREADY_BOUND" : collision.productDestinationId ? "COLLISION_BLOCKED" : "ACTIONABILITY_REVIEW_REQUIRED", reviewRequired: !equivalent, requiredReviewMethod: RETAILER_DESTINATION_BINDING_METHOD, networkOperation: "NONE", canonicalDestinationCreated: false, sellerInferred: false, affiliateRequired: false, currentAuthority: false, historicalAuthority: false, publicationAuthority: false, actualSpendUsd: 0 });
  }

  async revalidatePreparation(preparation) {
    if (!preparation || preparation.schemaVersion !== "1.0" || preparation.preparationType !== "AMAZON_DESTINATION_OPERATOR_REVIEW" || !preparation.preparationId || !preparation.bindingDigest) throw new Error("AMAZON_DESTINATION_PREPARATION_INVALID");
    const legacy = preparation.policyVersion === AMAZON_DESTINATION_LEGACY_PROGRESSION_POLICY_VERSION;
    const currentPolicy = preparation.policyVersion === AMAZON_DESTINATION_PROGRESSION_POLICY_VERSION;
    if (!legacy && !currentPolicy) throw new Error("AMAZON_DESTINATION_PREPARATION_POLICY_UNSUPPORTED");
    const common = { policyVersion: preparation.policyVersion, atlasProductId: preparation.atlasProductId, manufacturerPartNumber: preparation.manufacturerPartNumber };
    const binding = legacy
      ? { ...common, assessmentId: preparation.assessmentId, identityState: preparation.identityState, asin: preparation.asin, outcomeId: preparation.outcomeId, canonicalResultId: preparation.canonicalResultId, resultDigest: preparation.resultDigest, providerTaskId: preparation.providerTaskId, sourceRightsProfileDigest: preparation.sourceRightsProfileDigest, retailerId: preparation.retailerId, marketplace: preparation.marketplace, candidateUrl: preparation.candidateUrl, destinationStateDigest: preparation.destinationStateDigest, collision: preparation.collision }
      : { ...common, atlasLifecycleStatus: preparation.atlasLifecycleStatus, atlasPublicationStatus: preparation.atlasPublicationStatus, assessmentId: preparation.assessmentId, identityState: preparation.identityState, asin: preparation.asin, outcomeId: preparation.outcomeId, canonicalResultId: preparation.canonicalResultId, resultDigest: preparation.resultDigest, providerTaskId: preparation.providerTaskId, sourceRightsProfileDigest: preparation.sourceRightsProfileDigest, retailerId: preparation.retailerId, marketplace: preparation.marketplace, candidateUrl: preparation.candidateUrl, destinationBindingScope: preparation.destinationBindingScope, destinationStateDigest: preparation.destinationStateDigest, collision: preparation.collision };
    const expectedDigest = digest(binding);
    if (expectedDigest !== preparation.bindingDigest || preparation.preparationId !== `mer_amzdestprep_${expectedDigest.slice(0, 24)}` || preparation.qualification !== "ACTIONABILITY_REVIEW_REQUIRED" || preparation.reviewRequired !== true || preparation.requiredReviewMethod !== RETAILER_DESTINATION_BINDING_METHOD) throw new Error("AMAZON_DESTINATION_PREPARATION_BINDING_INVALID");
    const current = await this.prepare({ atlasProductId: preparation.atlasProductId, assessmentId: preparation.assessmentId });
    const fields = ["atlasProductId", "manufacturerPartNumber", "assessmentId", "identityState", "asin", "outcomeId", "canonicalResultId", "resultDigest", "providerTaskId", "sourceRightsProfileDigest", "retailerId", "marketplace", "candidateUrl"];
    const unchanged = fields.every(field => preparation[field] === current[field]);
    const nowBound = unchanged && current.qualification === "ALREADY_BOUND" && current.collision.productDestinationId && current.collision.productDestinationId === current.collision.listingDestinationId && current.collision.productDestinationId === current.collision.urlDestinationId;
    if (currentPolicy) {
      if (nowBound) return freeze({ status: "ALREADY_BOUND", preparation, current });
      if (current.bindingDigest !== preparation.bindingDigest) throw new Error("AMAZON_DESTINATION_PREPARATION_STALE");
      return freeze({ status: "CURRENT", preparation, current });
    }
    if (nowBound) return freeze({ status: "ALREADY_BOUND", preparation, current });
    const noPriorRelevantState = Object.values(preparation.collision ?? {}).every(value => value === null) && current.destinationStateDigest === digest([]) && Object.values(current.collision ?? {}).every(value => value === null);
    if (!unchanged || !noPriorRelevantState || current.qualification !== "ACTIONABILITY_REVIEW_REQUIRED") throw new Error("AMAZON_DESTINATION_PREPARATION_STALE");
    return freeze({ status: "LEGACY_COMPATIBLE", preparation, current });
  }

  createReview({ preparation, decision, reviewedBy, reviewedAt, approvalAttestation = null, rejectionReason = null, approvedPublicPageUrl = null } = {}) {
    if (!preparation?.bindingDigest || !["APPROVE", "REJECT"].includes(decision) || !reviewedBy || !validTime(reviewedAt)) throw new TypeError("AMAZON_DESTINATION_REVIEW_INVALID");
    if (decision === "APPROVE" && approvalAttestation !== AMAZON_DESTINATION_APPROVAL_ATTESTATION) throw new Error("AMAZON_DESTINATION_APPROVAL_ATTESTATION_REQUIRED");
    if (decision === "REJECT" && !AMAZON_DESTINATION_REJECTION_REASONS.includes(rejectionReason)) throw new Error("AMAZON_DESTINATION_REJECTION_REASON_INVALID");
    if (decision === "APPROVE" && approvedPublicPageUrl !== preparation.candidateUrl) throw new Error("AMAZON_DESTINATION_REVIEW_URL_MISMATCH");
    const material = { preparationId: preparation.preparationId, preparationBindingDigest: preparation.bindingDigest, atlasProductId: preparation.atlasProductId, asin: preparation.asin, candidateUrl: preparation.candidateUrl, decision, reviewedBy, reviewedAt, reviewMethod: RETAILER_DESTINATION_BINDING_METHOD, approvalAttestation: decision === "APPROVE" ? approvalAttestation : null, rejectionReason: decision === "REJECT" ? rejectionReason : null, approvedPublicPageUrl: decision === "APPROVE" ? approvedPublicPageUrl : null };
    const reviewDigest = digest(material);
    return freeze({ schemaVersion: "1.0", policyVersion: AMAZON_DESTINATION_PROGRESSION_POLICY_VERSION, reviewId: `mer_amzdestreview_${reviewDigest.slice(0, 24)}`, ...material, reviewDigest, persistenceAuthorized: decision === "APPROVE", networkOperation: "NONE", marketAuthority: false, publicationAuthority: false });
  }

  async execute({ preparation, review } = {}) {
    if (review?.decision !== "APPROVE" || review.preparationId !== preparation?.preparationId || review.preparationBindingDigest !== preparation?.bindingDigest || review.approvedPublicPageUrl !== preparation.candidateUrl) throw new Error("AMAZON_DESTINATION_REVIEW_NOT_APPROVED");
    const { current } = await this.revalidatePreparation(preparation);
    if (current.qualification === "ALREADY_BOUND") return freeze({ status: "ALREADY_BOUND", destinationId: current.collision.productDestinationId });
    if (current.qualification !== "ACTIONABILITY_REVIEW_REQUIRED") throw new Error("AMAZON_DESTINATION_NOT_PERSISTABLE");
    const destination = createRetailerDestination({ atlasProductId: preparation.atlasProductId, retailerId: AMAZON_RETAILER_ID, marketplace: AMAZON_MARKETPLACE, destinationType: RETAILER_DESTINATION_TYPE, destinationUrl: preparation.candidateUrl, retailerListingId: preparation.asin, binding: { manufacturerPartNumber: preparation.manufacturerPartNumber, method: RETAILER_DESTINATION_BINDING_METHOD, scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: [`assessment:${preparation.assessmentId}`, `provider-result:${preparation.canonicalResultId}`, `operator-review:${review.reviewId}`] }, provenance: { sourceType: RETAILER_DESTINATION_SOURCE_TYPE }, reviewedBy: review.reviewedBy, reviewedAt: review.reviewedAt, status: "ACTIVE", supersedesDestinationId: null, retirementReason: null, createdAt: review.reviewedAt, createdBy: review.reviewedBy });
    const retained = await this.destinations.retain(destination);
    return freeze({ status: retained.status === "DUPLICATE" ? "ALREADY_BOUND" : "DESTINATION_CREATED", destinationId: destination.destinationId, destination });
  }
}
