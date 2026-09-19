import { assessRetailerDestinationBinding } from "../destinations/RetailerDestination.js";
import { RIGHTS_STATES } from "../rights/SourceRightsPolicy.js";
import { createCurrentDisplaySnapshot } from "./CurrentDisplaySnapshot.js";
import { manualCurrentPriceDigest, projectPreparedManualCurrentOffer } from "./ManualCurrentPricePreparation.js";

export const MANUAL_SNAPSHOT_EXECUTION_POLICY_VERSION = "MANUAL-CURRENT-DISPLAY-SNAPSHOT-EXECUTION-P1-1.0";
export const MANUAL_SNAPSHOT_AUTHORIZE_CONFIRMATION = "AUTHORIZE-MANUAL-CURRENT-DISPLAY";
export const MANUAL_SNAPSHOT_EXECUTE_CONFIRMATION = "EXECUTE-MANUAL-CURRENT-DISPLAY";
export const MANUAL_SNAPSHOT_AUTHORIZATION_TTL_MS = 15 * 60 * 1000;
export const MANUAL_SNAPSHOT_FRESHNESS_MS = 36 * 60 * 60 * 1000;

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const text = (value, code) => { if (typeof value !== "string" || !value.trim()) throw new TypeError(code); return value.trim(); };
const time = (value, code) => { if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new TypeError(code); return value; };
const key = value => `${value.atlasProductId}|${value.retailerId}`;

export const manualSnapshotOfferFingerprint = ({ atlasProductId, retailerId, offer = null } = {}) => manualCurrentPriceDigest(offer === null
  ? { state: "ABSENT", atlasProductId, retailerId }
  : { state: "PRESENT", atlasProductId, retailerId, offer });

export function validateManualSnapshotPreparation(preparation) {
  if (preparation?.schemaVersion !== "1.0" || !/^mer_manualpriceprep_[a-f0-9]{24}$/.test(preparation?.preparationId ?? "")) throw new Error("MANUAL_CURRENT_PRICE_PREPARATION_INVALID");
  if (manualCurrentPriceDigest(preparation.binding) !== preparation.bindingDigest || preparation.preparationId !== `mer_manualpriceprep_${preparation.bindingDigest.slice(0, 24)}`) throw new Error("MANUAL_CURRENT_PRICE_PREPARATION_DIGEST_INVALID");
  if (preparation.authorizationState !== "NOT_AUTHORIZED" || preparation.executionAuthorized !== false || preparation.historicalAuthority !== false || preparation.comparisonAuthority !== false || preparation.cheapestAuthority !== false || preparation.publicationAuthority !== false) throw new Error("MANUAL_CURRENT_PRICE_PREPARATION_AUTHORITY_INVALID");
  return preparation;
}

export function describeManualSnapshotPredecessor({ snapshot, preparation } = {}) {
  validateManualSnapshotPreparation(preparation);
  const matches = (snapshot?.offers ?? []).filter(offer => key(offer) === key(preparation.binding));
  if (matches.length > 1) throw new Error("MANUAL_CURRENT_DISPLAY_PREDECESSOR_CARDINALITY_INVALID");
  const offer = matches[0] ?? null;
  return freeze({
    snapshotId: snapshot?.snapshotId ?? null,
    snapshotFingerprint: snapshot?.materialFingerprint ?? null,
    offerState: offer === null ? "ABSENT" : "PRESENT",
    offerFingerprint: manualSnapshotOfferFingerprint({ atlasProductId: preparation.binding.atlasProductId, retailerId: preparation.binding.retailerId, offer }),
    legacySourceIdentityAbsent: offer !== null && offer.sourceIdentity == null,
    offer: offer === null ? null : structuredClone(offer)
  });
}

