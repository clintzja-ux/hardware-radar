import {createHash} from "node:crypto";
import path from "node:path";

const freeze=value=>Object.freeze(structuredClone(value));

export function resolveProductionPublicationCommand({runtimeRoot,operationalRoot,publicationCheckoutRoot,env=process.env,nodeExecutable=process.execPath}={}){
 if(![runtimeRoot,operationalRoot,publicationCheckoutRoot].every(value=>typeof value==="string"&&value.trim()))throw new Error("PUBLICATION_COMMAND_ROOT_INVALID");
 const runtime=path.resolve(runtimeRoot??""),operational=path.resolve(operationalRoot??""),checkout=path.resolve(publicationCheckoutRoot??"");
 if(!path.isAbsolute(runtime)||!path.isAbsolute(operational)||!path.isAbsolute(checkout))throw new Error("PUBLICATION_COMMAND_ROOT_INVALID");
 if(typeof nodeExecutable!=="string"||!path.isAbsolute(nodeExecutable))throw new Error("PUBLICATION_NODE_EXECUTABLE_INVALID");
 const command={schemaVersion:"1.0",nodeExecutable,runtimeRoot:runtime,operationalRoot:operational,publicationCheckoutRoot:checkout,scriptPath:path.join(runtime,"scripts","unattended-live-price-publication.mjs"),environmentPath:path.join(operational,".env"),mandateStatePath:path.join(operational,".forge-review","publication","unattended-live-price.json"),nodeOptions:["--use-system-ca"],postSuccessEnabled:env.HARDWARE_RADAR_UNATTENDED_PUBLICATION_POST_SUCCESS_ENABLED==="true",mandateId:env.HARDWARE_RADAR_UNATTENDED_PUBLICATION_MANDATE_ID??null};
 command.fingerprint=createHash("sha256").update(JSON.stringify(command)).digest("hex");return freeze(command);
}

export function productionPublicationArguments(command,{mode="RUN",mandateId=command?.mandateId,candidateId=null,checkpointCommit=null}={}){
 if(!command?.fingerprint)throw new Error("PUBLICATION_COMMAND_CONTRACT_REQUIRED");
 if(!["RUN","INSPECT","RECOVERY_INSPECT","RECOVER"].includes(mode))throw new Error("PUBLICATION_COMMAND_MODE_INVALID");
 if(!mandateId)throw new Error("PUBLICATION_MANDATE_ID_REQUIRED");
 const args=[...command.nodeOptions,`--env-file=${command.environmentPath}`,command.scriptPath,`--mode=${mode}`,`--mandate-id=${mandateId}`,`--mandate-state=${command.mandateStatePath}`,`--root=${command.operationalRoot}`,`--checkout-root=${command.publicationCheckoutRoot}`];
 if(candidateId)args.push(`--candidate-id=${candidateId}`);if(checkpointCommit)args.push(`--checkpoint-commit=${checkpointCommit}`);return freeze(args);
}

export function createProductionPublicationRunner({execFile,env=process.env,...configuration}={}){
 if(typeof execFile!=="function")throw new TypeError("PUBLICATION_EXEC_FILE_REQUIRED");const command=resolveProductionPublicationCommand({...configuration,env});
 return async function run({mandateId,root:checkoutRoot,mode="RUN",candidateId=null,checkpointCommit=null}={}){
  if(checkoutRoot&&command.publicationCheckoutRoot!==path.resolve(checkoutRoot))throw new Error("PUBLICATION_CHECKOUT_ROOT_CONFLICT");let result;
  try{result=await execFile(command.nodeExecutable,productionPublicationArguments(command,{mode,mandateId,candidateId,checkpointCommit}),{cwd:command.runtimeRoot,env,windowsHide:true,maxBuffer:32*1024*1024});}
  catch(error){const detail=[error?.stderr,error?.message].find(value=>typeof value==="string"&&/PUBLICATION_[A-Z0-9_]+/.test(value)),classification=detail?.match(/PUBLICATION_[A-Z0-9_]+/)?.[0]??"PUBLICATION_COMMAND_FAILED",failure=new Error(classification);failure.code=classification;throw failure;}
  const start=result.stdout.indexOf("{");if(start<0)throw new Error("PUBLICATION_COMMAND_OUTPUT_INVALID");return JSON.parse(result.stdout.slice(start));
 };
}
