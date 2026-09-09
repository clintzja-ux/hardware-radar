import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { writeFileSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { PassThrough } from "node:stream";
import os from "node:os";
import path from "node:path";
import { buildOpenSshSftpInvocation, classifyOpenSshFailure, classifyOpenSshProcessFailure, classifyRakutenFeedFile, ensureWindowsOpenSshAskpass, loadRakutenSftpConfig, OpenSshSftpSession, RakutenProductCatalogSftpTransport, redactRakutenSftpError, selectRakutenNeweggMainDelta } from "../current-display/index.js";
import { fixtureFeedText, sanitizedCases } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;
const secret="fixture-password-never-log", username="fixture-user";
const config=loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:username,RAKUTEN_SFTP_PASSWORD:secret});
assert.deepEqual({protocol:config.protocol,host:config.host,port:config.port,connections:config.concurrency},{protocol:"SFTP",host:"aftp.linksynergy.com",port:22,connections:1});
assert.doesNotMatch(JSON.stringify(config),new RegExp(`${secret}|${username}`)); cases++;
assert.throws(()=>loadRakutenSftpConfig({}),/SFTP_CONFIG_MISSING/); assert.throws(()=>loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:"u",RAKUTEN_SFTP_PASSWORD:"p",RAKUTEN_SFTP_CONNECTIONS:"6"}),/CONNECTION_LIMIT/); assert.throws(()=>loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:"u",RAKUTEN_SFTP_PASSWORD:"p",RAKUTEN_SFTP_HOST:"wrong.example"}),/CONFIG_INVALID/); cases++;
const redacted=redactRakutenSftpError(new Error(`auth ${username} password=${secret}`),[username,secret]); assert.doesNotMatch(redacted.message,new RegExp(`${secret}|${username}`)); cases++;
const diagnosticError=Object.assign(new Error("SFTP_AUTH_FAILED"),{code:"SFTP_AUTH_FAILED",stage:"EXIT",exitCode:1,signal:null,processStarted:true,streamsOpened:true,askpassAttempted:true,askpassAttemptCount:1,readinessPromptObserved:false,stdoutBytesObserved:0,stderrBytesObserved:10,controlProbeSent:true,controlProbeResponseObserved:false,timeoutStage:null});const safeDiagnostic=redactRakutenSftpError(diagnosticError,[secret]);assert.deepEqual(safeDiagnostic.diagnostic,{stage:"EXIT",exitCode:1,signal:null,processStarted:true,streamsOpened:true,askpassAttempted:true,askpassAttemptCount:1,readinessPromptObserved:false,stdoutBytesObserved:0,stderrBytesObserved:10,controlProbeSent:true,controlProbeResponseObserved:false,timeoutStage:null});assert.doesNotMatch(JSON.stringify(safeDiagnostic.diagnostic),new RegExp(secret));cases++;
await assert.rejects(()=>new OpenSshSftpSession({config,knownHostsPath:"known",askpassPath:"askpass",trustOnFirstUse:false}).connect(),/HOST_VERIFICATION_REQUIRED/); cases++;
await assert.rejects(()=>new OpenSshSftpSession({config,knownHostsPath:"known",askpassPath:"askpass.cmd",trustOnFirstUse:true,sshExecutable:"definitely-missing-ssh",sftpExecutable:process.execPath}).connect(),/SFTP_SSH_EXECUTABLE_MISSING/); cases++;
await assert.rejects(()=>new OpenSshSftpSession({config,knownHostsPath:"known",askpassPath:"askpass.cmd",trustOnFirstUse:true,sshExecutable:process.execPath,sftpExecutable:"definitely-missing-sftp"}).connect(),/SFTP_SFTP_EXECUTABLE_MISSING/); cases++;
assert.equal(classifyOpenSshFailure("Permission denied (password)."),"SFTP_AUTH_FAILED");
assert.equal(classifyOpenSshFailure("REMOTE HOST IDENTIFICATION HAS CHANGED"),"SFTP_HOST_VERIFICATION_FAILED");
assert.equal(classifyOpenSshFailure("Connection timed out"),"SFTP_CONNECT_TIMEOUT");
assert.equal(classifyOpenSshFailure("Connection refused"),"SFTP_CONNECT_REFUSED");
assert.equal(classifyOpenSshFailure("Could not resolve hostname"),"SFTP_DNS_FAILED");
assert.equal(classifyOpenSshFailure("subsystem request failed"),"SFTP_SESSION_START_FAILED"); cases++;
assert.equal(classifyOpenSshProcessFailure({kind:"SPAWN"}),"SFTP_PROCESS_SPAWN_FAILED");
assert.equal(classifyOpenSshProcessFailure({kind:"EXIT",exitCode:1}),"SFTP_ASKPASS_NOT_INVOKED");
assert.equal(classifyOpenSshProcessFailure({kind:"EXIT",exitCode:1,askpassAttempted:true}),"SFTP_PROCESS_EXITED");
assert.equal(classifyOpenSshProcessFailure({kind:"EXIT",signal:"SIGTERM"}),"SFTP_PROCESS_TERMINATED");
assert.equal(classifyOpenSshProcessFailure({kind:"TIMEOUT"}),"SFTP_ASKPASS_NOT_INVOKED"); cases++;
if(process.platform==="win32"){
 const askpassRoot=await mkdtemp(path.join(os.tmpdir(),"hr askpass path "));
 try {
  const helper=await ensureWindowsOpenSshAskpass({root:askpassRoot});
  const fixtureSecret="fixture askpass value with spaces";
  const invoked=spawnSync(helper,["password prompt"],{encoding:"utf8",env:{...process.env,RAKUTEN_SFTP_PASSWORD:fixtureSecret},windowsHide:true});
  assert.equal(invoked.status,0);assert.equal(invoked.stdout,fixtureSecret);assert.doesNotMatch(`${invoked.stderr}`,new RegExp(fixtureSecret)); cases++;
 } finally { await rm(askpassRoot,{recursive:true,force:true}); }
}

