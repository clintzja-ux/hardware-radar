import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createAcquisitionBudgetPolicy, createAcquisitionPlan, ControlledAcquisitionExecutor,
  FileAcquisitionExecutionLedgerRepository, FileSingleWriterRunLock,
  FileDataForSeoMarketEvidenceRepository, DataForSeoAcquisitionResultProcessor
} from "../index.js";

const dir=await mkdtemp(join(tmpdir(),"hr-df004c-"));
try {
  const policy=createAcquisitionBudgetPolicy({enabled:true,maxPaidTasksPerRun:1,maxSpendPerRunUsd:.001,maxSpendPerDayUsd:.01,defaultRefreshCooldownMs:1});
  const plan=createAcquisitionPlan({policy,plannedAt:"2026-08-17T07:00:00.000Z",candidates:[{candidateId:"corsair-live1",priority:"HIGH",estimatedCostUsd:.001,execution:{kind:"DATAFORSEO_SELLERS",dataDocId:"17540895125310173539"}}]});
  const sellerItem={type:"shops_list",seller_name:"Central Computers",title:"Central Computers",domain:"www.centralcomputer.com",url:"https://www.centralcomputer.com/corsair-cmk32gx5m2b6000z30.html",base_price:549.99,tax:null,shipping_price:38.260695,total_price:588.25,currency:"USD",product_condition:null,product_availability:"in_stock",details:"Corsair CMK32GX5M2B6000Z30"};
  const productItem={product_id:null,title:"Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s",specifications:[{specification_name:"Brand",specification_value:"Corsair"},{specification_name:"Memory Size",specification_value:"32 GB"},{specification_name:"Number of Modules",specification_value:"2 x 16GB"},{specification_name:"Memory Technology",specification_value:"DDR5 SDRAM"},{specification_name:"Memory Speed",specification_value:"6000 MHz"},{specification_name:"CAS Latency",specification_value:"CL30"},{specification_name:"Form Factor",specification_value:"DIMM"}]};
  const atlasProduct={identity:{atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",brand:"Corsair",productFamily:"Vengeance",manufacturerPartNumber:"CMK32GX5M2B6000Z30",alternatePartNumbers:[],gtin:null,upc:null},extension:{data:{classification:{memoryType:"DDR5",formFactor:"DIMM"},capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16},performance:{dataRateMtps:6000,casLatency:30}}}};
  const atlasResolver={resolve:async()=>({outcome:"PROBABLE",atlasProductId:atlasProduct.identity.atlasProductId,externalProductId:null,evidence:[],candidateAtlasProductIds:[],automaticMercuryEligible:false})};
  const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:join(dir,"evidence.json"),now:()=>"2026-08-17T07:01:00.000Z"});
  const resultProcessor=new DataForSeoAcquisitionResultProcessor({atlasResolver,evidenceRepository,retailers:[]});
  const transport={execute:async()=>({providerTaskId:"fake-sellers-1",status:20000,costUsd:.001,payload:{sellerItem,productItem,context:{sourceTaskId:"fake-sellers-1",observedAt:"2026-08-17T07:00:30.000Z",productTitle:productItem.title,dataDocId:"17540895125310173539",rawPayloadReference:"fixture:df004c-live1"}}})};
  const executor=new ControlledAcquisitionExecutor({runLock:new FileSingleWriterRunLock({lockPath:join(dir,"run.lock"),heartbeatIntervalMs:100,staleAfterMs:1000}),ledgerRepository:new FileAcquisitionExecutionLedgerRepository({filePath:join(dir,"ledger.json")}),transport,resultProcessor,now:()=>"2026-08-17T07:02:00.000Z",runId:()=>"run-df004c"});
  const result=await executor.execute(plan);
  assert.equal(result.status,"COMPLETED");
  assert.equal(result.run.actualSpendUsd,.001);
  const task=result.run.tasks[0];
  assert.equal(task.acquisitionOutcome,"COMPLETED");
  assert.equal(task.integration.evidenceOutcome,"RETAINED");
  assert.equal(task.integration.productIdentityOutcome,"PROBABLE");
  assert.equal(task.integration.merchantIdentityOutcome,"DISCOVERED");
  assert.equal(task.integration.historicalOutcome,"NOT_ELIGIBLE");
  assert.equal(task.integration.canonicalObservationEligible,false);
  assert.equal(task.integration.publicationEligible,false);
  assert.equal((await evidenceRepository.getAll()).length,1);
  assert.equal((await evidenceRepository.getAll())[0].candidate.marketEvidence.pricing.totalPrice,588.25);

  const badPlan=createAcquisitionPlan({policy,plannedAt:"2026-08-17T08:00:00.000Z",candidates:[{candidateId:"bad",priority:"HIGH",estimatedCostUsd:.001,execution:{kind:"DATAFORSEO_SELLERS",dataDocId:"bad"}}]});
  const badExecutor=new ControlledAcquisitionExecutor({runLock:new FileSingleWriterRunLock({lockPath:join(dir,"bad.lock"),heartbeatIntervalMs:100,staleAfterMs:1000}),ledgerRepository:new FileAcquisitionExecutionLedgerRepository({filePath:join(dir,"bad-ledger.json")}),transport:{execute:async()=>({providerTaskId:"bad-provider",status:20000,costUsd:.001,payload:{sellerItem:{type:"wrong"},productItem,context:{}}})},resultProcessor,now:()=>"2026-08-17T08:01:00.000Z"});
  const bad=await badExecutor.execute(badPlan);
  assert.equal(bad.status,"COMPLETED");
  assert.equal(bad.run.actualSpendUsd,.001);
  assert.equal(bad.run.tasks[0].acquisitionOutcome,"COMPLETED");
  assert.equal(bad.run.tasks[0].integration.evidenceOutcome,"REJECTED_INVALID_EVIDENCE");
  assert.equal(bad.run.tasks[0].integration.historicalOutcome,"NOT_ELIGIBLE");
} finally { await rm(dir,{recursive:true,force:true}); }
console.log("Controlled acquisition DF003 integration tests passed.");
