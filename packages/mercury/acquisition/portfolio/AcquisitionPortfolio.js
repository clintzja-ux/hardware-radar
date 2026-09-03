import crypto from "node:crypto";
import { canonicalizeMerchantDomain } from "../../market/dataforseo/DataForSeoMerchantIdentity.js";
import { canonicalizeRetailerDestinationUrl } from "../../destinations/RetailerDestination.js";

export const ACQUISITION_PORTFOLIO_SCHEMA_VERSION = "1.0";
export const ACQUISITION_PORTFOLIO_AUTHORITY = "ACQUISITION_ORCHESTRATION_AUTHORITY";
export const ACQUISITION_PORTFOLIO_POLICY_VERSION = "MERCURY-ACTIVATION-002-1.0";
export const PORTFOLIO_PRODUCT_STATES = Object.freeze({
  EXCLUDED: "EXCLUDED", READY_FOR_PRODUCTS: "READY_FOR_PRODUCTS", PRODUCTS_PENDING: "PRODUCTS_PENDING",
  PRODUCTS_REVIEW_REQUIRED: "PRODUCTS_REVIEW_REQUIRED", READY_FOR_PRODUCT_INFO: "READY_FOR_PRODUCT_INFO",
  PRODUCT_INFO_PENDING: "PRODUCT_INFO_PENDING", PRODUCT_INFO_REVIEW_REQUIRED: "PRODUCT_INFO_REVIEW_REQUIRED",
  READY_FOR_SELLERS: "READY_FOR_SELLERS", SELLERS_PENDING: "SELLERS_PENDING",
  ACQUISITION_COMPLETE: "ACQUISITION_COMPLETE", NO_RESULT: "NO_RESULT", FAILED: "FAILED"
});
export const PORTFOLIO_EVENT_TYPES = Object.freeze({
  TASK_AUTHORIZED: "TASK_AUTHORIZED", PRODUCTS_POSTED: "PRODUCTS_POSTED", PRODUCTS_RESOLVED: "PRODUCTS_RESOLVED",
  PRODUCTS_NO_RESULT: "PRODUCTS_NO_RESULT", PRODUCTS_REVIEW_REQUIRED: "PRODUCTS_REVIEW_REQUIRED",
  PRODUCT_INFO_POSTED: "PRODUCT_INFO_POSTED", PRODUCT_INFO_VALIDATED: "PRODUCT_INFO_VALIDATED",
  PRODUCT_INFO_REVIEW_REQUIRED: "PRODUCT_INFO_REVIEW_REQUIRED", SELLERS_POSTED: "SELLERS_POSTED",
  SELLERS_RETRIEVED: "SELLERS_RETRIEVED", SELLERS_NO_RESULT: "SELLERS_NO_RESULT", TASK_FAILED: "TASK_FAILED"
});

const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const clone = value => value == null ? value : structuredClone(value);
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const money = value => Math.round((Number(value) + Number.EPSILON) * 1e9) / 1e9;
const iso = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const productId = product => product?.identity?.atlasProductId;
const productMaterial = product => ({ atlasProductId: productId(product), manufacturerPartNumber: product?.identity?.manufacturerPartNumber, recordRevision: product?.identity?.recordRevision, lifecycleStatus: product?.governance?.lifecycleStatus, publicationStatus: product?.governance?.publicationStatus, engineeringValidationStatus: product?.governance?.engineeringValidationStatus });
const validProviderIdentity = value => value && value.status === "REUSABLE" && [value.productId, value.dataDocId, value.gid].some(nonBlank) && nonBlank(value.bindingDigest);
const EVENT_KEYS = new Set(["eventId", "portfolioCycleId", "atlasProductId", "type", "recordedAt", "operation", "maximumSpendUsd", "actualSpendUsd", "authorizationId", "authorizationStatus", "authorizationExpiresAt", "providerTaskId", "resultReference", "reason"]);

function validateMoney(value, field, { positive = false } = {}) {
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0)) throw new TypeError(`${field} invalid`);
}

