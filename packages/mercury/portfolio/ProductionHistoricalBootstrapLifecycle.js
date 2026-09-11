import path from "node:path";
import {readFile} from "node:fs/promises";
import {FileHistoricalBootstrapCheckpointRepository} from "./HistoricalBootstrapCheckpoint.js";
import {FileHistoricalBootstrapContinuationRepository,HistoricalBootstrapPaidTaskHandoff} from "./HistoricalBootstrapContinuation.js";
import {HistoricalBootstrapLifecycleService} from "./HistoricalBootstrapLifecycleService.js";
import {createHistoricalBootstrapPreparedActionResolver} from "./HistoricalBootstrapPreparedActionResolver.js";
import {FileDataForSeoPrepareArtifactRepository} from "../acquisition/operations/FileDataForSeoPrepareArtifactRepository.js";

const freeze=value=>Object.freeze(structuredClone(value));
export const HISTORICAL_BOOTSTRAP_PRODUCTION_LIFECYCLE_VERSION="MERCURY-HISTORY-039-1.0";

export function createHistoricalBootstrapPrepareDispatcher({owners}={}){
 if(!owners)throw new TypeError("HISTORY_039_PREPARE_OWNERS_REQUIRED");
 return Object.freeze({async prepare({checkpoint,projection,authorization}={}){const owner=owners[projection?.nextPaidOperation];if(typeof owner?.prepare!=="function")throw new Error("HISTORY_039_PREPARE_OPERATION_UNSUPPORTED");if(authorization?.checkpointId!==projection.checkpointId||authorization?.atlasProductId!==projection.atlasProductId||authorization?.nextOperation!==projection.nextPaidOperation||authorization?.sourceRightsProfileDigest!==projection.sourceRightsProfileDigest)throw new Error("HISTORY_039_PREPARE_LINEAGE_CONFLICT");const trustedMetadata={paidActionIntentId:authorization.paidActionIntentId,bootstrapCheckpointId:projection.checkpointId,bootstrapArtifactId:projection.artifactId,sourceRightsProfileDigest:projection.sourceRightsProfileDigest,originatingCheckpointSequence:projection.eventSequence,productIndex:projection.productIndex};const prepared=await owner.prepare({atlasProductId:projection.atlasProductId,trustedMetadata,checkpoint});if(prepared?.reference?.paidActionIntentId!==authorization.paidActionIntentId||prepared.reference.sourceRightsProfileDigest!==projection.sourceRightsProfileDigest)throw new Error("HISTORY_039_PREPARE_LINEAGE_CONFLICT");return freeze(prepared)}});
}

export function createFileHistoricalBootstrapArtifactReader({rootPath=path.resolve(".forge-review/mercury/history-bootstrap")}={}){
 return Object.freeze({async getById(id){if(!/^mer_histbootstrap_[a-f0-9]{24}$/.test(id??""))throw new Error("HISTORY_039_ARTIFACT_ID_INVALID");try{const value=JSON.parse(await readFile(path.join(rootPath,`${id}.json`),"utf8"));if(value.bootstrapPreparationId!==id)throw new Error("HISTORY_039_ARTIFACT_BINDING_INVALID");return freeze(value)}catch(error){if(error?.code==="ENOENT")return null;throw error}}});
}

export function createProductionHistoricalBootstrapLifecycleService({stateRoot=path.resolve(".forge-review/mercury/history-bootstrap"),artifactRepository,checkpointRepository,continuationRepository,prepareOwners,prepareArtifactRepository,handoff,resultBridge,resultDispatcher,rightsRegistry,spendResolver,taskSpecificOwner,now=()=>new Date().toISOString()}={}){
 const artifacts=artifactRepository??createFileHistoricalBootstrapArtifactReader({rootPath:stateRoot}),checkpoints=checkpointRepository??new FileHistoricalBootstrapCheckpointRepository({statePath:path.join(stateRoot,"checkpoints.json")}),continuations=continuationRepository??new FileHistoricalBootstrapContinuationRepository({statePath:path.join(stateRoot,"continuations.json")}),prepares=prepareArtifactRepository??new FileDataForSeoPrepareArtifactRepository({statePath:path.join(stateRoot,"prepare-artifacts.json")}),resolver=createHistoricalBootstrapPreparedActionResolver({prepareRepository:prepares}),paidHandoff=handoff??new HistoricalBootstrapPaidTaskHandoff({continuationRepository:continuations,checkpointRepository:checkpoints,preparedActionResolver:resolver,rightsRegistry,spendResolver,taskSpecificOwner,now}),prepareOwner=createHistoricalBootstrapPrepareDispatcher({owners:prepareOwners});
 return new HistoricalBootstrapLifecycleService({artifactRepository:artifacts,checkpointRepository:checkpoints,continuationRepository:continuations,prepareOwner,handoff:paidHandoff,resultBridge,resultDispatcher,rightsRegistry,spendResolver,now});
}
