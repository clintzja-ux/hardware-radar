import path from "node:path";

export function createSplitRootPublicationRunner({execFile,nodeExecutable=process.execPath,runtimeRoot,operationalRoot,env=process.env}={}){
 if(typeof execFile!=="function")throw new TypeError("PUBLICATION_EXEC_FILE_REQUIRED");
 if(typeof nodeExecutable!=="string"||!path.isAbsolute(nodeExecutable))throw new Error("PUBLICATION_NODE_EXECUTABLE_INVALID");
 runtimeRoot=path.resolve(runtimeRoot??"");operationalRoot=path.resolve(operationalRoot??"");
 const script=path.join(runtimeRoot,"scripts/unattended-live-price-publication.mjs"),environmentPath=path.join(operationalRoot,".env"),mandateStatePath=path.join(operationalRoot,".forge-review/publication/unattended-live-price.json");
 return async function run({mandateId,root:checkoutRoot}={}){
  if(typeof mandateId!=="string"||!mandateId.trim())throw new Error("PUBLICATION_MANDATE_ID_REQUIRED");
  if(typeof checkoutRoot!=="string"||!path.isAbsolute(checkoutRoot))throw new Error("PUBLICATION_CHECKOUT_ROOT_REQUIRED");
  let result;
  try{result=await execFile(nodeExecutable,["--use-system-ca",`--env-file=${environmentPath}`,script,"--mode=RUN",`--mandate-id=${mandateId}`,`--mandate-state=${mandateStatePath}`,`--root=${operationalRoot}`,`--checkout-root=${path.resolve(checkoutRoot)}`],{cwd:runtimeRoot,env,windowsHide:true,maxBuffer:32*1024*1024});}
  catch(error){const detail=[error?.stderr,error?.message].find(value=>typeof value==="string"&&/PUBLICATION_[A-Z0-9_]+/.test(value)),classification=detail?.match(/PUBLICATION_[A-Z0-9_]+/)?.[0]??"PUBLICATION_COMMAND_FAILED",failure=new Error(classification);failure.code=classification;throw failure;}
  const start=result.stdout.indexOf("{");if(start<0)throw new Error("PUBLICATION_COMMAND_OUTPUT_INVALID");return JSON.parse(result.stdout.slice(start));
 };
}
