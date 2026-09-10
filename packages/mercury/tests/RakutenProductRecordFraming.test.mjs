import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { frameRakutenPhysicalRecords,validateRakutenProductCatalogGzip } from "../current-display/index.js";
import { fixtureFeedText,fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;const gzip=text=>gzipSync(Buffer.from(text));
const expect=async(input,code,check=()=>true,options)=>assert.rejects(()=>validateRakutenProductCatalogGzip(input,options),cause=>cause.code===code&&check(cause.integrity));
const frames=async chunks=>{const values=[];for await(const value of frameRakutenPhysicalRecords(Readable.from(chunks)))values.push(value);return values;};

const ordinary=await validateRakutenProductCatalogGzip(gzip(fixtureFeedText({rows:[fixtureRow({}, {delta:false})]})));assert.equal(ordinary.records[1].fieldCount,38);assert.equal(ordinary.records[1].modification,null);cases++;
const delta=await validateRakutenProductCatalogGzip(gzip(fixtureFeedText({rows:[fixtureRow({productName:"pipe | value"})]})));assert.equal(delta.records[1].fieldCount,39);assert.equal(delta.records[1].productName,"pipe | value");cases++;
const physical=await frames(["one|\"two",'""quoted',"\r","\ncontinued|three\r","\nTRL|2"]);assert.deepEqual(physical.map(value=>value.text),['one|"two""quoted',"continued|three","TRL|2"]);assert.deepEqual(physical.map(value=>value.physicalLineOrdinal),[1,2,3]);cases++;
const compressed=gzip(fixtureFeedText({rows:[fixtureRow()]})),chunked=await validateRakutenProductCatalogGzip(Readable.from(Array.from(compressed,byte=>Buffer.from([byte]))));assert.deepEqual(chunked,await validateRakutenProductCatalogGzip(compressed));cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n"private-secret\n${fixtureRow()}\nTRL|2`),"SFTP_PRODUCT_QUOTE_UNTERMINATED",value=>value.physicalLineOrdinal===2&&value.productRowOrdinal===1&&value.quoteStateAtFailure==="INSIDE_QUOTED_FIELD"&&value.gzipCompleted===false&&!JSON.stringify(value).includes("private-secret"));cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n${"x".repeat(200)}\nTRL|1`),"SFTP_PRODUCT_RECORD_TOO_LARGE",value=>value.physicalRecordByteLength>128&&!JSON.stringify(value).includes("xxxxxxxxxx"),{maxPhysicalRecordCharacters:128});cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\nABC|private-control-content\nTRL|0`),"SFTP_PRODUCT_RECORD_UNKNOWN",value=>value.recordClassification==="UNKNOWN"&&!JSON.stringify(value).includes("private-control-content"));cases++;
const blanks=await validateRakutenProductCatalogGzip(gzip(`\n${fixtureFeedText({rows:[fixtureRow()]})}\n\n`));assert.equal(blanks.records[1].fieldCount,39);assert.equal(blanks.records.at(-1).actualProductCount,1);cases++;

console.log(`RAKUTEN-SFTP-012 line-framing supersession compatibility tests passed: ${cases} cases.`);
