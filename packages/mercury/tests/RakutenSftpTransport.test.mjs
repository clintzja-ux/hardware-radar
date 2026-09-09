import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { classifyRakutenFeedFile, loadRakutenSftpConfig, OpenSshSftpSession, RakutenProductCatalogSftpTransport, redactRakutenSftpError, selectRakutenNeweggMainDelta } from "../current-display/index.js";
import { fixtureFeedText, sanitizedCases } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;
const secret="fixture-password-never-log", username="fixture-user";
const config=loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:username,RAKUTEN_SFTP_PASSWORD:secret});
assert.deepEqual({protocol:config.protocol,host:config.host,port:config.port,connections:config.concurrency},{protocol:"SFTP",host:"aftp.linksynergy.com",port:22,connections:1});
assert.doesNotMatch(JSON.stringify(config),new RegExp(`${secret}|${username}`)); cases++;
assert.throws(()=>loadRakutenSftpConfig({}),/SFTP_CONFIG_MISSING/); assert.throws(()=>loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:"u",RAKUTEN_SFTP_PASSWORD:"p",RAKUTEN_SFTP_CONNECTIONS:"6"}),/CONNECTION_LIMIT/); assert.throws(()=>loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:"u",RAKUTEN_SFTP_PASSWORD:"p",RAKUTEN_SFTP_HOST:"wrong.example"}),/CONFIG_INVALID/); cases++;
const redacted=redactRakutenSftpError(new Error(`auth ${username} password=${secret}`),[username,secret]); assert.doesNotMatch(redacted.message,new RegExp(`${secret}|${username}`)); cases++;
await assert.rejects(()=>new OpenSshSftpSession({config,knownHostsPath:"known",askpassPath:"askpass",trustOnFirstUse:false}).connect(),/HOST_VERIFICATION_REQUIRED/); cases++;

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
console.log(`RAKUTEN-SFTP-003 transport tests passed: ${cases} cases.`);
