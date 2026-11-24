import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { FileRecurringPublicationAuthorityRepository } from "../packages/sentinel/publication/UnattendedLivePricePublication.js";
import { createSplitRootProductionPublicationCandidateOwner, ProductionUnattendedPublicationCommand, RecurringPublicationMandateOperatorService } from "../packages/sentinel/publication/ProductionUnattendedPublicationBindings.js";
import { createProductionUnattendedPublicationCoordinator } from "../packages/sentinel/publication/ProductionUnattendedPublicationFactory.js";

const args = Object.fromEntries(process.argv.slice(2).filter(value => value.startsWith("--") && value.includes("=")).map(value => value.slice(2).split(/=(.*)/s).slice(0, 2)));
const runtimeRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),mode = String(args.mode ?? "INSPECT").toUpperCase(), root = path.resolve(args.root ?? "."), checkoutRoot = path.resolve(args["checkout-root"] ?? root),publicOutputRoot=path.join(checkoutRoot,"public");
const registryConfirmationDescriptor = "<STATUS>-UNATTENDED-PUBLICATION-MANDATE";
void registryConfirmationDescriptor;
const repository = new FileRecurringPublicationAuthorityRepository({ statePath: path.resolve(args["mandate-state"] ?? ".forge-review/publication/unattended-live-price.json") });
const mandateService = new RecurringPublicationMandateOperatorService({ repository });
const candidateOwner = createSplitRootProductionPublicationCandidateOwner({ evidenceRoot:root, checkoutRoot });
const fingerprint=(kind,value)=>createHash("sha256").update(JSON.stringify({kind,value:path.resolve(value)})).digest("hex");
const candidateBindingContext={runtimeFingerprint:fingerprint("runtime",runtimeRoot),operationalRootFingerprint:fingerprint("operational-root",root),publicationCheckoutRootFingerprint:fingerprint("publication-checkout-root",checkoutRoot)};

if (mode === "CREATE") {
  const result = await mandateService.create({ operatorId: args["operator-id"], validFrom: args["valid-from"], expiresAt: args["expires-at"], confirmation: args.confirmation });
  console.log(JSON.stringify({ status: "PUBLICATION_MANDATE_CREATED", mandateId: result.mandateId, validFrom: result.validFrom, expiresAt: result.expiresAt, maximumAcceptedReleasesPerLocalDay: 1, productionActivated: false }, null, 2));
} else if (["PAUSED", "REVOKED", "ENABLED"].includes(mode)) {
  const result = await mandateService.transition({ mandateId: args["mandate-id"], status: mode, operatorId: args["operator-id"], confirmation: args.confirmation });
  console.log(JSON.stringify({ status: `PUBLICATION_MANDATE_${mode}`, mandateId: result.mandateId, revision: result.revision, productionExecuted: false }, null, 2));
} else {
  const coordinatorFactory = async ({recovery=false,disposition=false,reconsideration=false,observationRecovery=false,advancementApproval=false}={}) => {
    return createProductionUnattendedPublicationCoordinator({runtimeRoot,evidenceRoot:root,workspaceRoot:checkoutRoot,publicOutputRoot,repository,candidateOwner,recovery,disposition,reconsideration,observationRecovery,advancementApproval});
  };
  const run=promisify(execFile),statusContextOwner={inspect:async()=>{const {stdout}=await run("git",["rev-parse","HEAD"],{cwd:runtimeRoot,windowsHide:true});return{currentCodeHead:stdout.trim(),publishedCheckpoint:null};}};
  const command = new ProductionUnattendedPublicationCommand({ repository, mandateService, candidateOwner, coordinatorFactory, statusContextOwner, candidateBindingContext });
  if(mode==="OBSERVE"&&args.confirmation!=="OBSERVE-UNATTENDED-PUBLICATION-DEPLOYMENT")throw new Error("PUBLICATION_OBSERVATION_CONFIRMATION_REQUIRED");
  const recoveryInput={mandateId:args["mandate-id"],candidateId:args["candidate-id"],checkpointCommit:args["checkpoint-commit"],confirmation:args.confirmation};
  const dispositionInput={candidateId:args["candidate-id"],confirmation:args.confirmation};
  const reconsiderationInput={mandateId:args["mandate-id"],candidateId:args["candidate-id"],confirmation:args.confirmation};
  const observationRecoveryInput={mandateId:args["mandate-id"],reconsiderationId:args["reconsideration-id"],operatorId:args["operator-id"],confirmation:args.confirmation};
  const advancementInput={mandateId:args["mandate-id"],candidateId:args["candidate-id"],approvedDescendant:args["approved-descendant"],operatorId:args["operator-id"],confirmation:args.confirmation};
  const result=mode==="RUN"?await command.run({mandateId:args["mandate-id"],candidateId:args["candidate-id"]}):mode==="OBSERVE"?await command.observe({mandateId:args["mandate-id"],candidateId:args["candidate-id"]}):mode==="RECOVERY_INSPECT"?await command.inspectRecovery(recoveryInput):mode==="RECOVER"?await command.recover(recoveryInput):mode==="ADVANCEMENT_APPROVAL_INSPECT"?await command.inspectAdvancementApproval(advancementInput):mode==="APPROVE_ADVANCEMENT"?await command.approveAdvancement(advancementInput):mode==="DISPOSITION_INSPECT"?await command.inspectDisposition(dispositionInput):mode==="DISPOSE_PRE_CHECKPOINT"?await command.disposeFailedPreparation(dispositionInput):mode==="RECONSIDERATION_INSPECT"?await command.inspectReconsideration(reconsiderationInput):mode==="RECONSIDER_PRE_CHECKPOINT"?await command.reconsiderFailedPreparation(reconsiderationInput):mode==="RECONSIDERATION_OBSERVATION_RECOVERY_INSPECT"?await command.inspectReconsiderationObservationRecovery(observationRecoveryInput):mode==="RECOVER_RECONSIDERATION_OBSERVATION"?await command.recoverReconsiderationObservation(observationRecoveryInput):await command.inspect({mandateId:args["mandate-id"]});
  console.log(JSON.stringify(result, null, 2));
}