export function createManualSnapshotExecutionAuthorization({ preparation, predecessor, authorizedBy, reason, createdAt, expiresAt, confirmation } = {}) {
  validateManualSnapshotPreparation(preparation);
  if (confirmation !== MANUAL_SNAPSHOT_AUTHORIZE_CONFIRMATION) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_CONFIRMATION_INVALID");
  const created = time(createdAt, "MANUAL_CURRENT_DISPLAY_AUTHORIZATION_TIME_INVALID"), expires = time(expiresAt, "MANUAL_CURRENT_DISPLAY_AUTHORIZATION_EXPIRY_INVALID");
  if (Date.parse(expires) <= Date.parse(created) || Date.parse(expires) - Date.parse(created) > MANUAL_SNAPSHOT_AUTHORIZATION_TTL_MS) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_EXPIRY_INVALID");
  const b = preparation.binding;
  const binding = {
    policyVersion: MANUAL_SNAPSHOT_EXECUTION_POLICY_VERSION,
    preparationId: preparation.preparationId,
    preparationDigest: preparation.bindingDigest,
    atlasProductId: b.atlasProductId,
    retailerId: b.retailerId,
    retailer: b.retailer,
    sourceId: b.sourceId,
    sourceRightsProfileDigest: b.sourceRightsProfileDigest,
    destinationId: b.destinationId,
    destinationBindingDigest: b.destinationBindingDigest,
    expectedPredecessorSnapshotId: predecessor.snapshotId,
    expectedPredecessorSnapshotDigest: predecessor.snapshotFingerprint,
    expectedPredecessorOfferState: predecessor.offerState,
    expectedPredecessorOfferFingerprint: predecessor.offerFingerprint,
    expectedPredecessorOffer: predecessor.offer,
    maximumMutation: { atlasProductId: b.atlasProductId, retailerId: b.retailerId, maximumOfferChanges: 1 },
    authorities: { history: false, comparison: false, cheapest: false, pick: false, publication: false, release: false }
  };
  const record = { schemaVersion: "1.0", authorizationType: "MANUAL_CURRENT_DISPLAY_SNAPSHOT_EXECUTION", authorizationId: "", authorizationBindingDigest: manualCurrentPriceDigest(binding), binding, authorizedBy: text(authorizedBy, "MANUAL_CURRENT_DISPLAY_AUTHORIZED_BY_REQUIRED"), reason: text(reason, "MANUAL_CURRENT_DISPLAY_AUTHORIZATION_REASON_REQUIRED"), createdAt: created, expiresAt: expires, singleUse: true };
  record.authorizationId = `mer_manualdisplayauth_${manualCurrentPriceDigest(record).slice(0, 24)}`;
  return freeze(record);
}

export function validateManualSnapshotExecutionAuthorization(value) {
  if (value?.schemaVersion !== "1.0" || value?.authorizationType !== "MANUAL_CURRENT_DISPLAY_SNAPSHOT_EXECUTION" || value?.singleUse !== true) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_INVALID");
  if (manualCurrentPriceDigest(value.binding) !== value.authorizationBindingDigest) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_BINDING_INVALID");
  const copy = structuredClone(value); copy.authorizationId = "";
  if (value.authorizationId !== `mer_manualdisplayauth_${manualCurrentPriceDigest(copy).slice(0, 24)}`) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_ID_INVALID");
  if (value.binding?.maximumMutation?.maximumOfferChanges !== 1 || Object.values(value.binding?.authorities ?? {}).some(Boolean)) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_SCOPE_INVALID");
  if (!/^[a-f0-9]{64}$/.test(value.authorizationBindingDigest ?? "") || !/^[a-f0-9]{64}$/.test(value.binding?.preparationDigest ?? "") || !/^[a-f0-9]{64}$/.test(value.binding?.sourceRightsProfileDigest ?? "") || !/^[a-f0-9]{64}$/.test(value.binding?.destinationBindingDigest ?? "") || !/^[a-f0-9]{64}$/.test(value.binding?.expectedPredecessorOfferFingerprint ?? "") || !["PRESENT", "ABSENT"].includes(value.binding?.expectedPredecessorOfferState)) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_BINDING_INVALID");
  if ((value.binding.expectedPredecessorOfferState === "ABSENT") !== (value.binding.expectedPredecessorOffer === null)) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_PREDECESSOR_INVALID");
  time(value.createdAt, "MANUAL_CURRENT_DISPLAY_AUTHORIZATION_TIME_INVALID"); time(value.expiresAt, "MANUAL_CURRENT_DISPLAY_AUTHORIZATION_EXPIRY_INVALID");
  return value;
}

function assertFresh(observedAt, at) {
  const age = Date.parse(at) - Date.parse(observedAt);
  if (!Number.isFinite(age) || age < 0) throw new Error("OBSERVATION_TIME_INVALID_AT_EXECUTION");
  if (age > MANUAL_SNAPSHOT_FRESHNESS_MS) throw new Error("OBSERVATION_STALE_AT_EXECUTION");
}

