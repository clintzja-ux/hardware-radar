import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp,rm,writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { validateRakutenProductCatalogGzip } from "../current-display/index.js";
import { fixtureFeedText,fixtureRow,sanitizedCases } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;const gzip=text=>gzipSync(Buffer.from(text));
const validText=fixtureFeedText({rows:[sanitizedCases.insertedRam,sanitizedCases.quotedPipe,sanitizedCases.deletedRam]}),valid=await validateRakutenProductCatalogGzip(gzip(`${validText.replaceAll("\n","\r\n")}\r\n\r\n`));
assert.equal(valid.integrity.status,"PASS");assert.equal(valid.integrity.integrityStage,"COMPLETE");assert.equal(valid.integrity.productRowsParsed,3);assert.deepEqual(valid.integrity.fieldCountsObserved,[39]);assert.equal(valid.records[0].advertiserMid,"44583");assert.equal(valid.records[0].advertiserName,"SANITIZED FIXTURE");cases++;

const expect=async(input,code,stage,check=()=>true)=>assert.rejects(()=>validateRakutenProductCatalogGzip(input),cause=>cause.code===code&&cause.integrity.integrityStage===stage&&check(cause.integrity));
const compressed=gzip(validText);await expect(compressed.subarray(0,compressed.length-8),"SFTP_GZIP_TRUNCATED","GZIP",value=>value.gzipCompleted===false);cases++;
await expect(gzip(`BAD|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\nTRL|0`),"SFTP_HDR_INVALID","HDR",value=>value.gzipOpened===true&&value.gzipCompleted===false);cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|not-a-time\nTRL|0`),"SFTP_HDR_TIMESTAMP_INVALID","HDR");cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\ntoo|few\nTRL|1`),"SFTP_PRODUCT_FIELD_COUNT_INVALID","PRODUCT",value=>value.rowOrdinal===2&&value.observedFieldCount===2&&!JSON.stringify(value).includes("too"));cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n"unterminated|field\nTRL|1`),"SFTP_PRODUCT_ROW_INVALID","PRODUCT",value=>value.rowOrdinal===2);cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n${fixtureRow()}`),"SFTP_TRAILER_MISSING","TRAILER",value=>value.productRowsParsed===1&&value.gzipCompleted===true);cases++;
await expect(gzip(fixtureFeedText({rows:[fixtureRow()],trailerCount:2})),"SFTP_TRAILER_COUNT_MISMATCH","COUNT",value=>value.trailerCountObserved===2&&value.productRowsParsed===1);cases++;
await expect(Buffer.from("not gzip"),"SFTP_GZIP_INVALID","GZIP");cases++;

const root=await mkdtemp(path.join(os.tmpdir(),"hr-rakuten-integrity-"));
try{const validPath=path.join(root,"fixture.gz"),badPath=path.join(root,"bad.gz");await writeFile(validPath,compressed);await writeFile(badPath,Buffer.from("not gzip"));const script=path.resolve("scripts/rakuten-feed-validate.mjs"),success=spawnSync(process.execPath,[script,validPath,"--reported-bytes=999"],{encoding:"utf8"});assert.equal(success.status,0);assert.match(success.stdout,/Result:\s+PASS/);assert.match(success.stdout,/Size difference bytes:/);assert.doesNotMatch(success.stdout,/Sanitized RAM|fixture-insert|productUrl/);const failure=spawnSync(process.execPath,[script,badPath],{encoding:"utf8"});assert.equal(failure.status,1);assert.match(failure.stderr,/SFTP_GZIP_INVALID/);assert.match(failure.stderr,/Integrity stage:\s+GZIP/);assert.doesNotMatch(failure.stderr,/not gzip/);cases++;}finally{await rm(root,{recursive:true,force:true});}

console.log(`RAKUTEN-SFTP-011 integrity diagnostic tests passed: ${cases} cases.`);
