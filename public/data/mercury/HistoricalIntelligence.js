import { evaluateHistoricalEligibility } from "./HistoricalEligibility.js";
import { validateHistoricalQuery } from "./HistoricalValidator.js";

function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; }
function norm(v) { return typeof v === "string" ? v.trim().toLowerCase() : v; }
function point(o) { return { observationId:o.observationId, observationTime:o.observationTime, atlasProductId:o.atlasProductId, retailerId:o.retailerId, marketplace:o.marketplace, price:o.offer.price, currency:o.offer.currency, condition:o.offer.condition }; }

export class HistoricalIntelligence {
    constructor({ eligibility = evaluateHistoricalEligibility } = {}) { this.eligibility = eligibility; }

    getTimeline(observations, query) {
        const report = validateHistoricalQuery(query); if (!report.valid) throw new TypeError(`Invalid historical query: ${report.errors.join(", ")}`);
        const matches = observations.filter((o) => this.eligibility(o).eligible)
            .filter((o) => norm(o.atlasProductId) === norm(query.atlasProductId))
            .filter((o) => query.currency == null || o.offer.currency === query.currency)
            .filter((o) => query.condition == null || norm(o.offer.condition) === norm(query.condition))
            .filter((o) => query.retailerId == null || norm(o.retailerId) === norm(query.retailerId))
            .filter((o) => query.marketplace == null || norm(o.marketplace) === norm(query.marketplace))
            .sort((a,b) => Date.parse(a.observationTime)-Date.parse(b.observationTime) || a.observationId.localeCompare(b.observationId))
            .map(point);
        return freeze(matches);
    }

    getPriceRange(observations, query) {
        const timeline=this.getTimeline(observations,query); if (!timeline.length) return freeze({count:0,lowest:null,highest:null});
        const lowest=timeline.reduce((a,b)=>b.price<a.price?b:a); const highest=timeline.reduce((a,b)=>b.price>a.price?b:a);
        return freeze({count:timeline.length,lowest:{...lowest},highest:{...highest}});
    }

    getAveragePrice(observations, query) {
        const timeline=this.getTimeline(observations,query); if (!timeline.length) return null;
        return timeline.reduce((sum,p)=>sum+p.price,0)/timeline.length;
    }

    getPriceMovement(observations, query) {
        const timeline=this.getTimeline(observations,query); if (timeline.length<2) return freeze({count:timeline.length,from:timeline[0]??null,to:timeline[0]??null,absolute:0,percentage:0});
        const from=timeline[0],to=timeline.at(-1),absolute=to.price-from.price,percentage=from.price===0?null:(absolute/from.price)*100;
        return freeze({count:timeline.length,from:{...from},to:{...to},absolute,percentage});
    }

    getSummary(observations, query) {
        const timeline=this.getTimeline(observations,query), range=this.getPriceRange(observations,query), averagePrice=this.getAveragePrice(observations,query), movement=this.getPriceMovement(observations,query);
        return freeze({query:{...query},count:timeline.length,first:timeline[0]??null,latest:timeline.at(-1)??null,lowest:range.lowest,highest:range.highest,averagePrice,movement});
    }
}
export default new HistoricalIntelligence();
