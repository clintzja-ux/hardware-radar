const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const hasIdentity=value=>Boolean(value?.productId||value?.dataDocId||value?.gid);
const hasManufacturerMatch=candidate=>Array.isArray(candidate?.signals)&&candidate.signals.some(signal=>signal?.name==="BRAND"&&signal?.matched===true);

export const DEFAULT_ACQUISITION_ROUTES=Object.freeze({READY_FOR_SELLERS:"READY_FOR_SELLERS",READY_FOR_PRODUCT_INFO:"READY_FOR_PRODUCT_INFO",MANUAL_PROVIDER_SELECTION:"MANUAL_PROVIDER_SELECTION",MANUAL_IDENTITY_REVIEW:"MANUAL_IDENTITY_REVIEW",UNRESOLVED:"UNRESOLVED"});

export function classifyDefaultAcquisitionRoute({resolution,directSellersLineageCertified=false}={}){
  if(!resolution||typeof resolution!=="object")throw new TypeError("PRODUCTS_RESOLUTION_REQUIRED");
  const candidates=Array.isArray(resolution.candidates)?resolution.candidates:[],recommended=resolution.recommendedCandidate??null;
  const exactCandidates=candidates.filter(candidate=>candidate?.exactMpnMatch===true&&hasIdentity(candidate.item));
  const relevant=recommended?[recommended]:exactCandidates.length?exactCandidates:candidates.slice(0,1);
  const contradictions=[...new Set(relevant.flatMap(candidate=>Array.isArray(candidate?.contradictions)?candidate.contradictions:[]))];
  let materialIdentity="AMBIGUOUS",desiredRoute=DEFAULT_ACQUISITION_ROUTES.UNRESOLVED,reasons=[];
  if(contradictions.length){materialIdentity="CONTRADICTED";desiredRoute=DEFAULT_ACQUISITION_ROUTES.MANUAL_IDENTITY_REVIEW;reasons=["MATERIAL_IDENTITY_CONTRADICTION",...contradictions];}
  else if(resolution.recommendationStatus==="RECOMMENDED"&&recommended?.exactMpnMatch===true&&hasIdentity(recommended.item)&&hasManufacturerMatch(recommended)&&exactCandidates.length===1){materialIdentity="ESTABLISHED";desiredRoute=DEFAULT_ACQUISITION_ROUTES.READY_FOR_SELLERS;reasons=["EXACT_MPN_MANUFACTURER_MATCH_UNIQUE_NON_CONTRADICTORY_PROVIDER_IDENTITY"];}
  else if(resolution.recommendationStatus==="AMBIGUOUS"&&exactCandidates.length>1){desiredRoute=DEFAULT_ACQUISITION_ROUTES.MANUAL_PROVIDER_SELECTION;reasons=["MULTIPLE_MATERIALLY_COMPATIBLE_PROVIDER_IDENTITIES"];}
  else if(candidates.length){desiredRoute=DEFAULT_ACQUISITION_ROUTES.MANUAL_IDENTITY_REVIEW;reasons=["PRODUCTS_IDENTITY_EVIDENCE_INSUFFICIENT"];}
  else reasons=["NO_PROVIDER_CANDIDATE"];
  const blocked=desiredRoute===DEFAULT_ACQUISITION_ROUTES.READY_FOR_SELLERS&&!directSellersLineageCertified;
  return freeze({schemaVersion:"1.0",materialIdentity,desiredRoute,executableRoute:blocked?DEFAULT_ACQUISITION_ROUTES.READY_FOR_PRODUCT_INFO:desiredRoute,reasons,blockers:blocked?["DIRECT_SELLERS_LINEAGE_NOT_CERTIFIED"]:[],directSellersLineageCertified:Boolean(directSellersLineageCertified),normalizationAuthority:"ATLAS_EXPLICIT_IDENTITY_AND_ALIASES",fuzzyMatching:false,providerSpendAuthorized:false,actualSpendUsd:0});
}
