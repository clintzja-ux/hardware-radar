import defaultPublicationPolicy from "./PublicationPolicy.js";
import { evaluatePublicationEligibility } from "./PublicationEligibility.js";

const SNAPSHOT_SCHEMA_VERSION = "1.0";
const SCOPES = Object.freeze(["overall", "ddr5", "ddr4", "sodimm"]);

function productMatchesScope(product, scope) {
    if (scope === "overall") return product?.identity?.productType === "ram";
    const ram = product?.extension?.data;
    if (!ram) return false;
    if (scope === "ddr5") return ram.classification?.memoryType === "DDR5" && ram.classification?.formFactor !== "SODIMM";
    if (scope === "ddr4") return ram.classification?.memoryType === "DDR4" && ram.classification?.formFactor !== "SODIMM";
    if (scope === "sodimm") return ram.classification?.formFactor === "SODIMM";
    return false;
}

function publishedOffer({ observation, product, retailer, freshness, confidence }) {
    const ram = product.extension.data;
    return Object.freeze({
        atlasProductId: product.identity.atlasProductId,
        observationId: observation.observationId,
        retailerId: retailer.id,
        brand: product.identity.brand,
        displayName: product.identity.displayName,
        modelName: product.identity.productFamily || product.identity.modelName,
        memoryType: ram.classification.memoryType,
        formFactor: ram.classification.formFactor,
        capacityGb: ram.capacity.capacityGb,
        dataRateMtps: ram.performance.dataRateMtps,
        price: observation.offer.price,
        currency: observation.offer.currency,
        retailer: retailer.name,
        sourceUrl: observation.offer.sourceUrl,
        observedAt: observation.observationTime,
        freshness: freshness.status,
        confidence: confidence.status
    });
}

export class MarketPublicationService {
    constructor({ mercury, policy = defaultPublicationPolicy } = {}) {
        if (!mercury || typeof mercury.evaluateConfidence !== "function") throw new TypeError("MarketPublicationService requires Mercury.");
        this.mercury = mercury;
        this.policy = policy;
    }

    async createSnapshot({ observations, qualifiedCandidates = null, products, retailers, generatedAt }) {
        if (!Array.isArray(observations) || !Array.isArray(products) || !Array.isArray(retailers)) throw new TypeError("Publication inputs must be arrays.");
        if (qualifiedCandidates !== null && !Array.isArray(qualifiedCandidates)) throw new TypeError("qualifiedCandidates must be null or an array.");
        if (!Number.isFinite(Date.parse(generatedAt))) throw new TypeError("generatedAt must be a valid ISO 8601 date-time.");

        const productsById = new Map(products.map((product) => [product.identity.atlasProductId, product]));
        const retailersById = new Map(retailers.map((retailer) => [retailer.id, retailer]));
        const eligible = [];

        if (qualifiedCandidates !== null) for (const candidate of qualifiedCandidates) {
            const observation = candidate?.observation;
            const qualification = candidate?.currentMarketQualification;
            const product = productsById.get(observation?.atlasProductId) ?? null;
            const retailer = retailersById.get(observation?.retailerId) ?? null;
            if (qualification?.qualified !== true || qualification.observationId !== observation?.observationId || !product || !retailer) continue;
            eligible.push({ observation, product, retailer, freshness: qualification.freshness, confidence: qualification.confidence });
        }

        if (qualifiedCandidates === null) for (const observation of observations) {
            const product = productsById.get(observation.atlasProductId) ?? null;
            const retailer = retailersById.get(observation.retailerId) ?? null;
            let freshness = null;
            let confidence = null;
            try {
                freshness = this.mercury.evaluateFreshness(observation, { evaluatedAt: generatedAt });
                confidence = this.mercury.evaluateConfidence(observation, { evaluatedAt: generatedAt });
            } catch {
                continue;
            }
            const eligibility = evaluatePublicationEligibility(observation, { product, retailer, freshness, confidence, policy: this.policy });
            if (eligibility.eligible) eligible.push({ observation, product, retailer, freshness, confidence });
        }

        const scopes = {};
        for (const scope of SCOPES) {
            const candidates = eligible
                .filter((candidate) => productMatchesScope(candidate.product, scope))
                .sort((a, b) => a.observation.offer.price - b.observation.offer.price || Date.parse(b.observation.observationTime) - Date.parse(a.observation.observationTime));
            const retailerCount = new Set(candidates.map((candidate) => candidate.retailer.id)).size;
            scopes[scope] = candidates.length === 0
                ? Object.freeze({ status: "INSUFFICIENT_DATA", cheapest: null, coverage: Object.freeze({ eligibleObservations: 0, retailersRepresented: 0 }) })
                : Object.freeze({ status: "AVAILABLE", cheapest: publishedOffer(candidates[0]), coverage: Object.freeze({ eligibleObservations: candidates.length, retailersRepresented: retailerCount }) });
        }

        return Object.freeze({
            schemaVersion: SNAPSHOT_SCHEMA_VERSION,
            generatedAt,
            publicationPolicy: Object.freeze({ policyId: this.policy.policyId, version: this.policy.version }),
            scopes: Object.freeze(scopes)
        });
    }
}

export { SNAPSHOT_SCHEMA_VERSION, SCOPES };
export default MarketPublicationService;
