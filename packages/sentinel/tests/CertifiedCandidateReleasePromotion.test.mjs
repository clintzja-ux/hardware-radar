import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CertifiedCandidateReleasePromotionOwner } from "../publication/CertifiedCandidateReleasePromotion.js";
import { createRecurringPublicationMandate, FileRecurringPublicationAuthorityRepository } from "../publication/UnattendedLivePricePublication.js";
import { FileLivePricePublicationAuthorizationRepository } from "../publication/GovernedLivePricePublication.js";

const sha=value=>createHash("sha256").update(value).digest("hex"), sourceRoot=path.resolve("."), root=await mkdtemp(path.join(os.tmpdir(),"hr-release-promotion-"));
try {
  const checkout=path.join(root,"checkout"), candidateDirectory=path.join(root,"candidate"); await mkdir(path.join(checkout,"config","artifacts"),{recursive:true}); await mkdir(candidateDirectory,{recursive:true});
  const bundle=JSON.parse(await readFile(path.join(sourceRoot,"config","artifacts","mer_ramreleasecand_a625a0d0797e86f7cd5e2dc6.json"),"utf8"));
  await writeFile(path.join(candidateDirectory,"manifest.json"),JSON.stringify(bundle.manifest)); await writeFile(path.join(candidateDirectory,"certification.json"),JSON.stringify(bundle.certification));
  for(const [name,text] of Object.entries(bundle.fileTexts)){const target=path.join(candidateDirectory,bundle.manifest.files[name].file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,text);}
  const predecessor=JSON.parse(await readFile(path.join(sourceRoot,"config","publication-release.json"),"utf8")); await writeFile(path.join(checkout,"config","publication-release.json"),JSON.stringify(predecessor));
  const recurring=new FileRecurringPublicationAuthorityRepository({statePath:path.join(root,"recurring.json")}), at="2026-10-17T16:30:00.000Z", mandate=createRecurringPublicationMandate({operatorId:"operator:fixture",validFrom:"2026-10-17T00:00:00Z",expiresAt:"2026-11-16T00:00:00Z",createdAt:at}); await recurring.record(mandate);
  const candidate={candidateId:bundle.manifest.candidateId,artifactId:bundle.manifest.artifactId,certificationId:bundle.certification.certificationId,bindingDigest:bundle.manifest.bindingDigest,artifactDigest:sha(JSON.stringify(bundle.manifest)),certificationDigest:sha(JSON.stringify(bundle.certification)),predecessorReleaseId:predecessor.releaseId,freshUntil:bundle.manifest.currentValidUntil,sentinelStatus:"CERTIFIED",sourceRightsEligible:true};
  const child=await recurring.authorizeChild({mandateId:mandate.mandateId,candidate,predecessorCommit:"fixture-base",at}), authorizations=new FileLivePricePublicationAuthorizationRepository({statePath:path.join(root,"authorizations.json")}); let calls=0;
  const owner=new CertifiedCandidateReleasePromotionOwner({recurringAuthorityRepository:recurring,publicationAuthorizationRepository:authorizations,preparationOwner:{prepare:async({authorizationId,promotionEvidence})=>{calls++;assert.equal(promotionEvidence.originalCleanCheckout.localCommit,"fixture-base");assert.deepEqual(promotionEvidence.promotionPaths,[`config/artifacts/${candidate.candidateId}.json`,"config/publication-release.json"].sort());return{status:"READY_FOR_RELEASE_ONLY_CHECKPOINT",authorizationId,changedPaths:["config/publication-release.json"],allowlistValid:true};}},now:()=>at});
  const originalCleanCheckout={clean:true,localCommit:"fixture-base",remoteCommit:"fixture-base",verifiedAt:at}, input={candidate,child,checkoutRoot:checkout,candidateDirectory,originalCleanCheckout}; const first=await owner.prepare(input), second=await owner.prepare(input), release=JSON.parse(await readFile(path.join(checkout,"config","publication-release.json"),"utf8"));
  assert.equal(first.releaseId,release.releaseId); assert.equal(first.authorizationId,child.childAuthorizationId); assert.equal(second.releaseId,first.releaseId); assert.equal(calls,2); assert.equal(release.rollback.previousReleaseId,predecessor.releaseId); assert.equal(release.artifact.candidateId,candidate.candidateId);
  await assert.rejects(()=>owner.prepare({...input,child:{...child,bindingDigest:"f".repeat(64)}}),/AUTHORITY_INVALID/);
  await assert.rejects(()=>owner.prepare({...input,originalCleanCheckout:null}),/CLEAN_CHECKOUT_EVIDENCE_INVALID/);
  await assert.rejects(()=>owner.prepare({...input,originalCleanCheckout:{...originalCleanCheckout,localCommit:"wrong"}}),/CLEAN_CHECKOUT_EVIDENCE_INVALID/);
  await assert.rejects(()=>new CertifiedCandidateReleasePromotionOwner({recurringAuthorityRepository:recurring,publicationAuthorizationRepository:authorizations,preparationOwner:{prepare:async()=>({})},now:()=>bundle.manifest.currentValidUntil}).prepare(input),/EXPIRED/);
  console.log("Certified candidate release promotion tests passed: exact binding, predecessor, replay, tamper, and expiry.");
} finally { await rm(root,{recursive:true,force:true}); }