const harnessRoot=await mkdtemp(path.join(os.tmpdir(),"hr sftp process "));
try {
 const executable=path.join(harnessRoot,"fixture.exe"),helper=path.join(harnessRoot,"askpass.exe"),knownHosts=path.join(harnessRoot,"known_hosts"),marker=path.join(harnessRoot,"askpass.invoked");
 await writeFile(executable,Buffer.from([0x4d,0x5a,0]));await writeFile(helper,Buffer.from([0x4d,0x5a,0]));
 const baseEnv={SystemRoot:"fixture-system",PATH:"fixture-path",TEMP:"fixture-temp",USERPROFILE:"fixture-profile"};
 const invocation=buildOpenSshSftpInvocation({config,knownHostsPath:knownHosts,askpassPath:helper,askpassMarkerPath:marker,baseEnv});
 assert.equal(invocation.env.SystemRoot,baseEnv.SystemRoot);assert.equal(invocation.env.PATH,baseEnv.PATH);assert.equal(invocation.env.TEMP,baseEnv.TEMP);assert.equal(invocation.env.USERPROFILE,baseEnv.USERPROFILE);
 assert.equal(invocation.env.SSH_ASKPASS_REQUIRE,"force");assert.ok(invocation.env.DISPLAY);assert.equal(invocation.env.RAKUTEN_SFTP_PASSWORD,secret);assert.equal(invocation.args.at(-1),`${username}@aftp.linksynergy.com`);assert.doesNotMatch(JSON.stringify(invocation.args),new RegExp(secret)); cases++;
 const makeProcess=({stderr="",exitCode,signal,error,promptOnStderr=false,markAskpass=0,probeStream=null,probeChunks=["Remote working directory: /"]}={})=>{const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin.on("data",chunk=>{if(probeStream&&chunk.toString("utf8").includes("pwd\n"))queueMicrotask(()=>{for(const part of probeChunks)child[probeStream].write(part);});});queueMicrotask(()=>{if(markAskpass)writeFileSync(marker,String(markAskpass));if(stderr)child.stderr.write(stderr);if(promptOnStderr)for(const part of ["s","ftp","> "])child.stderr.write(part);if(error)child.emit("error",error);else if(exitCode!==undefined||signal)child.emit("exit",exitCode??null,signal??null);});return child;};
 const options={config,knownHostsPath:knownHosts,askpassPath:helper,askpassMarkerPath:marker,trustOnFirstUse:true,sshExecutable:executable,sftpExecutable:executable,handshakeTimeoutMs:20};
 await assert.rejects(()=>new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess({error:new Error("spawn failed")})}).connect(),/SFTP_PROCESS_SPAWN_FAILED/);
 await assert.rejects(()=>new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess({stderr:"Permission denied (password).",exitCode:1,markAskpass:1})}).connect(),/SFTP_AUTH_FAILED/);
 await assert.rejects(()=>new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess({stderr:"Host key verification failed.",exitCode:1})}).connect(),/SFTP_HOST_VERIFICATION_FAILED/);
 await assert.rejects(()=>new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess({stderr:"subsystem request failed",exitCode:1,markAskpass:1})}).connect(),/SFTP_SESSION_START_FAILED/);
 await assert.rejects(()=>new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess({exitCode:1})}).connect(),/SFTP_ASKPASS_NOT_INVOKED/);
 await assert.rejects(()=>new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess()}).connect(),/SFTP_ASKPASS_NOT_INVOKED/);
 const stdoutProbe=new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess({probeStream:"stdout",probeChunks:["s","ftp banner\nRemote working ","directory: /"],markAskpass:2})});await stdoutProbe.connect();assert.equal(stdoutProbe.askpassAttemptCount(),2);assert.equal(stdoutProbe.controlProbeResponseObserved,true);assert.ok(stdoutProbe.stdoutBytesObserved>0);await stdoutProbe.close(); cases++;
 const stderrProbe=new OpenSshSftpSession({...options,spawnImpl:()=>makeProcess({promptOnStderr:true,probeStream:"stderr",probeChunks:["Remote working directory: /"],markAskpass:1})});await stderrProbe.connect();assert.equal(stderrProbe.readinessPromptObserved,true);assert.ok(stderrProbe.stderrBytesObserved>0);let written="";stderrProbe.process.stdin.on("data",chunk=>{written+=chunk.toString("utf8");});const commandResult=await stderrProbe.command("ls -l /","SFTP_LIST_FAILED");assert.match(commandResult,/Remote working directory:/);assert.match(written,/ls -l \/\npwd\n/);await stderrProbe.close(); cases++;
 const invalidHelper=path.join(harnessRoot,"invalid.exe");await writeFile(invalidHelper,"not-pe");
 await assert.rejects(()=>new OpenSshSftpSession({...options,askpassPath:invalidHelper}).connect(),/SFTP_ASKPASS_HELPER_INVALID/); cases++;
 await assert.rejects(()=>new OpenSshSftpSession({...options,askpassPath:path.join(harnessRoot,"missing.exe")}).connect(),/SFTP_ASKPASS_HELPER_MISSING/); cases++;
} finally {await rm(harnessRoot,{recursive:true,force:true});}

