import assert from "node:assert/strict";
import {createNeweggRoutineRun,advanceNeweggRoutine,assertNeweggRoutineResumeSafe} from "../operations/NeweggRoutineMarketObservation.js";

const input={fullDigest:"a".repeat(64),hdrObservedAt:"2026-10-03T12:00:00Z",sourceCurrent:{snapshotId:"mer_display_fixture",hash:"b".repeat(64),offerCount:2},sourceHistory:{hash:"c".repeat(64),sequence:3,count:3},rightsDigest:"d".repeat(64)};
const a=createNeweggRoutineRun(input),b=createNeweggRoutineRun(input);
assert.deepEqual(a,b);assert.equal(a.runId,b.runId);assert.equal(a.authority,"NONE");
const preflight=advanceNeweggRoutine(a,{stage:"PREFLIGHT",result:{status:"PASS"}}),acquired=advanceNeweggRoutine(preflight,{stage:"ACQUISITION",result:{fullDownloads:1}});
assert.equal(assertNeweggRoutineResumeSafe(acquired),"VALIDATION");
assert.throws(()=>advanceNeweggRoutine(acquired,{stage:"CURRENT"}),/STAGE_INVALID/);
const currentSucceeded={...acquired,completedStages:[...acquired.completedStages,"VALIDATION","CATALOG","BINDING","QUALIFICATION","PREPARE","CURRENT"],stage:"HISTORY"};assert.equal(assertNeweggRoutineResumeSafe(currentSucceeded),"HISTORY");
const historySucceeded={...acquired,completedStages:[...acquired.completedStages,"VALIDATION","CATALOG","BINDING","QUALIFICATION","PREPARE","HISTORY"],stage:"CURRENT"};assert.equal(assertNeweggRoutineResumeSafe(historySucceeded),"CURRENT");
assert.throws(()=>assertNeweggRoutineResumeSafe({...a,fullDigest:"e".repeat(64)}),/BINDING_INVALID/);
console.log("Newegg routine market observation tests passed: 10 cases.");
