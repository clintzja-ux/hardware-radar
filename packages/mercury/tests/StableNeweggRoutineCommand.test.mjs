import assert from "node:assert/strict";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {StableNeweggRoutineCommand} from "../operations/index.js";

const root=await mkdtemp(path.join(os.tmpdir(),"stable-newegg-command-")),runtime=path.join(root,"runtime"),operational=path.join(root,"operational");
try{
 await mkdir(path.join(runtime,"scripts"),{recursive:true});await mkdir(operational,{recursive:true});await writeFile(path.join(runtime,"scripts","newegg-routine.mjs"),"");await writeFile(path.join(operational,".env"),"");
 const calls=[],runner=async(file,args,options)=>{calls.push({file,args,options});return{stdout:JSON.stringify({status:"SUCCESS_RELEASE_READY",runId:"routine-1",publication:{status:"LIVE_ACCEPTED"}}),stderr:""};},command=new StableNeweggRoutineCommand({runtimeRoot:runtime,operationalRoot:operational,runner,nodePath:"node-fixture"});
 const inspected=await command.execute({mode:"INSPECT"});assert.equal(inspected.status,"SUCCESS_RELEASE_READY");assert.equal(calls[0].options.cwd,path.resolve(operational));assert.ok(calls[0].args.includes(`--runtime-root=${path.resolve(runtime)}`));assert.ok(calls[0].args.includes(`--operational-root=${path.resolve(operational)}`));assert.ok(!calls[0].args.includes("--post-success-publication"));
 const result=await command.execute({mode:"RUN_LIVE",mandateId:"mandate-1"});assert.equal(result.publication.status,"LIVE_ACCEPTED");assert.ok(calls[1].args.includes("--mandate-id=mandate-1"));assert.ok(calls[1].args.includes("--post-success-publication"));assert.equal(calls.length,2);
 await assert.rejects(()=>command.execute({mode:"RUN_LIVE"}),/MANDATE_ID_REQUIRED/);await assert.rejects(()=>command.execute({mode:"CERTIFY_RETAINED"}),/MODE_UNSUPPORTED/);
 const failing=new StableNeweggRoutineCommand({runtimeRoot:runtime,operationalRoot:operational,nodePath:"node-fixture",runner:async()=>{throw Object.assign(new Error("failed"),{stderr:`${JSON.stringify({type:"NEWEGG_ROUTINE_PROGRESS",event:"STARTED"})}\n${JSON.stringify({failure:"SFTP_DNS_FAILED"},null,2)}`});}});await assert.rejects(()=>failing.execute({mode:"RUN_LIVE",mandateId:"mandate-1"}),error=>error.code==="SFTP_DNS_FAILED");
 console.log("Stable Newegg routine command tests passed: 13 cases.");
}finally{await rm(root,{recursive:true,force:true});}
