import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp,rm,writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { frameRakutenLogicalRecords,validateRakutenProductCatalogGzip } from "../current-display/index.js";
import { fixtureFeedText,fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;const gzip=text=>gzipSync(Buffer.from(text));
const expect=async(input,code,check=()=>true,options)=>assert.rejects(()=>validateRakutenProductCatalogGzip(input,options),cause=>cause.code===code&&check(cause.integrity));
const frames=async chunks=>{const values=[];for await(const value of frameRakutenLogicalRecords(Readable.from(chunks)))values.push(value);return values;};

const ordinary=await validateRakutenProductCatalogGzip(gzip(fixtureFeedText({rows:[fixtureRow({}, {delta:false})]})));assert.equal(ordinary.integrity.productRowsParsed,1);assert.equal(ordinary.records[1].fieldCount,38);assert.equal(ordinary.records[1].modification,null);cases++;
const complex="first\rsecond\nthird\r\nfour | with \"quoted\" value",multilineRow=fixtureRow({longDescription:complex}),multilineText=fixtureFeedText({rows:[multilineRow]}),multiline=await validateRakutenProductCatalogGzip(gzip(multilineText));assert.equal(multiline.records[1].longDescription,complex);assert.equal(multiline.records[1].fieldCount,39);assert.equal(multiline.records[1].logicalRecordPhysicalLineCount,4);assert.equal(multiline.records[1].lineNumber,2);assert.equal(multiline.records.at(-1).actualProductCount,1);cases++;
const quotedPipe=await validateRakutenProductCatalogGzip(gzip(fixtureFeedText({rows:[fixtureRow({productName:'pipe | and "escaped" quote'})]})));assert.equal(quotedPipe.records[1].productName,'pipe | and "escaped" quote');cases++;

const compressedMultiline=gzip(multilineText),chunked=await validateRakutenProductCatalogGzip(Readable.from(Array.from(compressedMultiline,byte=>Buffer.from([byte]))));assert.deepEqual(chunked.records,multiline.records);cases++;
const framedSource='one|"two""quoted\r\ncontinued"|three\r\nTRL|1',framed=await frames(["one|\"two",'""quoted',"\r","\ncontinued\"|three\r","\nTRL|1"]),characterChunked=await frames([...framedSource]);assert.equal(framed.length,2);assert.deepEqual(characterChunked,framed);assert.equal(framed[0].text,'one|"two""quoted\r\ncontinued"|three');assert.equal(framed[0].logicalRecordPhysicalLineCount,2);assert.equal(framed[1].text,"TRL|1");cases++;

await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n"private-product-secret\nstill-open`),"SFTP_PRODUCT_QUOTE_UNTERMINATED",value=>value.logicalRecordOrdinal===2&&value.productRowOrdinal===1&&value.logicalRecordPhysicalLineCount===2&&value.quoteStateAtFailure==="INSIDE_QUOTED_FIELD"&&value.observedFieldCount===null&&value.gzipCompleted===true&&!JSON.stringify(value).includes("private-product-secret"));cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n"${"x".repeat(200)}`),"SFTP_PRODUCT_RECORD_TOO_LARGE",value=>value.logicalRecordByteLength>128&&!JSON.stringify(value).includes("xxxxxxxxxx"),{maxLogicalRecordCharacters:128});cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\nABC|private-control-content\nTRL|0`),"SFTP_PRODUCT_RECORD_UNKNOWN",value=>value.recordClassification==="UNKNOWN"&&value.startsWithRecognizedRecordToken===false&&value.gzipCompleted===false&&!JSON.stringify(value).includes("private-control-content"));cases++;
const blanks=await validateRakutenProductCatalogGzip(gzip(`${fixtureFeedText({rows:[fixtureRow({longDescription:"line one\n\nline three"})]})}\n\n`));assert.equal(blanks.records[1].longDescription,"line one\n\nline three");assert.equal(blanks.records[1].logicalRecordPhysicalLineCount,3);assert.equal(blanks.records.at(-1).actualProductCount,1);cases++;
const root=await mkdtemp(path.join(os.tmpdir(),"hr-rakuten-framing-"));try{const file=path.join(root,"unterminated.gz");await writeFile(file,gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n"cli-private-payload\nstill-open`));const result=spawnSync(process.execPath,[path.resolve("scripts/rakuten-feed-validate.mjs"),file],{encoding:"utf8"});assert.equal(result.status,1);assert.match(result.stderr,/SFTP_PRODUCT_QUOTE_UNTERMINATED/);assert.match(result.stderr,/Physical line ordinal:/);assert.match(result.stderr,/Logical record ordinal:/);assert.match(result.stderr,/Quote state at failure:\s+INSIDE_QUOTED_FIELD/);assert.doesNotMatch(result.stderr,/cli-private-payload|still-open/);cases++;}finally{await rm(root,{recursive:true,force:true});}

console.log(`RAKUTEN-SFTP-012 logical record framing tests passed: ${cases} cases.`);
