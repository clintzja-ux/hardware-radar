import defaultPublicationPolicy from "./PublicationPolicy.js";
import { evaluatePublicationEligibility } from "./PublicationEligibility.js";

const SNAPSHOT_SCHEMA_VERSION = "1.0";
const SCOPES = Object.freeze(["overall", "ddr5", "ddr4", "sodimm"]);
export const MAX_COMPARISON_OFFERS = 5;
const LAUNCH_REGION = "US";

function productMatchesScope(product, scope) {
    const ram = product?.extension?.data;
    if (!ram) return false;
    const classification = ram.classification;
    const laptop = classification?.formFactor === "SO_DIMM" && classification?.applicationClass === "LAPTOP";
    const desktop = classification?.formFactor === "DIMM" && classification?.applicationClass === "DESKTOP";
    if (scope === "overall") return product?.identity?.productType === "ram" && ["DDR4", "DDR5"].includes(classification?.memoryType) && (desktop || laptop);
    if (scope === "ddr5") return classification?.memoryType === "DDR5" && desktop;
    if (scope === "ddr4") return classification?.memoryType === "DDR4" && desktop;
    if (scope === "sodimm") return ["DDR4", "DDR5"].includes(classification?.memoryType) && laptop;
    return false;
}

function publiclyComparable({ observation, product, retailer }) {
    if (product?.identity?.productType !== "ram" || retailer?.status !== "active") return false;
    if (!Array.isArray(retailer.regions) || !retailer.regions.includes(LAUNCH_REGION)) return false;
    if (!Array.isArray(retailer.supportedCurrencies) || !retailer.supportedCurrencies.includes(observation?.offer?.currency)) return false;
    if (!Number.isFinite(observation?.offer?.price) || observation.offer.price <= 0) return false;
    if (observation.offer.bundle?.isBundle === true || observation.offer.bundle?.status === "BUNDLE") return false;
    if (observation.offer.conditionalPrice?.isConditional === true || observation.offer.conditionalPrice?.status === "CONDITIONAL") return false;
    return true;
}

function publishedOffer({ observation, product, retailer, freshness, confidence }) {
    const ram = product.extension.data;
    const shipping = observation.offer.shipping;
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
        listedPrice: observation.offer.price,
        priceBasis: "LISTED_PRICE",
        currency: observation.offer.currency,
        shipping: Object.freeze({
            known: shipping?.costKnown === true,
            amount: shipping?.costKnown === true ? shipping.cost : null,
            currency: shipping?.costKnown === true ? shipping.currency : null
        }),
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
            if (qualification?.qualified !== true || qualification.observationId !== observation?.observationId || !product || !retailer || !publiclyComparable({ observation, product, retailer })) continue;
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
            if (eligibility.eligible && publiclyComparable({ observation, product, retailer })) eligible.push({ observation, product, retailer, freshness, confidence });
        }

        const scopes = {};
        for (const scope of SCOPES) {
            const seen = new Set();
            const candidates = eligible
                .filter((candidate) => productMatchesScope(candidate.product, scope))
                .sort((a, b) => a.observation.offer.price - b.observation.offer.price || Date.parse(b.observation.observationTime) - Date.parse(a.observation.observationTime) || a.observation.observationId.localeCompare(b.observation.observationId))
                .filter(candidate => !seen.has(candidate.observation.observationId) && seen.add(candidate.observation.observationId));
            const retailerCount = new Set(candidates.map((candidate) => candidate.retailer.id)).size;
            const projected = candidates.slice(0, MAX_COMPARISON_OFFERS).map(publishedOffer);
            scopes[scope] = candidates.length === 0
                ? Object.freeze({ status: "INSUFFICIENT_DATA", cheapest: null, alternatives: Object.freeze([]), coverage: Object.freeze({ eligibleObservations: 0, retailersRepresented: 0, displayedOffers: 0 }) })
                : Object.freeze({ status: "AVAILABLE", cheapest: projected[0], alternatives: Object.freeze(projected.slice(1)), coverage: Object.freeze({ eligibleObservations: candidates.length, retailersRepresented: retailerCount, displayedOffers: projected.length }) });
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