function rightsMaterial(profile) {
  if (!profile || profile.sourceId !== "DATAFORSEO_GOOGLE_SHOPPING" || profile.acquisition?.api !== "ALLOWED") throw new Error("ACQUISITION_PORTFOLIO_SOURCE_RIGHTS_NOT_ALLOWED");
  return clone(profile);
}

export class AcquisitionPortfolioPrepareService {
  constructor({ atlas, rightsRegistry, providerIdentityResolver, taskCostUsd = 0.001, dailySpendCeilingUsd = 0.01 } = {}) {
    if (!atlas?.products?.getAll || !rightsRegistry?.get || !providerIdentityResolver?.resolve) throw new TypeError("ACQUISITION_PORTFOLIO_DEPENDENCY_REQUIRED");
    validateMoney(taskCostUsd, "taskCostUsd", { positive: true }); validateMoney(dailySpendCeilingUsd, "dailySpendCeilingUsd", { positive: true });
    this.atlas = atlas; this.rightsRegistry = rightsRegistry; this.providerIdentityResolver = providerIdentityResolver;
    this.taskCostUsd = taskCostUsd; this.dailySpendCeilingUsd = dailySpendCeilingUsd;
  }

  async prepare({ asOf, locationName = "United States", languageName = "English" } = {}) {
    if (!iso(asOf) || !nonBlank(locationName) || !nonBlank(languageName)) throw new TypeError("ACQUISITION_PORTFOLIO_PREPARE_INPUT_INVALID");
    const products = [...await this.atlas.products.getAll()].sort((a, b) => String(productId(a)).localeCompare(String(productId(b))));
    if (!products.length || products.some(product => !nonBlank(productId(product)) || !nonBlank(product?.identity?.manufacturerPartNumber))) throw new Error("ACQUISITION_PORTFOLIO_ATLAS_INVENTORY_INVALID");
    if (new Set(products.map(productId)).size !== products.length) throw new Error("ACQUISITION_PORTFOLIO_ATLAS_PRODUCT_DUPLICATE");
    const rightsProfile = rightsMaterial(this.rightsRegistry.get("DATAFORSEO_GOOGLE_SHOPPING"));
    const inventory = products.map(productMaterial), eligibleProducts = [], excludedProducts = [];
    for (const product of products) {
      const material = productMaterial(product), eligible = material.lifecycleStatus === "ACTIVE" && material.publicationStatus === "READY";
      if (!eligible) {
        excludedProducts.push({ atlasProductId: material.atlasProductId, lifecycleStatus: material.lifecycleStatus, publicationStatus: material.publicationStatus, reason: "ATLAS_PRODUCT_NOT_ACTIVE_READY" });
        continue;
      }
      const resolved = await this.providerIdentityResolver.resolve(material.atlasProductId, { asOf, product: clone(product) });
      if (resolved != null && !validProviderIdentity(resolved)) throw new Error(`ACQUISITION_PORTFOLIO_PROVIDER_IDENTITY_INVALID:${material.atlasProductId}`);
      const reusable = resolved != null, stagePath = reusable ? ["SELLERS"] : ["PRODUCTS", "PRODUCT_INFO", "SELLERS"];
      eligibleProducts.push({ atlasProductId: material.atlasProductId, manufacturerPartNumber: material.manufacturerPartNumber, atlasProductDigest: digest(material), query: material.manufacturerPartNumber, providerIdentityState: reusable ? "REUSABLE" : "NOT_ESTABLISHED", providerIdentity: reusable ? { productId: resolved.productId ?? null, dataDocId: resolved.dataDocId ?? null, gid: resolved.gid ?? null, bindingDigest: resolved.bindingDigest } : null, initialState: reusable ? PORTFOLIO_PRODUCT_STATES.READY_FOR_SELLERS : PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCTS, plannedStagePath: stagePath, maximumRemainingPaidTasks: stagePath.length, maximumRemainingSpendUsd: money(stagePath.length * this.taskCostUsd) });
    }
    const maximumProgramTaskCount = eligibleProducts.reduce((sum, product) => sum + product.maximumRemainingPaidTasks, 0);
    const maximumProgramSpendUsd = money(maximumProgramTaskCount * this.taskCostUsd);
    const maxTasksPerUtcDay = Math.floor((this.dailySpendCeilingUsd + Number.EPSILON) / this.taskCostUsd);
    if (maximumProgramSpendUsd !== money(eligibleProducts.reduce((sum, product) => sum + product.maximumRemainingSpendUsd, 0)) || maxTasksPerUtcDay < 1) throw new Error("ACQUISITION_PORTFOLIO_COST_ARITHMETIC_INVALID");
    const binding = { policyVersion: ACQUISITION_PORTFOLIO_POLICY_VERSION, asOf, atlasInventoryDigest: digest(inventory), sourceRightsProfileDigest: digest(rightsProfile), provider: "DATAFORSEO", sourceId: "DATAFORSEO_GOOGLE_SHOPPING", endpointFamily: "MERCHANT_GOOGLE_SHOPPING_ASYNC", locationName, languageName, eligibleProducts, excludedProducts, taskEnvelope: { products: eligibleProducts.filter(product => product.initialState === PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCTS).length, productInfo: eligibleProducts.filter(product => product.initialState === PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCTS).length, sellers: eligibleProducts.length, maximumProgramTaskCount }, costEnvelope: { perTaskCostCeilingUsd: this.taskCostUsd, maximumProgramSpendUsd, utcDaySpendCeilingUsd: this.dailySpendCeilingUsd, maxTasksPerUtcDay, minimumUtcDayCapacityEnvelopes: Math.ceil(maximumProgramTaskCount / maxTasksPerUtcDay) }, automaticPaidRetries: 0 };
    const bindingDigest = digest(binding);
    return freeze({ schemaVersion: ACQUISITION_PORTFOLIO_SCHEMA_VERSION, portfolioType: "DATAFORSEO_RAM_ACQUISITION_PORTFOLIO", portfolioCycleId: `mer_acqportfolio_${digest({ bindingDigest }).slice(0, 24)}`, preparedAt: asOf, authority: ACQUISITION_PORTFOLIO_AUTHORITY, authorizationState: "NOT_AUTHORIZED", portfolioReviewState: "NOT_REVIEWED", bindingDigest, ...binding, counts: { canonicalProducts: products.length, eligible: eligibleProducts.length, excluded: excludedProducts.length }, currentProgressState: "NOT_STARTED", mutationAuthorized: false, providerSpendAuthorized: false, paidTaskCreated: false, networkOperation: "NONE", actualSpendUsd: 0, downstreamAuthority: { retention: false, historicalAdmission: false, canonicalPromotion: false, review: false, publication: false, currentPrice: false, cheapest: false, pick: false, retailerDestinationAdmission: false } });
  }
}

