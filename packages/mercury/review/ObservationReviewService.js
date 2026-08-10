import { PAYLOAD_STATUSES } from "../retention/RetentionPolicy.js";

export const REVIEW_ITEM_STATUSES = Object.freeze({
  AVAILABLE: "AVAILABLE",
  PAYLOAD_PURGED: "PAYLOAD_PURGED",
  NOT_FOUND: "NOT_FOUND"
});

function freeze(value) { return Object.freeze(value); }
function clone(value) { return structuredClone(value); }

function safePayloadSummary(payload) {
  if (!payload) return null;
  return freeze({
    observationId: payload.observationId,
    atlasProductId: payload.atlasProductId,
    retailerId: payload.retailerId,
    marketplace: payload.marketplace,
    observationTime: payload.observationTime,
    sourceMethod: payload.sourceMethod,
    lifecycleStatus: payload.lifecycleStatus,
    validationStatus: payload.validationStatus,
    offer: freeze({
      price: payload.offer?.price ?? null,
      currency: payload.offer?.currency ?? null,
      availability: payload.offer?.availability ?? null,
      condition: payload.offer?.condition ?? null,
      sellerType: payload.offer?.sellerType ?? null,
      sourceUrl: payload.offer?.sourceUrl ?? null
    })
  });
}

function auditSummary(envelope) {
  if (!envelope) return null;
  return freeze({
    observationId: envelope.observationId,
    atlasProductId: envelope.atlasProductId,
    retailerId: envelope.retailerId,
    marketplace: envelope.marketplace,
    observationTime: envelope.observationTime,
    sourceMethod: envelope.sourceMethod,
    lifecycleStatus: envelope.lifecycleStatus,
    validationStatus: envelope.validationStatus,
    provenance: freeze(clone(envelope.provenance ?? {})),
    compliance: freeze(clone(envelope.compliance ?? {})),
    storage: freeze(clone(envelope.storage ?? {}))
  });
}

export class ObservationReviewService {
  constructor({ acceptanceRepository } = {}) {
    if (!acceptanceRepository) throw new TypeError("acceptanceRepository is required.");
    this.acceptanceRepository = acceptanceRepository;
  }

  async getReviewItem(observationId, { asOf = new Date().toISOString() } = {}) {
    if (typeof observationId !== "string" || observationId.trim() === "") throw new TypeError("observationId is required.");
    if (!Number.isFinite(Date.parse(asOf))) throw new TypeError("asOf must be a valid ISO date-time.");

    const audit = await this.acceptanceRepository.getAuditById(observationId);
    if (!audit) return freeze({ status: REVIEW_ITEM_STATUSES.NOT_FOUND, observationId, reviewable: false, reasons: freeze(["OBSERVATION_NOT_FOUND"]) });

    const payload = await this.acceptanceRepository.getById(observationId, { asOf });
    const refreshedAudit = await this.acceptanceRepository.getAuditById(observationId);
    const payloadStatus = refreshedAudit?.storage?.payloadStatus ?? audit.storage?.payloadStatus ?? null;
    if (!payload || payloadStatus === PAYLOAD_STATUSES.PURGED) {
      return freeze({
        status: REVIEW_ITEM_STATUSES.PAYLOAD_PURGED,
        observationId,
        reviewable: false,
        reasons: freeze(["LICENSED_PAYLOAD_UNAVAILABLE"]),
        audit: auditSummary(refreshedAudit ?? audit),
        observation: null
      });
    }

    return freeze({
      status: REVIEW_ITEM_STATUSES.AVAILABLE,
      observationId,
      reviewable: true,
      reasons: freeze([]),
      audit: auditSummary(refreshedAudit ?? audit),
      observation: safePayloadSummary(payload)
    });
  }
}

export default ObservationReviewService;
