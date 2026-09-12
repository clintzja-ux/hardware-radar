import crypto from "node:crypto";

export const AMAZON_ACCEPTANCE_POLICY_VERSION = "MERCURY-HISTORY-049-1.0";
export const AMAZON_ACCEPTANCE_CONFIRMATION = "PREPARE-DATAFORSEO-AMAZON-ACCEPTANCE";

const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
export const amazonAcceptanceDigest = digest;
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const productId = product => product?.identity?.atlasProductId;
const asin = value => typeof value === "string" && /^[A-Z0-9]{10}$/.test(value.toUpperCase()) ? value.toUpperCase() : null;

function productFacts(product) {
  const identity = product.identity, data = product.extension?.data ?? {};
  return { atlasProductId: identity.atlasProductId, brand: identity.brand, manufacturerPartNumber: identity.manufacturerPartNumber, capacity: data.capacity ?? null, classification: data.classification ?? null, performance: data.performance ?? null, physical: data.physical ?? null };
}

export function selectAmazonHistoricalAcceptanceProduct({ atlasProducts, destinations, historicalObservations } = {}) {
  if (![atlasProducts, destinations, historicalObservations].every(Array.isArray)) throw new TypeError("AMAZON_ACCEPTANCE_SELECTION_INPUT_INVALID");
  const amazonHistory = new Set(historicalObservations.filter(row => row?.provenance?.source === "DATAFORSEO_AMAZON").map(row => row.atlasProductId));
  const superseded = new Set(destinations.map(row => row?.supersedesDestinationId).filter(Boolean));
  const amazonDestinations = destinations.filter(row => row?.status === "ACTIVE" && !superseded.has(row.destinationId) && row.retailerId === "RETAILER-0001" && row.marketplace === "amazon.com" && asin(row.retailerListingId));
  const byProduct = new Map(); for (const destination of amazonDestinations) { const rows = byProduct.get(destination.atlasProductId) ?? []; rows.push(destination); byProduct.set(destination.atlasProductId, rows); }
  const eligible = atlasProducts.filter(product => product?.governance?.lifecycleStatus === "ACTIVE" && product?.governance?.publicationStatus === "READY" && typeof product?.identity?.manufacturerPartNumber === "string" && product.identity.manufacturerPartNumber.trim() && byProduct.has(productId(product)) && !amazonHistory.has(productId(product))).map(product => {
    const rows = byProduct.get(productId(product)).sort((a, b) => a.destinationId.localeCompare(b.destinationId));
    const facts = productFacts(product), completeness = [facts.capacity, facts.classification, facts.performance, facts.physical].filter(Boolean).length;
    return { product, facts, completeness, destination: rows[0], corroboratingDestinationAsins: [...new Set(rows.map(row => asin(row.retailerListingId)))].sort() };
  }).sort((a, b) => b.completeness - a.completeness || productId(a.product).localeCompare(productId(b.product)));
  if (!eligible.length) throw new Error("AMAZON_ACCEPTANCE_PRODUCT_NOT_AVAILABLE");
  const selected = eligible[0]; return freeze({ atlasProduct: structuredClone(selected.product), productFacts: selected.facts, productIdentityDigest: digest(selected.facts), destinationId: selected.destination.destinationId, corroboratingDestinationAsins: selected.corroboratingDestinationAsins, selectionRule: "ACTIVE_READY_WITH_AMAZON_DESTINATION_NO_DATAFORSEO_AMAZON_HISTORY_THEN_IDENTITY_COMPLETENESS_DESC_ATLAS_PRODUCT_ID_ASC", eligibleCount: eligible.length });
}