const metadata=(filename,size=100)=>({filename,size,modifiedAt:"2026-09-09T01:00:00.000Z",isDirectory:false});
assert.equal(classifyRakutenFeedFile({remotePath:"/44583/a_mp_delta.txt.gz",filename:"a_mp_delta.txt.gz"}),"DELTA");
assert.equal(classifyRakutenFeedFile({remotePath:"/44583/a_mp.txt.gz",filename:"a_mp.txt.gz"}),"FULL");
assert.equal(classifyRakutenFeedFile({remotePath:"/44583/a_mp_template.txt.gz",filename:"a_mp_template.txt.gz"}),"TEMPLATE");
assert.equal(classifyRakutenFeedFile({remotePath:"/44583/a_mp_deltatemplate.txt.gz",filename:"a_mp_deltatemplate.txt.gz"}),"DELTA_TEMPLATE");
assert.equal(classifyRakutenFeedFile({remotePath:"/ADDITIONAL/44583/a_mp_delta.txt.gz",filename:"a_mp_delta.txt.gz"}),"ADDITIONAL");
assert.equal(classifyRakutenFeedFile({remotePath:"/GLOBAL/a_mp_delta.txt.gz",filename:"a_mp_delta.txt.gz"}),"GLOBAL"); cases++;
assert.throws(()=>selectRakutenNeweggMainDelta([]),/NOT_FOUND/); assert.throws(()=>selectRakutenNeweggMainDelta([{advertiserMid:"44583",feedFamily:"DELTA",remotePath:"/44583/a",directory:false},{advertiserMid:"44583",feedFamily:"DELTA",remotePath:"/44583/b",directory:false}]),/AMBIGUOUS/); cases++;

