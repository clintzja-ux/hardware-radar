import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { manualCurrentPriceDigest, prepareManualCurrentPriceObservation } from "../current-display/ManualCurrentPricePreparation.js";

const RETAILERS = Object.freeze({
  "RETAILER-0001": Object.freeze({ retailer: "AMAZON", sourceId: "AMAZON_MANUAL_PUBLISHER_OBSERVATION" }),
  "RETAILER-0004": Object.freeze({ retailer: "NEWEGG", sourceId: "NEWEGG_MANUAL_PUBLISHER_OBSERVATION" })
});
const required = (value, code) => { if (typeof value !== "string" || !value.trim()) throw new Error(code); return value.trim(); };

export class ForgeManualPriceEntryService {
  constructor({ preparationRepository, routineProcessingService, snapshotRepository, listProducts, listRetailers, listDestinations, now = () => new Date().toISOString() } = {}) {
    if (!preparationRepository?.record || !routineProcessingService?.processCohort || !snapshotRepository?.getState || !listProducts || !listRetailers || !listDestinations) throw new TypeError("FORGE_MANUAL_PRICE_OWNERS_REQUIRED");
    Object.assign(this, { preparationRepository, routineProcessingService, snapshotRepository, listProducts, listRetailers, listDestinations, now });
  }

  async options() {
    const [products, destinations] = await Promise.all([this.listProducts(), this.listDestinations()]);
    return Object.freeze({ observedAtDefault: this.now(), products: products.filter(product => product.governance?.lifecycleStatus === "ACTIVE" && product.governance?.publicationStatus === "READY").map(product => Object.freeze({
      atlasProductId: product.identity.atlasProductId,
      displayName: product.identity.displayName,
      manufacturerPartNumber: product.identity.manufacturerPartNumber,
      destinations: destinations.filter(destination => destination.atlasProductId === product.identity.atlasProductId && destination.status === "ACTIVE" && RETAILERS[destination.retailerId]).map(destination => Object.freeze({ destinationId: destination.destinationId, retailerId: destination.retailerId, retailer: RETAILERS[destination.retailerId].retailer, marketplace: destination.marketplace, retailerListingId: destination.retailerListingId }))
    })).filter(product => product.destinations.length) });
  }

  async submit({ payload, operatorId } = {}) {
    const submittedAt = this.now(), atlasProductId = required(payload?.atlasProductId, "MANUAL_CURRENT_PRICE_PRODUCT_REQUIRED"), destinationId = required(payload?.destinationId, "MANUAL_CURRENT_PRICE_DESTINATION_REQUIRED");
    const [products, retailers, destinations, state] = await Promise.all([this.listProducts(), this.listRetailers(), this.listDestinations(), this.snapshotRepository.getState()]);
    const product = products.find(value => value.identity.atlasProductId === atlasProductId), destination = destinations.find(value => value.destinationId === destinationId), retailer = retailers.find(value => value.id === destination?.retailerId), governed = RETAILERS[destination?.retailerId];
    if (!governed) throw new Error("MANUAL_CURRENT_PRICE_RETAILER_INVALID");
    const shippingUsd = payload.shippingKnown === false ? "UNKNOWN" : Number(payload.shippingUsd);
    const feesUsd = payload.feesKnown === true ? Number(payload.feesUsd) : "UNKNOWN";
    const evidenceMaterial = { atlasProductId, destinationId, itemPriceUsd: Number(payload.itemPriceUsd), shippingUsd, feesUsd, availability: payload.availability, condition: payload.condition, seller: payload.seller, observedAt: payload.observedAt, operatorId };
    const input = {
      retailer: governed.retailer, atlasProductId, destinationId,
      ...(governed.retailer === "AMAZON" ? { governedAsin: destination.retailerListingId } : {}),
      itemPriceUsd: Number(payload.itemPriceUsd), currency: "USD", availability: required(payload.availability, "AVAILABILITY_INVALID"), condition: required(payload.condition, "CONDITION_INVALID"), seller: required(payload.seller, "SELLER_INVALID"), shippingUsd, feesUsd,
      observedAt: required(payload.observedAt, "OBSERVATION_TIME_INVALID"), observedBy: operatorId,
      evidenceReference: `forge:operator-attestation:${manualCurrentPriceDigest(evidenceMaterial)}`,
      evidenceNotes: "Operator-attested observation entered through authenticated Forge.",
      operatorEvidence: { acquisitionMode: "MANUAL", rawCondition: payload.condition, rawShipping: shippingUsd, rawSeller: payload.seller, enteredObservedAt: payload.observedAt, submittedForProcessing: true }
    };
    const preparation = prepareManualCurrentPriceObservation({ input, product, retailer, destination, rightsProfile: defaultSourceRightsRegistry.require(governed.sourceId), preparedAt: submittedAt, currentSnapshot: state.current });
    const recorded = await this.preparationRepository.record(preparation);
    let cohort;
    try { cohort = await this.routineProcessingService.processCohort({ preparationIds: [preparation.preparationId], processedAt: submittedAt, processedBy: operatorId }); }
    catch (error) { return Object.freeze({ status: "REQUIRES_REVIEW", outcome: "HISTORY_NOT_RETAINED", preparationStatus: recorded.status, preparationId: preparation.preparationId, retailer: governed.retailer, atlasProductId, current: { status: "NOT_PROCESSED" }, history: { status: "NOT_PROCESSED" }, comparison: null, exceptions: [String(error?.message ?? error).split(":")[0]], nextOperatorAction: "REVIEW_SAVED_PREPARATION", publicationAuthority: false, cheapestAuthority: false, pickAuthority: false }); }
    const result = cohort.results[0];
    const historyRetained = ["RETAINED", "ALREADY_RETAINED"].includes(result.history?.status);
    const currentNotUpdated = historyRetained && ["STALE_NOT_CURRENT", "REVIEW_REQUIRED", "NOT_ELIGIBLE"].includes(result.current?.status);
    const needsReview = ["REVIEW_REQUIRED", "FAILED_SAFE"].includes(result.status) || !historyRetained;
    const status = needsReview ? "REQUIRES_REVIEW" : result.status === "ALREADY_PROCESSED" ? "ALREADY_PROCESSED" : "PROCESSED";
    const outcome = needsReview ? "HISTORY_NOT_RETAINED" : currentNotUpdated ? "HISTORY_RETAINED_CURRENT_NOT_UPDATED" : "CURRENT_AND_HISTORY_PROCESSED";
    return Object.freeze({ status, outcome, preparationStatus: recorded.status, preparationId: preparation.preparationId, retailer: governed.retailer, atlasProductId, current: result.current, history: result.history, comparison: result.comparison ?? null, exceptions: result.exceptions, nextOperatorAction: result.nextOperatorAction, publicationAuthority: false, cheapestAuthority: false, pickAuthority: false });
  }
}
