import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { GitHubAppInstallationTokenProvider } from "../publication/GitHubAppInstallationAuthentication.js";
import { GitHubAppReleaseGitOwner } from "../publication/ProductionUnattendedPublicationBindings.js";

const now=new Date("2026-10-17T12:00:00.000Z"),{privateKey}=generateKeyPairSync("rsa",{modulusLength:2048,privateKeyEncoding:{type:"pkcs8",format:"pem"},publicKeyEncoding:{type:"spki",format:"pem"}});let request=null;
const provider=new GitHubAppInstallationTokenProvider({appId:"123",installationId:"456",privateKeyPath:"fixture.pem",repositoryOwner:"clintzja-ux",repositoryName:"hardware-radar",readPrivateKey:async()=>privateKey,now:()=>now,fetchImpl:async(url,options)=>{request={url,options};return{ok:true,json:async()=>({token:"installation-secret",expires_at:"2026-10-17T13:00:00.000Z",permissions:{contents:"write"},repositories:[{name:"hardware-radar",owner:{login:"clintzja-ux"}}]})};}});
const credential=await provider.getToken();assert.equal(credential.repository,"clintzja-ux/hardware-radar");assert.equal(JSON.parse(request.options.body).permissions.contents,"write");assert.deepEqual(JSON.parse(request.options.body).repositories,["hardware-radar"]);assert.match(request.options.headers.Authorization,/^Bearer [^.]+\.[^.]+\.[^.]+$/);assert.ok(!JSON.stringify(request).includes("installation-secret"));
let calls=[];const runner=async(command,args,cwd,options={})=>{calls.push({command,args:[...args],cwd,options:{...options,env:{...options.env}}});if(args[0]==="ls-remote")return{stdout:"abc\trefs/heads/main\n"};return{stdout:""};},owner=new GitHubAppReleaseGitOwner({runner,checkoutRoot:"C:/fixture",tokenProvider:provider,askPassPath:"C:/fixture/askpass.mjs"});
await owner.fastForwardMain({commit:"def",expectedRemote:"abc"});assert.equal(calls.length,2);for(const call of calls){assert.ok(!call.args.join(" ").includes("installation-secret"));assert.equal(call.options.env.GIT_TERMINAL_PROMPT,"0");assert.equal(call.options.env.GIT_CONFIG_KEY_0,"credential.helper");assert.equal(call.options.env.GIT_CONFIG_VALUE_0,"");assert.equal(call.options.env.HARDWARE_RADAR_GITHUB_ASKPASS_NODE,process.execPath);assert.equal(call.options.env.HARDWARE_RADAR_GITHUB_INSTALLATION_TOKEN_EPHEMERAL,"installation-secret");}
await assert.rejects(()=>new GitHubAppInstallationTokenProvider({}).getToken(),/APP_ID_REQUIRED/);
await assert.rejects(()=>new GitHubAppInstallationTokenProvider({appId:"1",installationId:"2",privateKeyPath:"x",repositoryOwner:"owner",repositoryName:"repo",readPrivateKey:async()=>privateKey,now:()=>now,fetchImpl:async()=>({ok:true,json:async()=>({token:"wrong",expires_at:"2026-10-17T13:00:00Z",permissions:{contents:"read"},repositories:[]})})}).getToken(),/TOKEN_SCOPE_INVALID/);
await assert.rejects(()=>new GitHubAppInstallationTokenProvider({appId:"1",installationId:"2",privateKeyPath:"x",repositoryOwner:"owner",repositoryName:"repo",readPrivateKey:async()=>privateKey,now:()=>now,fetchImpl:async()=>({ok:true,json:async()=>({token:"expired",expires_at:"2026-10-17T12:00:30Z",permissions:{contents:"write"},repositories:[{name:"repo",owner:{login:"owner"}}]})})}).getToken(),/TOKEN_SCOPE_INVALID/);
const pkg=JSON.parse(await readFile(new URL("../../../package.json",import.meta.url),"utf8")),publicationCommand=pkg.scripts["publication:unattended"];
assert.equal(publicationCommand,"node --use-system-ca --env-file=.env scripts/unattended-live-price-publication.mjs");
assert.match(publicationCommand,/^node --use-system-ca --env-file=\.env scripts\/unattended-live-price-publication\.mjs$/);
const supported=spawnSync(process.execPath,["--use-system-ca","--version"],{encoding:"utf8"});assert.equal(supported.status,0,supported.stderr);

if(process.platform==="win32"){
  const askPassPath=new URL("../../../scripts/lib/github-app-git-askpass.cmd",import.meta.url),expectedCommit="0123456789abcdef0123456789abcdef01234567",expectedAuthorization=`Basic ${Buffer.from("x-access-token:installation-secret").toString("base64")}`;
  let authenticatedRequests=0;
  const server=createServer((request,response)=>{
    if(request.headers.authorization!==expectedAuthorization){response.writeHead(401,{"WWW-Authenticate":'Basic realm="Hardware Radar test"'});response.end();return;}
    authenticatedRequests+=1;
    if(request.url==="/repository.git/info/refs"){response.writeHead(200,{"Content-Type":"text/plain"});response.end(`${expectedCommit}\trefs/heads/main\n`);return;}
    response.writeHead(404);response.end();
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  const port=server.address().port,runGit=token=>new Promise(resolve=>{const child=spawn("git",["-c","credential.helper=","ls-remote",`http://127.0.0.1:${port}/repository.git`,"refs/heads/main"],{windowsHide:true,env:{...process.env,GIT_ASKPASS:decodeURIComponent(askPassPath.pathname).replace(/^\/(?:[A-Za-z]:)/,value=>value.slice(1)).replaceAll("/","\\"),GIT_TERMINAL_PROMPT:"0",GCM_INTERACTIVE:"Never",GIT_SMART_HTTP:"0",HARDWARE_RADAR_GITHUB_ASKPASS_NODE:process.execPath,...(token?{HARDWARE_RADAR_GITHUB_INSTALLATION_TOKEN_EPHEMERAL:token}:{})}});let stdout="",stderr="";child.stdout.on("data",chunk=>stdout+=chunk);child.stderr.on("data",chunk=>stderr+=chunk);child.on("close",status=>resolve({status,stdout,stderr}));});
  try{
    const accepted=await runGit("installation-secret");assert.equal(accepted.status,0,accepted.stderr);assert.match(accepted.stdout,new RegExp(`^${expectedCommit}\\s+refs/heads/main`));assert.ok(authenticatedRequests>=1);assert.ok(!`${accepted.stdout}${accepted.stderr}`.includes("installation-secret"));
    const rejected=await runGit(null);assert.notEqual(rejected.status,0);assert.ok(!`${rejected.stdout}${rejected.stderr}`.includes("installation-secret"));
  }finally{await new Promise(resolve=>server.close(resolve));}
}
console.log("GitHub App installation authentication tests passed: scoped token, secret-free arguments, no credential-helper fallback, and fail-closed credentials.");
