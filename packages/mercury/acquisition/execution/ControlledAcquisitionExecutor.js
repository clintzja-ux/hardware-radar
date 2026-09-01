import crypto from "node:crypto";
import { SINGLE_WRITER_LOCK_STATUSES } from "../../runtime/FileSingleWriterRunLock.js";
import { readGovernedSpendForUtcDay } from "../planning/GovernedDailySpend.js";

export const ACQUISITION_EXECUTION_STATUSES = Object.freeze({ COMPLETED:"COMPLETED", PARTIAL:"PARTIAL", FAILED:"FAILED", DUPLICATE:"DUPLICATE", SKIPPED_LOCKED:"SKIPPED_LOCKED" });
export const ACQUISITION_EXECUTION_STOP_REASONS = Object.freeze({ ACTUAL_RUN_BUDGET:"ACTUAL_RUN_BUDGET", ACTUAL_DAILY_BUDGET:"ACTUAL_DAILY_BUDGET", NEXT_TASK_RUN_BUDGET:"NEXT_TASK_RUN_BUDGET", NEXT_TASK_DAILY_BUDGET:"NEXT_TASK_DAILY_BUDGET", TRANSPORT_FAILURE:"TRANSPORT_FAILURE" });
function validIso(value){ return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function money(value){ return Math.round((value + Number.EPSILON) * 1e9) / 1e9; }
function clone(value){ return value == null ? value : structuredClone(value); }
function freeze(value){ if(value && typeof value === "object" && !Object.isFrozen(value)){ Object.freeze(value); for(const child of Object.values(value)) freeze(child); } return value; }
function validatePlan(plan){
  if (!plan || plan.schemaVersion !== "1.0" || typeof plan.planId !== "string") throw new Error("INVALID_ACQUISITION_PLAN");
  if (!plan.policy?.enabled) throw new Error("ACQUISITION_PLAN_NOT_ENABLED");
  if (plan.policy.automaticPaidRetries !== 0) throw new Error("PAID_RETRIES_NOT_ALLOWED");
  const approved = plan.decisions?.filter((x)=>x.decision === "APPROVED") ?? [];
  if (approved.length !== plan.approvedTaskCount) throw new Error("ACQUISITION_PLAN_COUNT_MISMATCH");
  const estimated = money(approved.reduce((sum,x)=>sum + Number(x.estimatedCostUsd),0));
  if (estimated !== money(plan.estimatedApprovedSpendUsd)) throw new Error("ACQUISITION_PLAN_SPEND_MISMATCH");
  if (approved.length > plan.policy.maxPaidTasksPerRun || estimated > plan.policy.maxSpendPerRunUsd || money(plan.spentTodayUsd + estimated) > plan.policy.maxSpendPerDayUsd) throw new Error("ACQUISITION_PLAN_EXCEEDS_POLICY");
  for (const task of approved) if (!task.execution || typeof task.execution !== "object") throw new Error(`APPROVED_TASK_MISSING_EXECUTION:${task.candidateId}`);
  return approved;
}

export class ControlledAcquisitionExecutor {
  constructor({ runLock, ledgerRepository, transport, resultProcessor=null, currentDaySpendResolver=null, now=()=>new Date().toISOString(), runId=()=>`acqrun_${crypto.randomUUID()}` }={}){
    if (!runLock?.runExclusive) throw new TypeError("runLock is required.");
    if (!ledgerRepository?.findByPlanId || !ledgerRepository?.append) throw new TypeError("ledgerRepository is required.");
    if (!transport?.execute) throw new TypeError("transport.execute is required.");
    if (resultProcessor != null && !resultProcessor?.process) throw new TypeError("resultProcessor.process is required when provided.");
    if(currentDaySpendResolver!=null&&typeof currentDaySpendResolver!=="function")throw new TypeError("currentDaySpendResolver must be a function.");
    this.runLock=runLock; this.ledgerRepository=ledgerRepository; this.transport=transport; this.resultProcessor=resultProcessor;this.currentDaySpendResolver=currentDaySpendResolver??(ledgerRepository.getAll?evaluationTime=>readGovernedSpendForUtcDay({executionRepository:ledgerRepository,evaluationTime}):null); this.now=now; this.runIdFactory=runId;
  }
  async execute(plan){
    const approved = validatePlan(plan);
    const locked = await this.runLock.runExclusive(async()=>{
      const prior = await this.ledgerRepository.findByPlanId(plan.planId);
      if (prior) return { duplicate:true, prior };
      const startedAt=this.now(); if(!validIso(startedAt)) throw new TypeError("now() must return ISO timestamps.");
      if(this.currentDaySpendResolver){const current=money(await this.currentDaySpendResolver(startedAt));if(current!==money(plan.spentTodayUsd))throw new Error("ACQUISITION_DAILY_SPEND_SNAPSHOT_DRIFT");if(money(current+plan.estimatedApprovedSpendUsd)>money(plan.policy.maxSpendPerDayUsd))throw new Error("ACQUISITION_DAILY_BUDGET_EXCEEDED");}
      const tasks=[]; let actualSpend=0; let stopReason=null;
      for(const task of approved){
        if (money(actualSpend + task.estimatedCostUsd) > plan.policy.maxSpendPerRunUsd){ stopReason="NEXT_TASK_RUN_BUDGET"; tasks.push({candidateId:task.candidateId,outcome:"SKIPPED",reason:stopReason,estimatedCostUsd:task.estimatedCostUsd,actualCostUsd:0}); break; }
        if (money(plan.spentTodayUsd + actualSpend + task.estimatedCostUsd) > plan.policy.maxSpendPerDayUsd){ stopReason="NEXT_TASK_DAILY_BUDGET"; tasks.push({candidateId:task.candidateId,outcome:"SKIPPED",reason:stopReason,estimatedCostUsd:task.estimatedCostUsd,actualCostUsd:0}); break; }
        try {
          const response=await this.transport.execute(clone(task.execution));
          const cost=Number(response?.costUsd ?? 0);
          if(!Number.isFinite(cost)||cost<0) throw new Error("INVALID_PROVIDER_COST");
          actualSpend=money(actualSpend+cost);
          let integration=null;
          if(this.resultProcessor){
            try { integration=await this.resultProcessor.process({providerResponse:clone(response),execution:clone(task.execution),candidateId:task.candidateId}); }
            catch(error){ integration={evidenceOutcome:"REJECTED_INVALID_EVIDENCE",historicalOutcome:"NOT_ELIGIBLE",canonicalObservationEligible:false,publicationEligible:false,errorCode:error?.code ?? error?.message ?? "RESULT_PROCESSING_FAILURE"}; }
          }
          tasks.push({candidateId:task.candidateId,outcome:"COMPLETED",acquisitionOutcome:"COMPLETED",reason:null,estimatedCostUsd:task.estimatedCostUsd,actualCostUsd:cost,providerTaskId:response?.providerTaskId ?? null,providerStatus:response?.status ?? null,integration:clone(integration)});
          if(actualSpend > plan.policy.maxSpendPerRunUsd){ stopReason="ACTUAL_RUN_BUDGET"; break; }
          if(money(plan.spentTodayUsd+actualSpend) > plan.policy.maxSpendPerDayUsd){ stopReason="ACTUAL_DAILY_BUDGET"; break; }
        } catch(error){
          tasks.push({candidateId:task.candidateId,outcome:"FAILED",acquisitionOutcome:"FAILED",reason:"TRANSPORT_FAILURE",estimatedCostUsd:task.estimatedCostUsd,actualCostUsd:Number.isFinite(error?.costUsd)&&error.costUsd>=0?error.costUsd:0,providerTaskId:error?.providerTaskId ?? null,providerStatus:error?.providerStatus ?? null,errorCode:error?.code ?? error?.message ?? "TRANSPORT_FAILURE"});
          actualSpend=money(actualSpend+tasks.at(-1).actualCostUsd); stopReason="TRANSPORT_FAILURE"; break;
        }
      }
      const finishedAt=this.now(); if(!validIso(finishedAt)) throw new TypeError("now() must return ISO timestamps.");
      const completed=tasks.filter(x=>x.outcome==="COMPLETED").length, failed=tasks.filter(x=>x.outcome==="FAILED").length;
      const status=failed ? "FAILED" : stopReason ? "PARTIAL" : "COMPLETED";
      const ledger=freeze({schemaVersion:"1.0",runId:this.runIdFactory(),planId:plan.planId,startedAt,finishedAt,status,stopReason,plannedTasks:approved.length,attemptedTasks:completed+failed,completedTasks:completed,failedTasks:failed,skippedTasks:tasks.filter(x=>x.outcome==="SKIPPED").length,estimatedSpendUsd:plan.estimatedApprovedSpendUsd,actualSpendUsd:actualSpend,tasks});
      const recorded=await this.ledgerRepository.append(ledger);
      if(recorded.status!=="RECORDED") return {duplicate:true,prior:recorded.run};
      return {duplicate:false,ledger};
    });
    if(locked.status===SINGLE_WRITER_LOCK_STATUSES.SKIPPED_LOCKED) return freeze({status:"SKIPPED_LOCKED",planId:plan.planId});
    if(locked.result.duplicate) return freeze({status:"DUPLICATE",planId:plan.planId,run:clone(locked.result.prior)});
    return freeze({status:locked.result.ledger.status,planId:plan.planId,run:clone(locked.result.ledger)});
  }
}
export default ControlledAcquisitionExecutor;
