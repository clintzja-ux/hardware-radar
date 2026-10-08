import {
  RETAILER_DESTINATION_BINDING_METHOD,
  RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE,
  RETAILER_DESTINATION_TYPE,
  createRetailerDestination
} from "./RetailerDestination.js";

export const ATLAS_BATCH_NEWEGG_DESTINATION_BINDING_POLICY_VERSION = "ATLAS-RAM-COVERAGE-EXPANSION-BATCH-A-NEWEGG-DESTINATION-P1-1.0";

const clone = structuredClone;
const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};

function ordinaryNeweggDestination(evidence) {
  const tracking = new URL(evidence.sourceUrl);
  const rawDestination = tracking.searchParams.get("murl");
  if (!rawDestination) throw new Error("NEWEGG_ORDINARY_DESTINATION_MISSING");
  const destination = new URL(rawDestination);
  if (destination.protocol !== "https:" || destination.hostname.toLowerCase().replace(/^www\./, "") !== "newegg.com") throw new Error("NEWEGG_ORDINARY_DESTINATION_INVALID");
  const item = destination.searchParams.get("item");
  const pathItem = destination.pathname.match(/\/p\/([^/?#]+)/i)?.[1] ?? null;
  if (item !== evidence.sku && pathItem !== evidence.sku) throw new Error("NEWEGG_LISTING_IDENTITY_MISMATCH");
  destination.search = "";
  destination.hash = "";
  return `https://newegg.com${destination.pathname.replace(/\/$/, "")}`;
}

function collision(existingDestinations, candidate) {
  const samePair = existingDestinations.find(value => value.atlasProductId === candidate.atlasProductId && value.retailerId === candidate.retailerId && value.status === "ACTIVE");
  const sameListing = existingDestinations.find(value => value.retailerId === candidate.retailerId && value.retailerListingId === candidate.retailerListingId && value.atlasProductId !== candidate.atlasProductId);
  const sameUrl = existingDestinations.find(value => value.retailerId === candidate.retailerId && value.destinationUrl === candidate.destinationUrl && value.atlasProductId !== candidate.atlasProductId);
  return samePair ?? sameListing ?? sameUrl ?? null;
}

export function prepareAtlasBatchNeweggDestinations({
  admittedProducts,
  atlasProducts,
  existingDestinations,
  admissionArtifactId,
  reviewedBy,
  reviewedAt
} = {}) {
  if (!Array.isArray(admittedProducts) || !Array.isArray(atlasProducts) || !Array.isArray(existingDestinations) || !admissionArtifactId || !reviewedBy || !Number.isFinite(Date.parse(reviewedAt))) throw new TypeError("ATLAS_BATCH_NEWEGG_DESTINATION_INPUT_INVALID");
  const atlasById = new Map(atlasProducts.map(product => [product.identity?.atlasProductId, product]));
  const outcomes = [];

  for (const admitted of admittedProducts) {
    const evidences = Array.isArray(admitted.retainedNeweggEvidence) ? admitted.retainedNeweggEvidence : admitted.retainedNeweggEvidence ? [admitted.retainedNeweggEvidence] : [];
    let qualification = "DESTINATION_READY", blocker = null, destination = null;
    const product = atlasById.get(admitted.atlasProductId);
    if (!product || product.identity?.manufacturerPartNumber !== admitted.verifiedMpn || product.governance?.lifecycleStatus !== "ACTIVE" || product.governance?.publicationStatus !== "READY") {
      qualification = "IDENTITY_REVIEW_REQUIRED";
      blocker = "ATLAS_EXACT_MPN_OR_LIFECYCLE_BINDING_INVALID";
    } else if (evidences.length > 1) {
      qualification = "MULTI_ITEM_REVIEW_REQUIRED";
      blocker = "MULTIPLE_RETAINED_NEWEGG_ITEMS";
    } else if (evidences.length !== 1 || evidences[0].source !== "RETAINED_RAKUTEN_NEWEGG_PRODUCT_CATALOG" || !evidences[0].sku || !evidences[0].productId) {
      qualification = "IDENTITY_REVIEW_REQUIRED";
      blocker = "RETAINED_NEWEGG_LISTING_IDENTITY_INVALID";
    } else {
      try {
        const evidence = evidences[0];
        destination = createRetailerDestination({
          atlasProductId: admitted.atlasProductId,
          retailerId: "RETAILER-0004",
          marketplace: "newegg.com",
          destinationType: RETAILER_DESTINATION_TYPE,
          destinationUrl: ordinaryNeweggDestination(evidence),
          retailerListingId: evidence.sku,
          binding: {
            manufacturerPartNumber: admitted.verifiedMpn,
            method: RETAILER_DESTINATION_BINDING_METHOD,
            scope: "EXACT_STANDALONE_PRODUCT",
            evidenceReferences: [`artifact:${admissionArtifactId}:retained-newegg:${evidence.productId}:${evidence.sku}`]
          },
          provenance: { sourceType: RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE },
          reviewedBy,
          reviewedAt,
          status: "ACTIVE",
          supersedesDestinationId: null,
          retirementReason: null,
          createdAt: reviewedAt,
          createdBy: reviewedBy
        });
        if (collision(existingDestinations, destination)) {
          qualification = "DUPLICATE_CONFLICT";
          blocker = "CANONICAL_DESTINATION_COLLISION";
          destination = null;
        }
      } catch (error) {
        qualification = error.message === "NEWEGG_LISTING_IDENTITY_MISMATCH" ? "IDENTITY_REVIEW_REQUIRED" : "ACTIONABILITY_REVIEW_REQUIRED";
        blocker = error.message;
        destination = null;
      }
    }
    outcomes.push({
      atlasProductId: admitted.atlasProductId,
      brand: admitted.brand,
      manufacturerPartNumber: admitted.verifiedMpn,
      retailerListingId: evidences.length === 1 ? evidences[0].sku ?? null : null,
      providerProductId: evidences.length === 1 ? evidences[0].productId ?? null : null,
      qualification,
      blocker,
      destination: destination ? clone(destination) : null
    });
  }
  const counts = Object.fromEntries(["DESTINATION_READY", "IDENTITY_REVIEW_REQUIRED", "MULTI_ITEM_REVIEW_REQUIRED", "ACTIONABILITY_REVIEW_REQUIRED", "DUPLICATE_CONFLICT"].map(key => [key, outcomes.filter(value => value.qualification === key).length]));
  return freeze({ policyVersion: ATLAS_BATCH_NEWEGG_DESTINATION_BINDING_POLICY_VERSION, counts, outcomes });
}
