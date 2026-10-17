import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createStaticPublicationReleaseManifest, staticPublicationArtifactDigest } from "../validators/StaticPublicationReleaseControl.js";
import { createLivePricePublicationAuthorization } from "./GovernedLivePricePublication.js";

const freeze = value => Object.freeze(structuredClone(value));
const digest = value => createHash("sha256").update(value).digest("hex");
const atomicWrite = async (file, text) => { await mkdir(path.dirname(file), { recursive:true }); const temp=`${file}.${process.pid}.${randomUUID()}.tmp`; try { await writeFile(temp,text,{encoding:"utf8",flag:"wx"}); await rename(temp,file); } finally { await rm(temp,{force:true}); } };

export class CertifiedCandidateReleasePromotionOwner {
  constructor({ recurringAuthorityRepository, publicationAuthorizationRepository, preparationOwner, now=()=>new Date().toISOString(), checkpoint=async()=>{} }={}) {
    if (!recurringAuthorityRepository?.getChild || !recurringAuthorityRepository?.getMandate || !publicationAuthorizationRepository?.record || !preparationOwner?.prepare) throw new Error("PUBLICATION_PROMOTION_COMPOSITION_INCOMPLETE");
    Object.assign(this,{recurringAuthorityRepository,publicationAuthorizationRepository,preparationOwner,now,checkpoint});
  }
  async prepare({ candidate, child, checkoutRoot, candidateDirectory, releaseManifestPath="config/publication-release.json" }={}) {
    const root=path.resolve(checkoutRoot), directory=path.resolve(candidateDirectory), manifestPath=path.resolve(root,releaseManifestPath);
    const durableChild=await this.recurringAuthorityRepository.getChild(child?.childAuthorizationId), mandate=await this.recurringAuthorityRepository.getMandate(child?.mandateId);
    if (!durableChild || JSON.stringify(durableChild)!==JSON.stringify(child) || !mandate || mandate.status!=="ENABLED") throw new Error("PUBLICATION_PROMOTION_AUTHORITY_INVALID");
    if (Date.parse(this.now())>=Date.parse(child.freshUntil)) throw new Error("PUBLICATION_CANDIDATE_EXPIRED");
    const [manifest,certification,currentRelease]=await Promise.all([readFile(path.join(directory,"manifest.json"),"utf8").then(JSON.parse),readFile(path.join(directory,"certification.json"),"utf8").then(JSON.parse),readFile(manifestPath,"utf8").then(JSON.parse)]);
    const fileTexts={}; for (const [name,binding] of Object.entries(manifest.files??{})) fileTexts[name]=await readFile(path.join(directory,binding.file),"utf8");
    const bundleText=`${JSON.stringify({manifest,certification,fileTexts},null,2)}\n`;
    const certificationDigest=digest(JSON.stringify(certification)), replay=currentRelease.artifact?.candidateId===child.candidateId&&currentRelease.rollback?.previousReleaseId===child.predecessorReleaseId;
    const predecessorReleaseId=replay?currentRelease.rollback.previousReleaseId:currentRelease.releaseId;
    const bindings=[[manifest.candidateId,child.candidateId],[manifest.artifactId,child.artifactId],[manifest.bindingDigest,child.bindingDigest],[certification.certificationId,child.certificationId],[certification.candidateId,child.candidateId],[certification.artifactId,child.artifactId],[certification.artifactBindingDigest,child.bindingDigest],[manifest.currentValidUntil,child.freshUntil],[predecessorReleaseId,child.predecessorReleaseId],[candidate.candidateId,child.candidateId],[candidate.artifactDigest,child.artifactDigest],[candidate.certificationDigest,child.certificationDigest],[certificationDigest,child.certificationDigest]];
    if (bindings.some(([actual,expected])=>actual!==expected) || certification.status!=="CERTIFIED" || certification.releaseAuthority!==false || certification.deploymentAuthority!==false || candidate.sourceRightsEligible!==true) throw new Error("PUBLICATION_PROMOTION_BINDING_CONFLICT");
    const release=replay?currentRelease:createStaticPublicationReleaseManifest({releaseState:"ON",targetEnvironment:"PRODUCTION",targetSurface:"PUBLIC_RAM_INTELLIGENCE_PORTFOLIO",reason:"governed recurring publication candidate promotion",reviewedBy:mandate.operatorId,createdAt:child.authorizedAt,artifactRelativePath:`artifacts/${manifest.candidateId}.json`,artifactText:bundleText,authorityReference:certification.certificationId,previousReleaseId:currentRelease.releaseId,previousReleaseManifest:currentRelease});
    const artifactPath=path.resolve(path.dirname(manifestPath),release.artifact.relativePath), artifactDigest=staticPublicationArtifactDigest(bundleText), releaseText=`${JSON.stringify(release,null,2)}\n`;
    await this.checkpoint({stage:"PROMOTION_INTENT",childAuthorizationId:child.childAuthorizationId,releaseId:release.releaseId,artifactDigest});
    for (const [file,text] of [[artifactPath,bundleText],[manifestPath,releaseText]]) { try { const prior=await readFile(file,"utf8"); if (prior!==text) await atomicWrite(file,text); } catch (error) { if(error?.code!=="ENOENT")throw error; await atomicWrite(file,text); } }
    await this.checkpoint({stage:"PROMOTION_COMPLETED",childAuthorizationId:child.childAuthorizationId,releaseId:release.releaseId,artifactDigest});
    const authorization=createLivePricePublicationAuthorization({candidateId:manifest.candidateId,artifactId:manifest.artifactId,artifactDigest,bindingDigest:manifest.bindingDigest,certificationId:certification.certificationId,certificationDigest,targetEnvironment:"PRODUCTION",predecessorReleaseId:child.predecessorReleaseId,freshUntil:manifest.currentValidUntil,authorizedBy:mandate.operatorId,authorizedAt:child.authorizedAt});
    await this.publicationAuthorizationRepository.record(authorization);
    const prepared=await this.preparationOwner.prepare({authorizationId:authorization.authorizationId,checkoutRoot:root,releaseManifestPath});
    return freeze({...prepared,authorizationId:child.childAuthorizationId,releaseId:release.releaseId,canonicalPreparationAuthorizationId:authorization.authorizationId,candidateId:manifest.candidateId,allowlistValid:true});
  }
}
