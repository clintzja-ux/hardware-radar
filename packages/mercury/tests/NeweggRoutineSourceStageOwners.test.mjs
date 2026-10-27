import assert from "node:assert/strict";
import crypto from "node:crypto";
import {mkdir,mkdtemp,rm,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {gzipSync} from "node:zlib";
import {RakutenDiskBoundedCatalogStateProjection} from "../current-display/index.js";
import {bindProductionNeweggRoutineSourceOwners,FileNeweggSourceStageReceiptRepository} from "../index.js";
import {fixtureFeedText,fixtureRow} from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";
const root=await mkdtemp(path.join(os.tmpdir(),"newegg-source-owners-"));
try{
 const stateRoot=path.join(root,".forge-review","rakuten-sftp","catalog-state"),receiptRoot=path.join(root,"receipts");await mkdir(stateRoot,{recursive:true});
 const bytes=gzipSync(fixtureFeedText({timestamp:"12/10/2026 10:00:00",rows:[fixtureRow({productId:"P1",sku:"SKU-1"},{delta:false})]})),artifactPath=path.join(root,"44583_4746097_mp.txt.gz"),digest=crypto.createHash("sha256").update(bytes).digest("hex"),observedAt="2026-10-12T10:00:00.000Z";await writeFile(artifactPath,bytes);
 let providerCalls=0;const transport={downloadFullAndValidate:async()=>{providerCalls+=1;throw new Error("LIVE_PROVIDER_FORBIDDEN");}},projection=new RakutenDiskBoundedCatalogStateProjection({stateRoot}),owners=bindProductionNeweggRoutineSourceOwners({owners:{PREFLIGHT:{preserved:true}},transport,projection,receiptRoot}),input={lineage:{artifactDigest:digest,sourceObservedAt:observedAt},retainedArtifact:{path:artifactPath,digest,observedAt,bytes:bytes.length,productRows:1,trailerCount:1,filename:path.basename(artifactPath)},stageAuthorities:{ACQUISITION:{liveAcquisitionAuthorized:false}}};
 const acquisition=await owners.ACQUISITION.executionOwner.execute({mode:"RETAINED_EVIDENCE",input,priorResults:{}}),priorResults={ACQUISITION:{canonicalReceipt:acquisition.receipt}};assert.equal(providerCalls,0);assert.equal((await owners.ACQUISITION.receiptOwner.resolve({input})).state,"COMPLETED");
 const validation=await owners.VALIDATION.executionOwner.execute({input,priorResults}),withValidation={...priorResults,VALIDATION:{canonicalReceipt:validation.receipt}};assert.equal(validation.receipt.outputArtifact.productRows,1);assert.equal((await owners.VALIDATION.receiptOwner.resolve({input})).state,"COMPLETED");
 const catalog=await owners.CATALOG.executionOwner.execute({input,priorResults:withValidation});assert.equal(catalog.receipt.outputArtifact.recordCount,1);assert.equal((await owners.CATALOG.receiptOwner.resolve({input})).state,"COMPLETED");
 const replay=await owners.CATALOG.executionOwner.execute({input,priorResults:withValidation});assert.equal(replay.status,"REPLAY");assert.equal(providerCalls,0);
 const receipts=new FileNeweggSourceStageReceiptRepository({root:receiptRoot});assert.equal((await receipts.read("ACQUISITION",digest)).artifactDigest,digest);
 const operationId="mer_newegglive_fixture",bootstrapAuthority={status:"COMPLETED",acquisitionId:operationId,artifactDigest:digest,sourceObservedAt:observedAt},bootstrapArtifact={...input.retainedArtifact,operationId},productionInput={...input,operationId,bootstrapAcquisition:bootstrapArtifact,bootstrapAcquisitionAuthority:bootstrapAuthority};
 assert.equal(await owners.ACQUISITION.authorityOwner.validate({context:{mode:"PRODUCTION",input:productionInput}}),true);
 assert.equal(await owners.ACQUISITION.authorityOwner.validate({context:{mode:"PRODUCTION",input:{...productionInput,bootstrapAcquisitionAuthority:{...bootstrapAuthority,artifactDigest:"f".repeat(64)}}}}),false);
 assert.equal(await owners.ACQUISITION.authorityOwner.validate({context:{mode:"PRODUCTION",input:{...productionInput,operationId:"different-operation"}}}),false);
 await assert.rejects(owners.VALIDATION.executionOwner.execute({input:{...input,retainedArtifact:{...input.retainedArtifact,digest:"0".repeat(64)}},priorResults}),/INTEGRITY_FAILED/);
 console.log("Newegg routine acquisition/validation/catalog owners passed: 14 cases.");
}finally{await rm(root,{recursive:true,force:true});}
