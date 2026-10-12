import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileAtlasCatalogAdministrationRepository } from "../../atlas/index.js";
import { ForgeTrustedOperatorService } from "../operations/ForgeTrustedOperatorService.js";
import { FileForgeOperatorAuditRepository } from "../operations/FileForgeOperatorAuditRepository.js";

const repositoryRoot=path.resolve(fileURLToPath(new URL("../../..",import.meta.url))),root=await mkdtemp(path.join(os.tmpdir(),"forge-draft-activation-")),atlasRoot=path.join(root,"atlas"),auditPath=path.join(root,"audit.json"),id="ram_timetec_76tt26nus2r8_16gk2",at="2026-10-12T18:00:00.000Z";
try{
 await cp(path.join(repositoryRoot,"packages","atlas"),atlasRoot,{recursive:true,filter:source=>!source.includes(`${path.sep}tests`)});
 const activeCatalog=new FileAtlasCatalogAdministrationRepository({atlasRoot});
 assert.equal((await activeCatalog.assessDraftActivation(id)).status,"ALREADY_ACTIVE");
 const manifest=JSON.parse(await readFile(path.join(atlasRoot,"atlas-manifest.json"),"utf8")),entry=manifest.products.find(value=>value.atlasProductId===id),productPath=path.join(atlasRoot,entry.path),fixtureDraft=JSON.parse(await readFile(productPath,"utf8"));
 fixtureDraft.governance={...fixtureDraft.governance,lifecycleStatus:"DRAFT",publicationStatus:"PENDING",humanReviewRequired:true};
 await writeFile(productPath,`${JSON.stringify(fixtureDraft,null,2)}\n`);
 const catalog=new FileAtlasCatalogAdministrationRepository({atlasRoot}),audit=new FileForgeOperatorAuditRepository({statePath:auditPath}),destinations=[{destinationId:"mer_dest_fixture",atlasProductId:id,retailerId:"RETAILER-0004",retailerListingId:"0RM-006H-000A7",status:"ACTIVE"}],destinationRepository={getAll:async()=>structuredClone(destinations),retain:async()=>{throw new Error("NOT_USED");}},service=new ForgeTrustedOperatorService({catalogRepository:catalog,destinationRepository,affiliateOwner:{apply:async()=>{}},linkVerifier:{verify:async()=>{}},auditRepository:audit,identityDependencyInspector:async()=>[{type:"HISTORY_OBSERVATION",id}],now:()=>at}),context={authenticated:true,operatorId:"operator:fixture"};
 const readiness=await service.assessProductReadiness(context,id);assert.equal(readiness.status,"READY_TO_ACTIVATE");assert.equal(readiness.destinationReview.count,1);assert.equal(readiness.marketEvidence.dependencyCount,1);assert.equal(readiness.authority.publication,false);
 const prior=await catalog.getById(id),request={action:"ACTIVATE_PRODUCT",requestId:"activate-fixture-0001",confirmation:"CONFIRM ACTIVATE_PRODUCT",payload:{atlasProductId:id,expectedRevision:prior.identity.recordRevision}},result=await service.activateProduct(context,request);assert.equal(result.result.status,"ACTIVATED");
 const active=await catalog.getById(id);assert.equal(active.governance.lifecycleStatus,"ACTIVE");assert.equal(active.governance.publicationStatus,"READY");assert.equal(active.identity.manufacturerPartNumber,prior.identity.manufacturerPartNumber);assert.deepEqual(active.extension,prior.extension);assert.deepEqual(destinations,[{destinationId:"mer_dest_fixture",atlasProductId:id,retailerId:"RETAILER-0004",retailerListingId:"0RM-006H-000A7",status:"ACTIVE"}]);
 assert.equal((await service.activateProduct(context,request)).status,"ALREADY_COMPLETED");assert.equal((await audit.getAll()).filter(value=>value.action==="ACTIVATE_PRODUCT").length,1);assert.equal((await service.activationHistory(context,id)).length,1);
 await assert.rejects(()=>service.activateProduct(context,{...request,requestId:"activate-stale-0002",payload:{...request.payload,expectedRevision:prior.identity.recordRevision}}),/ALREADY_ACTIVE|STALE/);
 await assert.rejects(()=>service.activateProduct({authenticated:false},request),/UNAUTHORIZED/);
 assert.equal(JSON.parse(await readFile(path.join(atlasRoot,"atlas-manifest.json"),"utf8")).generatedAt,at);
 console.log("Forge governed DRAFT activation production-shaped tests passed.");
}finally{await rm(root,{recursive:true,force:true});}
