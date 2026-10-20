import path from "node:path";
import { pathToFileURL } from "node:url";
import { FileRecurringPublicationAuthorityRepository } from "../packages/sentinel/publication/UnattendedLivePricePublication.js";
import { CertifiedRoutinePublicationCandidateOwner, ProductionUnattendedPublicationCommand, RecurringPublicationMandateOperatorService } from "../packages/sentinel/publication/ProductionUnattendedPublicationBindings.js";
import { createProductionUnattendedPublicationCoordinator } from "../packages/sentinel/publication/ProductionUnattendedPublicationFactory.js";

const args = Object.fromEntries(process.argv.slice(2).filter(value => value.startsWith("--") && value.includes("=")).map(value => value.slice(2).split(/=(.*)/s).slice(0, 2)));
const mode = String(args.mode ?? "INSPECT").toUpperCase(), root = path.resolve(args.root ?? "."), checkoutRoot = path.resolve(args["checkout-root"] ?? root);
const registryConfirmationDescriptor = "<STATUS>-UNATTENDED-PUBLICATION-MANDATE";
void registryConfirmationDescriptor;
const repository = new FileRecurringPublicationAuthorityRepository({ statePath: path.resolve(args["mandate-state"] ?? ".forge-review/publication/unattended-live-price.json") });
const mandateService = new RecurringPublicationMandateOperatorService({ repository });
const candidateOwner = new CertifiedRoutinePublicationCandidateOwner({ routineHealthPath: path.join(root, ".forge-review/mercury/newegg-routine/routine-health.json"), artifactRoot: path.join(root, ".forge-review/publication/ram-intelligence"), releaseManifestPath: path.join(root, "config/publication-release.json") });

if (mode === "CREATE") {
  const result = await mandateService.create({ operatorId: args["operator-id"], validFrom: args["valid-from"], expiresAt: args["expires-at"], confirmation: args.confirmation });
  console.log(JSON.stringify({ status: "PUBLICATION_MANDATE_CREATED", mandateId: result.mandateId, validFrom: result.validFrom, expiresAt: result.expiresAt, maximumAcceptedReleasesPerLocalDay: 1, productionActivated: false }, null, 2));
} else if (["PAUSED", "REVOKED", "ENABLED"].includes(mode)) {
  const result = await mandateService.transition({ mandateId: args["mandate-id"], status: mode, operatorId: args["operator-id"], confirmation: args.confirmation });
  console.log(JSON.stringify({ status: `PUBLICATION_MANDATE_${mode}`, mandateId: result.mandateId, revision: result.revision, productionExecuted: false }, null, 2));
} else {
  const coordinatorFactory = async () => {
    const modulePath = process.env.HARDWARE_RADAR_PUBLICATION_PRODUCTION_FACTORY;
    if (!modulePath) return createProductionUnattendedPublicationCoordinator({ root:checkoutRoot, repository, candidateOwner });
    const factory = await import(pathToFileURL(path.resolve(modulePath)).href);
    if (typeof factory.createProductionUnattendedPublicationCoordinator !== "function") throw new Error("PUBLICATION_PRODUCTION_FACTORY_INVALID");
    return factory.createProductionUnattendedPublicationCoordinator({ root:checkoutRoot, repository, candidateOwner });
  };
  const command = new ProductionUnattendedPublicationCommand({ repository, mandateService, candidateOwner, coordinatorFactory });
  console.log(JSON.stringify(mode === "RUN" ? await command.run({ mandateId: args["mandate-id"] }) : await command.inspect(), null, 2));
}
