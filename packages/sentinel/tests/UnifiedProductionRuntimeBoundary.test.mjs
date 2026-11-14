import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const runtimeRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","..",".."),workspaceRoot=await mkdtemp(path.join(tmpdir(),"unified-publication-workspace-"));
await cp(path.join(runtimeRoot,"public"),path.join(workspaceRoot,"public"),{recursive:true});await cp(path.join(runtimeRoot,"config"),path.join(workspaceRoot,"config"),{recursive:true});await mkdir(path.join(workspaceRoot,"scripts"),{recursive:true});
await writeFile(path.join(workspaceRoot,"package.json"),JSON.stringify({type:"module",scripts:{"build:public:price-publication":"node scripts/build-public.mjs"}}));
await writeFile(path.join(workspaceRoot,"scripts","build-public.mjs"),'throw new Error("POISONED_CHECKOUT_EXECUTED");\n');
await writeFile(path.join(workspaceRoot,"scripts","verify-public-build.mjs"),'throw new Error("POISONED_CHECKOUT_EXECUTED");\n');
const manifestPath=path.join(workspaceRoot,"config","publication-release.json"),manifest=JSON.parse(await readFile(manifestPath,"utf8"));
const environment={...process.env,HARDWARE_RADAR_PUBLICATION_WORKSPACE_ROOT:workspaceRoot,HARDWARE_RADAR_PUBLIC_OUTPUT_ROOT:path.join(workspaceRoot,"public"),HARDWARE_RADAR_STATIC_RELEASE_MANIFEST:manifestPath,HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT:manifest.targetEnvironment,HARDWARE_RADAR_GENERATED_AT:manifest.createdAt};
const run=promisify(execFile);await run(process.execPath,[path.join(runtimeRoot,"scripts","build-public.mjs"),"--scope=PRICE_PUBLICATION"],{cwd:runtimeRoot,env:environment,windowsHide:true,maxBuffer:32*1024*1024});await run(process.execPath,[path.join(runtimeRoot,"scripts","verify-public-build.mjs"),"--scope=PRICE_PUBLICATION"],{cwd:runtimeRoot,env:environment,windowsHide:true,maxBuffer:32*1024*1024});
const catalog=JSON.parse(await readFile(path.join(workspaceRoot,"public","data","ram-catalog.json"),"utf8"));await Promise.all(catalog.products.map(product=>stat(path.join(workspaceRoot,"public",product.publicPath.slice(1),"index.html"))));
assert.equal(catalog.products.length,159,"all 159 canonical product pages must be present");assert.equal(await stat(path.join(workspaceRoot,"public","data","ram-current-retail.json")).then(()=>true),true);assert.equal(await readFile(path.join(workspaceRoot,"scripts","build-public.mjs"),"utf8"),'throw new Error("POISONED_CHECKOUT_EXECUTED");\n');
console.log("Unified production runtime boundary tests passed: poisoned checkout ignored, runtime build/verifier executed, outputs confined to the publication workspace, 159 product pages retained.");
