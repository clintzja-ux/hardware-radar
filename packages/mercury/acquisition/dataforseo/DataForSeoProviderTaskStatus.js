export const DATAFORSEO_TASK_STATUS_POLICY_VERSION="MERCURY-DATAFORSEO-TASK-STATUS-1.0";

const STATUS=Object.freeze({
  40101:["PROVIDER_TERMINAL_FAILURE","INTERNAL_SEARCH_ENGINE_ERROR"],40102:["COMPLETED_NO_RESULTS","NO_SEARCH_RESULTS"],40103:["PROVIDER_TERMINAL_FAILURE","TASK_EXECUTION_FAILED"],40105:["PROVIDER_TERMINAL_FAILURE","TASK_DELETED"],40401:["TASK_NOT_FOUND","TASK_NOT_FOUND"],40403:["PROVIDER_TERMINAL_FAILURE","RESULTS_EXPIRED"],40601:["RETRYABLE_PENDING","TASK_HANDED"],40602:["RETRYABLE_PENDING","TASK_IN_QUEUE"]
});

export function classifyDataForSeoTaskStatus({statusCode,statusMessage=null,result}={}){
  if(!Number.isInteger(statusCode))return Object.freeze({policyVersion:DATAFORSEO_TASK_STATUS_POLICY_VERSION,classification:"OTHER_REVIEW_REQUIRED",statusCode:null,statusMessage:null,reason:"STATUS_CODE_MISSING"});
  if(statusCode===20000){const populated=Array.isArray(result)&&result.length>0;return Object.freeze({policyVersion:DATAFORSEO_TASK_STATUS_POLICY_VERSION,classification:populated?"RESULT_AVAILABLE":"OTHER_REVIEW_REQUIRED",statusCode,statusMessage,reason:populated?"SUCCESS_WITH_RESULT":"SUCCESS_EMPTY_RESULT_AMBIGUOUS"});}
  if(statusCode===40106)return Object.freeze({policyVersion:DATAFORSEO_TASK_STATUS_POLICY_VERSION,classification:Array.isArray(result)&&result.length?"RESULT_AVAILABLE":"OTHER_REVIEW_REQUIRED",statusCode,statusMessage,reason:"PARTIAL_RESULT"});
  const known=STATUS[statusCode];if(known)return Object.freeze({policyVersion:DATAFORSEO_TASK_STATUS_POLICY_VERSION,classification:known[0],statusCode,statusMessage,reason:known[1]});
  if((statusCode>=40000&&statusCode<40601)||(statusCode>40602&&statusCode<50000))return Object.freeze({policyVersion:DATAFORSEO_TASK_STATUS_POLICY_VERSION,classification:"INVALID_REQUEST",statusCode,statusMessage,reason:"NON_RETRYABLE_4XXXX"});
  return Object.freeze({policyVersion:DATAFORSEO_TASK_STATUS_POLICY_VERSION,classification:"OTHER_REVIEW_REQUIRED",statusCode,statusMessage,reason:"UNRECOGNIZED_PROVIDER_STATUS"});
}
