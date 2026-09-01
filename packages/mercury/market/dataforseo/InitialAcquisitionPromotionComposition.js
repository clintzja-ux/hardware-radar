import { createGovernedInitialAcquisitionIdentityProjection } from "../../identity-review/GovernedInitialAcquisitionIdentityProjection.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const requireString=(value,name)=>{if(typeof value!=="string"||!value.trim())throw new TypeError(`${name} is required.`);return value.trim();};

export function composeInitialAcquisitionPromotionAssessment({records,requestedAtlasProductId,retentionAudit=null,sellersProposalEnvelope=null,atlasProduct=null}={}){
  if(!Array.isArray(records))throw new TypeError("records must be an array.");
  const requestedProduct=requireString(requestedAtlasProductId,"requestedAtlasProductId");
  const governedProduct=retentionAudit?.governance?.lineage?.atlasProductId??null;
  if(governedProduct!==requestedProduct){
    const selectedRecords=records.filter(record=>record?.candidate?.identity?.atlasProductId===requestedProduct);
    return freeze({compositionVersion:"1.0",mode:"GENERIC_RESOLVER",requestedAtlasProductId:requestedProduct,records:selectedRecords,initialAcquisitionIdentityProjections:[],identitySources:selectedRecords.map(record=>({evidenceId:record.evidenceId,identitySource:"GENERIC_RESOLVER"}))});
  }
  if(retentionAudit?.schemaVersion!=="1.0"||retentionAudit?.operation!=="SELLERS_RESULT_DF003_RETENTION"||retentionAudit?.governance?.status!=="VALIDATED"||retentionAudit.governance.lineage?.status!=="VALIDATED")throw new Error("INITIAL_ACQUISITION_RETENTION_AUDIT_INVALID");
  const proposal=sellersProposalEnvelope?.proposal??sellersProposalEnvelope;
  if(!proposal||typeof proposal!=="object")throw new Error("INITIAL_ACQUISITION_SELLERS_PROPOSAL_MISSING");
  const integrations=retentionAudit.integrations;
  if(!Array.isArray(integrations)||!integrations.length)throw new Error("INITIAL_ACQUISITION_RETENTION_EVIDENCE_BINDING_MISSING");
  const evidenceIds=integrations.map(value=>requireString(value?.evidenceId,"retention integration evidenceId"));
  if(new Set(evidenceIds).size!==evidenceIds.length)throw new Error("INITIAL_ACQUISITION_RETENTION_EVIDENCE_BINDING_CONFLICT");
  const recordsById=new Map(records.map(record=>[record?.evidenceId,record]));
  if(recordsById.size!==records.length)throw new Error("INITIAL_ACQUISITION_EVIDENCE_ID_CONFLICT");
  const selectedRecords=evidenceIds.map(evidenceId=>{const record=recordsById.get(evidenceId);if(!record)throw new Error("INITIAL_ACQUISITION_RETAINED_EVIDENCE_MISSING");return record;});
  const sellersTaskId=retentionAudit.governance.lineage.sellersTaskId;
  const taskRecords=records.filter(record=>record?.candidate?.marketEvidence?.provenance?.sourceTaskId===sellersTaskId);
  if(taskRecords.length!==selectedRecords.length||taskRecords.some(record=>!evidenceIds.includes(record.evidenceId)))throw new Error("INITIAL_ACQUISITION_RETENTION_EVIDENCE_SET_CONFLICT");
  if(retentionAudit.atlasProductId!==requestedProduct||retentionAudit.sellersTaskId!==sellersTaskId||retentionAudit.productInfoTaskId!==retentionAudit.governance.lineage.productInfoTaskId)throw new Error("INITIAL_ACQUISITION_RETENTION_LINEAGE_CONFLICT");
  if(!atlasProduct||atlasProduct?.identity?.atlasProductId!==requestedProduct)throw new Error("INITIAL_ACQUISITION_ATLAS_PRODUCT_BINDING_INVALID");
  const projections=selectedRecords.map(record=>createGovernedInitialAcquisitionIdentityProjection({governance:retentionAudit.governance,sellersProposal:proposal,atlasProduct,record}));
  return freeze({compositionVersion:"1.0",mode:"GOVERNED_INITIAL_ACQUISITION_BINDING",requestedAtlasProductId:requestedProduct,records:selectedRecords,initialAcquisitionIdentityProjections:projections,identitySources:selectedRecords.map((record,index)=>({evidenceId:record.evidenceId,identitySource:"GOVERNED_INITIAL_ACQUISITION_BINDING",projectionId:projections[index].projectionId}))});
}
