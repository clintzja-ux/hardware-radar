import {validateNeutralParentAuthorityFromRepository} from "./NeutralParentAuthority.js";
const money=value=>Math.round((value+Number.EPSILON)*1e9)/1e9;
const fail=code=>{throw new Error(code)};

/** Proves the portion of current daily spend created by earlier members of one exact bounded parent. */
export function createBoundedSpendProgressionResolver({boundedRepository,executionRepository}={}){
  if(!boundedRepository?.getAuthorization||!boundedRepository?.getPlan||!boundedRepository?.getPlanMember||!boundedRepository?.findRunByPlan||!executionRepository?.getAll)fail("BOUNDED_SPEND_PROGRESSION_DEPENDENCIES_REQUIRED");
  return async function resolve({request,operation}={}){
    const authority=request?.neutralParentAuthority;if(!authority)return null;
    validateNeutralParentAuthorityFromRepository({authority,repository:boundedRepository,expectedSourceId:authority.sourceId,expectedOperation:operation,maximumTaskCostUsd:authority.maximumTaskCostUsd,asOf:request.createdAt});
    const parent=boundedRepository.getAuthorization(authority.parentAuthorizationId),plan=boundedRepository.getPlan(authority.boundedPlanId),run=boundedRepository.findRunByPlan(plan.planId);
    if(!parent||!plan||parent.bindingDigest!==authority.parentAuthorizationDigest||parent.planBindingDigest!==authority.boundedPlanDigest||parent.planId!==plan.planId||parent.maximumSpendUsd!==plan.maximumSpendUsd||parent.maximumPaidTasks!==plan.maximumPaidTasks||parent.automaticPaidRetries!==0)fail("BOUNDED_SPEND_PARENT_BINDING_INVALID");
    if(!run||run.authorizationId!==parent.authorizationId||run.planId!==plan.planId)fail("BOUNDED_SPEND_RUN_BINDING_INVALID");
    const authorized=new Map(plan.ready.map(member=>[member.memberKey,member])),executions=await executionRepository.getAll();let attributable=0,count=0;
    for(const member of run.members){if(member.memberKey===authority.memberKey||!member.providerTaskId)continue;const planned=authorized.get(member.memberKey),child=boundedRepository.getChildAuthority(parent.authorizationId,member.memberKey);if(!planned||planned.domainMemberId!==member.domainMemberId||planned.source!==member.source||planned.operation!==member.operation||!child||child.parentAuthorizationId!==parent.authorizationId||child.parentAuthorizationDigest!==parent.bindingDigest||child.planId!==plan.planId||child.memberKey!==member.memberKey||child.domainMemberId!==member.domainMemberId||child.source!==member.source||child.operation!==member.operation)fail("BOUNDED_SPEND_MEMBER_BINDING_INVALID");
      const matches=executions.flatMap(row=>(row.tasks??[]).filter(task=>task.providerTaskId===member.providerTaskId).map(task=>({row,task})));if(matches.length!==1)fail("BOUNDED_SPEND_EXECUTION_LINEAGE_INVALID");const cost=Number(matches[0].task.actualCostUsd);if(matches[0].task.outcome!=="COMPLETED"||!Number.isFinite(cost)||cost<0||cost>planned.taskCeilingUsd)fail("BOUNDED_SPEND_MEMBER_CEILING_INVALID");attributable=money(attributable+cost);count++;
    }
    if(attributable>parent.maximumSpendUsd||count>parent.maximumPaidTasks||money(attributable+authority.maximumTaskCostUsd)>parent.maximumSpendUsd)fail("BOUNDED_SPEND_PARENT_CEILING_INVALID");
    return Object.freeze({authorityOrigin:"NEUTRAL_BOUNDED_PARENT",parentAuthorizationId:parent.authorizationId,parentAuthorizationDigest:parent.bindingDigest,boundedPlanId:plan.planId,boundedPlanDigest:plan.bindingDigest,runId:run.runId,memberKey:authority.memberKey,snapshotSpendUsd:request.plan.spentTodayUsd,attributableSpendUsd:attributable,expectedCurrentSpendUsd:money(request.plan.spentTodayUsd+attributable),parentMaximumSpendUsd:parent.maximumSpendUsd,memberMaximumSpendUsd:authority.maximumTaskCostUsd,automaticPaidRetries:0});
  };
}
