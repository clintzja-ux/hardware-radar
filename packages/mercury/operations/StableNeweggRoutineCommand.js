import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {access} from "node:fs/promises";
import path from "node:path";

const freeze=value=>Object.freeze(structuredClone(value));
const parseOutput=value=>{const text=String(value??"");for(let start=text.lastIndexOf("{");start>=0;start=text.lastIndexOf("{",start-1))try{return JSON.parse(text.slice(start));}catch{}throw Object.assign(new Error("STABLE_NEWEGG_ROUTINE_OUTPUT_INVALID"),{code:"STABLE_NEWEGG_ROUTINE_OUTPUT_INVALID"});};

export class StableNeweggRoutineCommand{
 constructor({runtimeRoot,operationalRoot,runner=promisify(execFile),nodePath=process.execPath,env=process.env}={}){if(!runtimeRoot||!operationalRoot||!runner)throw new TypeError("STABLE_NEWEGG_ROUTINE_CONFIGURATION_REQUIRED");Object.assign(this,{runtimeRoot:path.resolve(runtimeRoot),operationalRoot:path.resolve(operationalRoot),runner,nodePath,env});}
 async execute({mode,mandateId=null}={}){
  if(!["INSPECT","READINESS","RUN_LIVE"].includes(mode))throw new Error("STABLE_NEWEGG_ROUTINE_MODE_UNSUPPORTED");
  if(["READINESS","RUN_LIVE"].includes(mode)&&!mandateId)throw new Error("NEWEGG_ROUTINE_RECURRING_MANDATE_ID_REQUIRED");
  const script=path.join(this.runtimeRoot,"scripts","newegg-routine.mjs"),environment=path.join(this.operationalRoot,".env");await Promise.all([access(script),access(environment)]);
  const args=[`--env-file=${environment}`,script,`--mode=${mode}`,`--runtime-root=${this.runtimeRoot}`,`--operational-root=${this.operationalRoot}`];if(mandateId)args.push(`--mandate-id=${mandateId}`);if(mode==="RUN_LIVE")args.push("--post-success-publication");
  try{const result=await this.runner(this.nodePath,args,{cwd:this.operationalRoot,env:this.env,windowsHide:true,maxBuffer:32*1024*1024});return freeze(parseOutput(result.stdout));}
  catch(error){let detail=null;try{detail=parseOutput(error?.stderr);}catch{}const failure=detail?.failure??error?.code??"STABLE_NEWEGG_ROUTINE_EXECUTION_FAILED";throw Object.assign(new Error(failure),{code:failure,detail});}
 }
}
