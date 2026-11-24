import path from "node:path";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {CertifiedRoutinePublicationCandidateOwner} from "../../packages/sentinel/publication/ProductionUnattendedPublicationBindings.js";
import {FileRecurringPublicationAuthorityRepository} from "../../packages/sentinel/publication/UnattendedLivePricePublication.js";
import {createProductionPublicationRunner,resolveProductionPublicationCommand} from "./production-publication-command.mjs";

const freeze=value=>Object.freeze(structuredClone(value));
const jamaicaDay=value=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Jamaica",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
const accepted=state=>[...(state.operations??[]),...(state.recoveries??[]),...(state.reconsiderations??[])];

export function selectEligiblePublicationMandate({authority,candidate,at=new Date().toISOString()}={}){
 if(!candidate||candidate.sentinelStatus!=="CERTIFIED"||candidate.sourceRightsEligible!==true)throw Object.assign(new Error("PUBLICATION_CANDIDATE_INVALID"),{operatorOutcome:"RELEASE_READY_NOT_PUBLISHED"});
 if(Date.parse(at)>=Date.parse(candidate.freshUntil??""))throw Object.assign(new Error("PUBLICATION_CANDIDATE_EXPIRED"),{operatorOutcome:"RELEASE_READY_NOT_PUBLISHED"});
 const localDay=jamaicaDay(at),allowanceUsed=accepted(authority??{}).some(value=>value?.localDay===localDay&&value?.status==="LIVE_ACCEPTED");
 const eligible=(authority?.mandates??[]).filter(value=>value?.status==="ENABLED"&&value.environment==="PRODUCTION"&&Date.parse(at)>=Date.parse(value.validFrom)&&Date.parse(at)<Date.parse(value.expiresAt)&&!allowanceUsed);
 if(eligible.length!==1)throw Object.assign(new Error(eligible.length?"PUBLICATION_MANDATE_AMBIGUOUS":"PUBLICATION_MANDATE_NOT_ELIGIBLE"),{operatorOutcome:"RELEASE_READY_NOT_PUBLISHED"});
 return freeze(eligible[0]);
}

export function classifyIntegratedPublicationOutcome({routineResult,publication}={}){
 if(routineResult?.outcome==="SUCCESS_NO_CHANGE"||publication?.status==="NO_MEANINGFUL_CHANGE"||publication?.status==="SUCCESS_NO_CHANGE")return"SUCCESS_NO_CHANGE";
 if(["LIVE_ACCEPTED","ALREADY_DEPLOYED_CANDIDATE"].includes(publication?.status))return"LIVE_ACCEPTED";
 if(routineResult?.outcome==="SUCCESS_RELEASE_READY"&&!publication)return"RELEASE_READY_NOT_PUBLISHED";
 return"ACQUISITION_FAILED";
}

export function createNeweggRoutinePublicationExecution({runtimeRoot,operationalRoot,env=process.env,runFile=promisify(execFile),now=()=>new Date().toISOString(),authorityRepository=null,candidateOwner=null}={}){
 const root=path.resolve(operationalRoot),runtime=path.resolve(runtimeRoot),stateRoot=path.join(root,".forge-review/mercury/newegg-routine"),command=resolveProductionPublicationCommand({runtimeRoot:runtime,operationalRoot:root,publicationCheckoutRoot:env.HARDWARE_RADAR_PUBLICATION_CHECKOUT_ROOT,env}),repository=authorityRepository??new FileRecurringPublicationAuthorityRepository({statePath:command.mandateStatePath}),owner=candidateOwner??new CertifiedRoutinePublicationCandidateOwner({routineHealthPath:path.join(stateRoot,"routine-health.json"),artifactRoot:path.join(root,".forge-review/publication/ram-intelligence"),releaseManifestPath:path.join(command.publicationCheckoutRoot,"config/publication-release.json")}),run=createProductionPublicationRunner({execFile:runFile,nodeExecutable:command.nodeExecutable,runtimeRoot:command.runtimeRoot,operationalRoot:command.operationalRoot,publicationCheckoutRoot:command.publicationCheckoutRoot,env});
 return Object.freeze({execute:async({routineResult}={})=>{
  if(routineResult?.outcome==="SUCCESS_NO_CHANGE")return{status:"SUCCESS_NO_CHANGE",publicationInvoked:false};
  if(routineResult?.outcome!=="SUCCESS_RELEASE_READY")throw Object.assign(new Error("PUBLICATION_ROUTINE_NOT_RELEASE_READY"),{operatorOutcome:"ACQUISITION_FAILED"});
  const candidate=await owner.discover(),runId=routineResult.runId;if(!candidate||candidate.trigger?.runId!==runId)throw Object.assign(new Error("PUBLICATION_CANDIDATE_ROUTINE_BINDING_INVALID"),{operatorOutcome:"RELEASE_READY_NOT_PUBLISHED"});
  const mandate=selectEligiblePublicationMandate({authority:await repository.inspect(),candidate,at:now()});
  try{const result=await run({mandateId:mandate.mandateId,candidateId:candidate.candidateId,root:command.publicationCheckoutRoot});return{...result,mandateId:mandate.mandateId,publicationInvoked:true};}
  catch(error){error.operatorOutcome="PUBLICATION_FAILED";throw error;}
 }});
}
