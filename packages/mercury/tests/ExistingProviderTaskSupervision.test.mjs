import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SqliteNeutralBoundedRepository} from "../bounded/SqliteNeutralBoundedRepository.js";
import {ExistingProviderTaskSupervisionService} from "../bounded/ExistingProviderTaskSupervision.js";
import {classifyDataForSeoTaskStatus} from "../acquisition/dataforseo/DataForSeoProviderTaskStatus.js";

const root=mkdtempSync(join(tmpdir(),"hardware-radar-task-supervision-"));
const databasePath=join(root,"bounded.sqlite");
let clock="2026-10-05T00:00:00.000Z";
const repository=new SqliteNeutralBoundedRepository({databasePath});
const member={memberKey:"ram_fixture:DATAFORSEO_AMAZON",domainMemberId:"ram_fixture",atlasProductId:"ram_fixture",source:"DATAFORSEO_AMAZON",operation:"PRODUCTS",taskCeilingUsd:.0015,state:"WAITING_FOR_PROVIDER",paidTaskCreated:true,providerTaskId:"provider-task-1",actualSpendUsd:.0015};
repository.recordPlan({planId:"plan",bindingDigest:"a".repeat(64),cycle:clock,requested:[member],ready:[member],blocked:[],maximumSpendUsd:.0015});
repository.recordAuthorization({authorizationId:"auth",planId:"plan",authorizedAt:clock,expiresAt:"2026-10-06T00:00:00.000Z",bindingDigest:"b".repeat(64)});
repository.startRun({runId:"run",planId:"plan",authorizationId:"auth",state:"WAITING_FOR_PROVIDER",members:[member]});

const outcomes=[];
const service=new ExistingProviderTaskSupervisionService({repository,now:()=>clock,checkExistingTask:async()=>outcomes.shift()});
const bootstrap=service.bootstrap({runId:"run"});
assert.equal(bootstrap.records.length,1);
assert.equal(bootstrap.records[0].providerCreatedAt,null);
assert.equal(bootstrap.records[0].historicalAttemptsKnown,false);
assert.equal(bootstrap.records[0].attemptCountSinceSupervision,0);
assert.equal(bootstrap.providerCalls,0);
assert.equal(service.bootstrap({runId:"run"}).records.length,1);

outcomes.push(classifyDataForSeoTaskStatus({statusCode:40602,statusMessage:"Task In Queue"}));
let result=await service.supervise({runId:"run",maxChecks:1});
assert.equal(result.checks,1);
assert.equal(result.records[0].supervisionState,"WAITING_UNTIL_NEXT_CHECK");
assert.equal(result.records[0].attemptCountSinceSupervision,1);
result=await service.supervise({runId:"run",maxChecks:1});
assert.equal(result.checks,0);

clock="2026-10-05T06:15:00.000Z";
outcomes.push(classifyDataForSeoTaskStatus({statusCode:40601,statusMessage:"Task Handed"}));
result=await service.supervise({runId:"run",maxChecks:1});
assert.equal(result.records[0].supervisionState,"OPERATOR_REVIEW_REQUIRED");
assert.equal(result.records[0].terminalReason,null);
assert.equal(result.records[0].operatorReviewReason,"HARDWARE_RADAR_OPERATIONAL_REVIEW_THRESHOLD_EXCEEDED");
assert.equal(result.newPaidTasks,0);
assert.equal(result.actualSpendUsd,0);

const restarted=new ExistingProviderTaskSupervisionService({repository:new SqliteNeutralBoundedRepository({databasePath}),now:()=>clock});
assert.equal(restarted.inspect({runId:"run"}).records[0].attemptCountSinceSupervision,2);
assert.equal(classifyDataForSeoTaskStatus({statusCode:40102}).classification,"COMPLETED_NO_RESULTS");
assert.equal(classifyDataForSeoTaskStatus({statusCode:40103}).classification,"PROVIDER_TERMINAL_FAILURE");
assert.equal(classifyDataForSeoTaskStatus({statusCode:40401}).classification,"TASK_NOT_FOUND");
assert.equal(classifyDataForSeoTaskStatus({statusCode:49999}).classification,"INVALID_REQUEST");
assert.equal(classifyDataForSeoTaskStatus({statusCode:20000,result:[]}).classification,"OTHER_REVIEW_REQUIRED");
assert.equal(classifyDataForSeoTaskStatus({statusCode:20000,result:[{}]}).classification,"RESULT_AVAILABLE");

const scalePath=join(root,"scale.sqlite"),scaleRepository=new SqliteNeutralBoundedRepository({databasePath:scalePath}),scaleMembers=Array.from({length:200},(_,index)=>({memberKey:`member-${index}`,domainMemberId:`ram-${index}`,atlasProductId:`ram-${index}`,source:index%2?"DATAFORSEO_AMAZON":"DATAFORSEO_GOOGLE_SHOPPING",operation:"PRODUCTS",taskCeilingUsd:.0015,state:"WAITING_FOR_PROVIDER",paidTaskCreated:true,providerTaskId:`provider-task-${index}`,actualSpendUsd:.0015}));
scaleRepository.recordPlan({planId:"scale-plan",bindingDigest:"c".repeat(64),cycle:clock,requested:scaleMembers,ready:scaleMembers,blocked:[],maximumSpendUsd:.3});
scaleRepository.recordAuthorization({authorizationId:"scale-auth",planId:"scale-plan",authorizedAt:clock,expiresAt:"2026-10-06T12:00:00.000Z",bindingDigest:"d".repeat(64)});
scaleRepository.startRun({runId:"scale-run",planId:"scale-plan",authorizationId:"scale-auth",state:"WAITING_FOR_PROVIDER",members:scaleMembers});
const scaleService=new ExistingProviderTaskSupervisionService({repository:scaleRepository,now:()=>clock});
assert.equal(scaleService.bootstrap({runId:"scale-run"}).records.length,200);
assert.equal(scaleService.inspect({runId:"scale-run"}).due,200);
const firstClaim=scaleRepository.claimDueTaskSupervisions({runId:"scale-run",asOf:clock,limit:25,leaseId:"lease-one",leaseExpiresAt:"2026-10-05T06:20:00.000Z"});
const overlappingClaim=scaleRepository.claimDueTaskSupervisions({runId:"scale-run",asOf:clock,limit:25,leaseId:"lease-two",leaseExpiresAt:"2026-10-05T06:20:00.000Z"});
assert.equal(firstClaim.length,25);
assert.equal(overlappingClaim.length,25);
assert.equal(new Set([...firstClaim,...overlappingClaim].map(value=>value.providerTaskId)).size,50);
scaleRepository.close();

restarted.repository.close();
repository.close();
rmSync(root,{recursive:true,force:true});
console.log("Existing provider task supervision tests passed (26 cases, including 200-task scale and overlap isolation).");
