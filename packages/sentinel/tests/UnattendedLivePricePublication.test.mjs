import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createRecurringPublicationMandate,
  FileRecurringPublicationAuthorityRepository,
  projectUnattendedPublicationHealth,
  selectObservationInnerAuthorization,
  validateObservationDeployment,
  UnattendedLivePricePublicationCoordinator,
} from "../publication/UnattendedLivePricePublication.js";
import { createLivePricePublicationAuthorization, FileLivePricePublicationAuthorizationRepository } from "../publication/GovernedLivePricePublication.js";

const root = await mkdtemp(path.join(os.tmpdir(), "hr-unattended-publication-"));
const at = "2026-10-17T16:30:00.000Z";
const candidate = {
  candidateId: "candidate-1", artifactId: "artifact-1", certificationId: "cert-1",
  bindingDigest: "a".repeat(64), artifactDigest:"b".repeat(64), certificationDigest:"c".repeat(64), releaseId: "release-1",
  freshUntil: "2026-10-18T03:15:08.000Z", sentinelStatus: "CERTIFIED", sourceRightsEligible: true,
};

const createRepository = async name => {
  const repository = new FileRecurringPublicationAuthorityRepository({ statePath: path.join(root, `${name}.json`) });
  const mandate = createRecurringPublicationMandate({
    operatorId: `operator:${name}`, validFrom: "2026-10-17T00:00:00Z",
    expiresAt: "2026-11-16T00:00:00Z", createdAt: at,
  });
  await repository.record(mandate);
  return { repository, mandate };
};

const createCoordinator = ({ repository, candidateValue = candidate, overrides = {} }) => {
  let pushes = 0, preparations = 0;
  const coordinator = new UnattendedLivePricePublicationCoordinator({
    repository,
    candidateOwner: { discover: async () => candidateValue },
    preparationOwner: { prepare: async ({ child }) => { preparations += 1; return { authorizationId: child.childAuthorizationId, allowlistValid: true }; } },
    gitOwner: {
      inspectBase: async () => ({ clean: true, localCommit: "base", remoteCommit: "base" }),
      checkpoint: async () => ({ commit: "release", parentCommit: "base", unrelatedPaths: [] }),
      fastForwardMain: async () => { pushes += 1; return { commit: "release" }; },
    },
    deploymentOwner: { observe: async () => ({ status: "SUCCESS" }) },
    liveVerifier: { verify: async () => ({ status: "MATCH" }) },
    now: () => at,
    ...overrides,
  });
  return { coordinator, counts: () => ({ pushes, preparations }) };
};

