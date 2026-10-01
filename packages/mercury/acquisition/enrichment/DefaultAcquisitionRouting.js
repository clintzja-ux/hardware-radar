import {deriveLayeredProductsIdentity,PRODUCTS_IDENTITY_POLICY_VERSION,ATLAS_IDENTITY_STATES,PROVIDER_IDENTITY_STATES} from './DataForSeoProductCandidateResolver.js';
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const hasIdentity=value=>Boolean(value?.productId||value?.dataDocId||value?.gid);
const hasManufacturerMatch=candidate=>Array.isArray(candidate?.signals)&&candidate.signals.some(signal=>signal?.name==="BRAND"&&signal?.matched===true);

export const DEFAULT_ACQUISITION_ROUTES=Object.freeze({READY_FOR_SELLERS:"READY_FOR_SELLERS",READY_FOR_PRODUCT_INFO:"READY_FOR_PRODUCT_INFO",MANUAL_PROVIDER_SELECTION:"MANUAL_PROVIDER_SELECTION",MANUAL_IDENTITY_REVIEW:"MANUAL_IDENTITY_REVIEW",UNRESOLVED:"UNRESOLVED"});

export function classifyDefaultAcquisitionRoute({resolution,directSellersLineageCertified=false}={}){
  if(!resolution||typeof resolution!=="object")throw new TypeError("PRODUCTS_RESOLUTION_REQUIRED");
  const candidates=Array.isArray(resolution.candidates)?resolution.candidates:[],recommended=resolution.recommendedCandidate??null;
  const exactCandidates=candidates.filter(candidate=>candidate?.exactMpnMatch===true&&candidate?.outcome!=="REJECTED"&&(!Array.isArray(candidate?.contradictions)||candidate.contradictions.length===0)&&hasIdentity(candidate.item));
  const layered=resolution.layeredIdentity?.policyVersion===PRODUCTS_IDENTITY_POLICY_VERSION?resolution.layeredIdentity:deriveLayeredProductsIdentity({candidates});
  const relevant=recommended?[recommended]:exactCandidates.length?exactCandidates:candidates.slice(0,1),contradictions=[...new Set(relevant.flatMap(candidate=>Array.isArray(candidate?.contradictions)?candidate.contradictions:[]))];
  let materialIdentity="AMBIGUOUS",desiredRoute=DEFAULT_ACQUISITION_ROUTES.UNRESOLVED,reasons=[];
  if(layered.atlasIdentity.state===ATLAS_IDENTITY_STATES.CONTRADICTED){materialIdentity="CONTRADICTED";desiredRoute=DEFAULT_ACQUISITION_ROUTES.MANUAL_IDENTITY_REVIEW;reasons=["MATERIAL_IDENTITY_CONTRADICTION",...contradictions];}
  else if(layered.atlasIdentity.state===ATLAS_IDENTITY_STATES.CORROBORATED&&[PROVIDER_IDENTITY_STATES.UNIQUE_DOCUMENT_ANCHOR,PROVIDER_IDENTITY_STATES.SHARED_DOCUMENTED_PRODUCT].includes(layered.providerIdentity.state)&&exactCandidates.length>0&&exactCandidates.every(hasManufacturerMatch)){materialIdentity="ESTABLISHED";desiredRoute=DEFAULT_ACQUISITION_ROUTES.READY_FOR_SELLERS;reasons=[layered.providerIdentity.state===PROVIDER_IDENTITY_STATES.SHARED_DOCUMENTED_PRODUCT?"ATLAS_IDENTITY_CORROBORATED_SHARED_DOCUMENTED_PROVIDER_PRODUCT":"EXACT_MPN_MANUFACTURER_MATCH_UNIQUE_NON_CONTRADICTORY_PROVIDER_IDENTITY"];}
  else if(layered.atlasIdentity.state===ATLAS_IDENTITY_STATES.CORROBORATED){materialIdentity="CORROBORATED";desiredRoute=DEFAULT_ACQUISITION_ROUTES.UNRESOLVED;reasons=[...layered.providerIdentity.reasons];}
  else if(candidates.length){desiredRoute=DEFAULT_ACQUISITION_ROUTES.MANUAL_IDENTITY_REVIEW;reasons=["PRODUCTS_IDENTITY_EVIDENCE_INSUFFICIENT"];}
  else reasons=["NO_PROVIDER_CANDIDATE"];
  const blocked=desiredRoute===DEFAULT_ACQUISITION_ROUTES.READY_FOR_SELLERS&&!directSellersLineageCertified;
  return freeze({schemaVersion:"1.1",identityPolicyVersion:PRODUCTS_IDENTITY_POLICY_VERSION,materialIdentity,atlasIdentity:layered.atlasIdentity,providerIdentity:layered.providerIdentity,providerAnchor:layered.providerIdentity.anchor,desiredRoute,executableRoute:blocked?DEFAULT_ACQUISITION_ROUTES.READY_FOR_PRODUCT_INFO:desiredRoute,reasons,blockers:blocked?["DIRECT_SELLERS_LINEAGE_NOT_CERTIFIED"]:[],directSellersLineageCertified:Boolean(directSellersLineageCertified),normalizationAuthority:"ATLAS_EXPLICIT_IDENTITY_AND_ALIASES",fuzzyMatching:false,providerSpendAuthorized:false,actualSpendUsd:0});
}
