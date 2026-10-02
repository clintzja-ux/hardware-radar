import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { RakutenDiskBoundedCatalogStateProjection } from "../current-display/index.js";
import { fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

const count=100_000,root=await mkdtemp(path.join(os.tmpdir(),"hardware-radar-disk-scale-"));
const stateRoot=path.join(root,".forge-review","rakuten-sftp","catalog-state"),artifactPath=path.join(root,"44583_4746097_mp.txt.gz");
await mkdir(stateRoot,{recursive:true});
async function* feed(){yield "HDR|44583|SANITIZED FIXTURE|09/01/2026 12:00:00\n";for(let index=0;index<count;index+=1)yield `${fixtureRow({productId:`P${index}`,sku:`SKU-${String(index).padStart(8,"0")}`,manufacturerPartNumber:`MPN-${index}`,retailPrice:`${100+(index%100)}.00`},{delta:false})}\n`;yield `TRL|${count}`;}
await pipeline(Readable.from(feed()),createGzip(),createWriteStream(artifactPath));
const hash=crypto.createHash("sha256");for await(const chunk of createReadStream(artifactPath))hash.update(chunk);
const baselineRss=process.memoryUsage().rss;let peakRss=baselineRss;const sampler=setInterval(()=>{peakRss=Math.max(peakRss,process.memoryUsage().rss);},10);
const projection=new RakutenDiskBoundedCatalogStateProjection({stateRoot}),started=performance.now();
const result=await projection.materializeFull({artifactPath,expected:{feedFamilyKey:"RAKUTEN_MAIN:44583:4746097",filename:"44583_4746097_mp.txt.gz",artifactDigest:hash.digest("hex"),headerTimestamp:"2026-09-01T12:00:00.000Z",fileSize:(await stat(artifactPath)).size,productRows:count,trailerCount:count}});
clearInterval(sampler);
assert.equal(result.manifest.recordCount,count);assert.ok(peakRss-baselineRss<256*1024*1024);assert.equal((await projection.extractBySkus({stateId:result.manifest.stateId,skus:["SKU-00000000","SKU-00099999"]})).length,2);
console.log(`Rakuten disk-bounded scale test passed: ${count} rows; RSS delta ${peakRss-baselineRss} bytes; ${Math.round(performance.now()-started)} ms.`);
await rm(root,{recursive:true,force:true});
