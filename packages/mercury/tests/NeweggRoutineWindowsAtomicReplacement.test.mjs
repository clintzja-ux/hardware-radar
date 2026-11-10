import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {FileNeweggRoutineRunRepository} from "../operations/ProductionNeweggRoutineFactory.js";
import {replaceFileWithWindowsRetry,WINDOWS_ATOMIC_REPLACEMENT_BACKOFF_MS} from "../operations/WindowsAtomicFileReplacement.js";

const root=await mkdtemp(path.join(os.tmpdir(),"newegg-atomic-replace-"));
try{
 const waits=[];let attempts=0;
 const result=await replaceFileWithWindowsRetry({source:"source",destination:"destination",rename:async()=>{attempts+=1;if(attempts<3)throw Object.assign(new Error("sharing violation"),{code:attempts===1?"EPERM":"EBUSY",syscall:"rename",path:"source",dest:"destination"});},sleep:async value=>waits.push(value)});
 assert.deepEqual(result,{status:"REPLACED",attempts:3,totalBackoffMs:75});assert.deepEqual(waits,[25,50]);

 attempts=0;const permanent=Object.assign(new Error("invalid"),{code:"EINVAL",syscall:"rename"});await assert.rejects(()=>replaceFileWithWindowsRetry({source:"s",destination:"d",rename:async()=>{attempts+=1;throw permanent;},sleep:async()=>assert.fail("permanent failure must not back off")}),error=>error===permanent&&error.atomicReplacement.attempt===1&&error.atomicReplacement.transient===false);assert.equal(attempts,1);
 attempts=0;const exhausted=Object.assign(new Error("denied"),{code:"EACCES",syscall:"rename"});await assert.rejects(()=>replaceFileWithWindowsRetry({source:"s",destination:"d",rename:async()=>{attempts+=1;throw exhausted;},sleep:async()=>{}}),error=>error.atomicReplacement.attempt===WINDOWS_ATOMIC_REPLACEMENT_BACKOFF_MS.length+1&&error.atomicReplacement.source==="s"&&error.atomicReplacement.destination==="d");assert.equal(attempts,5);

 const statePath=path.join(root,"runs.json");await writeFile(statePath,`${JSON.stringify({schemaVersion:"1.0",runs:[{runId:"prior",status:"SUCCESS_NO_CHANGE"}]},null,2)}\n`);const original=await readFile(statePath,"utf8");let repositoryAttempts=0;const repository=new FileNeweggRoutineRunRepository({statePath,fileSystem:{rename:async()=>{repositoryAttempts+=1;throw Object.assign(new Error("busy"),{code:"EPERM",syscall:"rename"});}},sleep:async()=>{}});await assert.rejects(()=>repository.save({runId:"new",status:"RUNNING"}),error=>error.atomicReplacement.attempt===5);assert.equal(await readFile(statePath,"utf8"),original,"destination remains intact after retry exhaustion");assert.equal(repositoryAttempts,5);

 let active=0,maxActive=0,queue=Promise.resolve();const lock={runExclusive(operation){const result=queue.then(async()=>{active+=1;maxActive=Math.max(maxActive,active);try{return{status:"COMPLETED",result:await operation()};}finally{active-=1;}});queue=result.catch(()=>{});return result;}};const serializedPath=path.join(root,"serialized.json"),serialized=new FileNeweggRoutineRunRepository({statePath:serializedPath,lock});await Promise.all([serialized.save({runId:"one",status:"RUNNING"}),serialized.save({runId:"two",status:"RUNNING"})]);assert.equal(maxActive,1);assert.deepEqual((JSON.parse(await readFile(serializedPath,"utf8"))).runs.map(value=>value.runId),["one","two"]);
 console.log("Windows atomic replacement tests passed: transient recovery, retry exhaustion, intact destination, and surfaced diagnostics.");
}finally{await rm(root,{recursive:true,force:true});}
