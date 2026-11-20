import assert from "node:assert/strict";
import { classifyPublicationArtifactChange, projectPublicationReliabilityStatus } from "../publication/PublicationReliabilityP2.js";

const asOf="2026-11-19T18:00:00.000Z";
const successor={mandateId:"successor",status:"ENABLED",validFrom:"2026-11-19T01:31:24.948Z",expiresAt:"2026-12-19T01:31:24.948Z",maximumAcceptedReleasesPerLocalDay:1};
const predecessor={mandateId:"predecessor",status:"ENABLED",validFrom:"2026-10-20T01:31:24.948Z",expiresAt:"2026-11-19T01:31:24.948Z",maximumAcceptedReleasesPerLocalDay:1};
const disabled={...successor,mandateId:"disabled",status:"PAUSED"};
for(const paths of [["public/data/ram-catalog.json"],["public/data/ram-current-retail.json"],["public/data/ram-terminal.json"],["public/data/ram-catalog.json","public/data/ram-current-retail.json"]])assert.equal(classifyPublicationArtifactChange({changedPaths:paths,comparisonComplete:true}).status,"MEANINGFUL_CHANGE");
assert.equal(classifyPublicationArtifactChange({changedPaths:[],comparisonComplete:true}).status,"NO_MEANINGFUL_CHANGE");
await assert.rejects(async()=>classifyPublicationArtifactChange({changedPaths:[]}),/COMPARISON_INCOMPLETE/);
await assert.rejects(async()=>classifyPublicationArtifactChange({changedPaths:["public/a","public/a"],comparisonComplete:true}),/INVENTORY_INVALID/);

const accepted={candidateId:"candidate-accepted",localDay:"2026-11-19",status:"LIVE_ACCEPTED",acceptedAt:"2026-11-19T17:00:00.000Z",checkpointCommit:"data-checkpoint",releaseId:"release-accepted",deploymentId:"deployment-accepted",events:[]};
const recovered={...accepted,recoveryId:"recovery-accepted",recoveryType:"POST_DEPLOYMENT_RECONSIDERATION_OBSERVATION"};delete recovered.candidateId;
const recoveredState={mandates:[predecessor,successor,disabled],operations:[],recoveries:[recovered],reconsiderations:[]};
const immutable=JSON.stringify(recoveredState),projected=projectPublicationReliabilityStatus({state:recoveredState,selectedMandate:successor,currentCodeHead:"code-head",asOf});
assert.equal(projected.selectedMandate.mandateId,"successor");assert.equal(projected.selectedMandate.status,"ENABLED");assert.equal(projected.selectedMandate.expiresAt,successor.expiresAt);assert.equal(projected.selectedMandate.currentlyValid,true);
assert.equal(projected.latestAcceptedDataRelease.releaseId,"release-accepted");assert.equal(projected.publishedCheckpoint,"data-checkpoint");assert.equal(projected.currentCodeHead,"code-head");assert.equal(projected.codeHeadDiffersFromPublishedCheckpoint,true);assert.equal(projected.recoveryStatus.status,"LIVE_ACCEPTED");assert.equal(projected.dailyAcceptedReleaseAllowance.remaining,0);assert.equal(projected.nextSafeOperatorAction,"WAIT_FOR_DAILY_ALLOWANCE");assert.equal(JSON.stringify(recoveredState),immutable);

const available=projectPublicationReliabilityStatus({state:{mandates:[predecessor,successor],operations:[],recoveries:[],reconsiderations:[]},selectedMandate:successor,currentCodeHead:"code-head",asOf});assert.equal(available.dailyAcceptedReleaseAllowance.remaining,1);assert.equal(available.nextSafeOperatorAction,"PREFLIGHT_NEXT_PUBLICATION");assert.equal(available.activePublicationStage,"IDLE");
for(const selectedMandate of [predecessor,disabled]){const invalid=projectPublicationReliabilityStatus({state:{mandates:[predecessor,successor,disabled],operations:[],recoveries:[],reconsiderations:[]},selectedMandate,currentCodeHead:"code-head",asOf});assert.equal(invalid.selectedMandate.currentlyValid,false);assert.equal(invalid.dailyAcceptedReleaseAllowance.remaining,0);assert.equal(invalid.nextSafeOperatorAction,"SELECT_VALID_PUBLICATION_MANDATE");}

const failed={candidateId:"candidate-failed",localDay:"2026-11-19",status:"FAILED",events:[{type:"CHECKPOINT_CREATED",at:"2026-11-19T17:30:00.000Z",evidence:{commit:"live-checkpoint"}},{type:"MAIN_UPDATED",at:"2026-11-19T17:31:00.000Z",evidence:{commit:"live-checkpoint"}},{type:"FAILED",at:"2026-11-19T17:32:00.000Z",evidence:{classification:"OBSERVATION_FAILED"}}]};
const liveUnaccepted=projectPublicationReliabilityStatus({state:{mandates:[successor],operations:[failed],recoveries:[],reconsiderations:[]},selectedMandate:successor,currentCodeHead:"code-head",asOf});assert.equal(liveUnaccepted.deploymentLiveButNotGovernedAccepted,true);assert.equal(liveUnaccepted.nextSafeOperatorAction,"INSPECT_GOVERNED_RECOVERY");
const active=projectPublicationReliabilityStatus({state:{mandates:[successor],operations:[{candidateId:"active",status:"PREPARING",events:[{at:"2026-11-19T17:40:00.000Z"}]}],recoveries:[],reconsiderations:[]},selectedMandate:successor,currentCodeHead:"code-head",asOf});assert.equal(active.activePublicationStage,"PREPARING");assert.equal(active.nextSafeOperatorAction,"INSPECT_ACTIVE_PUBLICATION");
assert.throws(()=>projectPublicationReliabilityStatus({state:null,selectedMandate:successor,currentCodeHead:"code-head",asOf}),/EVIDENCE_INCOMPLETE/);
assert.throws(()=>projectPublicationReliabilityStatus({state:{mandates:[successor]},selectedMandate:successor,asOf}),/CODE_HEAD_REQUIRED/);
assert.throws(()=>projectPublicationReliabilityStatus({state:{mandates:[successor]},currentCodeHead:"code-head",asOf}),/MANDATE_REQUIRED/);
assert.throws(()=>projectPublicationReliabilityStatus({state:{mandates:[successor]},selectedMandate:{...successor,expiresAt:"2027-01-01T00:00:00Z"},currentCodeHead:"code-head",asOf}),/MANDATE_CONFLICT/);
assert.throws(()=>projectPublicationReliabilityStatus({state:{mandates:[successor]},selectedMandate:{...successor,mandateId:"unknown"},currentCodeHead:"code-head",asOf}),/MANDATE_CONFLICT/);
console.log("Publication Reliability P2 foundation tests passed: 27 cases.");
