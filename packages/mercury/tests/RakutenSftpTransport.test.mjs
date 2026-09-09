import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { classifyNativeSftpFailure, classifyRakutenFeedFile, loadRakutenSftpConfig, NativeSftpSession, RakutenProductCatalogSftpTransport, readRakutenSftpHostTrust, redactRakutenSftpError, selectRakutenNeweggMainDelta } from "../current-display/index.js";
import { fixtureFeedText, sanitizedCases } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;
const secret="fixture-password-never-log", username="fixture-user";
const config=loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:username,RAKUTEN_SFTP_PASSWORD:secret});
assert.deepEqual({protocol:config.protocol,host:config.host,port:config.port,connections:config.concurrency},{protocol:"SFTP",host:"aftp.linksynergy.com",port:22,connections:1});
assert.doesNotMatch(JSON.stringify(config),new RegExp(`${secret}|${username}`)); cases++;
assert.throws(()=>loadRakutenSftpConfig({}),/SFTP_CONFIG_MISSING/); assert.throws(()=>loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:"u",RAKUTEN_SFTP_PASSWORD:"p",RAKUTEN_SFTP_CONNECTIONS:"6"}),/CONNECTION_LIMIT/); assert.throws(()=>loadRakutenSftpConfig({RAKUTEN_SFTP_USERNAME:"u",RAKUTEN_SFTP_PASSWORD:"p",RAKUTEN_SFTP_HOST:"wrong.example"}),/CONFIG_INVALID/); cases++;
const redacted=redactRakutenSftpError(new Error(`auth ${username} password=${secret}`),[username,secret]); assert.doesNotMatch(redacted.message,new RegExp(`${secret}|${username}`)); cases++;
assert.equal(classifyNativeSftpFailure(Object.assign(new Error("Authentication failed"),{level:"client-authentication"})),"SFTP_AUTH_FAILED");assert.equal(classifyNativeSftpFailure(Object.assign(new Error(),{code:"ETIMEDOUT"})),"SFTP_CONNECT_TIMEOUT");assert.equal(classifyNativeSftpFailure(Object.assign(new Error(),{code:"ECONNREFUSED"})),"SFTP_CONNECT_REFUSED");assert.equal(classifyNativeSftpFailure(Object.assign(new Error(),{code:"ENOTFOUND"})),"SFTP_DNS_FAILED");assert.equal(classifyNativeSftpFailure(new Error("key rejected"),{hostMismatch:true}),"SFTP_HOST_VERIFICATION_FAILED");cases++;

const keyBlob=type=>{const name=Buffer.from(type),length=Buffer.alloc(4);length.writeUInt32BE(name.length);return Buffer.concat([length,name,Buffer.from("fixture-key-material")]);};
const trustedKey=keyBlob("ssh-ed25519"),changedKey=keyBlob("ssh-rsa");
class FakeClient extends EventEmitter{
 constructor({key=trustedKey,connectError=null,sftpError=null,sftp={}}={}){super();this.key=key;this.connectError=connectError;this.sftpError=sftpError;this.sftpValue=sftp;this.connectCalls=0;this.endCalls=0;this.options=null;}
 connect(options){this.connectCalls++;this.options=options;queueMicrotask(()=>{if(this.connectError)return this.emit("error",this.connectError);if(!options.hostVerifier(this.key))return this.emit("error",new Error("host rejected"));this.emit("ready");});}
 sftp(callback){queueMicrotask(()=>callback(this.sftpError,this.sftpValue));}
 end(){this.endCalls++;this.emit("close");}
}
const nativeRoot=await mkdtemp(path.join(os.tmpdir(),"hr native sftp "));
try{
 const knownHosts=path.join(nativeRoot,"known_hosts"),missingTrust=path.join(nativeRoot,"missing_known_hosts");
 await writeFile(knownHosts,`aftp.linksynergy.com ssh-ed25519 ${trustedKey.toString("base64")}\n`);
 const trust=await readRakutenSftpHostTrust({knownHostsPath:knownHosts,host:config.host,port:22});assert.equal(trust.status,"TRUSTED");assert.equal(trust.digests.length,1);cases++;
 const attrs={size:5,mtime:1788915600,isDirectory:()=>false},downloaded=Buffer.from([0,1,2,3,255]),fakeSftp={readdir:(remote,callback)=>callback(null,[{filename:"fixture.gz",attrs}]),stat:(remote,callback)=>callback(null,attrs),fastGet:(remote,local,callback)=>writeFile(local,downloaded).then(()=>callback(),callback)};
 const client=new FakeClient({sftp:fakeSftp}),session=new NativeSftpSession({config,knownHostsPath:knownHosts,clientFactory:()=>client});await session.connect();assert.equal(client.connectCalls,1);assert.equal(client.options.password,secret);assert.equal(client.options.username,username);assert.equal(JSON.stringify(client.options).includes(secret),true);const listed=await session.list("/44583/");assert.equal(listed[0].filename,"fixture.gz");assert.equal(listed[0].modifiedAt,"2026-09-09T01:00:00.000Z");const stated=await session.stat("/44583/fixture.gz");assert.deepEqual(stated,listed[0]);const local=path.join(nativeRoot,"binary.gz");await session.download("/44583/fixture.gz",local);assert.deepEqual(await readFile(local),downloaded);await session.close();assert.equal(client.endCalls,1);cases++;
 const mismatch=new FakeClient({key:changedKey});await assert.rejects(()=>new NativeSftpSession({config,knownHostsPath:knownHosts,clientFactory:()=>mismatch}).connect(),/SFTP_HOST_VERIFICATION_FAILED/);assert.equal(mismatch.endCalls,1);cases++;
 await assert.rejects(()=>new NativeSftpSession({config,knownHostsPath:missingTrust,trustOnFirstUse:false,clientFactory:()=>new FakeClient()}).connect(),/SFTP_HOST_VERIFICATION_REQUIRED/);cases++;
 const tofuClient=new FakeClient(),tofu=new NativeSftpSession({config,knownHostsPath:missingTrust,trustOnFirstUse:true,clientFactory:()=>tofuClient});await tofu.connect();await tofu.close();const migrated=await readRakutenSftpHostTrust({knownHostsPath:missingTrust,host:config.host,port:22});assert.equal(migrated.status,"TRUSTED");cases++;
 const authClient=new FakeClient({connectError:Object.assign(new Error(`Authentication failed password=${secret}`),{level:"client-authentication"})});await assert.rejects(()=>new NativeSftpSession({config,knownHostsPath:knownHosts,clientFactory:()=>authClient}).connect(),/SFTP_AUTH_FAILED/);assert.equal(authClient.endCalls,1);cases++;
}finally{await rm(nativeRoot,{recursive:true,force:true});}

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
const sessionSource=await readFile(new URL("../current-display/NativeSftpSession.js",import.meta.url),"utf8");
assert.match(sessionSource,/hostVerifier/);assert.match(sessionSource,/password:this\.config\.password/);assert.doesNotMatch(sessionSource,/SSH_ASKPASS|OpenSsh|sftp\.exe|CurrentDisplaySnapshotRepository|PublicCurrentRetailProjection|historical-observations|affiliate/i); cases++;
console.log(`RAKUTEN-SFTP-004 native transport tests passed: ${cases} cases.`);
