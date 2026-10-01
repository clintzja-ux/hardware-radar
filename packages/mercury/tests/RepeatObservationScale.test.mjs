import assert from "node:assert/strict";
import {mkdtemp,rm,stat} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {SqliteRepeatObservationRepository,createGoogleRepeatObservationIdentity,createRepeatObservationPreparation,createRepeatObservationAuthorization,defaultSourceRightsRegistry} from "../index.js";
const root=await mkdtemp(join(tmpdir(),"repeat-scale-")),databasePath=join(root,"scale.sqlite"),repository=new SqliteRepeatObservationRepository({databasePath}),rights=defaultSourceRightsRegistry.require("DATAFORSEO_GOOGLE_SHOPPING"),started=performance.now(),milestones={};
try{
 for(let index=0;index<10000;index++){
  const atlasProductId=`ram_scale_${String(index).padStart(5,"0")}`,observationCycle=new Date(Date.parse("2026-01-01T00:00:00.000Z")+index*1000).toISOString(),identity=createGoogleRepeatObservationIdentity({atlasProductId,state:"APPLICABLE",providerIdentity:{productId:`p${index}`,dataDocId:`d${index}`,gid:`g${index}`},identityReuseAssessmentId:`reuse-${index}`,contradictionStatus:"NONE"}),preparation=createRepeatObservationPreparation({atlasProductId,source:"DATAFORSEO_GOOGLE_SHOPPING",observationCycle,reusableIdentity:identity,rightsProfile:rights});await repository.recordPreparation(preparation);const authorization=createRepeatObservationAuthorization({preparation,operator:"scale-fixture",reason:"scale certification",authorizedAt:observationCycle,expiresAt:new Date(Date.parse(observationCycle)+60000).toISOString(),currentUtcDaySpendUsd:0});await repository.recordAuthorization(authorization);if([9,99,999,9999].includes(index))milestones[index+1]=Math.round(performance.now()-started);
 }
 const counts=repository.counts();assert.equal(counts.preparations,10000);assert.equal(counts.authorizations,10000);const target=repository.findPreparationByPaidActionIntent("mer_repeatintent_missing");assert.equal(target,null);const last=repository.findPreparationsByAcquisitionCycle("mer_repeatcycle_missing");assert.deepEqual(last,[]);const bytes=(await stat(databasePath)).size;assert.ok(bytes>0);assert.ok(bytes<100*1024*1024);console.log(`Repeat observation scale tests passed: 10=${milestones[10]}ms 100=${milestones[100]}ms 1000=${milestones[1000]}ms 10000=${milestones[10000]}ms rows=20000 dbBytes=${bytes}.`);
}finally{repository.close();await rm(root,{recursive:true,force:true});}