const transitions = Object.freeze({
  [PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCTS]: { PRODUCTS_POSTED: PORTFOLIO_PRODUCT_STATES.PRODUCTS_PENDING },
  [PORTFOLIO_PRODUCT_STATES.PRODUCTS_PENDING]: { PRODUCTS_RESOLVED: PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCT_INFO, PRODUCTS_NO_RESULT: PORTFOLIO_PRODUCT_STATES.NO_RESULT, PRODUCTS_REVIEW_REQUIRED: PORTFOLIO_PRODUCT_STATES.PRODUCTS_REVIEW_REQUIRED, TASK_FAILED: PORTFOLIO_PRODUCT_STATES.FAILED },
  [PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCT_INFO]: { PRODUCT_INFO_POSTED: PORTFOLIO_PRODUCT_STATES.PRODUCT_INFO_PENDING },
  [PORTFOLIO_PRODUCT_STATES.PRODUCT_INFO_PENDING]: { PRODUCT_INFO_VALIDATED: PORTFOLIO_PRODUCT_STATES.READY_FOR_SELLERS, PRODUCT_INFO_REVIEW_REQUIRED: PORTFOLIO_PRODUCT_STATES.PRODUCT_INFO_REVIEW_REQUIRED, TASK_FAILED: PORTFOLIO_PRODUCT_STATES.FAILED },
  [PORTFOLIO_PRODUCT_STATES.READY_FOR_SELLERS]: { SELLERS_POSTED: PORTFOLIO_PRODUCT_STATES.SELLERS_PENDING },
  [PORTFOLIO_PRODUCT_STATES.SELLERS_PENDING]: { SELLERS_RETRIEVED: PORTFOLIO_PRODUCT_STATES.ACQUISITION_COMPLETE, SELLERS_NO_RESULT: PORTFOLIO_PRODUCT_STATES.NO_RESULT, TASK_FAILED: PORTFOLIO_PRODUCT_STATES.FAILED }
});
const nextOperation = state => state === PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCTS ? "PRODUCTS" : state === PORTFOLIO_PRODUCT_STATES.READY_FOR_PRODUCT_INFO ? "PRODUCT_INFO" : state === PORTFOLIO_PRODUCT_STATES.READY_FOR_SELLERS ? "SELLERS" : null;

