import assert from "node:assert/strict";
import { createAcquisitionBudgetPolicy, createAcquisitionPlan } from "../index.js";
const at="2026-08-17T05:00:00.000Z";
const disabled=createAcquisitionBudgetPolicy();
let p=createAcquisitionPlan({policy:disabled,plannedAt:at,candidates:[{candidateId:"ram-1",priority:"HIGH",estimatedCostUsd:.001}]});
assert.equal(p.approvedTaskCount,0); assert.equal(p.decisions[0].reason,"DISABLED");
const policy=createAcquisitionBudgetPolicy({enabled:true,maxPaidTasksPerRun:2,maxSpendPerRunUsd:.002,maxSpendPerDayUsd:.003,defaultRefreshCooldownMs:3600000});
p=createAcquisitionPlan({policy,plannedAt:at,spentTodayUsd:.001,candidates:[
 {candidateId:"low",priority:"LOW",estimatedCostUsd:.001,rationale:"low"},
 {candidateId:"paused",priority:"PAUSED",estimatedCostUsd:.001},
 {candidateId:"fresh",priority:"HIGH",estimatedCostUsd:.001,lastObservedAt:"2026-08-17T04:30:00.000Z"},
 {candidateId:"high",priority:"HIGH",estimatedCostUsd:.001,rationale:"important"},
 {candidateId:"normal",priority:"NORMAL",estimatedCostUsd:.001}
]});
assert.equal(p.approvedTaskCount,2); assert.equal(p.estimatedApprovedSpendUsd,.002);
assert.deepEqual(p.decisions.filter(x=>x.decision==="APPROVED").map(x=>x.candidateId),["high","normal"]);
assert.equal(p.decisions.find(x=>x.candidateId==="fresh").reason,"COOLDOWN");
assert.equal(p.decisions.find(x=>x.candidateId==="paused").reason,"PAUSED");
assert.equal(p.decisions.find(x=>x.candidateId==="low").reason,"TASK_LIMIT");
assert.throws(()=>createAcquisitionBudgetPolicy({automaticPaidRetries:1}),/AUTOMATIC_PAID_RETRIES_MUST_BE_ZERO/);
assert.ok(Object.isFrozen(p)); assert.ok(Object.isFrozen(p.decisions));
const same=createAcquisitionPlan({policy,plannedAt:at,spentTodayUsd:.001,candidates:[{candidateId:"high",priority:"HIGH",estimatedCostUsd:.001},{candidateId:"normal",priority:"NORMAL",estimatedCostUsd:.001}]});
const same2=createAcquisitionPlan({policy,plannedAt:at,spentTodayUsd:.001,candidates:[{candidateId:"high",priority:"HIGH",estimatedCostUsd:.001},{candidateId:"normal",priority:"NORMAL",estimatedCostUsd:.001}]});
assert.equal(same.planId,same2.planId);
console.log("Acquisition planning and budget governance tests passed.");
