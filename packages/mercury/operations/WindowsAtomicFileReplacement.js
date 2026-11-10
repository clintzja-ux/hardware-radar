const TRANSIENT_WINDOWS_REPLACEMENT_CODES=new Set(["EPERM","EACCES","EBUSY"]);
export const WINDOWS_ATOMIC_REPLACEMENT_BACKOFF_MS=Object.freeze([25,50,100,200]);

const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const detail=(error,{source,destination,attempt,maxAttempts})=>Object.assign(error,{atomicReplacement:{code:error?.code??null,syscall:error?.syscall??"rename",source:error?.path??source,destination:error?.dest??destination,attempt,maxAttempts,transient:TRANSIENT_WINDOWS_REPLACEMENT_CODES.has(error?.code)}});

export async function replaceFileWithWindowsRetry({source,destination,rename,sleep=wait,backoff=WINDOWS_ATOMIC_REPLACEMENT_BACKOFF_MS}={}){
 if(typeof source!=="string"||typeof destination!=="string"||typeof rename!=="function"||typeof sleep!=="function"||!Array.isArray(backoff)||backoff.some(value=>!Number.isInteger(value)||value<0))throw new TypeError("WINDOWS_ATOMIC_REPLACEMENT_INPUT_INVALID");
 const maxAttempts=backoff.length+1;
 for(let attempt=1;attempt<=maxAttempts;attempt+=1){
  try{await rename(source,destination);return Object.freeze({status:"REPLACED",attempts:attempt,totalBackoffMs:backoff.slice(0,attempt-1).reduce((sum,value)=>sum+value,0)});}
  catch(error){detail(error,{source,destination,attempt,maxAttempts});if(!TRANSIENT_WINDOWS_REPLACEMENT_CODES.has(error?.code)||attempt===maxAttempts)throw error;await sleep(backoff[attempt-1]);}
 }
 throw new Error("WINDOWS_ATOMIC_REPLACEMENT_UNREACHABLE");
}