export function projectAcquisitionPortfolio({ portfolio, events = [], currentUtcDaySpendUsd = 0 } = {}) {
  if (!portfolio || portfolio.schemaVersion !== ACQUISITION_PORTFOLIO_SCHEMA_VERSION || portfolio.authority !== ACQUISITION_PORTFOLIO_AUTHORITY) throw new Error("ACQUISITION_PORTFOLIO_INVALID");
  if (!Array.isArray(events)) throw new TypeError("ACQUISITION_PORTFOLIO_EVENTS_INVALID"); validateMoney(currentUtcDaySpendUsd, "currentUtcDaySpendUsd");
  const eventIds = new Map(), normalizedEvents = [];
  for (const event of events) {
    if (!event || Object.keys(event).some(key => !EVENT_KEYS.has(key)) || !nonBlank(event?.eventId) || event.portfolioCycleId !== portfolio.portfolioCycleId || !nonBlank(event.atlasProductId) || !Object.values(PORTFOLIO_EVENT_TYPES).includes(event.type) || !iso(event.recordedAt)) throw new Error("ACQUISITION_PORTFOLIO_EVENT_INVALID");
    const material = digest(event), prior = eventIds.get(event.eventId);
    if (prior && prior !== material) throw new Error("ACQUISITION_PORTFOLIO_EVENT_REPLAY_CONFLICT");
    if (!prior) { eventIds.set(event.eventId, material); normalizedEvents.push(clone(event)); }
  }
  const states = new Map(portfolio.eligibleProducts.map(product => [product.atlasProductId, { state: product.initialState, events: [], product }]));
  let authorizedTaskSpendUsd = 0, actualIncurredSpendUsd = 0, authorized = 0, posted = 0, completed = 0, failedTasks = 0;
  for (const event of normalizedEvents) {
    const entry = states.get(event.atlasProductId); if (!entry) throw new Error("ACQUISITION_PORTFOLIO_EXCLUDED_OR_UNKNOWN_PRODUCT_EVENT");
    if (event.type === PORTFOLIO_EVENT_TYPES.TASK_AUTHORIZED) { if (nextOperation(entry.state) !== event.operation || Number(event.maximumSpendUsd) !== portfolio.costEnvelope.perTaskCostCeilingUsd || !nonBlank(event.authorizationId) || event.authorizationStatus !== "LIVE_AUTHORIZED" || !iso(event.authorizationExpiresAt) || Date.parse(event.authorizationExpiresAt) <= Date.parse(event.recordedAt)) throw new Error("ACQUISITION_PORTFOLIO_TASK_AUTHORIZATION_INVALID"); authorized++; authorizedTaskSpendUsd = money(authorizedTaskSpendUsd + Number(event.maximumSpendUsd)); entry.events.push(event); continue; }
    const target = transitions[entry.state]?.[event.type]; if (!target) throw new Error(`ACQUISITION_PORTFOLIO_EVENT_SEQUENCE_INVALID:${event.atlasProductId}:${event.type}`);
    if (event.type.endsWith("_POSTED")) { const priorAuthorization = [...entry.events].reverse().find(item => item.type === PORTFOLIO_EVENT_TYPES.TASK_AUTHORIZED && item.operation === event.operation); if (!priorAuthorization) throw new Error("ACQUISITION_PORTFOLIO_POST_WITHOUT_SINGLE_TASK_AUTHORIZATION"); const incurred = Number(event.actualSpendUsd ?? 0); validateMoney(incurred, "event.actualSpendUsd"); if (incurred > portfolio.costEnvelope.perTaskCostCeilingUsd) throw new Error("ACQUISITION_PORTFOLIO_TASK_COST_CEILING_EXCEEDED"); posted++; actualIncurredSpendUsd = money(actualIncurredSpendUsd + incurred); }
    if (event.type === PORTFOLIO_EVENT_TYPES.SELLERS_RETRIEVED || event.type === PORTFOLIO_EVENT_TYPES.SELLERS_NO_RESULT) completed++;
    if (event.type === PORTFOLIO_EVENT_TYPES.TASK_FAILED) failedTasks++;
    entry.state = target; entry.events.push(event);
  }
  if (actualIncurredSpendUsd > portfolio.costEnvelope.maximumProgramSpendUsd) throw new Error("ACQUISITION_PORTFOLIO_PROGRAM_CEILING_EXCEEDED");
  const remainingUtcDaySpendUsd = money(Math.max(0, portfolio.costEnvelope.utcDaySpendCeilingUsd - currentUtcDaySpendUsd));
  const products = [...states.values()].map(({ state, product, events: productEvents }) => ({ atlasProductId: product.atlasProductId, state, nextOperation: nextOperation(state), retryRequiresOperatorAction: state === PORTFOLIO_PRODUCT_STATES.FAILED, events: productEvents.map(event => event.eventId) }));
  const blocked = products.filter(product => [PORTFOLIO_PRODUCT_STATES.FAILED, PORTFOLIO_PRODUCT_STATES.PRODUCTS_REVIEW_REQUIRED, PORTFOLIO_PRODUCT_STATES.PRODUCT_INFO_REVIEW_REQUIRED].includes(product.state)).length;
  const pending = products.filter(product => product.state.endsWith("_PENDING")).length;
  const terminal = products.filter(product => [PORTFOLIO_PRODUCT_STATES.ACQUISITION_COMPLETE, PORTFOLIO_PRODUCT_STATES.NO_RESULT].includes(product.state)).length;
  const progressState = terminal === products.length ? "COMPLETE" : terminal > 0 && terminal + blocked === products.length ? "PARTIALLY_COMPLETE" : blocked === products.length ? "BLOCKED" : normalizedEvents.length ? "IN_PROGRESS" : "NOT_STARTED";
  const blockers = []; if (remainingUtcDaySpendUsd < portfolio.costEnvelope.perTaskCostCeilingUsd) blockers.push("UTC_DAY_SPEND_CEILING_EXHAUSTED"); if (money(actualIncurredSpendUsd + portfolio.costEnvelope.perTaskCostCeilingUsd) > portfolio.costEnvelope.maximumProgramSpendUsd) blockers.push("PORTFOLIO_SPEND_CEILING_EXHAUSTED");
  return freeze({ schemaVersion: "1.0", projectionType: "ACQUISITION_PORTFOLIO_OPERATOR_REPORT", portfolioCycleId: portfolio.portfolioCycleId, preparedAt: portfolio.preparedAt, bindingDigest: portfolio.bindingDigest, status: progressState, counts: clone(portfolio.counts), taskState: { maximum: portfolio.taskEnvelope.maximumProgramTaskCount, prepared: 0, authorized, posted, completed, failed: failedTasks, pending }, spend: { maximumProgramSpendUsd: portfolio.costEnvelope.maximumProgramSpendUsd, authorizedTaskSpendUsd, actualIncurredSpendUsd, remainingMaximumProgramSpendUsd: money(portfolio.costEnvelope.maximumProgramSpendUsd - actualIncurredSpendUsd), currentUtcDaySpendUsd: money(currentUtcDaySpendUsd), remainingUtcDaySpendUsd }, productOutcomes: { completed: terminal, pending, blocked, reviewRequired: products.filter(product => product.state.endsWith("REVIEW_REQUIRED")).length, noResult: products.filter(product => product.state === PORTFOLIO_PRODUCT_STATES.NO_RESULT).length }, products, blockers, automaticPaidRetries: 0, providerSpendAuthorized: false, nextTaskExecutionAuthorized: false, networkOperation: "NONE", actualSpendUsd: actualIncurredSpendUsd, downstreamAuthority: clone(portfolio.downstreamAuthority) });
}

