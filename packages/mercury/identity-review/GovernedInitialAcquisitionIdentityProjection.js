import crypto from "node:crypto";
import { assessDataForSeoProductEvidenceAgainstAtlas } from "../resolution/dataforseo/DataForSeoAtlasResolver.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const hash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const identity=value=>({productId:value?.productId??value?.product_id??null,dataDocId:value?.dataDocId??value?.data_docid??null,gid:value?.gid??null});
const same=(a,b)=>a!=null&&b!=null&&String(a)===String(b);

function sellerAssessmentInput({sellerItem,record}={}){
  const evidence=record?.candidate?.marketEvidence;
  const details=sellerItem?.details??evidence?.offer?.details??sellerItem?.title??null;
  const specifications=[...(Array.isArray(sellerItem?.specifications)?sellerItem.specifications:[])];
  const explicitMpn=sellerItem?.manufacturer_part_number??sellerItem?.mpn??null;
  if(explicitMpn)specifications.push({specification_name:"Manufacturer Part Number",specification_value:explicitMpn});
  const kit=String(details??"").match(/\b(\d+)\s*[x×]\s*(\d+)\s*gb\b/i);
  if(kit){specifications.push({specification_name:"Number of Modules",specification_value:kit[1]},{specification_name:"Capacity per Module",specification_value:`${kit[2]} GB`});}
  return {title:details,specifications};
}

function material(projection){const value={projectionType:projection.projectionType,status:projection.status,evidenceId:projection.evidenceId??null,rawPayloadReference:projection.rawPayloadReference,atlasProductId:projection.atlasProductId,sourceProductsTaskId:projection.sourceProductsTaskId,productInfoTaskId:projection.productInfoTaskId,sellersTaskId:projection.sellersTaskId,providerIdentity:projection.providerIdentity,upstreamValidationDigest:projection.upstreamValidationDigest,retentionGovernanceDigest:projection.retentionGovernanceDigest,sellerAssessment:projection.sellerAssessment,df003Outcome:projection.df003Outcome,effectiveProductState:projection.effectiveProductState};return projection.identityLineageType==="DIRECT_PRODUCTS_STRONG_IDENTITY"?{...value,identityLineageType:projection.identityLineageType}:value;}

export function validateGovernedInitialAcquisitionIdentityProjection(projection){
  const errors=[];
  if(projection?.schemaVersion!=="1.0"||projection?.projectionType!=="GOVERNED_INITIAL_ACQUISITION_BINDING"||projection?.status!=="APPLICABLE")errors.push("INITIAL_ACQUISITION_PROJECTION_TYPE_INVALID");
  for(const field of ["rawPayloadReference","atlasProductId","sourceProductsTaskId","sellersTaskId","upstreamValidationDigest","retentionGovernanceDigest"])if(typeof projection?.[field]!=="string"||!projection[field])errors.push(`INITIAL_ACQUISITION_${field.toUpperCase()}_INVALID`);
  if(projection?.identityLineageType==="PRODUCT_INFO_VALIDATED"&&(typeof projection?.productInfoTaskId!=="string"||!projection.productInfoTaskId))errors.push("INITIAL_ACQUISITION_PRODUCTINFOTASKID_INVALID");
  if(!["PRODUCT_INFO_VALIDATED","DIRECT_PRODUCTS_STRONG_IDENTITY"].includes(projection?.identityLineageType??"PRODUCT_INFO_VALIDATED"))errors.push("INITIAL_ACQUISITION_LINEAGE_TYPE_INVALID");
  if(projection?.df003Outcome!=="CONFIRMED"||projection?.effectiveProductState!=="VERIFIED")errors.push("INITIAL_ACQUISITION_IDENTITY_STATE_INVALID");
  if(projection?.atlasResolution?.outcome!=="CONFIRMED"||projection.atlasResolution.atlasProductId!==projection?.atlasProductId||projection.atlasResolution.automaticMercuryEligible!==true)errors.push("INITIAL_ACQUISITION_ATLAS_RESOLUTION_INVALID");
  if(projection?.sellerAssessment?.status==="CONTRADICTION"||(projection?.sellerAssessment?.contradictions??[]).length)errors.push("INITIAL_ACQUISITION_SELLER_CONTRADICTION");
  if(projection?.projectionId!==`mer_initid_${hash(material(projection)).slice(0,24)}`)errors.push("INITIAL_ACQUISITION_PROJECTION_ID_INVALID");
  return freeze({valid:errors.length===0,errors});
}

