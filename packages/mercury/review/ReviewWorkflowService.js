import { createReviewDecision } from "./ObservationReviewDecision.js";

function freeze(value) { return Object.freeze(value); }

export class ReviewWorkflowService {
  constructor({ reviewRepository, reviewService } = {}) {
    if (!reviewRepository) throw new TypeError("reviewRepository is required.");
    if (!reviewService) throw new TypeError("reviewService is required.");
    this.reviewRepository = reviewRepository;
    this.reviewService = reviewService;
  }

  async record(input = {}) {
    for(const key of Object.keys(input))if(!["observationId","decision","reviewedBy","reviewedAt","reasonCodes","notes","governance"].includes(key))throw new Error(`REVIEW_WORKFLOW_CALLER_SUBSTITUTION_FORBIDDEN:${key}`);
    const { observationId, decision, reviewedBy, reviewedAt, reasonCodes = [], notes = "", governance }=input;
    const reviewItem = await this.reviewService.getReviewItem(observationId, { asOf: reviewedAt });
    if (!reviewItem.reviewable) {
      throw new Error(`Observation is not reviewable: ${reviewItem.reasons?.join(", ") || reviewItem.status}`);
    }

    const draft = createReviewDecision({ observationId, decision, reviewedBy, reviewedAt, reasonCodes, notes, governance });
    return this.reviewRepository.recordDecision(draft);
  }

  async getState(observationId) {
    const history = await this.reviewRepository.getHistoryForObservation(observationId);
    const effectiveDecision = history.length ? history[history.length - 1] : null;
    return freeze({
      observationId,
      effectiveDecision,
      history
    });
  }
}

export default ReviewWorkflowService;
