import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createPortableNpmRunner } from "./lib/portable-npm-runner.mjs";
import { createPricePublicationGeneratedPathInventory } from "./lib/publication-generated-path-inventory.mjs";
import { DEFAULT_LIVE_PRICE_GENERATED_PATHS, classifyCloudflareDeploymentObservation } from "../packages/sentinel/publication/GovernedLivePricePublication.js";
import { CloudflarePagesDeploymentObserver } from "../packages/sentinel/publication/ProductionUnattendedPublicationBindings.js";

const run = promisify(execFile);
const args = new Map(process.argv.slice(2).map(value => { const index=value.indexOf("="); return index < 0 ? [value,true] : [value.slice(0,index),value.slice(index+1)]; }));
const implementationRoot = path.resolve(path.join(import.meta.dirname,".."));
const runtimeRoot = path.resolve(String(args.get("--runtime-root") ?? implementationRoot));
const checkoutSource = path.resolve(String(args.get("--checkout-source") ?? runtimeRoot));
const promotionRoot = path.resolve(String(args.get("--promotion-root") ?? checkoutSource));
const keep = args.has("--keep");
const fixtureRoot = await mkdtemp(path.join(os.tmpdir(),"hardware-radar-publication-rehearsal-"));
const operationalRoot = path.join(fixtureRoot,"operational"), checkoutRoot = path.join(fixtureRoot,"checkout");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const npmEntryPoint = path.join(path.dirname(process.execPath),"node_modules","npm","bin","npm-cli.js");
const implementationPaths = [
  "package.json",
  "scripts/build-public.mjs",
  "scripts/verify-public-build.mjs",
  "scripts/editorial-publishing.mjs",
  "scripts/governed-live-price-publication.mjs",
  "scripts/lib/publication-generated-path-inventory.mjs",
  "packages/sentinel/publication/GovernedLivePricePublication.js",
  "packages/sentinel/publication/ProductionUnattendedPublicationFactory.js"
];
const git = async values => (await run("git",["-c","core.longpaths=true","-C",checkoutRoot,...values],{windowsHide:true,maxBuffer:32*1024*1024})).stdout.trimEnd();
const treeDigest = async target => {
  const records=[];
  async function visit(directory,prefix="") { for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const relative=path.posix.join(prefix,entry.name),absolute=path.join(directory,entry.name);if(entry.isDirectory())await visit(absolute,relative);else records.push(`${relative}:${sha(await readFile(absolute))}`);} }
  await visit(target); return sha(records.join("\n"));
};