export function createGovernedInitialAcquisitionIdentityProjection({governance,sellersProposal,atlasProduct,sellerItem=null,record=null,evidenceId=record?.evidenceId??null,rawPayloadReference=record?.candidate?.marketEvidence?.provenance?.rawPayloadReference??null}={}){
  if(governance?.status!=="VALIDATED"||governance?.lineage?.status!=="VALIDATED")throw new Error("INITIAL_ACQUISITION_RETENTION_GOVERNANCE_REQUIRED");
  const lineage=governance.lineage,validation=sellersProposal?.validation;
  if(!atlasProduct?.identity?.atlasProductId||atlasProduct.identity.atlasProductId!==lineage.atlasProductId||atlasProduct.governance?.lifecycleStatus!=="ACTIVE"||atlasProduct.governance?.publicationStatus!=="READY")throw new Error("INITIAL_ACQUISITION_ATLAS_PRODUCT_NOT_ACTIVE_READY");
  const direct=lineage.identityLineageType==="DIRECT_PRODUCTS_STRONG_IDENTITY";
  if(sellersProposal?.atlasProductId!==lineage.atlasProductId||sellersProposal.sourceProductsTaskId!==lineage.sourceProductsTaskId||sellersProposal.validationDigest!==hash(validation))throw new Error("INITIAL_ACQUISITION_PROPOSAL_BINDING_INVALID");
  if(direct){if(sellersProposal.identityLineageType!=="DIRECT_PRODUCTS_STRONG_IDENTITY"||lineage.sourceProductsReviewId!==sellersProposal.sourceProductsReviewId||lineage.sourceProductsReviewMaterialDigest!==sellersProposal.sourceProductsReviewMaterialDigest||sellersProposal.sourceProductInfoTaskId!==null)throw new Error("INITIAL_ACQUISITION_DIRECT_PRODUCTS_BINDING_INVALID");}
  else if(sellersProposal.sourceProductInfoTaskId!==lineage.productInfoTaskId||sellersProposal.sourceProductInfoExecutionRunId!==lineage.sourceProductInfoExecutionRunId)throw new Error("INITIAL_ACQUISITION_PRODUCT_INFO_BINDING_INVALID");
  if(validation?.status!=="VALIDATED"||!["MATCH","COMPATIBLE_WITH_UNKNOWNS"].includes(validation?.atlas?.status)||(validation.atlas.contradictions??[]).length||validation.atlas.atlasProductId!==lineage.atlasProductId)throw new Error("INITIAL_ACQUISITION_PRODUCT_INFO_CONTRADICTION");
  if(typeof rawPayloadReference!=="string"||!rawPayloadReference||!rawPayloadReference.startsWith(`dataforseo:sellers:${lineage.sellersTaskId}:item:`)||(record&&lineage.sellersTaskId!==record?.candidate?.marketEvidence?.provenance?.sourceTaskId))throw new Error("INITIAL_ACQUISITION_EVIDENCE_BINDING_INVALID");
  const expected=identity(lineage.providerIdentity),retained=identity(record?.candidate?.marketEvidence?.productEvidence),comparisons=governance.providerIdentity?.comparisons;
  for(const source of [identity(sellersProposal.providerIdentity),identity(validation.lineage?.providerIdentity)]){const shared=Object.keys(expected).filter(field=>expected[field]!=null&&source[field]!=null);if(!shared.length||shared.some(field=>!same(expected[field],source[field])))throw new Error("INITIAL_ACQUISITION_PROVIDER_IDENTITY_INVALID");}
  if(!Array.isArray(comparisons)||!comparisons.some(entry=>direct?entry.authorizationToSellers==="MATCH":entry.authorizationToProductInfo==="MATCH")||comparisons.some(entry=>[entry.authorizationToProductInfo,entry.authorizationToSellers,entry.productInfoToSellers].includes("CONTRADICTION")))throw new Error("INITIAL_ACQUISITION_PROVIDER_IDENTITY_INVALID");
  if(record){const shared=Object.keys(expected).filter(field=>expected[field]!=null&&retained[field]!=null);if(!shared.length||shared.some(field=>!same(expected[field],retained[field])))throw new Error("INITIAL_ACQUISITION_RETAINED_PROVIDER_IDENTITY_CONFLICT");if(record.candidate?.identity?.atlasProductId&&record.candidate.identity.atlasProductId!==lineage.atlasProductId)throw new Error("INITIAL_ACQUISITION_RETAINED_ATLAS_CONFLICT");}
  const sellerAssessment=assessDataForSeoProductEvidenceAgainstAtlas(sellerAssessmentInput({sellerItem,record}),atlasProduct);
  if(sellerAssessment.status==="CONTRADICTION")throw new Error(`INITIAL_ACQUISITION_SELLER_CONTRADICTION:${sellerAssessment.contradictions.join(",")}`);
  const common={schemaVersion:"1.0",projectionType:"GOVERNED_INITIAL_ACQUISITION_BINDING",status:"APPLICABLE",evidenceId:evidenceId??null,rawPayloadReference,atlasProductId:lineage.atlasProductId,sourceProductsTaskId:lineage.sourceProductsTaskId,productInfoTaskId:direct?null:lineage.productInfoTaskId,sellersTaskId:lineage.sellersTaskId,providerIdentity:structuredClone(expected),upstreamValidationDigest:sellersProposal.validationDigest,retentionGovernanceDigest:hash(governance),sellerAssessment:{status:sellerAssessment.status,contradictions:structuredClone(sellerAssessment.contradictions),evidence:structuredClone(sellerAssessment.evidence)},df003Outcome:"CONFIRMED",effectiveProductState:"VERIFIED"};
  const base=direct?{...common,identityLineageType:"DIRECT_PRODUCTS_STRONG_IDENTITY"}:common;
  const projection=freeze({...base,projectionId:`mer_initid_${hash(material(base)).slice(0,24)}`,atlasResolution:freeze({outcome:"CONFIRMED",atlasProductId:lineage.atlasProductId,externalProductId:expected.productId??null,candidateAtlasProductIds:[],evidence:[{field:"governedAcquisitionBinding",status:"MATCH",external:`${lineage.sellersTaskId}:${rawPayloadReference}`,atlas:lineage.atlasProductId}],automaticMercuryEligible:true})});
  const report=validateGovernedInitialAcquisitionIdentityProjection(projection);if(!report.valid)throw new Error(`INITIAL_ACQUISITION_PROJECTION_INVALID:${report.errors.join(",")}`);return projection;
}
