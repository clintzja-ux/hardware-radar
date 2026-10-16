import crypto from "node:crypto";
import {access,readdir} from "node:fs/promises";
import path from "node:path";

const freeze=value=>Object.freeze(structuredClone(value));
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const exists=async value=>access(value).then(()=>true,()=>false);

export class ProductionNeweggFailedAcquisitionEvidenceOwner{
 constructor({root=process.cwd(),bootstrapRepository,authorityService,auditRepository}={}){if(!bootstrapRepository?.get||!authorityService?.inspectOperation||!auditRepository?.getAll)throw new TypeError("NEWEGG_ACQUISITION_EVIDENCE_OWNER_REQUIRED");this.root=path.resolve(root);Object.assign(this,{bootstrapRepository,authorityService,auditRepository});}
 async inspect({operationId,mandateId,forgeRequestId}={}){
  const operation=await this.bootstrapRepository.get(operationId),authority=(await this.authorityService.inspectOperation({mandateId,operationId})).acquisition,audit=(await this.auditRepository.getAll()).find(value=>value.requestId===forgeRequestId),directory=path.join(this.root,".forge-review","rakuten-sftp","staging","acquisitions",operationId),entries=await readdir(directory,{withFileTypes:true}).catch(error=>error?.code==="ENOENT"?[]:Promise.reject(error)),names=entries.filter(value=>value.isFile()).map(value=>value.name),partialPresent=names.some(value=>value.includes(".partial")),finalizedFullPresent=names.some(value=>value.endsWith(".txt.gz")),completionReceiptPresent=names.includes("acquisition-receipt.json"),leaseHeld=await exists(path.join(this.root,".forge-review","rakuten-sftp","acquisition.lock"));
  return{operation,authority,forgeAudit:audit,leaseHeld,partialPresent,finalizedFullPresent,completionReceiptPresent,terminalTransportEvidence:operation?.terminalTransportEvidence??operation?.failureReceipt??null};
 }
}

export function assessFailedNeweggAcquisitionEvidence({operation,authority,forgeAudit,leaseHeld=false,partialPresent=false,finalizedFullPresent=false,completionReceiptPresent=false,terminalTransportEvidence=null}={}){
 if(!operation?.operationId||!operation?.mandateId||!authority?.acquisitionId||operation.operationId!==authority.acquisitionId||operation.mandateId!==authority.mandateId||operation.source!==authority.source||operation.localDay!==authority.localDay)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_BINDING_INVALID");
 if(!forgeAudit?.operatorId||forgeAudit.action!=="RUN_NEWEGG_ROUTINE")throw new Error("NEWEGG_ACQUISITION_DISPOSITION_AUDIT_INVALID");
 if(finalizedFullPresent||completionReceiptPresent||authority.status==="COMPLETED")throw new Error("NEWEGG_ACQUISITION_DISPOSITION_COMPLETION_CONFLICT");
 const confirmed=Boolean(terminalTransportEvidence?.classification?.match(/^SFTP_[A-Z0-9_]+$/)&&terminalTransportEvidence?.cleanup?.leaseReleased===true&&terminalTransportEvidence?.connectionAccounting?.activeConnectionsAtEnd===0&&terminalTransportEvidence?.terminalAt);
 const classification=confirmed?"ACQUISITION_FAILED":"ACQUISITION_REVIEW_REQUIRED",evidence={operationId:operation.operationId,mandateId:operation.mandateId,source:operation.source,localDay:operation.localDay,authorizedAt:authority.authorizedAt,operatorId:forgeAudit.operatorId,forgeRequestId:forgeAudit.requestId,authorityStatus:authority.status,bootstrapStatus:operation.status,leaseHeld:Boolean(leaseHeld),partialPresent:Boolean(partialPresent),finalizedFullPresent:false,completionReceiptPresent:false,terminalTransportEvidence:confirmed?terminalTransportEvidence:null};
 return freeze({schemaVersion:"1.0",classification,evidence,evidenceDigest:digest(evidence),providerWorkAttempted:true,dailyAllowanceConsumed:true,automaticRetryPermitted:false,replacementAcquisitionPermitted:false,nextAction:"STOP_AND_REVIEW"});
}