function assertRights(rights, binding) {
  if (manualCurrentPriceDigest(rights) !== binding.sourceRightsProfileDigest || rights?.sourceId !== binding.sourceId || rights.acquisition?.manual !== RIGHTS_STATES.ALLOWED || rights.live?.currentObservation !== RIGHTS_STATES.ALLOWED || rights.live?.publicDisplay !== RIGHTS_STATES.ALLOWED || rights.live?.comparison !== RIGHTS_STATES.BLOCKED || rights.retention?.historical !== RIGHTS_STATES.BLOCKED) throw new Error("MANUAL_CURRENT_DISPLAY_RIGHTS_CHANGED");
}

export class ManualCurrentPriceSnapshotExecutionService {
  constructor({ preparationRepository, snapshotRepository, executionRepository, productResolver, retailerResolver, destinationResolver, rightsResolver, now = () => new Date().toISOString() } = {}) {
    if (!preparationRepository?.getById || !snapshotRepository?.getState || !snapshotRepository?.replaceIfCurrent || !executionRepository?.recordAuthorization || !executionRepository?.recordExecution || !productResolver || !retailerResolver || !destinationResolver || !rightsResolver) throw new TypeError("MANUAL_CURRENT_DISPLAY_EXECUTION_DEPENDENCY_REQUIRED");
    Object.assign(this, { preparationRepository, snapshotRepository, executionRepository, productResolver, retailerResolver, destinationResolver, rightsResolver, now });
  }

  async previewAuthorization({ preparationId, asOf = this.now() } = {}) {
    const preparation = validateManualSnapshotPreparation(await this.preparationRepository.getById(preparationId));
    const current = (await this.snapshotRepository.getState()).current;
    const predecessor = describeManualSnapshotPredecessor({ snapshot: current, preparation });
    const checks = await this.#revalidate({ preparation, at: asOf, current, predecessor, requirePredecessor: false });
    return freeze({ preparation, predecessor, ...checks, authorizationReady: true, authorizationCreated: false });
  }

  async authorize({ preparationId, authorizedBy, reason, confirmation, createdAt = this.now(), expiresAt = new Date(Date.parse(createdAt) + MANUAL_SNAPSHOT_AUTHORIZATION_TTL_MS).toISOString() } = {}) {
    const preview = await this.previewAuthorization({ preparationId, asOf: createdAt });
    const prior = await this.executionRepository.findForPreparation(preparationId);
    if (prior.executed) throw new Error("MANUAL_CURRENT_DISPLAY_PREPARATION_ALREADY_EXECUTED");
    const active = prior.authorizations.find(value => !prior.executionAuthorizationIds.includes(value.authorizationId) && Date.parse(value.expiresAt) > Date.parse(createdAt));
    if (active && active.binding.expectedPredecessorSnapshotId === preview.predecessor.snapshotId && active.binding.expectedPredecessorSnapshotDigest === preview.predecessor.snapshotFingerprint && active.binding.expectedPredecessorOfferFingerprint === preview.predecessor.offerFingerprint) return freeze({ status: "EXISTING", authorization: active, preview });
    const authorization = createManualSnapshotExecutionAuthorization({ preparation: preview.preparation, predecessor: preview.predecessor, authorizedBy, reason, createdAt, expiresAt, confirmation });
    const result = await this.executionRepository.recordAuthorization(authorization);
    return freeze({ ...result, authorization: result.value, preview });
  }

  async inspectAuthorization({ authorizationId, asOf = this.now() } = {}) {
    const authorization = validateManualSnapshotExecutionAuthorization(await this.executionRepository.getAuthorization(authorizationId));
    const execution = await this.executionRepository.getExecutionByAuthorization(authorizationId);
    const preparation = await this.preparationRepository.getById(authorization.binding.preparationId);
    const state = execution ? "CONSUMED" : Date.parse(authorization.expiresAt) <= Date.parse(asOf) ? "EXPIRED" : "AUTHORIZED";
    return freeze({ state, authorization, preparation, execution, whatWillChange: { product: authorization.binding.atlasProductId, retailer: authorization.binding.retailer, predecessor: authorization.binding.expectedPredecessorOfferState, predecessorPriceUsd: authorization.binding.expectedPredecessorOffer?.priceUsd ?? null, proposedPriceUsd: preparation?.binding?.itemPriceUsd ?? null, observedAt: preparation?.binding?.observedAt ?? null, sourceId: authorization.binding.sourceId }, whatWillNotChange: ["OTHER_RETAILERS", "HISTORY", "COMPARISON", "CHEAPEST", "PUBLICATION", "RELEASE"], invalidatedBy: ["OBSERVATION_STALE", "RIGHTS_CHANGE", "DESTINATION_CHANGE", "ATLAS_STATE_CHANGE", "PREDECESSOR_STATE_CHANGED", "AUTHORIZATION_EXPIRED"] });
  }

