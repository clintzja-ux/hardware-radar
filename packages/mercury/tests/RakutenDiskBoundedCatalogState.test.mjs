import assert from "node:assert/strict";
import crypto from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { RakutenDiskBoundedCatalogStateProjection, collectRakutenProductCatalogFixture, projectRakutenCatalogState } from "../current-display/index.js";
import { fixtureFeedText, fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

const digest = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const family = "RAKUTEN_MAIN:44583:4746097";
const fullAt = "2026-09-01T12:00:00.000Z";
const deltaAt = "2026-09-02T12:00:00.000Z";
const base = { productUrl:"https://click.example.invalid/track", manufacturerPartNumber:"FIXTURE-MPN", currency:"USD", availability:"in-stock" };
let cases = 0;

const root = await mkdtemp(path.join(os.tmpdir(),"hardware-radar-disk-catalog-"));
const stateRoot = path.join(root,".forge-review","rakuten-sftp","catalog-state");
await mkdir(stateRoot,{recursive:true});
const fullPath = path.join(root,"44583_4746097_mp.txt.gz");
const deltaPath = path.join(root,"44583_4746097_mp_delta.txt.gz");
const fullRows = [
  fixtureRow({...base,productId:"P1",sku:"SKU-1",retailPrice:"100.00"},{delta:false}),
  fixtureRow({...base,productId:"P2",sku:"SKU-2",retailPrice:"200.00"},{delta:false}),
  fixtureRow({...base,productId:"P3",sku:"SKU-3",retailPrice:"300.00"},{delta:false})
];
const fullBytes = gzipSync(fixtureFeedText({timestamp:"09/01/2026 12:00:00",rows:fullRows}));
await writeFile(fullPath,fullBytes);
const projection = new RakutenDiskBoundedCatalogStateProjection({stateRoot});
const expected = {feedFamilyKey:family,filename:path.basename(fullPath),artifactDigest:digest(fullBytes),headerTimestamp:fullAt,remoteModifiedAt:"2026-09-01T12:05:00.000Z",fileSize:fullBytes.length,productRows:3,trailerCount:3};
const baseline = await projection.materializeFull({artifactPath:fullPath,expected});
assert.equal(baseline.status,"MATERIALIZED");assert.equal(baseline.manifest.recordCount,3);assert.equal(baseline.manifest.artifact.remoteModifiedAt,"2026-09-01T12:05:00.000Z");assert.equal((await projection.assessBaselineReadiness({feedFamilyKey:family})).classification,"BASELINE_READY");cases+=4;
const baselineReplay = await projection.materializeFull({artifactPath:fullPath,expected});
assert.equal(baselineReplay.status,"REPLAY_NO_CHANGE");assert.equal(baselineReplay.manifest.stateId,baseline.manifest.stateId);cases+=2;
const baselineTargets = await projection.extractBySkus({stateId:baseline.manifest.stateId,skus:["SKU-1","SKU-3","ABSENT"]});
assert.deepEqual(baselineTargets.map(item=>item.sku),["SKU-1","SKU-3"]);cases++;

const deltaRows = [
  fixtureRow({...base,productId:"P1",sku:"SKU-1",retailPrice:"110.00",modification:"U"}),
  fixtureRow({...base,productId:"P4",sku:"SKU-4",retailPrice:"400.00",modification:"I"}),
  fixtureRow({...base,productId:"P1",sku:"SKU-1",retailPrice:"120.00",modification:"U"}),
  fixtureRow({...base,productId:"P2",sku:"SKU-2",retailPrice:"200.00",modification:"D"})
];
const deltaBytes = gzipSync(fixtureFeedText({timestamp:"09/02/2026 12:00:00",rows:deltaRows}));
await writeFile(deltaPath,deltaBytes);
const delta = await projection.applyDelta({parentStateId:baseline.manifest.stateId,artifactPath:deltaPath,artifactDigest:digest(deltaBytes),headerTimestamp:deltaAt,remoteModifiedAt:"2026-09-01T11:00:00.000Z",feedFamilyKey:family});
assert.equal(delta.status,"MATERIALIZED");assert.equal(delta.manifest.parentStateId,baseline.manifest.stateId);assert.equal(delta.manifest.recordCount,3);assert.equal(delta.manifest.delta.remoteModifiedAt,"2026-09-01T11:00:00.000Z");assert.deepEqual(delta.manifest.delta.modifications,{I:1,U:2,D:1});cases+=5;
const after = await projection.extractBySkus({stateId:delta.manifest.stateId,skus:["SKU-1","SKU-2","SKU-3","SKU-4"]});
assert.equal(after.find(item=>item.sku==="SKU-1").record.retailPrice,"120.00");assert.equal(after.some(item=>item.sku==="SKU-2"),false);assert.deepEqual(after.map(item=>item.sku),["SKU-1","SKU-3","SKU-4"]);cases+=3;
const deltaReplay = await projection.applyDelta({parentStateId:baseline.manifest.stateId,artifactPath:deltaPath,artifactDigest:digest(deltaBytes),headerTimestamp:deltaAt,feedFamilyKey:family});
assert.equal(deltaReplay.status,"REPLAY_NO_CHANGE");assert.equal(deltaReplay.manifest.stateId,delta.manifest.stateId);cases+=2;

const parsedFull=(await collectRakutenProductCatalogFixture(fullBytes,{feedProfile:"MAIN_FULL"})).filter(item=>item.recordType==="PRODUCT");
const parsedDelta=(await collectRakutenProductCatalogFixture(deltaBytes,{feedProfile:"MAIN_DELTA"})).filter(item=>item.recordType==="PRODUCT");
const legacy=projectRakutenCatalogState({files:[{feedProfile:"MAIN_FULL",records:parsedFull},{feedProfile:"MAIN_DELTA",records:parsedDelta}]});
assert.deepEqual(after.map(item=>[item.productId,item.sku,item.record.retailPrice]).sort(),legacy.entries.map(item=>[item.record.productId,item.record.sku,item.record.retailPrice]).sort());cases++;
await assert.rejects(()=>projection.applyDelta({parentStateId:baseline.manifest.stateId,artifactPath:deltaPath,artifactDigest:digest(deltaBytes),headerTimestamp:deltaAt,feedFamilyKey:"RAKUTEN_MAIN:OTHER:4746097"}),/RAKUTEN_DELTA_LINEAGE_INVALID/);cases++;
await assert.rejects(()=>projection.applyDelta({parentStateId:baseline.manifest.stateId,artifactPath:deltaPath,artifactDigest:digest(deltaBytes),headerTimestamp:fullAt,feedFamilyKey:family}),/RAKUTEN_DELTA_ORDER_AMBIGUOUS/);cases++;
const protectedState={current:[{id:"current"}],history:[{id:"history"}],destinations:[{id:"destination"}]},protectedBefore=structuredClone(protectedState);
await projection.extractBySkus({stateId:delta.manifest.stateId,skus:["SKU-1"]});assert.deepEqual(protectedState,protectedBefore);cases++;
assert.equal((await readdir(stateRoot)).some(name=>name.includes(".partial-")),false);assert.ok((await stat(delta.statePath)).size>0);assert.equal(JSON.parse(await readFile(path.join(stateRoot,"current.json"),"utf8")).stateId,delta.manifest.stateId);cases+=3;
const badRoot=path.join(root,"bad");await mkdir(badRoot);const badPath=path.join(badRoot,"44583_4746097_mp.txt.gz"),badBytes=Buffer.from("not-a-gzip");await writeFile(badPath,badBytes);
await assert.rejects(()=>projection.materializeFull({artifactPath:badPath,expected:{...expected,artifactDigest:digest(badBytes),fileSize:badBytes.length}}));
assert.equal((await projection.getCurrent()).stateId,delta.manifest.stateId);assert.equal((await readdir(stateRoot)).some(name=>name.includes(".partial-")),false);cases+=3;

await rm(root,{recursive:true,force:true});
console.log(`Rakuten disk-bounded catalog-state tests passed: ${cases} cases.`);
