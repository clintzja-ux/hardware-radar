import {existsSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";

const rows=(db,sql,...parameters)=>db.prepare(sql).all(...parameters).map(row=>JSON.parse(row.payload_json));
const sum=(values,key)=>values.reduce((total,value)=>total+(Number(value?.[key])||0),0);
const reviewEligibility=member=>member.h052ReviewAvailable===true?{eligible:true,owner:"H052_OPERATOR_REVIEW",reviewType:"H052",permittedDecisions:["ACCEPT","REJECT"],evidenceReferences:[member.assessmentId,member.providerResultId].filter(Boolean)}:{eligible:false};

function bounded(databasePath){
 if(!databasePath||!existsSync(databasePath))return [];
 const db=new DatabaseSync(databasePath,{readOnly:true});try{const plans=rows(db,"SELECT payload_json FROM bounded_plans ORDER BY plan_id"),authorizations=rows(db,"SELECT payload_json FROM bounded_authorizations ORDER BY authorized_at,authorization_id"),runs=rows(db,"SELECT payload_json FROM bounded_runs ORDER BY run_id");return runs.map(run=>{const plan=plans.find(x=>x.planId===run.planId),authorization=authorizations.find(x=>x.authorizationId===run.authorizationId),members=rows(db,"SELECT payload_json FROM bounded_run_members WHERE run_id=? ORDER BY member_key",run.runId);return{cohortType:"PRODUCTS_IDENTITY_DISCOVERY",planId:run.planId,runId:run.runId,cycle:plan?.cycle??null,requestedMembers:plan?.requested??[],readyCount:plan?.ready?.length??members.length,blockedCount:plan?.blocked?.length??0,authorizationState:authorization?"AUTHORIZED":"NOT_AUTHORIZED",runState:run.state,members:members.map(member=>({...member,reviewEligibility:reviewEligibility(member)})),automaticRetryCount:0,cost:{authorizedMaximumSpendUsd:plan?.maximumSpendUsd??null,actualSpendUsd:sum(members,"actualSpendUsd")},systemicFailure:run.systemicFailure===true,systemicFailureReason:run.systemicFailureReason??null,safety:run.safety??{}};});}finally{db.close();}
}

function repeat(databasePath){
 if(!databasePath||!existsSync(databasePath))return [];
 const db=new DatabaseSync(databasePath,{readOnly:true});try{const plans=rows(db,"SELECT payload_json FROM repeat_run_plans ORDER BY run_plan_id"),authorizations=rows(db,"SELECT payload_json FROM repeat_run_authorizations ORDER BY expires_at,run_authorization_id"),runs=rows(db,"SELECT payload_json FROM repeat_runs ORDER BY run_id");return runs.map(run=>{const plan=plans.find(x=>x.runPlanId===run.runPlanId),authorization=authorizations.find(x=>x.runAuthorizationId===run.runAuthorizationId),members=rows(db,"SELECT payload_json FROM repeat_run_members WHERE run_id=? ORDER BY prepared_observation_id",run.runId);return{cohortType:"REPEAT_OBSERVATION",planId:run.runPlanId,runId:run.runId,cycle:plan?.observationCycle??null,requestedMembers:plan?.members??members,readyCount:members.length,blockedCount:plan?.blocked?.length??0,authorizationState:authorization?"AUTHORIZED":"NOT_AUTHORIZED",runState:run.state,members:members.map(member=>({...member,memberKey:member.preparedObservationId,source:member.source??member.sourceId,operation:member.operation,repeatObservation:{evidenceCount:member.evidenceCount??null,historicalObservationCount:member.historicalObservationCount??null},reviewEligibility:{eligible:false}})),automaticRetryCount:0,cost:{authorizedMaximumSpendUsd:plan?.maximumSpendUsd??authorization?.maximumSpendUsd??null,actualSpendUsd:sum(members,"actualSpendUsd")},systemicFailure:run.systemicFailure===true,systemicFailureReason:run.systemicFailureReason??null,safety:run.safety??{}};});}finally{db.close();}
}

export class ProductionForgeCohortOperationsProvider{
 constructor({boundedDatabasePath,repeatDatabasePath}={}){this.boundedDatabasePath=boundedDatabasePath;this.repeatDatabasePath=repeatDatabasePath;}
 async load(){return [...bounded(this.boundedDatabasePath),...repeat(this.repeatDatabasePath)];}
}

export default ProductionForgeCohortOperationsProvider;
