import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {assertRefreshStateIsolation,PRODUCTION_REFRESH_PLAN_PATH,PRODUCTION_REFRESH_AUTHORIZATION_PATH} from "../index.js";

assert.equal(PRODUCTION_REFRESH_PLAN_PATH,path.resolve(".forge-review/acquisition/historical-refresh-plan.json"));assert.equal(PRODUCTION_REFRESH_AUTHORIZATION_PATH,path.resolve(".forge-review/acquisition/historical-refresh-authorization-request.json"));
const planBefore=await readFile(PRODUCTION_REFRESH_PLAN_PATH,"utf8"),authorizationBefore=await readFile(PRODUCTION_REFRESH_AUTHORIZATION_PATH,"utf8");const args=new Map([["--plan-state",PRODUCTION_REFRESH_PLAN_PATH],["--authorization-state",PRODUCTION_REFRESH_AUTHORIZATION_PATH]]);assert.throws(()=>assertRefreshStateIsolation({testMode:true,args,requiredArguments:["--plan-state","--authorization-state"],writePaths:[PRODUCTION_REFRESH_PLAN_PATH]}),/TEST_PRODUCTION_REFRESH_STATE_WRITE_BLOCKED/);assert.throws(()=>assertRefreshStateIsolation({testMode:true,args:new Map(),requiredArguments:["--plan-state"],writePaths:[]}),/TEST_REFRESH_STATE_PATH_REQUIRED/);assert.equal(assertRefreshStateIsolation({testMode:false,args:new Map(),writePaths:[PRODUCTION_REFRESH_PLAN_PATH]}),true);assert.equal(await readFile(PRODUCTION_REFRESH_PLAN_PATH,"utf8"),planBefore);assert.equal(await readFile(PRODUCTION_REFRESH_AUTHORIZATION_PATH,"utf8"),authorizationBefore);
console.log("Historical refresh state-isolation tests passed.");