try {
  const primary = await createRepository("fixture");
  const primaryRun = createCoordinator({ repository: primary.repository });
  const success = await primaryRun.coordinator.run({ mandateId: primary.mandate.mandateId });
  assert.equal(success.status, "LIVE_ACCEPTED");
  assert.deepEqual(primaryRun.counts(), { pushes: 1, preparations: 1 });
  assert.equal((await primaryRun.coordinator.run({ mandateId: primary.mandate.mandateId })).replay, true);
  assert.deepEqual(primaryRun.counts(), { pushes: 1, preparations: 1 });
  assert.equal(projectUnattendedPublicationHealth({ mandate: primary.mandate, operation: success, asOf: at }).liveAcceptance, true);

  const concurrent = await createRepository("concurrent");
  const concurrentRun = createCoordinator({ repository: concurrent.repository, candidateValue: { ...candidate, candidateId: "concurrent" } });
  const concurrentResults = await Promise.allSettled([
    concurrentRun.coordinator.run({ mandateId: concurrent.mandate.mandateId }),
    concurrentRun.coordinator.run({ mandateId: concurrent.mandate.mandateId }),
  ]);
  assert.equal(concurrentResults.filter(result => result.status === "fulfilled").length, 1);
  assert.match(concurrentResults.find(result => result.status === "rejected").reason.message, /OPERATION_BUSY/);
  assert.equal(concurrentRun.counts().preparations, 1);
  assert.equal(concurrentRun.counts().pushes, 1);

  assert.equal((await createCoordinator({ repository: primary.repository, candidateValue: null }).coordinator.run({ mandateId: primary.mandate.mandateId })).status, "NO_ELIGIBLE_CANDIDATE");
  await assert.rejects(() => createCoordinator({ repository: primary.repository, candidateValue: { ...candidate, candidateId: "expired", freshUntil: at } }).coordinator.run({ mandateId: primary.mandate.mandateId }), /EXPIRED/);
  await assert.rejects(() => createCoordinator({ repository: primary.repository, candidateValue: { ...candidate, candidateId: "conflict", sentinelStatus: "CONFLICT" } }).coordinator.run({ mandateId: primary.mandate.mandateId }), /CERTIFICATION/);

  const transitions = await createRepository("transitions");
  await transitions.repository.transition({ mandateId: transitions.mandate.mandateId, status: "PAUSED", operatorId: "operator:transitions", at });
  await assert.rejects(() => transitions.repository.authorizeChild({ mandateId: transitions.mandate.mandateId, candidate, predecessorCommit: "base", at }), /PAUSED/);
  await transitions.repository.transition({ mandateId: transitions.mandate.mandateId, status: "ENABLED", operatorId: "operator:transitions", at });
  await transitions.repository.transition({ mandateId: transitions.mandate.mandateId, status: "REVOKED", operatorId: "operator:transitions", at });
  await assert.rejects(() => transitions.repository.authorizeChild({ mandateId: transitions.mandate.mandateId, candidate, predecessorCommit: "base", at }), /REVOKED/);

  const pending = await createRepository("pending");
  let deploymentStatus = "PENDING";
  const pendingRun = createCoordinator({ repository: pending.repository, candidateValue: { ...candidate, candidateId: "pending" }, overrides: { deploymentOwner: { observe: async () => ({ status: deploymentStatus }) } } });
  await assert.rejects(() => pendingRun.coordinator.run({ mandateId: pending.mandate.mandateId }), /PENDING/);
  deploymentStatus = "SUCCESS";
  assert.equal((await pendingRun.coordinator.run({ mandateId: pending.mandate.mandateId })).status, "LIVE_ACCEPTED");
  assert.equal(pendingRun.counts().preparations, 1);

  const daily = await createRepository("daily");
  await createCoordinator({ repository: daily.repository }).coordinator.run({ mandateId: daily.mandate.mandateId });
  await assert.rejects(() => createCoordinator({ repository: daily.repository, candidateValue: { ...candidate, candidateId: "candidate-2" } }).coordinator.run({ mandateId: daily.mandate.mandateId }), /DAILY_LIMIT/);

  const staleBase = await createRepository("stale-base");
  await assert.rejects(() => createCoordinator({ repository: staleBase.repository, overrides: { gitOwner: { inspectBase: async () => ({ clean: true, localCommit: "old", remoteCommit: "new" }) } } }).coordinator.run({ mandateId: staleBase.mandate.mandateId }), /PREDECESSOR_CONFLICT/);

  const interrupted = await createRepository("interrupted"), interruptedCandidate={...candidate,candidateId:"interrupted"}, interruptedPaths=[`config/artifacts/${"interrupted"}.json`,"config/publication-release.json"].sort(), interruptedChild=await interrupted.repository.authorizeChild({mandateId:interrupted.mandate.mandateId,candidate:interruptedCandidate,predecessorCommit:"base",at});
  await interrupted.repository.recordEvent({candidateId:interruptedCandidate.candidateId,type:"PREPARE_STARTED",status:"PREPARING",evidence:{originalCleanCheckout:{clean:true,localCommit:"base",remoteCommit:"base",verifiedAt:at},promotionPaths:interruptedPaths},at});
  const interruptedRun=createCoordinator({repository:interrupted.repository,candidateValue:interruptedCandidate,overrides:{gitOwner:{inspectBase:async()=>({clean:false,changedPaths:[interruptedPaths[0]],localCommit:"base",remoteCommit:"base"}),checkpoint:async()=>({commit:"release",parentCommit:"base",unrelatedPaths:[]}),fastForwardMain:async()=>({commit:"release"})}}});
  const recovered=await interruptedRun.coordinator.run({mandateId:interrupted.mandate.mandateId});assert.equal(recovered.status,"LIVE_ACCEPTED");assert.equal(interruptedRun.counts().preparations,1);assert.equal((await interrupted.repository.getOperation(interruptedCandidate.candidateId)).attempts,1);assert.equal(interruptedChild.childAuthorizationId,(await interrupted.repository.getOperation(interruptedCandidate.candidateId)).childAuthorizationId);

  const unrelated = await createRepository("unrelated");
  const unrelatedRun = createCoordinator({ repository: unrelated.repository, overrides: { gitOwner: {
    inspectBase: async () => ({ clean: true, localCommit: "base", remoteCommit: "base" }),
    checkpoint: async () => ({ commit: "release", parentCommit: "base", unrelatedPaths: ["packages/mercury/index.js"] }),
  } } });
  await assert.rejects(() => unrelatedRun.coordinator.run({ mandateId: unrelated.mandate.mandateId }), /RELEASE_ONLY_CHECKPOINT_INVALID/);

  const deploymentFailure = await createRepository("deployment-failure");
  const failedRun = createCoordinator({ repository: deploymentFailure.repository, overrides: { deploymentOwner: { observe: async () => ({ status: "FAILED" }) } } });
  await assert.rejects(() => failedRun.coordinator.run({ mandateId: deploymentFailure.mandate.mandateId }), /DEPLOYMENT_FAILED/);
  await assert.rejects(() => failedRun.coordinator.run({ mandateId: deploymentFailure.mandate.mandateId }), /AUTOMATIC_RETRY_PROHIBITED/);

  const liveMismatch = await createRepository("live-mismatch");
  await assert.rejects(() => createCoordinator({ repository: liveMismatch.repository, overrides: { liveVerifier: { verify: async () => ({ status: "MISMATCH" }) } } }).coordinator.run({ mandateId: liveMismatch.mandate.mandateId }), /LIVE_ACCEPTANCE_INVALID/);

  const observation=await createRepository("observation"),observedCandidate={...candidate,candidateId:"mer_ramreleasecand_1234567890abcdef12345678",artifactId:"mer_ramreleaseart_1234567890abcdef12345678",certificationId:"sent_ramreleasecert_1234567890abcdef12345678",releaseId:"pubrel_1234567890abcdef12345678",predecessorReleaseId:"pubrel_abcdefabcdefabcdefabcdef"},child=await observation.repository.authorizeChild({mandateId:observation.mandate.mandateId,candidate:observedCandidate,predecessorCommit:"base",at});
  await observation.repository.recordEvent({candidateId:observedCandidate.candidateId,type:"PREPARE_STARTED",status:"PREPARING",evidence:{},at});
  await observation.repository.recordEvent({candidateId:observedCandidate.candidateId,type:"CHECKPOINT_CREATED",status:"CHECKPOINTED",evidence:{commit:"release"},at});
  await observation.repository.recordEvent({candidateId:observedCandidate.candidateId,type:"MAIN_UPDATED",status:"DEPLOYMENT_PENDING",evidence:{commit:"release"},at});
  const releaseArtifactDigest="9".repeat(64),innerRepository=new FileLivePricePublicationAuthorizationRepository({statePath:path.join(root,"observation-inner.json")}),inner=createLivePricePublicationAuthorization({candidateId:observedCandidate.candidateId,artifactId:observedCandidate.artifactId,artifactDigest:releaseArtifactDigest,bindingDigest:observedCandidate.bindingDigest,certificationId:observedCandidate.certificationId,certificationDigest:observedCandidate.certificationDigest,targetEnvironment:"PRODUCTION",predecessorReleaseId:observedCandidate.predecessorReleaseId??"pubrel_abcdefabcdefabcdefabcdef",freshUntil:observedCandidate.freshUntil,authorizedPaths:["public/"],authorizedBy:"operator:observation",authorizedAt:at});
  await innerRepository.record(inner);await innerRepository.begin({authorizationId:inner.authorizationId,checkoutRoot:root,startedAt:at});await innerRepository.consume({authorizationId:inner.authorizationId,checkpointDigest:"d".repeat(64),consumedAt:at});
  let observations=0,checkpointInput=null;const observationRun=createCoordinator({repository:observation.repository,candidateValue:observedCandidate,overrides:{authorizationRepository:innerRepository,gitOwner:{inspectPublishedCheckpoint:async input=>{checkpointInput=input;return{localCommit:"release",remoteCommit:"release",parentCommit:"base",candidateId:observedCandidate.candidateId,releaseId:observedCandidate.releaseId,publicArtifacts:[{url:"https://example.test/",sha256:"e".repeat(64)}]};}},deploymentOwner:{observe:async()=>({status:"SUCCESS",commit:"release",environment:"production",deploymentId:"deployment",completedAt:"2026-10-18T03:00:00Z"})},liveVerifier:{verify:async()=>{observations++;return{status:"MATCH"};}},now:()=>"2026-10-23T00:00:00Z"}});
  const observed=await observationRun.coordinator.observe({candidateId:observedCandidate.candidateId,mandateId:observation.mandate.mandateId});assert.equal(observed.status,"LIVE_ACCEPTED");assert.equal(observed.events.at(-1).evidence.observationOnly,true);assert.equal(observationRun.counts().preparations,0);assert.equal(observationRun.counts().pushes,0);assert.equal(observations,1);
  assert.notEqual(observedCandidate.artifactDigest,releaseArtifactDigest);assert.equal(checkpointInput.releaseArtifactDigest,releaseArtifactDigest);assert.equal(checkpointInput.artifactDigest,undefined);assert.equal((await observation.repository.getOperation(observedCandidate.candidateId)).childAuthorizationId,child.childAuthorizationId);
  assert.equal((await observationRun.coordinator.observe({candidateId:observedCandidate.candidateId,mandateId:observation.mandate.mandateId})).replay,true);assert.equal(observations,1);

  const exactInnerInput={authorizations:[inner],child,mandate:observation.mandate};assert.equal(selectObservationInnerAuthorization(exactInnerInput).authorizationId,inner.authorizationId);
  assert.throws(()=>selectObservationInnerAuthorization({...exactInnerInput,authorizations:[]}),/INNER_AUTHORITY_INVALID/);
  assert.throws(()=>selectObservationInnerAuthorization({...exactInnerInput,authorizations:[inner,{...inner,authorizationId:"pubauto_ffffffffffffffffffffffff",artifactDigest:"8".repeat(64)}]}),/INNER_AUTHORITY_INVALID/);
  for(const field of ["candidateId","artifactId","certificationId","certificationDigest","bindingDigest","predecessorReleaseId","freshUntil","authorizedAt","authorizedBy","targetEnvironment"])assert.throws(()=>selectObservationInnerAuthorization({...exactInnerInput,authorizations:[{...inner,[field]:`wrong-${field}`}] }),/INNER_AUTHORITY_INVALID/,field);
  const timelyDeployment={status:"SUCCESS",commit:"release",environment:"production",completedAt:"2026-10-18T03:00:00Z"};assert.equal(validateObservationDeployment({deployment:timelyDeployment,commit:"release",freshUntil:observedCandidate.freshUntil}).status,"SUCCESS");
  for(const deployment of [{...timelyDeployment,commit:"wrong"},{...timelyDeployment,environment:"preview"},{...timelyDeployment,completedAt:null},{...timelyDeployment,status:"FAILED"}])assert.throws(()=>validateObservationDeployment({deployment,commit:"release",freshUntil:observedCandidate.freshUntil}),/OBSERVATION_INVALID/);
  assert.throws(()=>validateObservationDeployment({deployment:{...timelyDeployment,completedAt:observedCandidate.freshUntil},commit:"release",freshUntil:observedCandidate.freshUntil}),/AFTER_FRESHNESS/);

  const late=await createRepository("late-observation"),lateCandidate={...observedCandidate,candidateId:"mer_ramreleasecand_abcdefabcdefabcdefabcdef"},lateChild=await late.repository.authorizeChild({mandateId:late.mandate.mandateId,candidate:lateCandidate,predecessorCommit:"base",at});void lateChild;
  await late.repository.recordEvent({candidateId:lateCandidate.candidateId,type:"PREPARE_STARTED",status:"PREPARING",evidence:{},at});await late.repository.recordEvent({candidateId:lateCandidate.candidateId,type:"CHECKPOINT_CREATED",status:"CHECKPOINTED",evidence:{commit:"release"},at});await late.repository.recordEvent({candidateId:lateCandidate.candidateId,type:"MAIN_UPDATED",status:"DEPLOYMENT_PENDING",evidence:{commit:"release"},at});
  const lateInnerRepository=new FileLivePricePublicationAuthorizationRepository({statePath:path.join(root,"late-inner.json")}),lateInner=createLivePricePublicationAuthorization({candidateId:lateCandidate.candidateId,artifactId:lateCandidate.artifactId,artifactDigest:"8".repeat(64),bindingDigest:lateCandidate.bindingDigest,certificationId:lateCandidate.certificationId,certificationDigest:lateCandidate.certificationDigest,targetEnvironment:"PRODUCTION",predecessorReleaseId:lateCandidate.predecessorReleaseId,freshUntil:lateCandidate.freshUntil,authorizedPaths:["public/"],authorizedBy:"operator:late-observation",authorizedAt:at});await lateInnerRepository.record(lateInner);await lateInnerRepository.begin({authorizationId:lateInner.authorizationId,checkoutRoot:root,startedAt:at});await lateInnerRepository.consume({authorizationId:lateInner.authorizationId,checkpointDigest:"f".repeat(64),consumedAt:at});
  const lateRun=createCoordinator({repository:late.repository,candidateValue:lateCandidate,overrides:{authorizationRepository:lateInnerRepository,gitOwner:{inspectPublishedCheckpoint:async()=>({localCommit:"release",remoteCommit:"release",parentCommit:"base",candidateId:lateCandidate.candidateId,releaseId:lateCandidate.releaseId,publicArtifacts:[{}]})},deploymentOwner:{observe:async()=>({status:"SUCCESS",commit:"release",environment:"production",completedAt:lateCandidate.freshUntil})},liveVerifier:{verify:async()=>({status:"MATCH"})},now:()=>"2026-10-23T00:00:00Z"}});await assert.rejects(()=>lateRun.coordinator.observe({candidateId:lateCandidate.candidateId,mandateId:late.mandate.mandateId}),/AFTER_FRESHNESS/);const lateState=await late.repository.getOperation(lateCandidate.candidateId);assert.equal(lateState.status,"DEPLOYMENT_PENDING");assert.equal(lateState.events.length,3);assert.equal(lateState.attempts,1);assert.equal(lateState.childAuthorizationId,lateChild.childAuthorizationId);assert.equal((await lateInnerRepository.getConsumption(lateInner.authorizationId)).checkpointDigest,"f".repeat(64));

  assert.equal(primary.mandate.automaticRetries, 0);
  assert.equal(primary.mandate.automaticRollback, false);
  assert.equal(primary.mandate.sourceCodeChanges, false);
  console.log("Unattended live-price publication tests passed: success, replay, authority, Git, deployment, observation-only reconciliation, and live-acceptance controls.");
} finally {
  await rm(root, { recursive: true, force: true });
}
