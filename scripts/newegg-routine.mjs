import {ProductionNeweggRoutineOperatorCommand} from "../packages/mercury/operations/index.js";

const args=new Map(process.argv.slice(2).map(value=>{const index=value.indexOf("=");return index<0?[value,true]:[value.slice(0,index),value.slice(index+1)];})),mode=String(args.get("--mode")??"");
for(const key of args.keys())if(!["--mode","--mandate-id"].includes(key))throw new Error(`NEWEGG_ROUTINE_ARGUMENT_NOT_ALLOWED:${key}`);
try{const result=await new ProductionNeweggRoutineOperatorCommand().execute({mode,mandateId:args.get("--mandate-id")||null});console.log(JSON.stringify(result,null,2));}catch(error){console.error(JSON.stringify({command:"mercury:newegg:routine",mode,status:"REVIEW_REQUIRED",failure:error.code??error.message,recurringAuthority:error.authorityProjection??null,providerCalls:0,canonicalMutation:false,releaseAuthority:false,deploymentAuthority:false,nextAction:"STOP_AND_REVIEW"},null,2));process.exitCode=2;}