  async execute({ authorizationId, executedBy, confirmation, executedAt = this.now() } = {}) {
    if (confirmation !== MANUAL_SNAPSHOT_EXECUTE_CONFIRMATION) throw new Error("MANUAL_CURRENT_DISPLAY_EXECUTION_CONFIRMATION_INVALID");
    text(executedBy, "MANUAL_CURRENT_DISPLAY_EXECUTED_BY_REQUIRED"); time(executedAt, "MANUAL_CURRENT_DISPLAY_EXECUTION_TIME_INVALID");
    const prior = await this.executionRepository.getExecutionByAuthorization(authorizationId);
    if (prior) return freeze({ status: "ALREADY_EXECUTED", execution: prior });
    const authorization = validateManualSnapshotExecutionAuthorization(await this.executionRepository.getAuthorization(authorizationId));
    if (Date.parse(authorization.expiresAt) <= Date.parse(executedAt)) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_EXPIRED");
    const preparation = validateManualSnapshotPreparation(await this.preparationRepository.getById(authorization.binding.preparationId));
    if (preparation.bindingDigest !== authorization.binding.preparationDigest) throw new Error("MANUAL_CURRENT_DISPLAY_PREPARATION_CHANGED");
    const state = await this.snapshotRepository.getState(), current = state.current;
    const predecessor = describeManualSnapshotPredecessor({ snapshot: current, preparation });
    await this.#revalidate({ preparation, authorization, at: executedAt, current, predecessor, requirePredecessor: true });
    const targetKey = key(preparation.binding), before = predecessor.offer;
    const nextOffer = projectPreparedManualCurrentOffer(preparation, { authorizationId });
    const unrelatedBefore = (current?.offers ?? []).filter(offer => key(offer) !== targetKey);
    const offers = [...unrelatedBefore, nextOffer];
    const sourceDigest = manualCurrentPriceDigest({ predecessorSnapshotId: predecessor.snapshotId, authorizationId, preparationId: preparation.preparationId, offers });
    const snapshot = createCurrentDisplaySnapshot({ observedAt: executedAt, importedAt: executedAt, source: { workbook: "manual-current-price-snapshot-execution", sheet: MANUAL_SNAPSHOT_EXECUTION_POLICY_VERSION, digest: sourceDigest }, offers });
    const replacement = await this.snapshotRepository.replaceIfCurrent(snapshot, { expectedCurrentSnapshotId: predecessor.snapshotId, expectedCurrentFingerprint: predecessor.snapshotFingerprint });
    const unrelatedAfter = snapshot.offers.filter(offer => key(offer) !== targetKey);
    if (manualCurrentPriceDigest(unrelatedBefore) !== manualCurrentPriceDigest(unrelatedAfter)) throw new Error("MANUAL_CURRENT_DISPLAY_UNRELATED_OFFER_CHANGED");
    const executionMaterial = { policyVersion: MANUAL_SNAPSHOT_EXECUTION_POLICY_VERSION, authorizationId, authorizationBindingDigest: authorization.authorizationBindingDigest, preparationId: preparation.preparationId, preparationDigest: preparation.bindingDigest, predecessorSnapshotId: predecessor.snapshotId, predecessorSnapshotDigest: predecessor.snapshotFingerprint, predecessorOfferFingerprint: predecessor.offerFingerprint, resultSnapshotId: snapshot.snapshotId, resultSnapshotDigest: snapshot.materialFingerprint, executedBy: executedBy.trim(), executedAt, target: { atlasProductId: preparation.binding.atlasProductId, retailerId: preparation.binding.retailerId }, delta: { offerCountBefore: current?.offers?.length ?? 0, offerCountAfter: snapshot.offers.length, targetRecordsChanged: 1, unrelatedRecordsChanged: 0, before: before === null ? null : structuredClone(before), after: structuredClone(nextOffer) } };
    const execution = { schemaVersion: "1.0", executionId: `mer_manualdisplayexec_${manualCurrentPriceDigest(executionMaterial).slice(0, 24)}`, ...executionMaterial, status: "EXECUTED", authorities: { history: false, comparison: false, cheapest: false, pick: false, publication: false, release: false } };
    await this.executionRepository.recordExecution(execution);
    return freeze({ status: "EXECUTED", execution, replacement, before, after: nextOffer });
  }

