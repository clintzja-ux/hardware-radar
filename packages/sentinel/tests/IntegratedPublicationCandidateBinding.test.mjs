import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { UnattendedLivePricePublicationCoordinator, validateBoundPublicationCandidate } from "../publication/UnattendedLivePricePublication.js";
import { ProductionUnattendedPublicationCommand } from "../publication/ProductionUnattendedPublicationBindings.js";

const context={runtimeFingerprint:"runtime",operationalRootFingerprint:"evidence",publicationCheckoutRootFingerprint:"checkout"};
const certified={candidateId:"candidate-a",certificationId:"cert-a",sentinelStatus:"CERTIFIED",sourceRightsEligible:true};
assert.equal(validateBoundPublicationCandidate({candidate:certified,expectedCandidateId:"candidate-a",bindingContext:context}).candidateId,"candidate-a");
for(const [candidate,expected,code] of [[null,"candidate-a","PUBLICATION_EXPECTED_CANDIDATE_ABSENT"],[{...certified,candidateId:"candidate-b"},"candidate-a","PUBLICATION_CANDIDATE_IDENTITY_DRIFT"],[{...certified,sentinelStatus:"PENDING"},"candidate-a","PUBLICATION_CERTIFICATION_STATUS_INVALID"],[{...certified,sourceRightsEligible:false},"candidate-a","PUBLICATION_SOURCE_RIGHTS_INELIGIBLE"]]) {
 assert.throws(()=>validateBoundPublicationCandidate({candidate,expectedCandidateId:expected,bindingContext:context}),error=>error.code===code&&error.diagnostic.expectedCandidateId===expected&&error.diagnostic.runtimeFingerprint==="runtime"&&error.diagnostic.evidenceFingerprint==="evidence"&&error.diagnostic.checkoutFingerprint==="checkout");
}

const calls=[];
const command=new ProductionUnattendedPublicationCommand({
 repository:{getAcceptedPublication:async()=>null,getOperation:async()=>null},
 mandateService:{},candidateOwner:{discover:async()=>certified},candidateBindingContext:context,
 coordinatorFactory:async()=>({run:async input=>{calls.push(input);return{status:"NO_MEANINGFUL_CHANGE"};}})
});
assert.equal((await command.run({mandateId:"mandate",candidateId:"candidate-a"})).status,"NO_MEANINGFUL_CHANGE");
assert.deepEqual(calls,[{mandateId:"mandate",expectedCandidateId:"candidate-a",bindingContext:context}]);
calls.length=0;
assert.equal((await command.run({mandateId:"mandate"})).status,"NO_MEANINGFUL_CHANGE","standalone discovery remains supported when no candidate identity is supplied");
assert.equal(calls[0].expectedCandidateId,null);

const roots=await Promise.all(["application","evidence","checkout"].map(name=>mkdtemp(path.join(os.tmpdir(),`candidate-binding-${name}-`))));
const rootContext={runtimeFingerprint:createHash("sha256").update(roots[0]).digest("hex"),operationalRootFingerprint:createHash("sha256").update(roots[1]).digest("hex"),publicationCheckoutRootFingerprint:createHash("sha256").update(roots[2]).digest("hex")};
const exercise=async sequence=>{
 let authorityCreated=0,prepared=0,index=0;
 const candidateOwner={discover:async()=>sequence[Math.min(index++,sequence.length-1)]};
 const repository={runOperationExclusive:action=>action(),getAcceptedPublication:async()=>null,getOperation:async()=>null,authorizeChild:async()=>{authorityCreated+=1;return{childAuthorizationId:"child"};},recordEvent:async input=>input};
 const coordinatorFactory=async()=>new UnattendedLivePricePublicationCoordinator({repository,candidateOwner,preparationOwner:{prepare:async()=>{prepared+=1;return{status:"NO_MEANINGFUL_CHANGE",authorizationId:"child",allowlistValid:true};}},gitOwner:{inspectBase:async()=>({clean:true,localCommit:"base",remoteCommit:"base"})},deploymentOwner:{},liveVerifier:{}});
 const productionCommand=new ProductionUnattendedPublicationCommand({repository,mandateService:{},candidateOwner,coordinatorFactory,candidateBindingContext:rootContext});
 return{run:()=>productionCommand.run({mandateId:"mandate",candidateId:"candidate-a"}),counts:()=>({authorityCreated,prepared})};
};
for(const [sequence,code] of [[[certified,{...certified,candidateId:"candidate-b"}],"PUBLICATION_CANDIDATE_IDENTITY_DRIFT"],[[certified,null],"PUBLICATION_EXPECTED_CANDIDATE_ABSENT"]]){
 const scenario=await exercise(sequence);await assert.rejects(scenario.run(),error=>error.code===code&&error.diagnostic.runtimeFingerprint===rootContext.runtimeFingerprint);assert.deepEqual(scenario.counts(),{authorityCreated:0,prepared:0});
}
const matching=await exercise([certified,certified]);assert.equal((await matching.run()).status,"NO_MEANINGFUL_CHANGE");assert.deepEqual(matching.counts(),{authorityCreated:1,prepared:1});
await rm(roots[0],{recursive:true,force:true});await rm(roots[1],{recursive:true,force:true});await rm(roots[2],{recursive:true,force:true});
console.log("Integrated publication candidate binding matrix passed: 10 cases.");
