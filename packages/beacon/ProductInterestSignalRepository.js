import {createProductInterestSignal} from "./ProductInterestSignal.js";
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
export class ProductInterestSignalRepository{
 constructor({signals=[],productRepository}={}){if(!Array.isArray(signals)||!productRepository?.getAll)throw new TypeError("PRODUCT_INTEREST_REPOSITORY_DEPENDENCIES_REQUIRED");this.raw=structuredClone(signals);this.productRepository=productRepository;this.loaded=null;}
 async getAll(){this.loaded??=(async()=>{const signals=this.raw.map(createProductInterestSignal),ids=signals.map(x=>x.signalId);if(new Set(ids).size!==ids.length)throw new Error("PRODUCT_INTEREST_SIGNAL_ID_DUPLICATE");const products=await this.productRepository.getAll(),known=new Set(products.map(x=>x?.identity?.atlasProductId));if(signals.some(x=>!known.has(x.atlasProductId)))throw new Error("PRODUCT_INTEREST_ATLAS_PRODUCT_UNKNOWN");return freeze([...signals].sort((a,b)=>a.signalId.localeCompare(b.signalId)));})();return this.loaded;}
 async getByProductId(atlasProductId){return freeze((await this.getAll()).filter(x=>x.atlasProductId===atlasProductId));}
}
export default ProductInterestSignalRepository;