try {
  assert.notEqual(runtimeRoot, operationalRoot); assert.notEqual(runtimeRoot, checkoutRoot); assert.notEqual(operationalRoot, checkoutRoot);
  await mkdir(operationalRoot,{recursive:true});
  await writeFile(path.join(operationalRoot,".env"),"NODE_USE_SYSTEM_CA=1\nHARDWARE_RADAR_UNATTENDED_PUBLICATION_POST_SUCCESS_ENABLED=false\n","utf8");
  if(process.platform === "win32") {
    const validation=await run("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",path.join(runtimeRoot,"scripts","windows","newegg-routine-task.ps1"),"-RuntimeRoot",runtimeRoot,"-OperationalRoot",operationalRoot,"-ValidateOnly"],{cwd:runtimeRoot,windowsHide:true});
    assert.match(validation.stdout,/"status"\s*:\s*"READY"/);
  }
  await run("git",["-c","core.longpaths=true","clone","--no-local",checkoutSource,checkoutRoot],{windowsHide:true,maxBuffer:32*1024*1024});
  await git(["config","core.longpaths","true"]);
  // The rehearsal can certify an uncommitted review candidate without changing its source
  // worktree. Its implementation is first checkpointed inside the disposable checkout so
  // the later generated-path inventory contains publication artifacts only.
  for (const relative of implementationPaths) {
    await mkdir(path.dirname(path.join(checkoutRoot,relative)),{recursive:true});
    await cp(path.join(implementationRoot,relative),path.join(checkoutRoot,relative));
  }
  await git(["add","--",...implementationPaths]);
  if (await git(["status","--porcelain=v1"])) await git(["-c","user.name=Hardware Radar Rehearsal","-c","user.email=rehearsal@invalid.local","commit","-m","test(publication): install reliability candidate"]);
  const modules=path.join(runtimeRoot,"node_modules"); try { if((await lstat(modules)).isDirectory()) await symlink(modules,path.join(checkoutRoot,"node_modules"),"junction"); } catch {}
  const manifestSource=path.join(promotionRoot,"config","publication-release.json"),manifest=JSON.parse(await readFile(manifestSource,"utf8")),artifactRelative=path.join("config",manifest.artifact.relativePath);
  await mkdir(path.join(checkoutRoot,path.dirname(artifactRelative)),{recursive:true});
  await cp(manifestSource,path.join(checkoutRoot,"config","publication-release.json"));
  await cp(path.join(promotionRoot,artifactRelative),path.join(checkoutRoot,artifactRelative));
  await mkdir(path.join(operationalRoot,".forge-review","publication","ram-intelligence",manifest.artifact.candidateId),{recursive:true});
  await cp(path.join(promotionRoot,artifactRelative),path.join(operationalRoot,".forge-review","publication","ram-intelligence",manifest.artifact.candidateId,"artifact.json"));
  const protectedBefore={forge:await treeDigest(path.join(checkoutRoot,"public","forge")),atlas:await treeDigest(path.join(checkoutRoot,"public","data","atlas")),guides:await treeDigest(path.join(checkoutRoot,"public","guides")),js:await treeDigest(path.join(checkoutRoot,"public","js")),css:await treeDigest(path.join(checkoutRoot,"public","css"))};
  const npm=createPortableNpmRunner({execFile:run,cwd:checkoutRoot,platform:process.platform,nodeExecutable:process.execPath,npmEntryPoint,baseOptions:{windowsHide:true,maxBuffer:64*1024*1024}}),environment={...process.env,HARDWARE_RADAR_PUBLIC_RELEASE_ENVIRONMENT:"PRODUCTION",HARDWARE_RADAR_GENERATED_AT:manifest.createdAt,npm_execpath:""};
  await npm("build:public:price-publication",{env:environment});
  for(const script of ["verify:public:price-publication","test:ram-products","test:ram-catalog","test:ram-terminal","test:retailer-destinations","test:release-governance","test:layout"])await npm(script,{env:environment});
  const protectedAfter={forge:await treeDigest(path.join(checkoutRoot,"public","forge")),atlas:await treeDigest(path.join(checkoutRoot,"public","data","atlas")),guides:await treeDigest(path.join(checkoutRoot,"public","guides")),js:await treeDigest(path.join(checkoutRoot,"public","js")),css:await treeDigest(path.join(checkoutRoot,"public","css"))};
  assert.deepEqual(protectedAfter,protectedBefore);
  const status=(await git(["status","--porcelain=v1","--untracked-files=all"])).split(/\r?\n/).filter(Boolean),changedPaths=status.map(line=>line.slice(3).replace(/^"|"$/g,"").replaceAll("\\","/")),inventory=createPricePublicationGeneratedPathInventory({changedPaths,authorizedPaths:DEFAULT_LIVE_PRICE_GENERATED_PATHS});
  assert.equal(inventory.valid,true,JSON.stringify(inventory,null,2)); assert.equal(inventory.applicationPackagingPaths.length,0);
  await git(["add","--",...inventory.paths]);
  await git(["-c","user.name=Hardware Radar Rehearsal","-c","user.email=rehearsal@invalid.local","commit","-m",`test(publication): rehearse ${manifest.artifact.candidateId}`]);
  const commit=await git(["rev-parse","HEAD"]),parent=await git(["rev-parse","HEAD^"]);
  const observer=new CloudflarePagesDeploymentObserver({accountId:"fixture",projectName:"fixture",tokenProvider:async()=>"fixture",fetchImpl:async()=>({ok:true,json:async()=>({result:[{id:"fixture-deployment",environment:"production",deployment_trigger:{metadata:{commit_hash:commit}},latest_stage:{status:"success",ended_on:manifest.createdAt}}]})})}),deployment=await observer.observe({commit}),acceptance=classifyCloudflareDeploymentObservation({expectedCommit:commit,expectedReleaseId:manifest.releaseId,observation:{...deployment,releaseId:manifest.releaseId}});
  assert.equal(acceptance.status,"DEPLOYMENT_VERIFIED");
  await run(process.execPath,[path.join(checkoutRoot,"packages","sentinel","tests","UnattendedLivePricePublication.test.mjs")],{cwd:checkoutRoot,env:environment,windowsHide:true,maxBuffer:64*1024*1024});
  const lockFiles=[]; async function locks(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const target=path.join(directory,entry.name);if(entry.isDirectory())await locks(target);else if(entry.name.endsWith(".lock"))lockFiles.push(target);}} await locks(fixtureRoot); assert.equal(lockFiles.length,0);
  console.log(JSON.stringify({status:"LIVE_ACCEPTED",runtimeRoot,operationalRoot,checkoutRoot,candidateId:manifest.artifact.candidateId,commit,parent,generatedPathInventory:inventory,protectedPackagingUnchanged:true,processesAwaited:true,locksRemaining:0,productionMutation:false,fixtureRoot:keep?fixtureRoot:null},null,2));
} catch(error) {
  error.fixtureRoot=fixtureRoot; throw error;
} finally {
  if (!keep) await rm(fixtureRoot,{recursive:true,force:true});
}

