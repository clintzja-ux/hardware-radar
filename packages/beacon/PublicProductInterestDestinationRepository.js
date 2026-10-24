import {validatePublicCurrentRetailProjection} from "../mercury/current-display/PublicCurrentRetailProjection.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const categoriesFor=offer=>freeze([...(offer.formFactor==="SO_DIMM"?["SO_DIMM"]:[offer.ddrGeneration]),"OVERALL"]);

export class PublicProductInterestDestinationRepository{
 constructor({publicCurrentRetailProjection}={}){const report=validatePublicCurrentRetailProjection(publicCurrentRetailProjection);if(!report.valid)throw new TypeError(`BEACON_PUBLIC_DESTINATION_PROJECTION_INVALID:${report.errors.join(",")}`);this.byDestinationId=new Map();for(const product of publicCurrentRetailProjection.products)for(const offer of product.offers){const projected=freeze({destinationId:offer.destinationId,atlasProductId:offer.atlasProductId,retailerId:offer.retailerId,catalogCategories:categoriesFor(offer),freshness:offer.freshness,eligible:true});const matches=this.byDestinationId.get(offer.destinationId)??[];matches.push(projected);this.byDestinationId.set(offer.destinationId,matches);}}
 async getByDestinationId(destinationId){return freeze(structuredClone(this.byDestinationId.get(destinationId)??[]));}
}

export default PublicProductInterestDestinationRepository;
