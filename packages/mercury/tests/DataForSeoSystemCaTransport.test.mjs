import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {createAcquisitionFailureDiagnostic} from "../index.js";

let cases=0;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const pkg=JSON.parse(await readFile(path.join(root,"package.json"),"utf8"));
const networkCommands=[
  "acquisition:live:execute",
  "acquisition:enrichment:prepare",
  "acquisition:enrichment:live:execute",
  "acquisition:sellers:prepare",
  "acquisition:sellers:live:execute",
  "acquisition:sellers:retain",
  "acquisition:history-refresh:live:execute",
  "acquisition:history-refresh:result:retrieve"
];
for(const name of networkCommands){assert.match(pkg.scripts[name],/^node --use-system-ca --env-file=\.env scripts\//,`${name} must use governed system CA trust`);}cases++;
for(const name of ["acquisition:live:prepare","acquisition:enrichment:live:prepare","acquisition:sellers:live:prepare","acquisition:history-refresh:live:prepare"]){assert.doesNotMatch(pkg.scripts[name],/--use-system-ca/,`${name} is zero-network and should remain unchanged`);}cases++;
const supported=spawnSync(process.execPath,["--use-system-ca","--version"],{encoding:"utf8"});assert.equal(supported.status,0,supported.stderr);cases++;
const runtimeSources=await Promise.all(networkCommands.map(async name=>readFile(path.join(root,pkg.scripts[name].match(/scripts\/\S+\.mjs/)[0]),"utf8")));const runtimeText=runtimeSources.join("\n");assert.doesNotMatch(runtimeText,/NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*0|rejectUnauthorized\s*:\s*false|--insecure\b|curl\s+-k\b/);cases++;

const diagnostic=error=>createAcquisitionFailureDiagnostic({error,provider:"DATAFORSEO",operation:"PRODUCTS",occurredAt:"2026-09-04T01:00:00.000Z",executionRunId:"fixture-run",candidateId:"fixture:products",actualSpendUsd:0});
const tlsCause=Object.assign(new Error("unable to verify the first certificate"),{code:"UNABLE_TO_VERIFY_LEAF_SIGNATURE"}),fetchError=new TypeError("fetch failed",{cause:tlsCause}),wrapped=new Error("PROVIDER_REQUEST_FAILED",{cause:fetchError});wrapped.failureStage="DURING_PROVIDER_REQUEST";let value=diagnostic(wrapped);assert.equal(value.failureClass,"TLS_CERTIFICATE_VALIDATION_FAILURE");assert.equal(value.safeErrorCode,"UNABLE_TO_VERIFY_LEAF_SIGNATURE");assert.equal(value.retryability,"RETRY_REQUIRES_OPERATOR_ACTION");assert.equal(value.causeChain.length,3);cases++;
const dns=new Error("PROVIDER_REQUEST_FAILED",{cause:new TypeError("fetch failed",{cause:Object.assign(new Error("lookup failed"),{code:"ENOTFOUND"})})});value=diagnostic(dns);assert.equal(value.failureClass,"NETWORK_FAILURE");assert.equal(value.safeErrorCode,"ENOTFOUND");cases++;
const reset=new Error("PROVIDER_REQUEST_FAILED",{cause:new TypeError("fetch failed",{cause:Object.assign(new Error("socket closed"),{code:"ECONNRESET"})})});value=diagnostic(reset);assert.equal(value.failureClass,"NETWORK_FAILURE");assert.equal(value.safeErrorCode,"ECONNRESET");cases++;
const secret=new Error("outer",{cause:Object.assign(new Error("Authorization: Basic dXNlcjpwYXNz password=hunter2"),{code:"ECONNRESET"})});value=diagnostic(secret);const serialized=JSON.stringify(value);assert(!serialized.includes("dXNlcjpwYXNz"));assert(!serialized.includes("hunter2"));assert(serialized.includes("REDACTED"));cases++;
let deep=new Error("level-8");for(let i=7;i>=0;i--)deep=new Error(`level-${i}`,{cause:deep});value=diagnostic(deep);assert.equal(value.causeChain.length,4);cases++;
const circular=new Error("circular");circular.cause=circular;value=diagnostic(circular);assert.equal(value.causeChain.length,1);cases++;
assert.equal(value.actualSpendUsd,0);assert.equal(value.providerTaskId,null);cases++;
console.log(`DataForSEO system-CA transport tests passed: ${cases} cases.`);

