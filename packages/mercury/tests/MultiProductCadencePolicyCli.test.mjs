import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
const root=await mkdtemp(join(tmpdir(),"hardware-radar-df005b-cli-")),policyPath=join(root,"fixture-policy.json");try{await writeFile(policyPath,JSON.stringify({schemaVersion:"1.0",policyType:"HISTORICAL_REFRESH_CADENCE",policyId:"fixture-cadence-policy",enabled:true,minimumIntervalMs:86400000,atlasProductIds:["ram_corsair_cmk32gx5m2b6000z30"],retailerIds:null,rationale:"Test-only fixture.",metadata:null,automaticExecution:false}));const output=execFileSync(process.execPath,["scripts/mercury-history-refresh-policies.mjs",`--policies=${policyPath}`],{cwd:process.cwd(),encoding:"utf8"});assert.match(output,/HISTORICAL REFRESH CADENCE POLICIES/);assert.match(output,/Policies:\s+1/);assert.match(output,/Enabled:\s+1/);assert.match(output,/Explicit product scopes:\s+1/);assert.match(output,/Ambiguous products:\s+0/);assert.match(output,/Automatic execution:\s+0/);assert.match(output,/fixture-cadence-policy/);assert.match(output,/Actual spend:\s+\$0\.000/);assert.match(output,/Paid task created:\s+NO/);}finally{await rm(root,{recursive:true,force:true});}
console.log("Multi-product cadence policy CLI tests passed.");
