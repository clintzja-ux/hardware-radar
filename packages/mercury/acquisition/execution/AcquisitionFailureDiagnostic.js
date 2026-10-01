import crypto from "node:crypto";

export const ACQUISITION_FAILURE_STAGES = Object.freeze({
  BEFORE_PROVIDER_REQUEST: "BEFORE_PROVIDER_REQUEST",
  DURING_PROVIDER_REQUEST: "DURING_PROVIDER_REQUEST",
  PROVIDER_REJECTED: "PROVIDER_REJECTED",
  AFTER_PROVIDER_RESPONSE_BEFORE_TASK_PERSISTENCE: "AFTER_PROVIDER_RESPONSE_BEFORE_TASK_PERSISTENCE",
  LOCAL_PERSISTENCE_FAILURE: "LOCAL_PERSISTENCE_FAILURE",
  UNKNOWN: "UNKNOWN"
});

export const ACQUISITION_FAILURE_CLASSES = Object.freeze({
  CONFIGURATION_OR_CONTRACT_FAILURE: "CONFIGURATION_OR_CONTRACT_FAILURE",
  TLS_CERTIFICATE_VALIDATION_FAILURE: "TLS_CERTIFICATE_VALIDATION_FAILURE",
  NETWORK_FAILURE: "NETWORK_FAILURE",
  PROVIDER_REJECTION: "PROVIDER_REJECTION",
  LOCAL_PERSISTENCE_FAILURE: "LOCAL_PERSISTENCE_FAILURE",
  RUNTIME_FAILURE: "RUNTIME_FAILURE",
  UNKNOWN: "UNKNOWN"
});

export const ACQUISITION_FAILURE_RETRYABILITY = Object.freeze({
  RETRY_REQUIRES_OPERATOR_ACTION: "RETRY_REQUIRES_OPERATOR_ACTION",
  NON_RETRYABLE_CONFIGURATION_OR_CONTRACT_FAILURE: "NON_RETRYABLE_CONFIGURATION_OR_CONTRACT_FAILURE",
  REVIEW_REQUIRED: "REVIEW_REQUIRED"
});

const stages=new Set(Object.values(ACQUISITION_FAILURE_STAGES));
const classes=new Set(Object.values(ACQUISITION_FAILURE_CLASSES));
const retryability=new Set(Object.values(ACQUISITION_FAILURE_RETRYABILITY));
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const hash=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const text=(value,fallback)=>typeof value==="string"&&value.trim()?value.trim():fallback;
const TLS_CODES=/^(CERT_|ERR_TLS_CERT_|UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED_CERT_IN_CHAIN|DEPTH_ZERO_SELF_SIGNED_CERT)/;
const NETWORK_CODES=/^(EAI_AGAIN|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|UND_ERR_)/;

export function sanitizeAcquisitionFailureText(value,{fallback="UNAVAILABLE",maximumLength=240}={}){
  let safe=text(value,fallback);
  safe=safe.replace(/\bBasic\s+[A-Za-z0-9+/=]+/gi,"[REDACTED_AUTHORIZATION]")
    .replace(/\b(Bearer|Token)\s+[^\s,;]+/gi,"$1 [REDACTED]")
    .replace(/\b(password|passwd|secret|api[_-]?key|authorization)\s*[:=]\s*[^\s,;]+/gi,"$1=[REDACTED]")
    .replace(/https?:\/\/[^\s/@:]+:[^\s/@]+@/gi,"https://[REDACTED]@");
  return safe.slice(0,maximumLength);
}

