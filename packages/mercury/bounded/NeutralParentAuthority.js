import crypto from "node:crypto";

const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));
const text=(value,code)=>{if(typeof value!=="string"||!value.trim())throw new Error(code);return value.trim();};

export function createNeutralParentAuthorityInput({parentAuthorization,plan,member,childExpiresAt}={}){
  const material={parentAuthorizationId:text(parentAuthorization?.authorizationId,"BOUNDED_PARENT_AUTHORIZATION_INVALID"),parentAuthorizationDigest:text(parentAuthorization?.bindingDigest,"BOUNDED_PARENT_AUTHORIZATION_INVALID"),boundedPlanId:text(plan?.planId,"BOUNDED_PARENT_PLAN_INVALID"),boundedPlanDigest:text(plan?.bindingDigest,"BOUNDED_PARENT_PLAN_INVALID"),memberKey:text(member?.memberKey,"BOUNDED_PARENT_MEMBER_INVALID"),domainMemberId:text(member?.domainMemberId,"BOUNDED_PARENT_MEMBER_INVALID"),sourceId:text(member?.source,"BOUNDED_PARENT_SOURCE_INVALID"),operation:text(member?.operation,"BOUNDED_PARENT_OPERATION_INVALID"),maximumTaskCostUsd:member?.taskCeilingUsd,zeroRetries:parentAuthorization?.automaticPaidRetries,parentExpiresAt:text(parentAuthorization?.expiresAt,"BOUNDED_PARENT_EXPIRY_INVALID"),childExpiresAt:text(childExpiresAt??parentAuthorization?.expiresAt,"BOUNDED_CHILD_EXPIRY_INVALID")};
  if(!/^[a-f0-9]{64}$/.test(material.parentAuthorizationDigest)||!/^[a-f0-9]{64}$/.test(material.boundedPlanDigest)||!Number.isFinite(material.maximumTaskCostUsd)||material.maximumTaskCostUsd<0||material.zeroRetries!==0)throw new Error("BOUNDED_PARENT_AUTHORITY_INVALID");
  const childBindingDigest=digest(material);
  return freeze({schemaVersion:"1.0",...material,childBindingDigest});
}

export function validateNeutralParentAuthorityInput({authority,parentAuthorization,plan,member,expectedSourceId,expectedOperation,maximumTaskCostUsd,asOf}={}){
  const expected=createNeutralParentAuthorityInput({parentAuthorization,plan,member,childExpiresAt:authority?.childExpiresAt});
  if(stable(authority)!==stable(expected))throw new Error("BOUNDED_PARENT_CHILD_BINDING_INVALID");
  if(parentAuthorization?.planId!==plan?.planId||parentAuthorization?.planBindingDigest!==plan?.bindingDigest||!plan?.ready?.some(value=>value.memberKey===member?.memberKey&&stable(value)===stable(member)))throw new Error("BOUNDED_PARENT_MEMBER_BINDING_INVALID");
  if(authority.sourceId!==expectedSourceId)throw new Error("BOUNDED_PARENT_SOURCE_INVALID");
  if(authority.operation!==expectedOperation)throw new Error("BOUNDED_PARENT_OPERATION_INVALID");
  if(authority.maximumTaskCostUsd>maximumTaskCostUsd)throw new Error("BOUNDED_PARENT_TASK_CEILING_EXPANDED");
  if(Date.parse(authority.childExpiresAt)>Date.parse(authority.parentExpiresAt)||Date.parse(authority.parentExpiresAt)!==Date.parse(parentAuthorization.expiresAt))throw new Error("BOUNDED_PARENT_EXPIRY_INVALID");
  if(asOf&&Date.parse(asOf)>=Date.parse(authority.parentExpiresAt))throw new Error("BOUNDED_PARENT_AUTHORIZATION_EXPIRED");
  return true;
}

export function validateNeutralParentAuthorityFromRepository({authority,repository,expectedSourceId,expectedOperation,maximumTaskCostUsd,asOf}={}){
  if(typeof repository?.getAuthorization!=="function"||typeof repository?.getPlan!=="function"||typeof repository?.getPlanMember!=="function")throw new Error("BOUNDED_PARENT_REPOSITORY_REQUIRED");
  const parentAuthorization=repository.getAuthorization(authority?.parentAuthorizationId),plan=repository.getPlan(authority?.boundedPlanId),member=repository.getPlanMember(authority?.boundedPlanId,authority?.memberKey);
  if(!parentAuthorization||!plan||!member)throw new Error("BOUNDED_PARENT_AUTHORITY_NOT_FOUND");
  return validateNeutralParentAuthorityInput({authority,parentAuthorization,plan,member,expectedSourceId,expectedOperation,maximumTaskCostUsd,asOf});
}

export const neutralParentAuthorityDigest=digest;