const root=await mkdtemp(path.join(os.tmpdir(),"hr-rakuten-sftp-")), staging=path.join(root,".forge-review","rakuten-sftp");
const bytes=gzipSync(Buffer.from(fixtureFeedText({rows:[sanitizedCases.insertedRam,sanitizedCases.updatedRam,sanitizedCases.deletedRam]})));
const listings={"/":[{filename:"44583",size:0,modifiedAt:"2026-09-09T01:00:00Z",isDirectory:true}],"/44583/":[metadata("44583_SANITIZED_mp.txt.gz",999999),metadata("44583_SANITIZED_mp_template.txt.gz"),metadata("44583_SANITIZED_mp_deltatemplate.txt.gz"),metadata("44583_SANITIZED_mp_delta.txt.gz",bytes.length)],"/ADDITIONAL/44583/":[metadata("44583_OTHER_mp_delta.txt.gz")],"/GLOBAL/":[metadata("global.txt.gz")]};
const tracker={connections:0,closes:0,downloads:0};
const factory=({payload=bytes,failConnect=false}={})=>()=>({secrets:[username,secret],connect:async()=>{tracker.connections++;if(failConnect)throw new Error(`bad ${secret}`);},list:async dir=>structuredClone(listings[dir]??[]),download:async(remote,local)=>{tracker.downloads++;assert.equal(remote,"/44583/44583_SANITIZED_mp_delta.txt.gz");await writeFile(local,payload);},close:async()=>{tracker.closes++;}});
try{
 const inspectTransport=new RakutenProductCatalogSftpTransport({sessionFactory:factory(),stagingRoot:staging});
 const inspected=await inspectTransport.inspect(); assert.equal(inspected.selected.feedFamily,"DELTA"); assert.equal(inspected.downloaded,false); assert.equal(tracker.downloads,0); assert.equal(inspected.connectionsUsed,1); cases++;
 const downloaded=await new RakutenProductCatalogSftpTransport({sessionFactory:factory(),stagingRoot:staging}).downloadAndValidate();
 assert.equal(downloaded.status,"DOWNLOADED_AND_VALIDATED"); assert.equal(downloaded.productRows,3); assert.equal(downloaded.trailerRows,3); assert.deepEqual(downloaded.modifications,{I:1,U:1,D:1}); assert.deepEqual(downloaded.fieldCounts,[39]); assert.equal(downloaded.headerTimestamp,"2026-09-08T12:00:00.000Z"); assert.deepEqual(await readFile(downloaded.localPath),bytes); assert.equal((await readdir(staging)).some(name=>name.includes(".partial-")),false); cases++;
 const badRoot=path.join(root,".forge-review","bad"); await assert.rejects(()=>new RakutenProductCatalogSftpTransport({sessionFactory:factory({payload:Buffer.from("bad")}),stagingRoot:badRoot}).downloadAndValidate(),/SFTP_OPERATION_FAILED|INTEGRITY|GZIP/); assert.equal((await readdir(badRoot)).some(name=>name.includes(".partial-")),false); cases++;
 assert.throws(()=>new RakutenProductCatalogSftpTransport({sessionFactory:factory(),stagingRoot:staging,connectionConcurrency:6}),/CONNECTION_LIMIT/); assert.throws(()=>new RakutenProductCatalogSftpTransport({sessionFactory:factory(),stagingRoot:path.join(root,"public","feeds")}),/STAGING_PATH/); cases++;
 let attempts=0;const retry=new RakutenProductCatalogSftpTransport({sessionFactory:()=>({secrets:[secret],connect:async()=>{attempts++;throw new Error(secret);},close:async()=>{}}),stagingRoot:staging,maxAttempts:2});await assert.rejects(()=>retry.inspect(),error=>!error.message.includes(secret));assert.equal(attempts,2);cases++;
 assert.equal(tracker.connections,tracker.closes); assert.ok(tracker.connections>=2); cases++;
}finally{await rm(root,{recursive:true,force:true});}

const source=await readFile(new URL("../current-display/RakutenProductCatalogSftpTransport.js",import.meta.url),"utf8");
assert.doesNotMatch(source,/CurrentDisplaySnapshotRepository|PublicCurrentRetailProjection|historical-observations|affiliate/i); assert.doesNotMatch(source,/fetch\(|http:|ftp:/i); cases++;
const sessionSource=await readFile(new URL("../current-display/OpenSshSftpSession.js",import.meta.url),"utf8");
assert.match(sessionSource,/SSH_ASKPASS_REQUIRE:"force"/);assert.match(sessionSource,/StrictHostKeyChecking=accept-new/);assert.match(sessionSource,/BatchMode=no/);assert.match(sessionSource,/PreferredAuthentications=password,keyboard-interactive/);assert.doesNotMatch(sessionSource,/StrictHostKeyChecking=no|password=.*args/i); cases++;
console.log(`RAKUTEN-SFTP-003 transport tests passed: ${cases} cases.`);
