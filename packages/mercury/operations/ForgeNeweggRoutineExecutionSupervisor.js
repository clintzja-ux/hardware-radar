const freeze=value=>Object.freeze(structuredClone(value));

export class ForgeNeweggRoutineExecutionSupervisor{
 constructor({command,now=()=>new Date().toISOString()}={}){if(!command?.execute)throw new TypeError("FORGE_NEWEGG_ROUTINE_COMMAND_REQUIRED");this.command=command;this.now=now;this.active=null;this.lastTerminal=null;}
 inspect(){return freeze({active:this.active?{requestId:this.active.requestId,operatorId:this.active.operatorId,mode:this.active.mode,acceptedAt:this.active.acceptedAt}:null,lastTerminal:this.lastTerminal});}
 start({requestId,operatorId,mode,mandateId}={}){
  if(!requestId||!operatorId||!mandateId||!["RUN_TODAY","RESUME"].includes(mode))throw new TypeError("FORGE_NEWEGG_ROUTINE_EXECUTION_INPUT_INVALID");
  if(this.active)throw new Error("NEWEGG_ROUTINE_OPERATOR_EXECUTION_ACTIVE");
  const acceptedAt=this.now(),entry={requestId,operatorId,mode,mandateId,acceptedAt};this.active=entry;
  entry.promise=Promise.resolve().then(()=>this.command.execute({mode:"RUN_LIVE",mandateId})).then(result=>{this.lastTerminal={requestId,status:result?.status??"COMPLETED",completedAt:this.now(),failure:null};return result;},error=>{this.lastTerminal={requestId,status:"REVIEW_REQUIRED",completedAt:this.now(),failure:error?.code??error?.message??"NEWEGG_ROUTINE_OPERATOR_EXECUTION_FAILED"};return null;}).finally(()=>{if(this.active?.requestId===requestId)this.active=null;});
  return freeze({status:"ACCEPTED",requestId,operatorId,mode,acceptedAt,browserIndependent:true,automaticRetries:0,releaseAuthority:false,deploymentAuthority:false,automaticDeletionAuthority:false});
 }
}
