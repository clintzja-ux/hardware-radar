import assert from "node:assert/strict";
import {mkdtemp,readFile,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {assessNeweggRoutineScheduling,createNeweggRetentionPlan,createNeweggRoutineHealthProjection,NEWEGG_CURRENT_TTL_MS,NEWEGG_ROUTINE_CADENCE_MS,ProductionForgeNeweggRoutineProvider} from "../index.js";

assert.equal(NEWEGG_ROUTINE_CADENCE_MS,24*60*60*1000);assert.equal(NEWEGG_CURRENT_TTL_MS,36*60*60*1000);
const before=assessNeweggRoutineScheduling({asOf:"2026-10-04T17:00:00Z",lastAttempt:"2026-10-03T18:57:54Z"});assert.equal(before.state,"NOT_DUE");assert.equal(before.automaticExecution,false);
const due=assessNeweggRoutineScheduling({asOf:"2026-10-04T19:00:00Z",lastAttempt:"2026-10-03T18:57:54Z"});assert.equal(due.state,"DUE");
const overlap=assessNeweggRoutineScheduling({asOf:"2026-10-05T19:00:00Z",lastAttempt:"2026-10-03T18:57:54Z",activeRun:{status:"VALIDATION"}});assert.equal(overlap.state,"BLOCKED_ACTIVE_RUN");assert.equal(overlap.overlapPrevented,true);
const entries=[
 {path:"current.sqlite",kind:"CATALOG_STATE",bytes:100,catalogStateId:"current",prerequisitesComplete:true},
 {path:"previous.sqlite",kind:"CATALOG_STATE",bytes:90,catalogStateId:"previous",prerequisitesComplete:true},
 {path:"old.sqlite",kind:"CATALOG_STATE",bytes:80,catalogStateId:"old",prerequisitesComplete:true},
 {path:"recent.gz",kind:"RAW_FULL",bytes:70,observedAt:"2026-10-02T00:00:00Z",prerequisitesComplete:true},
 {path:"old.gz",kind:"RAW_FULL",bytes:60,observedAt:"2026-09-20T00:00:00Z",prerequisitesComplete:true},
 {path:"incident.partial",kind:"PARTIAL_DIAGNOSTIC",bytes:50,hold:true},
 {path:"qa.csv",kind:"QA_ARTIFACT",bytes:40}
];
const plan=createNeweggRetentionPlan({asOf:"2026-10-04T19:00:00Z",entries,currentCatalogId:"current",predecessorCatalogId:"previous"}),replay=createNeweggRetentionPlan({asOf:"2026-10-04T19:00:00Z",entries:[...entries].reverse(),currentCatalogId:"current",predecessorCatalogId:"previous"});
assert.deepEqual(plan,replay);assert.equal(plan.automaticDeletion,false);assert.equal(plan.operatorApprovalRequired,true);assert.equal(plan.entries.find(x=>x.path==="current.sqlite").state,"RETAIN");assert.equal(plan.entries.find(x=>x.path==="previous.sqlite").state,"RETAIN");assert.equal(plan.entries.find(x=>x.path==="old.sqlite").state,"SAFE_TO_PRUNE");assert.equal(plan.entries.find(x=>x.path==="recent.gz").state,"RETAIN");assert.equal(plan.entries.find(x=>x.path==="old.gz").state,"SAFE_TO_PRUNE");assert.equal(plan.entries.find(x=>x.path==="incident.partial").state,"HOLD_FOR_REVIEW");
const health=createNeweggRoutineHealthProjection({asOf:"2026-10-04T19:00:00Z",status:"SUCCESS",lastSuccessfulRun:{runId:"run"},lastAttemptedRun:{runId:"run"},schedule:due,coverage:{destinationProducts:200,representedProducts:150,previousRepresentedProducts:149,absoluteChange:1},qa:{available:true,rowCount:150},storage:plan,providerCalls:0,actualSpendUsd:0});
assert.equal(health.readOnly,true);assert.equal(health.networkOperation,"NONE");assert.equal(health.affiliateRevalidation,false);assert.equal(health.coverage.destinationProducts,200);assert.equal(health.qa.rowCount,150);
const root=await mkdtemp(join(tmpdir(),"forge-newegg-")),state=join(root,"health.json");await writeFile(state,JSON.stringify(health));assert.deepEqual(await new ProductionForgeNeweggRoutineProvider({statePath:state}).load(),health);assert.equal(await new ProductionForgeNeweggRoutineProvider({statePath:join(root,"missing.json")}).load(),null);await writeFile(state,"{}");await assert.rejects(()=>new ProductionForgeNeweggRoutineProvider({statePath:state}).load(),/STATE_INVALID/);
console.log("Newegg routine scheduling, retention, and Forge tests passed: 24 cases.");
