import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(fileURLToPath(new URL("..",import.meta.url))),entry=path.join(root,"scripts","serve-forge-operator-preview.mjs"),sha=async file=>crypto.createHash("sha256").update(await readFile(file)).digest("hex"),protectedFiles=["packages/atlas/atlas-manifest.json","packages/mercury/destinations/production-destinations.json","config/publication-release.json"].map(file=>path.join(root,file)),before=await Promise.all(protectedFiles.map(sha));
function run(env={}){const child=spawn(process.execPath,[entry],{cwd:root,env:{...process.env,FORGE_OPERATOR_PREVIEW_PORT:"0",...env},stdio:["ignore","pipe","pipe"]});let output="";child.stdout.on("data",chunk=>output+=chunk);child.stderr.on("data",chunk=>output+=chunk);return{child,output:()=>output,exit:new Promise(resolve=>child.once("exit",(code,signal)=>resolve({code,signal})))}};
async function waitFor(check,timeout=5000){const started=Date.now();while(Date.now()-started<timeout){const value=check();if(value)return value;await new Promise(resolve=>setTimeout(resolve,25));}throw new Error("FORGE_STARTUP_TEST_TIMEOUT");}

const readOnly=run(),url=await waitFor(()=>/http:\/\/127\.0\.0\.1:\d+\//.exec(readOnly.output())?.[0]);assert.match(url,/^http:\/\/127\.0\.0\.1:/);const response=await fetch(url);assert.equal(response.status,200);assert.match(await response.text(),/Hardware Radar Forge/);readOnly.child.kill("SIGTERM");const stopped=await readOnly.exit;assert.ok(stopped.code===0||stopped.signal==="SIGTERM","server must stop without hanging");

const dirtyMarker=path.join(root,`.forge-startup-smoke-${process.pid}.tmp`);try{await writeFile(dirtyMarker,"startup guard fixture\n",{flag:"wx"});const trusted=run({FORGE_OPERATOR_ID:"operator:startup-test"}),terminal=await trusted.exit;assert.notEqual(terminal.code,0);assert.match(trusted.output(),/FORGE_TRUSTED_RUNTIME_REQUIRES_CLEAN_SYNCHRONIZED_GROWTH_BRANCH/);assert.doesNotMatch(trusted.output(),/Forge trusted operator: http:/);}finally{await rm(dirtyMarker,{force:true});}
assert.deepEqual(await Promise.all(protectedFiles.map(sha)),before);console.log("Forge operator startup composition tests passed: imports, ephemeral loopback startup, clean shutdown, trusted Git guard, and canonical zero-mutation.");
