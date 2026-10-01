export const AUTOMATED_CURRENT_LANE_CERTIFICATION_POLICY_VERSION = "AUTOMATED-CURRENT-REFRESH-LANE-CERTIFICATION-P1-1.0";

export const CURRENT_REQUIREMENT_MATRIX = Object.freeze({
  exactAtlasProductIdentity: "REQUIRED_FOR_CURRENT_FACT",
  retailerIdentity: "REQUIRED_FOR_CURRENT_FACT",
  marketplaceSellerIdentity: "REQUIRED_FOR_CURRENT_FACT",
  standaloneBundleSemantics: "REQUIRED_FOR_CURRENT_FACT",
  condition: "REQUIRED_FOR_CURRENT_FACT",
  availability: "REQUIRED_FOR_CURRENT_FACT",
  itemPrice: "REQUIRED_FOR_CURRENT_FACT",
  currency: "REQUIRED_FOR_CURRENT_FACT",
  observationTimestamp: "REQUIRED_FOR_CURRENT_FACT",
  freshness: "REQUIRED_FOR_CURRENT_FACT",
  shippingSemantics: "OPTIONAL",
  destinationReadiness: "REQUIRED_FOR_PUBLIC_ACTION",
  sourceRights: "REQUIRED_FOR_BOTH",
  sourceProvenance: "REQUIRED_FOR_BOTH",
  sourceConflictHandling: "REQUIRED_FOR_BOTH"
});

export const AUTOMATED_CURRENT_LANE_CERTIFICATIONS = Object.freeze({
  DATAFORSEO_AMAZON_PRODUCTS: Object.freeze({ state: "IDENTITY_ONLY", currentFactCapable: false, blockers: ["PRICE_BEARING_OFFER_NOT_ESTABLISHED", "SELLER_IDENTITY_NOT_ESTABLISHED", "AVAILABILITY_NOT_ESTABLISHED"] }),
  DATAFORSEO_AMAZON_SELLERS: Object.freeze({ state: "BLOCKED", currentFactCapable: false, blockers: ["CANONICAL_RETAILER_IDENTITY_NOT_BOUND", "AVAILABILITY_NOT_RETAINED"] }),
  DATAFORSEO_AMAZON_PRODUCTS_PLUS_SELLERS: Object.freeze({ state: "BLOCKED", currentFactCapable: false, blockers: ["CANONICAL_RETAILER_IDENTITY_NOT_BOUND", "AVAILABILITY_NOT_RETAINED"] }),
  DATAFORSEO_GOOGLE_SHOPPING: Object.freeze({ state: "SCOPED_ROUTINE_READY", currentFactCapable: true, retailerIds: ["RETAILER-0002", "RETAILER-0003"], blockers: [] }),
  RAKUTEN_NEWEGG: Object.freeze({ state: "ROUTINE_READY", currentFactCapable: true, retailerIds: ["RETAILER-0004"], historicalRetentionAllowed: false, blockers: [] })
});

export function getAutomatedCurrentLaneCertification(lane) {
  return AUTOMATED_CURRENT_LANE_CERTIFICATIONS[lane] ?? null;
}

