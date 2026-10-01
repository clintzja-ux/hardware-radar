import { createHash } from "node:crypto";

export const RAKUTEN_CURRENT_REFRESH_PREPARATION_SCHEMA_VERSION = "1.0";
export const RAKUTEN_CURRENT_REFRESH_POLICY_VERSION = "RAKUTEN-NEWEGG-ROUTINE-CURRENT-REFRESH-P1-1.0";
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
const digest = value => createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };

export function prepareRakutenCurrentRefresh({ plan, members, preparedAt } = {}) {
  if (!plan?.planId || !Array.isArray(members) || !members.length || !Number.isFinite(Date.parse(preparedAt))) throw new TypeError("RAKUTEN_CURRENT_REFRESH_PREPARE_INPUT_INVALID");
  const selected = new Map(plan.selectedMembers.filter(value => value.proposedLane === "RAKUTEN_NEWEGG").map(value => [value.atlasProductId, value]));
  const normalized = members.map(member => {
    const planned = selected.get(member.atlasProductId);
    if (!planned || member.retailerId !== "RETAILER-0004" || member.source !== "RAKUTEN_NEWEGG_PRODUCT_CATALOG" || member.identityBinding !== "DETERMINISTIC_SINGLE_BINDING" || !member.destinationId || !member.retailerListingId) throw new Error("RAKUTEN_CURRENT_REFRESH_MEMBER_NOT_ROUTINE_READY");
    return { atlasProductId: member.atlasProductId, retailerId: member.retailerId, source: member.source, destinationId: member.destinationId, retailerListingId: member.retailerListingId, identityBinding: member.identityBinding, reviewStatus: "NOT_REQUIRED", destinationStatus: "GOVERNED", currentQualificationReadiness: "READY_FOR_FUTURE_ACQUISITION", freshnessTarget: member.freshnessTarget, sourceRightsProfileId: member.sourceRightsProfileId, historyEligibility: false, providerOperationBoundary: "OPERATOR_AUTHORIZATION_REQUIRED" };
  }).sort((a, b) => a.atlasProductId.localeCompare(b.atlasProductId));
  const material = { policyVersion: RAKUTEN_CURRENT_REFRESH_POLICY_VERSION, preparedAt, refreshPlanId: plan.planId, refreshPlanBindingDigest: plan.bindingDigest, members: normalized, maximumProviderOperations: 1, maximumSpendUsd: 0, authority: "NONE", networkOperation: "NONE", currentMutationAuthorized: false, historyEligibility: false };
  const bindingDigest = digest(material);
  return freeze({ schemaVersion: RAKUTEN_CURRENT_REFRESH_PREPARATION_SCHEMA_VERSION, preparationType: "RAKUTEN_NEWEGG_CURRENT_REFRESH_PREPARATION", preparationId: `mer_rakutencurrent_${bindingDigest.slice(0, 24)}`, bindingDigest, ...material, providerCalls: 0, paidTasksCreated: 0, actualSpendUsd: 0 });
}

export function validateRakutenCurrentRefreshPreparation(value) {
  const material = { policyVersion: value?.policyVersion, preparedAt: value?.preparedAt, refreshPlanId: value?.refreshPlanId, refreshPlanBindingDigest: value?.refreshPlanBindingDigest, members: value?.members, maximumProviderOperations: value?.maximumProviderOperations, maximumSpendUsd: value?.maximumSpendUsd, authority: value?.authority, networkOperation: value?.networkOperation, currentMutationAuthorized: value?.currentMutationAuthorized, historyEligibility: value?.historyEligibility };
  if (value?.schemaVersion !== RAKUTEN_CURRENT_REFRESH_PREPARATION_SCHEMA_VERSION || value?.preparationType !== "RAKUTEN_NEWEGG_CURRENT_REFRESH_PREPARATION" || value?.bindingDigest !== digest(material) || value?.preparationId !== `mer_rakutencurrent_${value.bindingDigest.slice(0, 24)}` || value.authority !== "NONE" || value.networkOperation !== "NONE" || value.currentMutationAuthorized !== false || value.historyEligibility !== false || value.providerCalls !== 0 || value.paidTasksCreated !== 0 || value.actualSpendUsd !== 0) throw new Error("RAKUTEN_CURRENT_REFRESH_PREPARATION_INVALID");
  return true;
}
