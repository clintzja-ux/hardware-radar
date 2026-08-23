import { validateRetailerRepository } from "../../atlas/RetailerValidator.js";
import {
  canonicalizeMerchantDomain,
  resolveDataForSeoMerchantIdentity
} from "../market/dataforseo/DataForSeoMerchantIdentity.js";

function normalizedName(value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError("ATLAS_RETAILER_NAME_INVALID");
  return value.trim().toLowerCase();
}

export function resolveAtlasBackedMerchantRegistration({ decision, record, retailers } = {}) {
  if (!decision || decision.subjectType !== "MERCHANT_IDENTITY") throw new TypeError("MERCHANT_REVIEW_DECISION_REQUIRED");
  if (!record || typeof record !== "object") throw new TypeError("RETAINED_MERCHANT_EVIDENCE_REQUIRED");
  if (!Array.isArray(retailers)) throw new TypeError("ATLAS_RETAILERS_REQUIRED");

  const repositoryReport = validateRetailerRepository(retailers);
  if (!repositoryReport.valid) throw new Error("ATLAS_RETAILER_REPOSITORY_INVALID");

  const retailer = retailers.find((candidate) => candidate.id === decision.merchantId);
  if (!retailer) throw new Error("ATLAS_RETAILER_NOT_FOUND");
  if (retailer.status !== "active" || decision.merchantActive !== true) throw new Error("ATLAS_RETAILER_NOT_ACTIVE");
  if (canonicalizeMerchantDomain(retailer.websiteUrl) !== canonicalizeMerchantDomain(decision.canonicalDomain)) throw new Error("ATLAS_RETAILER_DOMAIN_MISMATCH");
  if (normalizedName(retailer.name) !== normalizedName(decision.canonicalMerchantName)) throw new Error("ATLAS_RETAILER_NAME_MISMATCH");

  const retainedMerchant = record.merchantResolution;
  if (retainedMerchant?.outcome !== "DISCOVERED") throw new Error("MERCHANT_REVIEW_EVIDENCE_NOT_DISCOVERED");
  if (canonicalizeMerchantDomain(retainedMerchant.canonicalDomain) !== canonicalizeMerchantDomain(decision.canonicalDomain)) throw new Error("MERCHANT_REVIEW_EVIDENCE_DOMAIN_MISMATCH");
  if (normalizedName(retainedMerchant.sellerName) !== normalizedName(decision.discoveredMerchantName)) throw new Error("MERCHANT_REVIEW_EVIDENCE_NAME_MISMATCH");

  const resolved = resolveDataForSeoMerchantIdentity({ marketEvidence: record.candidate?.marketEvidence, retailers });
  if (resolved.outcome !== "RESOLVED") throw new Error("ATLAS_RETAILER_RESOLUTION_FAILED");
  if (resolved.retailerId !== decision.merchantId) throw new Error("ATLAS_RETAILER_ID_MISMATCH");
  if (resolved.canonicalDomain !== canonicalizeMerchantDomain(decision.canonicalDomain)) throw new Error("ATLAS_RETAILER_RESOLUTION_DOMAIN_MISMATCH");
  return resolved;
}

export default resolveAtlasBackedMerchantRegistration;
