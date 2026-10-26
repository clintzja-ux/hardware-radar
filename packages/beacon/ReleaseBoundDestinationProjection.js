import {createHash} from "node:crypto";
import {validatePublicCurrentRetailProjection} from "../mercury/current-display/PublicCurrentRetailProjection.js";
import {portfolioFileDigest,validateRamPublicIntelligencePortfolio} from "../mercury/publication/RamPublicIntelligenceReleasePortfolio.js";
import {staticPublicationArtifactDigest,validateStaticPublicationReleaseManifest} from "../sentinel/validators/StaticPublicationReleaseControl.js";

export const RELEASE_BOUND_DESTINATION_PROJECTION_SCHEMA_VERSION="1.0";
export const RELEASE_BOUND_DESTINATION_PROJECTION_TYPE="BEACON_RELEASE_BOUND_PUBLIC_DESTINATION_PROJECTION";
const hex=(value,length)=>new RegExp(`^[a-f0-9]{${length}}$`).test(value??"");
const time=value=>typeof value==="string"&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`:JSON.stringify(value);
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const envelopeKeys=["schemaVersion","envelopeType","releaseGeneration","releaseId","candidateId","artifactId","sentinelCertificationId","predecessorReleaseId","productionGitCommit","currentProjectionDigest","releaseArtifactDigest","acceptanceBindingDigest","projectionObservedAt","projectionValidUntil","projection"];
export const releaseBoundDestinationProjectionDigest=value=>createHash("sha256").update(canonical(value),"utf8").digest("hex");

export function validateReleaseBoundDestinationProjectionEnvelope(envelope,{asOf,enforceFreshness=true}={}){
 const errors=[],projectionReport=validatePublicCurrentRetailProjection(envelope?.projection);
 if(!envelope||typeof envelope!=="object"||Array.isArray(envelope)||Object.keys(envelope).length!==envelopeKeys.length||envelopeKeys.some(key=>!Object.hasOwn(envelope,key)))errors.push("BEACON_PROJECTION_ENVELOPE_SHAPE_INVALID");
 if(envelope?.schemaVersion!==RELEASE_BOUND_DESTINATION_PROJECTION_SCHEMA_VERSION||envelope?.envelopeType!==RELEASE_BOUND_DESTINATION_PROJECTION_TYPE)errors.push("BEACON_PROJECTION_ENVELOPE_HEADER_INVALID");
 if(!Number.isSafeInteger(envelope?.releaseGeneration)||envelope.releaseGeneration<1)errors.push("BEACON_PROJECTION_GENERATION_INVALID");
 if(!/^pubrel_[a-f0-9]{24}$/.test(envelope?.releaseId??"")||!/^mer_ramreleasecand_[a-f0-9]{24}$/.test(envelope?.candidateId??"")||!/^mer_ramreleaseart_[a-f0-9]{24}$/.test(envelope?.artifactId??"")||!/^sent_ramreleasecert_[a-f0-9]{24}$/.test(envelope?.sentinelCertificationId??""))errors.push("BEACON_PROJECTION_RELEASE_IDENTITY_INVALID");
 if(envelope?.predecessorReleaseId!==null&&!/^pubrel_[a-f0-9]{24}$/.test(envelope?.predecessorReleaseId??""))errors.push("BEACON_PROJECTION_PREDECESSOR_INVALID");
 if(!hex(envelope?.productionGitCommit,40)||!hex(envelope?.currentProjectionDigest,64)||!hex(envelope?.releaseArtifactDigest,64)||!hex(envelope?.acceptanceBindingDigest,64))errors.push("BEACON_PROJECTION_DIGEST_INVALID");
 if(!time(envelope?.projectionObservedAt)||!time(envelope?.projectionValidUntil)||Date.parse(envelope?.projectionValidUntil)<=Date.parse(envelope?.projectionObservedAt))errors.push("BEACON_PROJECTION_TIME_INVALID");
 if(!projectionReport.valid)errors.push(...projectionReport.errors.map(error=>`BEACON_PROJECTION_${error}`));
 if(envelope?.projection?.asOf!==envelope?.projectionObservedAt||portfolioFileDigest(`${JSON.stringify(envelope?.projection,null,2)}\n`)!==envelope?.currentProjectionDigest)errors.push("BEACON_PROJECTION_CURRENT_BINDING_INVALID");
 const acceptance={releaseId:envelope?.releaseId,candidateId:envelope?.candidateId,artifactId:envelope?.artifactId,sentinelCertificationId:envelope?.sentinelCertificationId,predecessorReleaseId:envelope?.predecessorReleaseId,productionGitCommit:envelope?.productionGitCommit,releaseArtifactDigest:envelope?.releaseArtifactDigest,projectionValidUntil:envelope?.projectionValidUntil};
 if(releaseBoundDestinationProjectionDigest(acceptance)!==envelope?.acceptanceBindingDigest)errors.push("BEACON_PROJECTION_ACCEPTANCE_BINDING_INVALID");
 if(enforceFreshness&&(!time(asOf)||Date.parse(asOf)<Date.parse(envelope?.projectionObservedAt??"")||Date.parse(asOf)>Date.parse(envelope?.projectionValidUntil??"")))errors.push("BEACON_PROJECTION_EXPIRED");
 return freeze({valid:errors.length===0,errors:[...new Set(errors)]});
}

export function createReleaseBoundDestinationProjectionEnvelope({releaseManifest,releaseArtifactText,acceptedPublication,productionGitCommit,releaseGeneration,asOf}={}){
 const manifestReport=validateStaticPublicationReleaseManifest(releaseManifest);if(!manifestReport.valid)throw new Error(`BEACON_PROJECTION_RELEASE_INVALID:${manifestReport.errors.join(",")}`);
 if(releaseManifest.releaseState!=="ON"||releaseManifest.targetEnvironment!=="PRODUCTION"||releaseManifest.targetSurface!=="PUBLIC_RAM_INTELLIGENCE_PORTFOLIO")throw new Error("BEACON_PROJECTION_RELEASE_NOT_PRODUCTION");
 if(staticPublicationArtifactDigest(releaseArtifactText??"")!==releaseManifest.artifact.digestSha256)throw new Error("BEACON_PROJECTION_RELEASE_ARTIFACT_DIGEST_INVALID");
 let bundle;try{bundle=JSON.parse(releaseArtifactText);}catch{throw new Error("BEACON_PROJECTION_RELEASE_ARTIFACT_INVALID");}
 const portfolio=validateRamPublicIntelligencePortfolio({manifest:bundle.manifest,fileTexts:bundle.fileTexts,evaluatedAt:asOf});if(!portfolio.valid||portfolio.currentMode!=="FRESH")throw new Error(`BEACON_PROJECTION_PORTFOLIO_INVALID:${portfolio.errors.join(",")}`);
 const bindings=[[acceptedPublication?.status,"LIVE_ACCEPTED"],[acceptedPublication?.releaseId,releaseManifest.releaseId],[acceptedPublication?.candidateId,releaseManifest.artifact.candidateId],[acceptedPublication?.artifactId,releaseManifest.artifact.artifactId],[acceptedPublication?.certificationId,releaseManifest.artifact.certificationId],[acceptedPublication?.predecessorReleaseId,releaseManifest.rollback.previousReleaseId],[acceptedPublication?.productionGitCommit,productionGitCommit],[bundle.manifest.candidateId,releaseManifest.artifact.candidateId],[bundle.manifest.artifactId,releaseManifest.artifact.artifactId],[bundle.certification?.certificationId,releaseManifest.artifact.certificationId],[bundle.certification?.status,"CERTIFIED"],[bundle.certification?.artifactBindingDigest,releaseManifest.artifact.bindingDigest],[bundle.manifest.currentValidUntil,releaseManifest.artifact.expiresAt]];
 if(bindings.some(([left,right])=>left!==right)||!hex(productionGitCommit,40)||!time(acceptedPublication?.acceptedAt)||Date.parse(acceptedPublication.acceptedAt)>Date.parse(bundle.manifest.currentValidUntil))throw new Error("BEACON_PROJECTION_ACCEPTED_RELEASE_BINDING_INVALID");
 const projection=JSON.parse(bundle.fileTexts.current),currentProjectionDigest=bundle.manifest.files.current.digestSha256;
 if(portfolioFileDigest(bundle.fileTexts.current)!==currentProjectionDigest)throw new Error("BEACON_PROJECTION_CURRENT_DIGEST_INVALID");
 const acceptance={releaseId:releaseManifest.releaseId,candidateId:releaseManifest.artifact.candidateId,artifactId:releaseManifest.artifact.artifactId,sentinelCertificationId:releaseManifest.artifact.certificationId,predecessorReleaseId:releaseManifest.rollback.previousReleaseId,productionGitCommit,releaseArtifactDigest:releaseManifest.artifact.digestSha256,projectionValidUntil:bundle.manifest.currentValidUntil};
 const envelope={schemaVersion:RELEASE_BOUND_DESTINATION_PROJECTION_SCHEMA_VERSION,envelopeType:RELEASE_BOUND_DESTINATION_PROJECTION_TYPE,releaseGeneration,releaseId:acceptance.releaseId,candidateId:acceptance.candidateId,artifactId:acceptance.artifactId,sentinelCertificationId:acceptance.sentinelCertificationId,predecessorReleaseId:acceptance.predecessorReleaseId,productionGitCommit,currentProjectionDigest,releaseArtifactDigest:acceptance.releaseArtifactDigest,acceptanceBindingDigest:releaseBoundDestinationProjectionDigest(acceptance),projectionObservedAt:projection.asOf,projectionValidUntil:acceptance.projectionValidUntil,projection};
 const report=validateReleaseBoundDestinationProjectionEnvelope(envelope,{asOf});if(!report.valid)throw new Error(`BEACON_PROJECTION_ENVELOPE_INVALID:${report.errors.join(",")}`);return freeze(envelope);
}
