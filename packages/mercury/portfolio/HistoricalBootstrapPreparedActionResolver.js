import {projectHistoricalBootstrapCheckpoint} from "./HistoricalBootstrapCheckpoint.js";

const freeze=value=>Object.freeze(structuredClone(value));

export function createHistoricalBootstrapPreparedActionResolver({prepareRepository}={}){
 if(!prepareRepository?.getById||!prepareRepository?.getAuthorizationById)throw new TypeError("PREPARE_RESOLVER_REPOSITORY_REQUIRED");
 return Object.freeze({async resolve({checkpoint,continuation}={}){
  const projection=projectHistoricalBootstrapCheckpoint({checkpoint}),reference=projection.prepareReference;
  if(!reference)throw new Error("PREPARE_ARTIFACT_NOT_FOUND");
  const artifact=await prepareRepository.getById(reference.prepareArtifactId);
  if(!artifact)throw new Error("PREPARE_ARTIFACT_NOT_FOUND");
  if(artifact.bindingDigest!==reference.prepareArtifactBindingDigest)throw new Error("PREPARE_ARTIFACT_DIGEST_MISMATCH");
  if(artifact.originatingCheckpointSequence!==reference.preparedFromEventSequence||continuation?.eventSequence!==artifact.originatingCheckpointSequence)throw new Error("STALE_PREPARE_ARTIFACT");
  const rights=checkpoint.binding.sourceRightsProfileDigest;
  if(!rights||continuation?.sourceRightsProfileDigest!==rights||artifact.sourceRightsProfileDigest!==rights)throw new Error("BOOTSTRAP_SOURCE_RIGHTS_LINEAGE_CONFLICT");
  if(artifact.operation!==projection.currentStage||artifact.operation!==continuation?.nextOperation||artifact.atlasProductId!==projection.atlasProductId||artifact.productIndex!==projection.productIndex||artifact.source!==checkpoint.binding.sourceId||artifact.paidActionIntentId!==continuation?.paidActionIntentId||artifact.bootstrapCheckpointId!==projection.checkpointId||artifact.bootstrapArtifactId!==projection.artifactId||artifact.authorizationRequestId!==reference.authorizationRequestId||artifact.proposalDigest!==reference.proposalDigest)throw new Error("PAID_ACTION_LINEAGE_CONFLICT");
  const request=await prepareRepository.getAuthorizationById(artifact.authorizationRequestId);
  if(!request)throw new Error("PREPARE_AUTHORIZATION_REFERENCE_NOT_FOUND");
  if(request.requestId!==artifact.authorizationRequestId||request.plan?.decisions?.filter(x=>x.decision==="APPROVED").some(x=>x.execution?.kind!==artifact.operation)||request.paidActionIntentId&&request.paidActionIntentId!==artifact.paidActionIntentId)throw new Error("PAID_ACTION_LINEAGE_CONFLICT");
  return freeze({prepareArtifact:artifact,authorizationRequest:request});
 }});
}
