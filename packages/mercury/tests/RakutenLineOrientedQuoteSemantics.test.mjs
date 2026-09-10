import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { frameRakutenPhysicalRecords,parseRakutenPipeRecord,validateRakutenProductCatalogGzip } from "../current-display/index.js";
import { fixtureFeedText,fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;const gzip=text=>gzipSync(Buffer.from(text));
const literalTitleRow=value=>fixtureRow().replace("Sanitized RAM fixture",value);
const expect=async(input,code,check=()=>true)=>assert.rejects(()=>validateRakutenProductCatalogGzip(input),cause=>cause.code===code&&check(cause.integrity));
const frame=async chunks=>{const values=[];for await(const value of frameRakutenPhysicalRecords(Readable.from(chunks)))values.push(value);return values;};

for(const separator of ["\n","\r","\r\n"]){const text=fixtureFeedText({rows:[fixtureRow()]}).replaceAll("\n",separator),result=await validateRakutenProductCatalogGzip(gzip(text));assert.equal(result.integrity.productRowsParsed,1);assert.equal(result.records.at(-1).actualProductCount,1);cases++;}
assert.deepEqual(parseRakutenPipeRecord('one|"alpha|beta"|three'),["one","alpha|beta","three"]);cases++;
assert.deepEqual(parseRakutenPipeRecord('one|"alpha""beta"|three'),["one",'alpha"beta',"three"]);cases++;
for(const title of ['16GB "Gaming" Memory','15.6" Laptop Memory','3.5" Drive','John\'s "Pro Series']){const result=await validateRakutenProductCatalogGzip(gzip(fixtureFeedText({rows:[literalTitleRow(title),fixtureRow()]})));assert.equal(result.records[1].productName,title);assert.equal(result.integrity.productRowsParsed,2);cases++;}
assert.deepEqual(parseRakutenPipeRecord('abc"def|next'),['abc"def',"next"]);assert.deepEqual(parseRakutenPipeRecord('"abc|def"|next'),["abc|def","next"]);cases++;

const malformed=`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n${fixtureRow().replace("Sanitized RAM fixture",'"alpha|beta')}\n${fixtureRow()}\nTRL|2`,framed=await frame([malformed]);assert.equal(framed.length,4);assert.equal(framed[1].physicalLineOrdinal,2);assert.equal(framed[2].physicalLineOrdinal,3);assert.equal(framed[3].text,"TRL|2");await expect(gzip(malformed),"SFTP_PRODUCT_QUOTE_UNTERMINATED",value=>value.physicalLineOrdinal===2&&value.productRowOrdinal===1&&value.gzipCompleted===false);cases++;

const prefix=Array.from({length:256},(_,index)=>fixtureRow({productId:`fixture-prefix-${index}`})),suffix=Array.from({length:449},(_,index)=>fixtureRow({productId:`fixture-suffix-${index}`})),literalOpen=literalTitleRow('ordinary "literal'),literalClose=literalTitleRow('later" literal'),rows=[...prefix,literalOpen,...suffix,literalClose],large=await validateRakutenProductCatalogGzip(gzip(fixtureFeedText({rows})));assert.equal(large.integrity.productRowsParsed,707);assert.equal(large.records.at(-1).actualProductCount,707);assert.equal(large.records[257].productName,'ordinary "literal');assert.equal(large.records.at(-2).productName,'later" literal');cases++;
const fortyOne=["product-id",...Array.from({length:40},(_,index)=>`field-${index}`)].join("|");await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n${fortyOne}\nTRL|1`),"SFTP_PRODUCT_FIELD_COUNT_INVALID",value=>value.observedFieldCount===41&&value.physicalLineOrdinal===2);cases++;
const source=fixtureFeedText({rows:[literalTitleRow('16GB "Gaming" Memory'),fixtureRow({productName:"alpha | beta"})]}),whole=await validateRakutenProductCatalogGzip(gzip(source)),bytes=gzip(source),chunked=await validateRakutenProductCatalogGzip(Readable.from(Array.from(bytes,byte=>Buffer.from([byte]))));assert.deepEqual(chunked,whole);cases++;
await expect(gzip(`HDR|44583|SANITIZED FIXTURE|2026-09-08T12:00:00Z\n${fixtureRow().replace("Sanitized RAM fixture",'"private-title|still-open')}\nTRL|1`),"SFTP_PRODUCT_QUOTE_UNTERMINATED",value=>!JSON.stringify(value).includes("private-title")&&!JSON.stringify(value).includes("still-open"));cases++;

console.log(`RAKUTEN-SFTP-013 line-oriented quote semantics tests passed: ${cases} cases.`);
