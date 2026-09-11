import { validateHistoricalBootstrapPreparation } from "./HistoricalBootstrapPreparation.js";

export const HISTORICAL_BOOTSTRAP_PRODUCTION_COMPOSITION_VERSION = "MERCURY-HISTORY-021-1.0";
export const STAGE_A_BOOTSTRAP_ARTIFACT_ID = "mer_histbootstrap_71c280422c057da3b248a43b";

const requiredMethod = (owner, method, code) => {
  if (typeof owner?.[method] !== "function") throw new TypeError(code);
};

/**
 * Wiring-only boundary. Provider task creation, retrieval, identity, retention,
 * comparability, admission and accounting remain owned by the injected certified
 * production services. No stage is inferred and no task is created speculatively.
 */
export class HistoricalBootstrapProductionComposition {
  constructor({ artifactRepository, authorizationRepository, productsOwner,
    productInfoOwner, sellersOwner, retrievalOwner, identityOwner, retentionOwner,
    comparabilityOwner, admissionOwner, spendOwner, portfolioOwner, forgeOwner } = {}) {
    requiredMethod(artifactRepository, "getById", "HISTORY_021_ARTIFACT_OWNER_REQUIRED");
    requiredMethod(authorizationRepository, "getById", "HISTORY_021_AUTHORIZATION_OWNER_REQUIRED");
    requiredMethod(authorizationRepository, "consume", "HISTORY_021_AUTHORIZATION_OWNER_REQUIRED");
    requiredMethod(productsOwner, "createTask", "HISTORY_021_PRODUCTS_OWNER_REQUIRED");
    requiredMethod(productInfoOwner, "createTask", "HISTORY_021_PRODUCT_INFO_OWNER_REQUIRED");
    requiredMethod(sellersOwner, "createTask", "HISTORY_021_SELLERS_OWNER_REQUIRED");
    requiredMethod(retrievalOwner, "retrieve", "HISTORY_021_RETRIEVAL_OWNER_REQUIRED");
    requiredMethod(identityOwner, "resolve", "HISTORY_021_IDENTITY_OWNER_REQUIRED");
    requiredMethod(retentionOwner, "retain", "HISTORY_021_RETENTION_OWNER_REQUIRED");
    requiredMethod(comparabilityOwner, "assess", "HISTORY_021_COMPARABILITY_OWNER_REQUIRED");
    requiredMethod(admissionOwner, "admit", "HISTORY_021_ADMISSION_OWNER_REQUIRED");
    requiredMethod(spendOwner, "forUtcDay", "HISTORY_021_SPEND_OWNER_REQUIRED");
    this.owners={artifactRepository,authorizationRepository,productsOwner,productInfoOwner,sellersOwner,retrievalOwner,identityOwner,retentionOwner,comparabilityOwner,admissionOwner,spendOwner,portfolioOwner,forgeOwner};
  }

  async inspect({ artifactId = STAGE_A_BOOTSTRAP_ARTIFACT_ID, authorizationId, asOf } = {}) {
    if (artifactId !== STAGE_A_BOOTSTRAP_ARTIFACT_ID) throw new Error("HISTORY_021_ARTIFACT_SUBSTITUTION_BLOCKED");
    const artifact=await this.owners.artifactRepository.getById(artifactId);
    validateHistoricalBootstrapPreparation(artifact);
    const authorization=authorizationId?await this.owners.authorizationRepository.getById(authorizationId):null;
    const currentUtcDaySpendUsd=await this.owners.spendOwner.forUtcDay(asOf);
    return Object.freeze({schemaVersion:"1.0",compositionVersion:HISTORICAL_BOOTSTRAP_PRODUCTION_COMPOSITION_VERSION,artifactId,artifactBindingDigest:artifact.bindingDigest,products:artifact.selected.map(x=>x.atlasProductId),taskCeiling:artifact.costEnvelope.maximumPaidTasks,spendCeilingUsd:artifact.costEnvelope.maximumProviderSpendUsd,currentUtcDaySpendUsd,authorization:authorization?{authorizationId:authorization.authorizationId,status:authorization.status,expiresAt:authorization.expiresAt}:null,providerOperation:"NONE",paidTaskCreated:false,actualSpendUsd:0,publicationAuthority:false,currentPriceAuthority:false});
  }

  ownerBindings(){return Object.freeze({PRODUCTS:"productsOwner.createTask",PRODUCT_INFO:"productInfoOwner.createTask",SELLERS:"sellersOwner.createTask",RETRIEVAL:"retrievalOwner.retrieve",IDENTITY:"identityOwner.resolve",DF003:"retentionOwner.retain",COMPARABILITY:"comparabilityOwner.assess",E2J:"admissionOwner.admit",SPEND:"spendOwner.forUtcDay"});}
}
