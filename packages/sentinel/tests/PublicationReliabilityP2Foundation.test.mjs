import assert from "node:assert/strict";
import { classifyPublicationArtifactChange, projectPublicationReliabilityStatus } from "../publication/PublicationReliabilityP2.js";

const asOf="2026-11-19T18:00:00.000Z",mandate={mandateId:"mandate",status:"ENABLED",validFrom:"2026-11-19T00:00:00.000Z",expiresAt:"2026-12-19T00:00:00.000Z",maximumAcceptedReleasesPerLocalDay:1};
for(const paths of [["public/data/ram-catalog.json"],["public/data/ram-current-retail.json"],["public/data/ram-terminal.json"],["public/data/ram-catalog.json","public/data/ram-current-retail.json"]])assert.equal(classifyPublicationArtifactChange({changedPaths:paths,comparisonComplete:true}).status,"MEANINGFUL_CHANGE");
assert.equal(classifyPublicationArtifactChange({changedPaths:[],comparisonComplete:true}).status,"NO_MEANINGFUL_CHANGE");
await assert.rejects(async()=>classifyPublicationArtifactChange({changedPaths:[]}),/COMPARISON_INCOMPLETE/);
await assert.rejects(async()=>classifyPublicationArtifactChange({changedPaths:["public/a","public/a"],comparisonComplete:true}),/INVENTORY_INVALID/);

const accepted={candidateId:"candidate-accepted",localDay:"2026-11-19",status:"LIVE_ACCEPTED",acceptedAt:"2026-11-19T17:00:00.000Z",checkpointCommit:"data-checkpoint",releaseId:"release-accepted",deploymentId:"deployment-accepted",events:[]};
const recovered={...accepted,recoveryId:"recovery-accepted",recoveryType:"POST_DEPLOYMENT_RECONSIDERATION_OBSERVATION"};delete recovered.candidateId;
const recoveredState={mandates:[mandate],operations:[],recoveries:[recovered],reconsiderations:[]};
const immutable=JSON.stringify(recoveredState),projected=projectPublicationReliabilityStatus({state:recoveredState,currentCodeHead:"code-head",asOf});
assert.equal(projected.latestAcceptedDataRelease.releaseId,"release-accepted");assert.equal(projected.publishedCheckpoint,"data-checkpoint");assert.equal(projected.currentCodeHead,"code-head");assert.equal(projected.codeHeadDiffersFromPublishedCheckpoint,true);assert.equal(projected.recoveryStatus.status,"LIVE_ACCEPTED");assert.equal(projected.dailyAcceptedReleaseAllowance.remaining,0);assert.equal(projected.nextSafeOperatorAction,"WAIT_FOR_DAILY_ALLOWANCE");assert.equal(JSON.stringify(recoveredState),immutable);

const failed={candidateId:"candidate-failed",localDay:"11/19/2026",status:"FAILED",events:[{type:"CHECKPOINT_CREATED",at:"2026-11-19T17:30:00.000Z",evidence:{commit:"live-checkpoint"}},{type:"MAIN_UPDATED",at:"2026-11-19T17:31:00.000Z",evidence:{commit:"live-checkpoint"}},{type:"FAILED",at:"2026-11-19T17:32:00.000Z",evidence:{classification:"OBSERVATION_FAILED"}}]};
const liveUnaccepted=projectPublicationReliabilityStatus({state:{mandates:[mandate],operations:[failed],recoveries:[],reconsiderations:[]},currentCodeHead:"code-head",asOf});assert.equal(liveUnaccepted.deploymentLiveButNotGovernedAccepted,true);assert.equal(liveUnaccepted.nextSafeOperatorAction,"INSPECT_GOVERNED_RECOVERY");
const active=projectPublicationReliabilityStatus({state:{mandates:[mandate],operations:[{candidateId:"active",status:"PREPARING",events:[{at:"2026-11-19T17:40:00.000Z"}]}],recoveries:[],reconsiderations:[]},currentCodeHead:"code-head",asOf});assert.equal(active.activePublicationStage,"PREPARING");assert.equal(active.nextSafeOperatorAction,"INSPECT_ACTIVE_PUBLICATION");
assert.throws(()=>projectPublicationReliabilityStatus({state:null,currentCodeHead:"code-head",asOf}),/EVIDENCE_INCOMPLETE/);assert.throws(()=>projectPublicationReliabilityStatus({state:{},asOf}),/CODE_HEAD_REQUIRED/);
console.log("Publication Reliability P2 foundation tests passed: 16 cases.");