export function prepareAmazonHistoricalAcceptance({ asOf, selection, rightsProfile, currentUtcDaySpendUsd, utcDaySpendCeilingUsd = 0.01 } = {}) {
  if (typeof asOf !== "string" || !Number.isFinite(Date.parse(asOf)) || !selection?.productFacts?.atlasProductId || rightsProfile?.sourceId !== "DATAFORSEO_AMAZON" || !Number.isFinite(currentUtcDaySpendUsd) || currentUtcDaySpendUsd < 0) throw new TypeError("AMAZON_ACCEPTANCE_PREPARE_INPUT_INVALID");
  const rightsAllowed = rightsProfile.acquisition?.api === "ALLOWED" && rightsProfile.retention?.historical === "ALLOWED" && rightsProfile.retention?.durableAuditMetadata === "ALLOWED" && rightsProfile.derivation?.historicalAnalytics === "ALLOWED";
  if (!rightsAllowed) throw new Error("AMAZON_ACCEPTANCE_SOURCE_RIGHTS_BLOCKED");
  const sourceRightsProfileDigest = digest(rightsProfile), remainingUtcDayCapacityUsd = Math.max(0, Number((utcDaySpendCeilingUsd - currentUtcDaySpendUsd).toFixed(4)));
  const material = { policyVersion: AMAZON_ACCEPTANCE_POLICY_VERSION, asOf, sourceId: "DATAFORSEO_AMAZON", atlasProductId: selection.productFacts.atlasProductId, productIdentityDigest: selection.productIdentityDigest, selectedProductIdentityFacts: selection.productFacts, destinationId: selection.destinationId, corroboratingDestinationAsins: selection.corroboratingDestinationAsins, sourceRightsProfileDigest, amazonOperationPolicyVersion: "MERCURY-HISTORY-047-1.0", identityPolicyVersion: "MERCURY-HISTORY-046-1.0", operationPlan: [{ operation: "AMAZON_PRODUCTS", requirement: "REQUIRED" }, { operation: "AMAZON_ASIN", requirement: "CONDITIONAL_UNAUTHORIZED_NO_CERTIFIED_ESCALATION" }, { operation: "AMAZON_SELLERS", requirement: "REQUIRES_STRONG_UNIQUE_ASIN" }], costEnvelope: { maximumTasks: 3, maximumProviderSpendUsd: 0.0045, perTaskCostCeilingUsd: 0.0015, utcDaySpendCeilingUsd, currentUtcDaySpendUsd, remainingUtcDayCapacityUsd, automaticPaidRetries: 0 }, selectionRule: selection.selectionRule };
  const bindingDigest = digest(material), artifact = { schemaVersion: "1.0", preparationType: "DATAFORSEO_AMAZON_HISTORICAL_ACCEPTANCE", acceptanceArtifactId: `mer_amzaccept_${digest({ bindingDigest }).slice(0, 24)}`, bindingDigest, ...material, authorizationState: "NOT_AUTHORIZED", executionAuthorized: false, providerSpendAuthorized: false, executionEligible: remainingUtcDayCapacityUsd >= 0.0045, networkOperation: "NONE", paidTaskCreated: false, actualSpendUsd: 0 };
  validateAmazonHistoricalAcceptance(artifact); return freeze(artifact);
}

export function validateAmazonHistoricalAcceptance(value) {
  const material = { policyVersion: value?.policyVersion, asOf: value?.asOf, sourceId: value?.sourceId, atlasProductId: value?.atlasProductId, productIdentityDigest: value?.productIdentityDigest, selectedProductIdentityFacts: value?.selectedProductIdentityFacts, destinationId: value?.destinationId, corroboratingDestinationAsins: value?.corroboratingDestinationAsins, sourceRightsProfileDigest: value?.sourceRightsProfileDigest, amazonOperationPolicyVersion: value?.amazonOperationPolicyVersion, identityPolicyVersion: value?.identityPolicyVersion, operationPlan: value?.operationPlan, costEnvelope: value?.costEnvelope, selectionRule: value?.selectionRule };
  const expectedEligible = value?.costEnvelope?.remainingUtcDayCapacityUsd >= 0.0045;
  if (value?.schemaVersion !== "1.0" || value?.preparationType !== "DATAFORSEO_AMAZON_HISTORICAL_ACCEPTANCE" || value.policyVersion !== AMAZON_ACCEPTANCE_POLICY_VERSION || value.sourceId !== "DATAFORSEO_AMAZON" || !/^[a-f0-9]{64}$/.test(value.sourceRightsProfileDigest ?? "") || value.productIdentityDigest !== digest(value.selectedProductIdentityFacts) || value.selectedProductIdentityFacts?.atlasProductId !== value.atlasProductId || value.authorizationState !== "NOT_AUTHORIZED" || value.executionAuthorized !== false || value.providerSpendAuthorized !== false || value.executionEligible !== expectedEligible || value.networkOperation !== "NONE" || value.paidTaskCreated !== false || value.actualSpendUsd !== 0 || value.costEnvelope?.maximumTasks !== 3 || value.costEnvelope?.maximumProviderSpendUsd !== 0.0045 || value.costEnvelope?.perTaskCostCeilingUsd !== 0.0015 || value.costEnvelope?.automaticPaidRetries !== 0 || value.bindingDigest !== digest(material) || value.acceptanceArtifactId !== `mer_amzaccept_${digest({ bindingDigest: value.bindingDigest }).slice(0, 24)}`) throw new Error("AMAZON_ACCEPTANCE_ARTIFACT_INVALID");
  return true;
}

export function assessAmazonAcceptanceProductsOutcome(identityAssessment) {
  const state = identityAssessment?.state;
  if (state === "STRONG_UNIQUE_ASIN") return freeze({ systemStatus: "PRODUCTS_PROCESSED", nextPermittedAction: "AUTHORIZE_AMAZON_SELLERS", governedAsin: identityAssessment.providerAnchor?.asin ?? null });
  return freeze({ systemStatus: "SYSTEM_SUCCESS_FAIL_CLOSED", nextPermittedAction: "STOP", blocker: state ?? "IDENTITY_ASSESSMENT_MISSING", asinEnrichmentAuthorized: false });
}