  async inspectExecution({ authorizationId } = {}) {
    const authorization = await this.inspectAuthorization({ authorizationId });
    if (!authorization.execution) return freeze({ state: authorization.state, authorization: authorization.authorization, execution: null });
    const state = await this.snapshotRepository.getState();
    return freeze({ state: "EXECUTED", authorization: authorization.authorization, execution: authorization.execution, currentSnapshotId: state.current?.snapshotId ?? null, before: authorization.execution.delta.before, after: authorization.execution.delta.after, sourceLineage: authorization.execution.delta.after?.sourceIdentity ?? null, preparationLineage: authorization.execution.delta.after?.manualExecutionLineage ?? null, itemPriceEligible: authorization.execution.delta.after?.itemPriceEligible === true, comparisonEligible: authorization.execution.delta.after?.comparisonEligible === true, preparationConsumed: true, authorizationConsumed: true, unrelatedOffersChanged: authorization.execution.delta.unrelatedRecordsChanged, downstreamAuthority: false });
  }

  async #revalidate({ preparation, authorization = null, at, current, predecessor, requirePredecessor }) {
    const b = preparation.binding;
    assertFresh(b.observedAt, at);
    const [product, retailer, destination, rights] = await Promise.all([this.productResolver(b.atlasProductId), this.retailerResolver(b.retailerId), this.destinationResolver(b.destinationId), this.rightsResolver(b.sourceId)]);
    if (!product || product.identity?.atlasProductId !== b.atlasProductId || product.governance?.lifecycleStatus !== "ACTIVE" || product.governance?.publicationStatus !== "READY") throw new Error("MANUAL_CURRENT_DISPLAY_ATLAS_NOT_ACTIVE_READY");
    if (!retailer || retailer.id !== b.retailerId || retailer.status !== "active") throw new Error("MANUAL_CURRENT_DISPLAY_RETAILER_NOT_ACTIVE");
    const destinationAssessment = assessRetailerDestinationBinding({ destination, product, retailer });
    if (!destinationAssessment.eligible || destination?.destinationId !== b.destinationId || destination?.materialFingerprint !== b.destinationBindingDigest) throw new Error("MANUAL_CURRENT_DISPLAY_DESTINATION_CHANGED");
    assertRights(rights, b);
    if (authorization) {
      const a = authorization.binding;
      if (a.preparationId !== preparation.preparationId || a.preparationDigest !== preparation.bindingDigest || a.atlasProductId !== b.atlasProductId || a.retailerId !== b.retailerId || a.sourceId !== b.sourceId || a.sourceRightsProfileDigest !== b.sourceRightsProfileDigest || a.destinationId !== b.destinationId || a.destinationBindingDigest !== b.destinationBindingDigest) throw new Error("MANUAL_CURRENT_DISPLAY_AUTHORIZATION_PREPARATION_MISMATCH");
      if (requirePredecessor && (a.expectedPredecessorSnapshotId !== predecessor.snapshotId || a.expectedPredecessorSnapshotDigest !== predecessor.snapshotFingerprint || a.expectedPredecessorOfferState !== predecessor.offerState || a.expectedPredecessorOfferFingerprint !== predecessor.offerFingerprint)) throw new Error("PREDECESSOR_STATE_CHANGED");
    }
    return freeze({ product: structuredClone(product), retailer: structuredClone(retailer), destination: structuredClone(destination), rights: structuredClone(rights), freshness: { observedAt: b.observedAt, asOf: at, ageMs: Date.parse(at) - Date.parse(b.observedAt), remainingMs: MANUAL_SNAPSHOT_FRESHNESS_MS - (Date.parse(at) - Date.parse(b.observedAt)), eligible: true }, predecessor: predecessor ?? describeManualSnapshotPredecessor({ snapshot: current, preparation }) });
  }
}
