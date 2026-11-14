const DEFAULT_GRACE_MS=250;
const DEFAULT_FORCE_EXIT_MS=2_000;
const BENIGN_RESOURCES=new Set(["PipeWrap","TTYWrap"]);

const wait=value=>new Promise(resolve=>setTimeout(resolve,value));

function write(stream,value){
  return new Promise((resolve,reject)=>{
    const callback=error=>error?reject(error):resolve();
    try{stream.write(`${value}\n`,callback);}catch(error){reject(error);}
  });
}
export function inspectScheduledProcessResources({activeResources=()=>process.getActiveResourcesInfo?.()??[]}={}){
  const resources=activeResources().filter(value=>!BENIGN_RESOURCES.has(value));
  return Object.freeze({resources:Object.freeze([...resources]),clean:resources.length===0});
}

export async function finalizeScheduledProcess({
  exitCode,
  stdout=process.stdout,
  stderr=process.stderr,
  terminalOutput,
  graceMs=DEFAULT_GRACE_MS,
  forceExitMs=DEFAULT_FORCE_EXIT_MS,
  activeResources=()=>process.getActiveResourcesInfo?.()??[],
  exit=code=>process.exit(code),
  setExitCode=code=>{process.exitCode=code;},
  delay=wait
}={}){
  if(!Number.isInteger(exitCode)||exitCode<0)throw new TypeError("SCHEDULED_PROCESS_EXIT_CODE_INVALID");
  if(typeof terminalOutput!=="string"||terminalOutput.length===0)throw new TypeError("SCHEDULED_PROCESS_TERMINAL_OUTPUT_REQUIRED");
  if(!Number.isFinite(graceMs)||graceMs<0||!Number.isFinite(forceExitMs)||forceExitMs<=graceMs)throw new TypeError("SCHEDULED_PROCESS_SHUTDOWN_WINDOW_INVALID");

  await write(exitCode===0?stdout:stderr,terminalOutput);
  setExitCode(exitCode);
  await delay(graceMs);
  await new Promise(resolve=>setImmediate(resolve));
  const inspection=inspectScheduledProcessResources({activeResources});
  if(inspection.clean)return Object.freeze({exitCode,forced:false,resources:inspection.resources});

  await write(stderr,JSON.stringify({
    status:"TERMINAL_PROCESS_CLEANUP_FALLBACK",
    exitCode,
    activeResourceTypes:inspection.resources,
    terminalEvidenceDurable:true
  }));
  await delay(forceExitMs-graceMs);
  exit(exitCode);
  return Object.freeze({exitCode,forced:true,resources:inspection.resources});
}
