import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createGzip, gzipSync } from "node:zlib";
import { validateRakutenProductCatalogGzip } from "../current-display/index.js";
import { fixtureFeedText, fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;
const count=100_000,targetSku="N82E16829999999";
async function* largeText({truncate=false,duplicate=false}={}){
  yield "HDR|44583|SANITIZED FIXTURE|10/01/2026 12:00:00\n";
  for(let index=0;index<count;index+=1){const sku=index===count-1?targetSku:duplicate&&index===count-2?targetSku:`N82E${String(index).padStart(8,"0")}`;yield `${fixtureRow({productId:`fixture-${index}`,sku}, {delta:false})}\n`;}
  if(!truncate)yield `TRL|${count}`;
}
const compressed=options=>Readable.from(largeText(options)).pipe(createGzip());
const before=process.memoryUsage().heapUsed,result=await validateRakutenProductCatalogGzip(compressed(),{feedProfile:"MAIN_FULL",collectRecords:false,targetSkus:[targetSku]}),after=process.memoryUsage().heapUsed;
assert.equal(result.records.length,0);assert.equal(result.integrity.productRowsParsed,count);assert.equal(result.summary.targetRecords.length,1);assert.equal(result.summary.targetRecords[0].sku,targetSku);assert.ok(after-before<256*1024*1024);cases+=5;
await assert.rejects(()=>validateRakutenProductCatalogGzip(compressed({truncate:true}),{feedProfile:"MAIN_FULL",collectRecords:false}),error=>error.code==="SFTP_TRAILER_MISSING"&&error.integrity.productRowsParsed===count);cases++;
const duplicate=await validateRakutenProductCatalogGzip(compressed({duplicate:true}),{feedProfile:"MAIN_FULL",collectRecords:false,targetSkus:[targetSku]});assert.equal(duplicate.summary.targetRecords.length,2);cases++;
const small=gzipSync(fixtureFeedText({rows:[fixtureRow({}, {delta:false})]})),legacy=await validateRakutenProductCatalogGzip(small,{feedProfile:"MAIN_FULL"}),streamed=await validateRakutenProductCatalogGzip(Readable.from([small]),{feedProfile:"MAIN_FULL",collectRecords:false});assert.deepEqual(streamed.integrity,legacy.integrity);assert.deepEqual(streamed.summary.header,legacy.records[0]);assert.equal(streamed.summary.trailer.actualProductCount,legacy.records.at(-1).actualProductCount);cases+=3;
console.log(`Rakuten memory-bounded validation tests passed: ${cases} cases; ${count} rows; heap delta ${Math.max(0,after-before)} bytes.`);
