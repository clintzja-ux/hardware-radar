const freeze=value=>Object.freeze(structuredClone(value));
const integer=(value,code)=>{if(!Number.isInteger(value)||value<1)throw new Error(code);return value;};
const delay=value=>new Promise(resolve=>setTimeout(resolve,value));

export const BOUNDED_PENDING_PROGRESSION_POLICY_VERSION="MERCURY-BOUNDED-EXISTING-TASK-PROGRESSION-1.0";

/**
 * Finite orchestration over already-created provider tasks. This owner has no
 * paid executor, authorization repository, or task-creation dependency.
 */
export class BoundedExistingTaskProgressionService{
  constructor({coordinator,wait=delay,now=()=>new Date().toISOString()}={}){
    if(typeof coordinator?.progressExistingTasks!=="function"||typeof wait!=="function")throw new Error("BOUNDED_PENDING_PROGRESSION_DEPENDENCIES_REQUIRED");
    Object.assign(this,{coordinator,wait,now});
  }
  async progress({runId,maxAttempts,intervalMs=0}={}){
    const attemptsLimit=integer(maxAttempts,"BOUNDED_PENDING_MAX_ATTEMPTS_INVALID");
    if(!Number.isInteger(intervalMs)||intervalMs<0)throw new Error("BOUNDED_PENDING_INTERVAL_INVALID");
    const attempts=[];let projection;
    for(let attempt=1;attempt<=attemptsLimit;attempt++){
      projection=await this.coordinator.progressExistingTasks({runId});
      attempts.push(freeze({attempt,at:this.now(),state:projection.state,pending:projection.pending??0,completed:projection.completed??projection.identitiesResolved??0,systemicFailure:projection.systemicFailure??null}));
      if(projection.state!=="WAITING_FOR_PROVIDER")break;
      if(attempt<attemptsLimit)await this.wait(intervalMs);
    }
    const progressionStatus=projection.state==="FAILED"?"SYSTEMIC_STOP":projection.state==="WAITING_FOR_PROVIDER"?"PENDING_BOUND_REACHED":"TERMINAL";
    return freeze({...projection,progressionStatus,progressionAttempts:attempts.length,attempts,noNewPaidWork:true,newPaidTasks:0,newSpendUsd:0,automaticPaidRetries:0});
  }
}