export function createAcquisitionFailureDiagnostic({error,provider="UNKNOWN",operation="UNKNOWN",occurredAt,executionRunId=null,authorizationId=null,candidateId=null,providerTaskId=null,actualSpendUsd=0}={}){
  const causeChain=[];const seen=new Set();let cursor=error;
  for(let depth=0;cursor&&typeof cursor==="object"&&depth<4&&!seen.has(cursor);depth++){seen.add(cursor);causeChain.push(Object.freeze({depth,name:sanitizeAcquisitionFailureText(cursor.name,{fallback:"Error",maximumLength:80}),code:sanitizeAcquisitionFailureText(cursor.code,{fallback:"UNAVAILABLE",maximumLength:120}),message:sanitizeAcquisitionFailureText(cursor.message,{fallback:"UNAVAILABLE"})}));cursor=cursor.cause;}
  const annotatedStage=error?.failureStage;
  const deepestCode=[...causeChain].reverse().find(layer=>layer.code!=="UNAVAILABLE")?.code??"";
  const diagnosticLayer=[...causeChain].reverse().find(layer=>TLS_CODES.test(layer.code)||NETWORK_CODES.test(layer.code))??causeChain[0];
  const causeCode=text(diagnosticLayer?.code??deepestCode,"");
  const rawCode=text(error?.safeErrorCode??diagnosticLayer?.code??error?.code??error?.message,"UNCLASSIFIED_FAILURE");
  const rawMessage=text(error?.safeErrorMessage??diagnosticLayer?.message??error?.message,"Failure detail unavailable.");
  let failureStage=stages.has(annotatedStage)?annotatedStage:ACQUISITION_FAILURE_STAGES.DURING_PROVIDER_REQUEST;
  let failureClass=classes.has(error?.failureClass)?error.failureClass:ACQUISITION_FAILURE_CLASSES.UNKNOWN;
  if(failureClass===ACQUISITION_FAILURE_CLASSES.UNKNOWN&&TLS_CODES.test(causeCode))failureClass=ACQUISITION_FAILURE_CLASSES.TLS_CERTIFICATE_VALIDATION_FAILURE;
  if(failureClass===ACQUISITION_FAILURE_CLASSES.UNKNOWN&&NETWORK_CODES.test(causeCode))failureClass=ACQUISITION_FAILURE_CLASSES.NETWORK_FAILURE;
  if(failureClass===ACQUISITION_FAILURE_CLASSES.UNKNOWN&&/^(DATAFORSEO_API_ERROR|DATAFORSEO_TASK_ERROR|HTTP_\d+)/.test(rawCode))failureClass=ACQUISITION_FAILURE_CLASSES.PROVIDER_REJECTION;
  if(failureClass===ACQUISITION_FAILURE_CLASSES.PROVIDER_REJECTION)failureStage=ACQUISITION_FAILURE_STAGES.PROVIDER_REJECTED;
  const retry=retryability.has(error?.retryability)?error.retryability:failureClass===ACQUISITION_FAILURE_CLASSES.CONFIGURATION_OR_CONTRACT_FAILURE?ACQUISITION_FAILURE_RETRYABILITY.NON_RETRYABLE_CONFIGURATION_OR_CONTRACT_FAILURE:[ACQUISITION_FAILURE_CLASSES.NETWORK_FAILURE,ACQUISITION_FAILURE_CLASSES.TLS_CERTIFICATE_VALIDATION_FAILURE].includes(failureClass)?ACQUISITION_FAILURE_RETRYABILITY.RETRY_REQUIRES_OPERATOR_ACTION:ACQUISITION_FAILURE_RETRYABILITY.REVIEW_REQUIRED;
  const material={failureStage,failureClass,provider:text(provider,"UNKNOWN"),operation:text(operation,"UNKNOWN"),occurredAt:text(occurredAt,"UNKNOWN"),retryability:retry,safeErrorCode:sanitizeAcquisitionFailureText(rawCode),safeErrorMessage:sanitizeAcquisitionFailureText(rawMessage),causeChain,providerTaskId:providerTaskId??error?.providerTaskId??null,executionRunId,authorizationId,candidateId,actualSpendUsd:Number(actualSpendUsd)};
  return Object.freeze({...material,diagnosticFingerprint:hash(material)});
}