export class NeweggFailedAcquisitionDispositionService{
 constructor({bootstrapRepository,authorityService,evidenceOwner,now=()=>new Date().toISOString()}={}){if(!bootstrapRepository?.get||!bootstrapRepository?.transact||!authorityService?.inspectOperation||!authorityService?.reviewAcquisition||!evidenceOwner?.inspect)throw new TypeError("NEWEGG_ACQUISITION_DISPOSITION_OWNER_REQUIRED");Object.assign(this,{bootstrapRepository,authorityService,evidenceOwner,now});}
 async assess({operationId,mandateId,forgeRequestId}={}){return assessFailedNeweggAcquisitionEvidence(await this.evidenceOwner.inspect({operationId,mandateId,forgeRequestId}));}
 async dispose({operationId,mandateId,forgeRequestId,operatorId,expectedEvidenceDigest,classification,confirmation}={}){
  if(!operatorId||confirmation!=="CONFIRM DISPOSE_NEWEGG_ACQUISITION"||!expectedEvidenceDigest||!classification)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_AUTHORITY_INVALID");
  const stored=await this.bootstrapRepository.get(operationId);
  if(stored?.dispositionEvidenceDigest){
   if(stored.mandateId!==mandateId||stored.dispositionEvidenceDigest!==expectedEvidenceDigest||stored.dispositionClassification!==classification)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_CONFLICT");
   const inspected=await this.authorityService.inspectOperation({mandateId,operationId}),authority=inspected.acquisition.dispositionEvidenceDigest?inspected:await this.authorityService.reviewAcquisition({mandateId,operationId,classification,evidenceDigest:expectedEvidenceDigest,operatorId:stored.disposedBy,disposedAt:stored.disposedAt}).then(()=>this.authorityService.inspectOperation({mandateId,operationId}));if(authority.acquisition.dispositionEvidenceDigest!==expectedEvidenceDigest||authority.acquisition.dispositionClassification!==classification)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_CONFLICT");
   const completed=stored.dispositionState==="COMPLETED"?stored:await this.bootstrapRepository.transact(operationId,current=>({...current,status:classification,dispositionState:"COMPLETED",updatedAt:current.disposedAt}));
   return freeze({status:"REPLAY",classification,operationId,mandateId,evidenceDigest:expectedEvidenceDigest,disposedAt:completed.disposedAt,disposedBy:completed.disposedBy,providerWorkAttempted:true,dailyAllowanceConsumed:true,automaticRetryPermitted:false,replacementAcquisitionPermitted:false,releaseAuthority:false,deploymentAuthority:false});
  }
  const assessment=await this.assess({operationId,mandateId,forgeRequestId});
  if(expectedEvidenceDigest!==assessment?.evidenceDigest||classification!==assessment?.classification)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_AUTHORITY_INVALID");
  const prior=stored;if(!prior||prior.mandateId!==mandateId||prior.source!==assessment.evidence.source||prior.localDay!==assessment.evidence.localDay)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_STALE_EVIDENCE");
  const authority=await this.authorityService.inspectOperation({mandateId,operationId});if(authority.acquisition.status!==assessment.evidence.authorityStatus)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_STALE_EVIDENCE");
  const disposedAt=this.now();await this.bootstrapRepository.transact(operationId,current=>{if(current.dispositionEvidenceDigest)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_CONFLICT");return{...current,dispositionState:"PREPARED",dispositionClassification:classification,dispositionEvidenceDigest:assessment.evidenceDigest,disposedAt,disposedBy:operatorId,providerWorkAttempted:true,dailyAllowanceConsumed:true,automaticRetryPermitted:false,replacementAcquisitionPermitted:false,nextAction:"STOP_AND_REVIEW",updatedAt:disposedAt};});
  const authorityResult=await this.authorityService.reviewAcquisition({mandateId,operationId,classification,evidenceDigest:assessment.evidenceDigest,operatorId,disposedAt});
  const bootstrap=await this.bootstrapRepository.transact(operationId,current=>{if(current.dispositionEvidenceDigest!==assessment.evidenceDigest||current.dispositionClassification!==classification)throw new Error("NEWEGG_ACQUISITION_DISPOSITION_CONFLICT");return{...current,status:classification,dispositionState:"COMPLETED",updatedAt:disposedAt};});
  return freeze({status:authorityResult.status==="REPLAY"?"REPLAY":"DISPOSED",classification,operationId,mandateId,evidenceDigest:assessment.evidenceDigest,disposedAt:bootstrap.disposedAt,disposedBy:bootstrap.disposedBy,providerWorkAttempted:true,dailyAllowanceConsumed:true,automaticRetryPermitted:false,replacementAcquisitionPermitted:false,releaseAuthority:false,deploymentAuthority:false});
 }
}
