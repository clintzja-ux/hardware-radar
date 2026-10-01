const line=(label,value)=>`${label.padEnd(23)}${value??"NOT_AVAILABLE"}`;
const tuple=value=>`dataDocId=${value?.dataDocId??"null"} productId=${value?.productId??"null"} gid=${value?.gid??"null"}`;

export function renderProductInfoResultOutcome(outcome={}){
  const status=outcome.status,result=outcome.result??null,lines=["GOVERNED PRODUCT INFO RESULT",""];
  if(status==="PRODUCT_INFO_REVIEW_REQUIRED"||status==="DUPLICATE"&&result?.status==="PRODUCT_INFO_REVIEW_REQUIRED"){
    if(!result?.resultId||!result?.providerTaskId||result.validation?.status!=="REVIEW_REQUIRED"||!Array.isArray(result.validation.reasons)||result.validation.reasons.length===0)throw new Error("PRODUCT_INFO_REVIEW_REQUIRED_OUTPUT_INVALID");
    lines.push(line("Result ID:",result.resultId),line("Task ID:",result.providerTaskId),line("Atlas product:",result.atlasProductId),line("Status:","PRODUCT_INFO_REVIEW_REQUIRED"),line("Reasons:",result.validation.reasons.join(",")),line("Provider identity:",tuple(result.providerIdentity)),line("Product title:",result.retrievedEvidence?.title),line("Sellers readiness:","NOT_ESTABLISHED"),line("Paid task created:","NO"),line("Additional spend:","$0.000"));return `${lines.join("\n")}\n`;
  }
  if(status==="RESULT_RECEIVED"||status==="DUPLICATE"&&result?.status==="PRODUCT_INFO_VALIDATED"){
    if(!result?.resultId||result.validation?.status!=="VALIDATED"||!result.validation?.atlas?.status)throw new Error("PRODUCT_INFO_VALIDATED_OUTPUT_INVALID");
    lines.push(line("Result ID:",result.resultId),line("Task ID:",result.providerTaskId),line("Atlas product:",result.atlasProductId),line("Status:","PRODUCT_INFO_VALIDATED"),line("Provider identity:",tuple(result.providerIdentity)),line("Product title:",result.retrievedEvidence?.title),line("Atlas evidence:",result.validation.atlas.status),line("Sellers readiness:",outcome.sellersReadiness??result.sellersReadiness),line("Paid task created:","NO"),line("Additional spend:","$0.000"));return `${lines.join("\n")}\n`;
  }
  if(status==="PROVIDER_PENDING"||status==="NO_RESULT"){
    lines.push(line("Task ID:",outcome.lineage?.productInfoTaskId),line("Atlas product:",outcome.lineage?.atlasProductId),line("Status:",status),line("Sellers readiness:","NOT_ESTABLISHED"),line("Paid task created:","NO"),line("Additional spend:","$0.000"));return `${lines.join("\n")}\n`;
  }
  throw new Error("PRODUCT_INFO_RESULT_OUTPUT_STATE_UNSUPPORTED");
}