export function acknowledgeAcquisitionPortfolio({ portfolio, reviewedBy, reviewedAt, reason } = {}) {
  if (!portfolio || portfolio.schemaVersion !== ACQUISITION_PORTFOLIO_SCHEMA_VERSION || !nonBlank(reviewedBy) || !iso(reviewedAt) || !nonBlank(reason)) throw new TypeError("ACQUISITION_PORTFOLIO_REVIEW_INPUT_INVALID");
  const material = { portfolioCycleId: portfolio.portfolioCycleId, bindingDigest: portfolio.bindingDigest, reviewedBy: reviewedBy.trim(), reviewedAt, reason: reason.trim() };
  return freeze({ schemaVersion: "1.0", acknowledgmentId: `mer_acqportreview_${digest(material).slice(0, 24)}`, ...material, status: "PORTFOLIO_REVIEWED", providerSpendAuthorized: false, paidTaskAuthorized: false, executionAuthorized: false, networkOperation: "NONE", actualSpendUsd: 0 });
}

export async function assertAcquisitionPortfolioBindingCurrent({ portfolio, atlas, rightsRegistry } = {}) {
  if (!portfolio || !atlas?.products?.getAll || !rightsRegistry?.get) throw new TypeError("ACQUISITION_PORTFOLIO_REASSESSMENT_INPUT_INVALID");
  const products = [...await atlas.products.getAll()].sort((a, b) => String(productId(a)).localeCompare(String(productId(b))));
  if (digest(products.map(productMaterial)) !== portfolio.atlasInventoryDigest) throw new Error("ACQUISITION_PORTFOLIO_ATLAS_DRIFT_REPREPARE_REQUIRED");
  if (digest(rightsMaterial(rightsRegistry.get(portfolio.sourceId))) !== portfolio.sourceRightsProfileDigest) throw new Error("ACQUISITION_PORTFOLIO_RIGHTS_DRIFT_REPREPARE_REQUIRED");
  return true;
}

