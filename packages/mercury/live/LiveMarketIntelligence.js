import defaultLiveMarketPolicy from "./LiveMarketPolicy.js";
import { evaluateLiveMarketEligibility } from "./LiveMarketEligibility.js";

function freeze(value) { return Object.freeze(value); }

export class LiveMarketIntelligence {
  constructor({ mercury, policy = defaultLiveMarketPolicy } = {}) {
    if (!mercury || typeof mercury.evaluateFreshness !== "function" || typeof mercury.evaluateConfidence !== "function") {
      throw new TypeError("LiveMarketIntelligence requires Mercury.");
    }
    this.mercury = mercury;
    this.policy = policy;
  }

  async evaluate({ observations, products, retailers, asOf }) {
    if (!Array.isArray(observations) || !Array.isArray(products) || !Array.isArray(retailers)) {
      throw new TypeError("Live market inputs must be arrays.");
    }
    if (!Number.isFinite(Date.parse(asOf))) throw new TypeError("asOf must be a valid ISO 8601 date-time.");

    const productsById = new Map(products.map((product) => [product?.identity?.atlasProductId, product]));
    const retailersById = new Map(retailers.map((retailer) => [retailer?.id, retailer]));
    const eligible = [];
    const excluded = [];

    for (const observation of observations) {
      const product = productsById.get(observation?.atlasProductId) ?? null;
      const retailer = retailersById.get(observation?.retailerId) ?? null;
      let freshness = null;
      let confidence = null;
      let eligibility;
      try {
        freshness = this.mercury.evaluateFreshness(observation, { evaluatedAt: asOf });
        confidence = this.mercury.evaluateConfidence(observation, { evaluatedAt: asOf });
        eligibility = evaluateLiveMarketEligibility(observation, { product, retailer, freshness, confidence, evaluatedAt: asOf, policy: this.policy });
      } catch {
        eligibility = freeze({ eligible: false, reasons: freeze(["LIVE_EVALUATION_FAILED"]) });
      }

      const candidate = freeze({ observation, product, retailer, freshness, confidence, eligibility });
      if (eligibility.eligible) eligible.push(candidate);
      else excluded.push(candidate);
    }

    eligible.sort((a, b) =>
      a.observation.offer.price - b.observation.offer.price ||
      Date.parse(b.observation.observationTime) - Date.parse(a.observation.observationTime) ||
      a.observation.observationId.localeCompare(b.observation.observationId)
    );

    return freeze({
      status: eligible.length ? "AVAILABLE" : "INSUFFICIENT_DATA",
      asOf,
      cheapest: eligible[0] ?? null,
      eligible: freeze(eligible),
      excluded: freeze(excluded),
      policy: freeze({ policyId: this.policy.policyId, version: this.policy.version })
    });
  }
}

export default LiveMarketIntelligence;
