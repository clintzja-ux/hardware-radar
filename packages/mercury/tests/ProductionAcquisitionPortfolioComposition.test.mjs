import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { ProductRepository } from "../../atlas/index.js";
import { defaultSourceRightsRegistry, FileAcquisitionPortfolioRepository, GovernedProviderIdentityResolver, ProductionAcquisitionPortfolioPrepareService } from "../index.js";

let cases=0;const asOf="2026-09-03T14:00:00.000Z",readJson=async resource=>JSON.parse(await readFile(resource,"utf8")),products=new ProductRepository({readJson});
const evidence=new Map([["ev1",{evidenceId:"ev1",candidate:{marketEvidence:{provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",productEvidence:{dataDocId:"doc-1",productId:null,gid:null},provenance:{sourceTaskId:"task-1"}}}}]]);
const history={getAll:async()=>[{observationId:"hist-1",atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",provenance:{provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",retainedEvidenceId:"ev1",acquisition:{sellersTaskId:"task-1"}}}]};
const identity=new GovernedProviderIdentityResolver({historicalRepository:history,evidenceRepository:{getById:async id=>structuredClone(evidence.get(id)??null)}}),resolved=await identity.resolve("ram_corsair_cmk32gx5m2b6000z30");assert.equal(resolved.status,"REUSABLE");assert.equal(resolved.dataDocId,"doc-1");cases++;
assert.equal((await identity.resolve("ram_unseen")).status,"ABSENT");cases++;
const conflictEvidence=new Map(evidence);conflictEvidence.set("ev2",{evidenceId:"ev2",candidate:{marketEvidence:{provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",productEvidence:{dataDocId:"doc-2"},provenance:{sourceTaskId:"task-2"}}}});const conflict=new GovernedProviderIdentityResolver({historicalRepository:{getAll:async()=>[...(await history.getAll()),{observationId:"hist-2",atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",provenance:{provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",retainedEvidenceId:"ev2",acquisition:{sellersTaskId:"task-2"}}}]},evidenceRepository:{getById:async id=>conflictEvidence.get(id)}});assert.equal((await conflict.resolve("ram_corsair_cmk32gx5m2b6000z30")).status,"REVIEW_REQUIRED");cases++;

const root=await mkdtemp(join(tmpdir(),"hr-portfolio-production-"));try{
 const repository=new FileAcquisitionPortfolioRepository({rootPath:join(root,"portfolios")}),ledger={getAll:async()=>[{mode:"LIVE",startedAt:"2026-09-03T10:00:00.000Z",actualSpendUsd:.002}]},service=new ProductionAcquisitionPortfolioPrepareService({atlas:{products},rightsRegistry:defaultSourceRightsRegistry,providerIdentityResolver:identity,executionRepository:ledger,portfolioRepository:repository});
 const first=await service.prepare({asOf}),replay=await service.prepare({asOf});assert.equal(first.status,"PREPARED");assert.equal(replay.status,"DUPLICATE");assert.deepEqual(first.portfolio,replay.portfolio);cases++;
 assert.equal(first.portfolio.counts.canonicalProducts,103);assert.equal(first.portfolio.counts.eligible,11);assert.equal(first.portfolio.counts.excluded,92);cases++;
 assert.equal(first.portfolio.eligibleProducts.filter(x=>x.providerIdentityState==="REUSABLE").length,1);assert.equal(first.portfolio.taskEnvelope.products,10);cases++;
 assert.equal(first.portfolio.costEnvelope.currentUtcDaySpendUsd,.002);assert.equal(first.portfolio.costEnvelope.remainingUtcDayCapacityUsd,.008);cases++;
 assert.equal(first.portfolio.providerSpendAuthorized,false);assert.equal(first.portfolio.paidTaskCreated,false);assert.equal(first.report.products.find(x=>x.atlasProductId==="ram_corsair_cmk32gx5m2b6000z30").nextOperation,"SELLERS");cases++;
 const stored=JSON.parse(await readFile(first.artifactPath,"utf8"));assert.deepEqual(stored,first.portfolio);cases++;
 assert.equal((await service.validate(stored)).valid,true);cases++;
 const changed=structuredClone(first.portfolio);changed.actualSpendUsd=1;await assert.rejects(()=>repository.persist(changed),/IMMUTABLE_CONFLICT/);cases++;
 assert(!/password|credential|token/i.test(JSON.stringify(first)));cases++;
 const emptyEvidence=join(root,"evidence.json"),emptyHistory=join(root,"history.json"),emptyLedger=join(root,"ledger.json"),cliRoot=join(root,"cli");await writeFile(emptyEvidence,'{"version":"1.0","records":{},"idempotency":{}}\n');await writeFile(emptyHistory,'{"version":"1.0","sequence":0,"records":{},"idempotency":{}}\n');await writeFile(emptyLedger,'{"schemaVersion":"1.0","runs":[]}\n');
 const cli=spawnSync(process.execPath,["scripts/mercury-acquisition-portfolio-prepare.mjs",`--as-of=${asOf}`,`--evidence-state=${emptyEvidence}`,`--historical-state=${emptyHistory}`,`--execution-ledger=${emptyLedger}`,`--portfolio-state-root=${cliRoot}`],{cwd:new URL("../../..",import.meta.url),encoding:"utf8",env:{PATH:process.env.PATH}});assert.equal(cli.status,0,cli.stderr);assert.match(cli.stdout,/Provider calls performed: 0/);assert.match(cli.stdout,/Actual spend:\s+\$0\.000/);assert.doesNotMatch(cli.stdout,/password|credential|token/i);cases++;
 assert.equal((await new ProductRepository({readJson}).getAll()).length,103);cases++;
}finally{await rm(root,{recursive:true,force:true});}
assert.throws(()=>new ProductionAcquisitionPortfolioPrepareService({}),/OWNER_REQUIRED/);cases++;
console.log(`Production acquisition portfolio composition tests passed: ${cases} cases.`);
