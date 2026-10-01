import assert from "node:assert/strict";
import {runBoundedRepeatRunCli} from "../../../scripts/mercury-bounded-repeat-run-cli.mjs";

let cases=0;
const calls=[];
const plan={runPlanId:"mer_repeatrunplan_aaaaaaaaaaaaaaaaaaaaaaaa",observationCycle:"2026-09-14T00:00:00.000Z",requested:[{atlasProductId:"ram_a",source:"DATAFORSEO_AMAZON"},{atlasProductId:"ram_b",source:"DATAFORSEO_GOOGLE_SHOPPING"}],ready:[{atlasProductId:"ram_a",source:"DATAFORSEO_AMAZON"}],blocked:[{atlasProductId:"ram_b",source:"DATAFORSEO_GOOGLE_SHOPPING",state:"DISCOVERY_REQUIRED",reason:"fixture"}],maximumPaidTasks:1,maximumSpendUsd:.0015,automaticPaidRetries:0,authorizationState:"NOT_AUTHORIZED"};
const summary={runId:"mer_repeatrun_bbbbbbbbbbbbbbbbbbbbbbbb",runPlanId:plan.runPlanId,state:"WAITING_FOR_PROVIDER",paidTasksCreated:1,completed:0,pending:1,failed:0,evidenceRetained:0,historicalFactsAdmitted:0,downstreamAuthority:false};
const service={
 async prepareRun(input){calls.push(["prepare",input]);return{status:"PREPARED",value:plan};},
 async inspectRun(input){calls.push(["inspect",input]);return input.runPlanId?{...plan,currentUtcDaySpendUsd:.002,dailySpendCeilingUsd:.025,remainingUtcDayCapacityUsd:.023,runState:"NOT_STARTED",downstreamAuthority:false}:summary;},
 async authorizeRun(input){calls.push(["authorize",input]);return{status:"AUTHORIZED",value:{runAuthorizationId:"mer_repeatrunauth_cccccccccccccccccccccccc",maximumPaidTasks:1,maximumSpendUsd:.0015}};},
 async startRun(input){calls.push(["start",input]);return summary;},
 async resumeRun(input){calls.push(["resume",input]);return{...summary,state:"COMPLETED",pending:0,completed:1,evidenceRetained:1,historicalFactsAdmitted:1};}
};
let closed=0;const runtimeFactory=()=>({service,close:()=>closed++}),output=[],write=value=>output.push(value),cohort=JSON.stringify(plan.requested);

await runBoundedRepeatRunCli("prepare",{values:["--cohort-file=fixture.json","--observation-cycle=2026-09-14T00:00:00.000Z"],runtimeFactory,readText:async()=>cohort,write});
assert.equal(calls[0][0],"prepare");assert.deepEqual(calls[0][1].cohort,plan.requested);assert.ok(output.includes("Provider calls: 0"));cases+=3;
await runBoundedRepeatRunCli("inspect",{values:[`--run-plan-id=${plan.runPlanId}`],runtimeFactory,write});assert.equal(calls[1][0],"inspect");assert.ok(output.includes("Writes: 0"));cases+=2;
await runBoundedRepeatRunCli("authorize",{values:[`--run-plan-id=${plan.runPlanId}`,"--operator=operator:test","--reason=fixture","--expires-at=2026-09-14T01:00:00.000Z","--confirm=AUTHORIZE-BOUNDED-REPEAT-RUN"],runtimeFactory,write});assert.equal(calls[2][0],"authorize");cases++;
await runBoundedRepeatRunCli("start",{values:["--run-authorization-id=mer_repeatrunauth_cccccccccccccccccccccccc","--executed-by=operator:test","--confirm=START-BOUNDED-REPEAT-RUN"],runtimeFactory,write});assert.equal(calls[3][0],"start");cases++;
await runBoundedRepeatRunCli("resume",{values:[`--run-id=${summary.runId}`,"--resumed-by=operator:test","--confirm=RESUME-BOUNDED-REPEAT-RUN"],runtimeFactory,write});assert.equal(calls[4][0],"resume");assert.ok(output.includes("Historical facts admitted: 1"));cases+=2;
await assert.rejects(()=>runBoundedRepeatRunCli("prepare",{values:["--cohort-file=x","--observation-cycle=2026-09-14T00:00:00.000Z","--provider-task-id=bad"],runtimeFactory,readText:async()=>cohort,write}),/ARGUMENT_NOT_ALLOWED/);cases++;
await assert.rejects(()=>runBoundedRepeatRunCli("inspect",{values:[`--run-id=${summary.runId}`,`--run-plan-id=${plan.runPlanId}`],runtimeFactory,write}),/INSPECT_ID_REQUIRED/);cases++;
await assert.rejects(()=>runBoundedRepeatRunCli("prepare",{values:["--cohort-file=x","--observation-cycle=2026-09-14T00:00:00.000Z"],runtimeFactory,readText:async()=>JSON.stringify({cohort:[]}),write}),/COHORT_FILE_INVALID/);cases++;
assert.equal(closed,6);assert.equal(calls.length,5);cases+=2;
console.log(`Bounded repeat observation CLI tests passed: ${cases} cases.`);
