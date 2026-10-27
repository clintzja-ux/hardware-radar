import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ForgeTrustedOperatorService } from "../index.js";
import { deriveAtlasRamProductId } from "../../atlas/index.js";

const at="2026-10-12T12:00:00.000Z",fixture=JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json",import.meta.url),"utf8"));
fixture.governance.lifecycleStatus="DRAFT";fixture.governance.publicationStatus="PENDING";fixture.identity.recordRevision=1;
let stored=structuredClone(fixture),destinations=[],dependencies=[],audits=[];
const catalog={getAll:async()=>[structuredClone(stored)],getById:async id=>id===stored.identity.atlasProductId?structuredClone(stored):null,correctDraftIdentity:async({priorAtlasProductId,product,expectedRevision})=>{assert.equal(priorAtlasProductId,stored.identity.atlasProductId);assert.equal(expectedRevision,stored.identity.recordRevision);stored=structuredClone(product);return{status:"IDENTITY_CORRECTED",priorAtlasProductId,atlasProductId:stored.identity.atlasProductId,recordRevision:stored.identity.recordRevision};}};
const service=new ForgeTrustedOperatorService({catalogRepository:catalog,destinationRepository:{getAll:async()=>structuredClone(destinations),retain:async()=>{}},affiliateOwner:{apply:async()=>{}},linkVerifier:{verify:async()=>{}},identityDependencyInspector:async()=>structuredClone(dependencies),auditRepository:{getAll:async()=>structuredClone(audits),record:async record=>{const saved={...record,auditId:`audit-${audits.length+1}`};audits.push(saved);return{record:saved};}},now:()=>at});
const context={authenticated:true,operatorId:"operator:fixture"},request=(id,overrides={})=>({action:"CORRECT_DRAFT_IDENTITY",requestId:id,confirmation:"CONFIRM CORRECT_DRAFT_IDENTITY",payload:{atlasProductId:stored.identity.atlasProductId,correctedManufacturerPartNumber:"CMK32GX5M2B6000C30-CORRECTED",manufacturerEvidenceUrl:"https://manufacturer.example/corrected",expectedRevision:stored.identity.recordRevision,...overrides}});

destinations=[{destinationId:"destination-1",atlasProductId:stored.identity.atlasProductId}];
await assert.rejects(()=>service.correctDraftIdentity(context,request("request-bound-0001")),/DEPENDENCIES_BLOCK/);assert.equal(stored.identity.atlasProductId,fixture.identity.atlasProductId);
destinations=[];dependencies=[{type:"CURRENT_OBSERVATION",id:stored.identity.atlasProductId}];
await assert.rejects(()=>service.correctDraftIdentity(context,request("request-current-001")),/DEPENDENCIES_BLOCK/);
dependencies=[];const result=await service.correctDraftIdentity(context,request("request-success-001"));
assert.equal(result.result.status,"IDENTITY_CORRECTED");assert.equal(stored.identity.atlasProductId,deriveAtlasRamProductId(stored.identity));assert.equal(stored.identity.recordRevision,2);assert.equal(stored.provenance.fieldSources["identity.manufacturerPartNumber"].length,fixture.provenance.fieldSources["identity.manufacturerPartNumber"].length+1);assert.equal(audits.length,1);
const replay=await service.correctDraftIdentity(context,{...request("request-success-001",{atlasProductId:fixture.identity.atlasProductId,expectedRevision:1}),payload:{atlasProductId:fixture.identity.atlasProductId,correctedManufacturerPartNumber:"CMK32GX5M2B6000C30-CORRECTED",manufacturerEvidenceUrl:"https://manufacturer.example/corrected",expectedRevision:1}});assert.equal(replay.status,"ALREADY_COMPLETED");
stored.governance.lifecycleStatus="ACTIVE";stored.governance.publicationStatus="READY";await assert.rejects(()=>service.correctDraftIdentity(context,request("request-active-0001",{correctedManufacturerPartNumber:"OTHER"})),/REQUIRES_DRAFT/);
console.log("Forge governed DRAFT identity correction tests passed.");