export function assessDestinationCandidate({ sourceUrl, atlasProductId, retailerResolution, marketplace, destinations = [] } = {}) {
  let candidateUrl; try { candidateUrl = canonicalizeRetailerDestinationUrl(sourceUrl); } catch { return freeze({ status: "URL_REJECTED", sourceUrl, destinationUrl: null, navigationEligible: false }); }
  if (retailerResolution?.outcome !== "RESOLVED" || !nonBlank(retailerResolution.retailerId)) return freeze({ status: "RETAILER_IDENTITY_REQUIRED", sourceUrl: candidateUrl, destinationUrl: null, navigationEligible: false });
  const market = canonicalizeMerchantDomain(marketplace), matching = destinations.filter(destination => destination.status === "ACTIVE" && destination.atlasProductId === atlasProductId && destination.retailerId === retailerResolution.retailerId && destination.marketplace === market);
  const exact = matching.find(destination => canonicalizeRetailerDestinationUrl(destination.destinationUrl) === candidateUrl);
  return freeze({ status: exact ? "ALREADY_COVERED" : matching.length ? "CANDIDATE_REVIEW_REQUIRED" : "CANDIDATE_REVIEW_REQUIRED", sourceUrl: candidateUrl, destinationUrl: null, navigationEligible: false, existingDestinationId: exact?.destinationId ?? null, supersessionAuthorized: false });
}
