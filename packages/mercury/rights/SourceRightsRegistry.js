import { RIGHTS_STATES, SOURCE_RIGHTS_SCHEMA_VERSION } from "./SourceRightsPolicy.js";

const HOUR = 60 * 60 * 1000;

const profiles = Object.freeze({
  TEST_FIXTURE: Object.freeze({
    sourceId: "TEST_FIXTURE", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.NOT_APPLICABLE, manual: RIGHTS_STATES.ALLOWED, import: RIGHTS_STATES.ALLOWED },
    live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.BLOCKED, comparison: RIGHTS_STATES.ALLOWED },
    retention: { storageClass: "TEST_ONLY", contentTtlMs: null, historical: RIGHTS_STATES.ALLOWED, durableAuditMetadata: RIGHTS_STATES.ALLOWED },
    derivation: { analytics: RIGHTS_STATES.ALLOWED, offerCondition: RIGHTS_STATES.ALLOWED, historicalAnalytics: RIGHTS_STATES.ALLOWED },
    presentation: { attribution: RIGHTS_STATES.NOT_APPLICABLE },
    status: "TEST_ONLY"
  }),
  INDEPENDENT_SOURCE: Object.freeze({
    sourceId: "INDEPENDENT_SOURCE", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.ALLOWED, manual: RIGHTS_STATES.ALLOWED, import: RIGHTS_STATES.ALLOWED },
    live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.ALLOWED, comparison: RIGHTS_STATES.ALLOWED },
    retention: { storageClass: "DURABLE", contentTtlMs: null, historical: RIGHTS_STATES.ALLOWED, durableAuditMetadata: RIGHTS_STATES.ALLOWED },
    derivation: { analytics: RIGHTS_STATES.ALLOWED, offerCondition: RIGHTS_STATES.ALLOWED, historicalAnalytics: RIGHTS_STATES.ALLOWED },
    presentation: { attribution: RIGHTS_STATES.NOT_APPLICABLE },
    status: "INTERNAL_TEST_BASELINE"
  }),
  HARDWARE_RADAR_LICENSED_TEST: Object.freeze({
    sourceId: "HARDWARE_RADAR_LICENSED_TEST", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.ALLOWED, manual: RIGHTS_STATES.ALLOWED, import: RIGHTS_STATES.ALLOWED },
    live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.ALLOWED, comparison: RIGHTS_STATES.ALLOWED },
    retention: { storageClass: "DURABLE", contentTtlMs: null, historical: RIGHTS_STATES.ALLOWED, durableAuditMetadata: RIGHTS_STATES.ALLOWED },
    derivation: { analytics: RIGHTS_STATES.ALLOWED, offerCondition: RIGHTS_STATES.ALLOWED, historicalAnalytics: RIGHTS_STATES.ALLOWED },
    presentation: { attribution: RIGHTS_STATES.NOT_APPLICABLE },
    status: "SYNTHETIC_TEST_POLICY"
  }),
  AMAZON_CREATORS_API: Object.freeze({
    sourceId: "AMAZON_CREATORS_API", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.ALLOWED, manual: RIGHTS_STATES.BLOCKED, import: RIGHTS_STATES.BLOCKED },
    live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.ALLOWED, comparison: RIGHTS_STATES.ALLOWED },
    retention: { storageClass: "LICENSE_CONTROLLED", contentTtlMs: HOUR, historical: RIGHTS_STATES.BLOCKED, durableAuditMetadata: RIGHTS_STATES.CONDITIONAL },
    derivation: { analytics: RIGHTS_STATES.BLOCKED, offerCondition: RIGHTS_STATES.BLOCKED, historicalAnalytics: RIGHTS_STATES.BLOCKED },
    presentation: { attribution: RIGHTS_STATES.CONDITIONAL },
    status: "VERIFIED_BASELINE"
  }),
  MANUAL_PUBLIC_PAGE_OBSERVATION: Object.freeze({
    sourceId: "MANUAL_PUBLIC_PAGE_OBSERVATION", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.NOT_APPLICABLE, manual: RIGHTS_STATES.BLOCKED, import: RIGHTS_STATES.BLOCKED },
    live: { currentObservation: RIGHTS_STATES.BLOCKED, publicDisplay: RIGHTS_STATES.BLOCKED, comparison: RIGHTS_STATES.BLOCKED },
    retention: { storageClass: "LICENSE_CONTROLLED", contentTtlMs: 0, historical: RIGHTS_STATES.BLOCKED, durableAuditMetadata: RIGHTS_STATES.CONDITIONAL },
    derivation: { analytics: RIGHTS_STATES.BLOCKED, offerCondition: RIGHTS_STATES.BLOCKED, historicalAnalytics: RIGHTS_STATES.BLOCKED },
    presentation: { attribution: RIGHTS_STATES.NOT_APPLICABLE },
    status: "BLOCKED_LEGACY_SOURCE"
  }),
  DATAFORSEO_GOOGLE_SHOPPING: Object.freeze({
    sourceId: "DATAFORSEO_GOOGLE_SHOPPING", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.ALLOWED, manual: RIGHTS_STATES.BLOCKED, import: RIGHTS_STATES.BLOCKED },
    live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.ALLOWED, comparison: RIGHTS_STATES.ALLOWED },
    retention: { storageClass: "DURABLE", contentTtlMs: null, historical: RIGHTS_STATES.ALLOWED, durableAuditMetadata: RIGHTS_STATES.ALLOWED },
    derivation: { analytics: RIGHTS_STATES.ALLOWED, offerCondition: RIGHTS_STATES.ALLOWED, historicalAnalytics: RIGHTS_STATES.ALLOWED },
    presentation: { attribution: RIGHTS_STATES.CONDITIONAL },
    status: "WRITTEN_PROVIDER_AUTHORIZATION_2026_08"
  }),
  DATAFORSEO_AMAZON: Object.freeze({
    sourceId: "DATAFORSEO_AMAZON", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.ALLOWED, manual: RIGHTS_STATES.BLOCKED, import: RIGHTS_STATES.BLOCKED },
    live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.ALLOWED, comparison: RIGHTS_STATES.ALLOWED },
    retention: { storageClass: "DURABLE", contentTtlMs: null, historical: RIGHTS_STATES.ALLOWED, durableAuditMetadata: RIGHTS_STATES.ALLOWED },
    derivation: { analytics: RIGHTS_STATES.ALLOWED, offerCondition: RIGHTS_STATES.ALLOWED, historicalAnalytics: RIGHTS_STATES.ALLOWED },
    presentation: { attribution: RIGHTS_STATES.CONDITIONAL },
    status: "DATAFORSEO_MARKET_INTELLIGENCE_USE_AUTHORIZED_2026_08"
  }),
  BEST_BUY_PRODUCTS_API: Object.freeze({
    sourceId: "BEST_BUY_PRODUCTS_API", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.ALLOWED, manual: RIGHTS_STATES.BLOCKED, import: RIGHTS_STATES.BLOCKED },
    live: { currentObservation: RIGHTS_STATES.CONDITIONAL, publicDisplay: RIGHTS_STATES.CONDITIONAL, comparison: RIGHTS_STATES.CLARIFICATION_REQUIRED },
    retention: { storageClass: "LICENSE_CONTROLLED", contentTtlMs: 72 * HOUR, historical: RIGHTS_STATES.BLOCKED, durableAuditMetadata: RIGHTS_STATES.CLARIFICATION_REQUIRED },
    derivation: { analytics: RIGHTS_STATES.CLARIFICATION_REQUIRED, offerCondition: RIGHTS_STATES.CLARIFICATION_REQUIRED, historicalAnalytics: RIGHTS_STATES.BLOCKED },
    presentation: { attribution: RIGHTS_STATES.CONDITIONAL },
    status: "PROVISIONAL_AWAITING_CLARIFICATION"
  }),
  RAKUTEN_NEWEGG_PRODUCT_CATALOG: Object.freeze({
    sourceId: "RAKUTEN_NEWEGG_PRODUCT_CATALOG", schemaVersion: SOURCE_RIGHTS_SCHEMA_VERSION,
    acquisition: { api: RIGHTS_STATES.BLOCKED, manual: RIGHTS_STATES.BLOCKED, import: RIGHTS_STATES.ALLOWED },
    processing: { ephemeral: RIGHTS_STATES.ALLOWED },
    live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.ALLOWED, comparison: RIGHTS_STATES.ALLOWED },
    retention: { storageClass: "EPHEMERAL_CURRENT", contentTtlMs: 36 * HOUR, current: RIGHTS_STATES.ALLOWED, historical: RIGHTS_STATES.BLOCKED, durableAuditMetadata: RIGHTS_STATES.CONDITIONAL },
    derivation: { analytics: RIGHTS_STATES.BLOCKED, offerCondition: RIGHTS_STATES.CLARIFICATION_REQUIRED, historicalAnalytics: RIGHTS_STATES.BLOCKED, recommendation: RIGHTS_STATES.BLOCKED },
    distribution: { api: RIGHTS_STATES.BLOCKED },
    presentation: { attribution: RIGHTS_STATES.CONDITIONAL },
    provenance: {
      program: "RAKUTEN_ADVERTISING_NEWEGG_PRODUCT_CATALOG",
      relationshipEvidence: "OPERATOR_CONFIRMED_APPROVED_NEWEGG_ADVERTISER_AND_PRODUCT_CATALOG_ACCESS_2026_09_18",
      references: [
        "https://pubhelp.rakutenadvertising.com/hc/en-us/articles/4412243602189-Product-Catalog-Overview",
        "https://pubhelp.rakutenadvertising.com/hc/en-us/articles/7145964532877-Data-Feeds",
        "https://pubhelp.rakutenadvertising.com/hc/en-us/articles/4412243880333-Download-Product-Catalog-Data-Feed-Files"
      ],
      scope: "APPROVED_NEWEGG_US_PRODUCT_CATALOG_CURRENT_COMMERCE",
      unsupported: ["HISTORICAL_RETENTION", "DERIVED_ANALYTICS", "RECOMMENDATION", "REDISTRIBUTION_API", "OFFER_CONDITION_INFERENCE"]
    },
    status: "APPROVED_CURRENT_COMMERCE_2026_09"
  })
});

function clone(v) { return structuredClone(v); }

export class SourceRightsRegistry {
  constructor({ sourceProfiles = profiles } = {}) { this.sourceProfiles = sourceProfiles; }
  get(sourceId) { const p = this.sourceProfiles[sourceId]; return p ? Object.freeze(clone(p)) : null; }
  require(sourceId) { const p = this.get(sourceId); if (!p) throw new Error(`SOURCE_RIGHTS_UNKNOWN:${sourceId ?? "UNSPECIFIED"}`); return p; }
  has(sourceId) { return Boolean(this.sourceProfiles[sourceId]); }
  getAll() { return Object.freeze(Object.values(this.sourceProfiles).map(p => Object.freeze(clone(p)))); }
}

export const defaultSourceRightsRegistry = new SourceRightsRegistry();
export default defaultSourceRightsRegistry;
