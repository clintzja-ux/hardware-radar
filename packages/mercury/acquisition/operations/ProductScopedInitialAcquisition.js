import crypto from "node:crypto";

const PRODUCT_ID=/^ram_[a-z0-9_]+$/;
function freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value}

export function selectProductScopedInitialAcquisitionCandidate({atlasProductId,product,candidates}={}){
 if(typeof atlasProductId!=="string"||!PRODUCT_ID.test(atlasProductId))throw new Error("INITIAL_ACQUISITION_SELECTOR_INVALID");
 if(!product||product.identity?.atlasProductId!==atlasProductId)throw new Error("INITIAL_ACQUISITION_ATLAS_PRODUCT_NOT_FOUND_OR_SUBSTITUTED");
 if(product.governance?.lifecycleStatus!=="ACTIVE"||product.governance?.publicationStatus!=="READY")throw new Error("INITIAL_ACQUISITION_PRODUCT_NOT_ACTIVE_READY");
 if(!Array.isArray(candidates))throw new Error("INITIAL_ACQUISITION_CANDIDATES_INVALID");
 const matches=candidates.filter(candidate=>candidate?.atlasProductId===atlasProductId);
 if(matches.length!==1)throw new Error(matches.length>1?"INITIAL_ACQUISITION_CANDIDATE_AMBIGUOUS":"INITIAL_ACQUISITION_CANDIDATE_NOT_FOUND");
 const candidate=matches[0],mpn=product.identity?.manufacturerPartNumber;
 if(candidate.candidateId!==`atlas:${atlasProductId}:products`)throw new Error("INITIAL_ACQUISITION_PRODUCT_SUBSTITUTION");
 if(typeof mpn!=="string"||!mpn||candidate.execution?.kind!=="PRODUCTS"||candidate.execution?.keyword!==mpn)throw new Error("INITIAL_ACQUISITION_MPN_SUBSTITUTION");
 if(candidate.lastObservedAt!=null)throw new Error("INITIAL_ACQUISITION_REQUIRES_HISTORICAL_REFRESH");
 const atlasBinding={atlasProductId,manufacturerPartNumber:mpn,recordRevision:product.identity?.recordRevision??null};
 return freeze({...structuredClone(candidate),atlasBinding,bindingDigest:crypto.createHash("sha256").update(JSON.stringify(atlasBinding)).digest("hex"),execution:{...structuredClone(candidate.execution),provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING"}});
}
