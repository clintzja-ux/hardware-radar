import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {gzipSync} from "node:zlib";
import {classifyRakutenHeaderTimestampSyntax,collectRakutenProductCatalogFixture,diagnoseRakutenHeaderTimestampSemanticFailure,parseRakutenHeaderTimestampUtc,validateRakutenProductCatalogGzip} from "../current-display/index.js";
import {fixtureFeedText,fixtureRow} from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases=0;
const equal=(actual,expected)=>{assert.equal(actual,expected);cases+=1;};
const invalid=value=>equal(parseRakutenHeaderTimestampUtc(value),null);

equal(parseRakutenHeaderTimestampUtc("09/03/2022 00:02:32"),"2022-09-03T00:02:32.000Z");
equal(parseRakutenHeaderTimestampUtc("09/28/2026 23:41:07"),"2026-09-28T23:41:07.000Z");
equal(parseRakutenHeaderTimestampUtc("01/01/2026 00:00:00"),"2026-01-01T00:00:00.000Z");
equal(parseRakutenHeaderTimestampUtc("12/31/2026 23:59:59"),"2026-12-31T23:59:59.000Z");
equal(parseRakutenHeaderTimestampUtc("02/29/2024 12:34:56"),"2024-02-29T12:34:56.000Z");
for(const hour of ["0","1","9","00","01","09","10","23"]){const expected=`2026-09-29T${hour.padStart(2,"0")}:04:05.000Z`;equal(parseRakutenHeaderTimestampUtc(`09/29/2026 ${hour}:04:05`),expected);}
equal(parseRakutenHeaderTimestampUtc("09/29/2026 9:04:05"),parseRakutenHeaderTimestampUtc("09/29/2026 09:04:05"));
invalid("02/29/2026 12:00:00");
invalid("02/30/2026 12:00:00");
invalid("04/31/2026 12:00:00");
invalid("13/03/2026 12:00:00");
invalid("00/03/2026 12:00:00");
invalid("09/00/2026 12:00:00");
invalid("09/03/2026 24:00:00");
invalid("09/03/2026 12:60:00");
invalid("09/03/2026 12:00:60");
invalid("9/3/2026 12:00:00");
invalid("");
invalid("not-a-time");
invalid("2026-09-03T12:00:00Z");
invalid("Thu, 03 Sep 2026 12:00:00 GMT");
for(const value of ["09/29/2026 24:04:05","09/29/2026 25:04:05","09/29/2026 99:04:05","09/29/2026 000:04:05","09/29/2026 :04:05","09/29/2026 -1:04:05","09/29/2026 +1:04:05"]){invalid(value);}
for(const value of ["9/03/2022 00:02:32","09/3/2022 00:02:32","9/3/2022 00:02:32","09/03/2022 00:2:32","09/03/2022 00:02:3"]){assert.equal(classifyRakutenHeaderTimestampSyntax(value).componentCount,6);invalid(value);}
assert.doesNotMatch(parseRakutenHeaderTimestampUtc.toString(),/Date\.parse/);cases+=1;

const semanticCases=[
    ["13/03/2026 12:00:00",{failureComponent:"MONTH",failureReason:"MONTH_OUT_OF_RANGE",observedNumericValue:13}],
    ["09/00/2026 12:00:00",{failureComponent:"DAY",failureReason:"DAY_OUT_OF_RANGE",observedNumericValue:0}],
    ["09/32/2026 12:00:00",{failureComponent:"DAY",failureReason:"DAY_OUT_OF_RANGE",observedNumericValue:32}],
    ["09/03/2026 24:00:00",{failureComponent:"HOUR",failureReason:"HOUR_OUT_OF_RANGE",observedNumericValue:24}],
    ["09/03/2026 12:60:00",{failureComponent:"MINUTE",failureReason:"MINUTE_OUT_OF_RANGE",observedNumericValue:60}],
    ["09/03/2026 12:00:60",{failureComponent:"SECOND",failureReason:"SECOND_OUT_OF_RANGE",observedNumericValue:60}],
    ["02/30/2026 12:00:00",{failureComponent:"CALENDAR_DATE",failureReason:"INVALID_CALENDAR_DATE",observedNumericValue:null}],
    ["04/31/2026 12:00:00",{failureComponent:"CALENDAR_DATE",failureReason:"INVALID_CALENDAR_DATE",observedNumericValue:null}],
    ["02/29/2026 12:00:00",{failureComponent:"CALENDAR_DATE",failureReason:"INVALID_LEAP_DAY",observedNumericValue:null}]
];
for(const [value,expected] of semanticCases){const diagnostic=diagnoseRakutenHeaderTimestampSemanticFailure(value);assert.deepEqual(diagnostic,expected);assert.equal(JSON.stringify(diagnostic).includes(value),false);cases+=2;}
for(const value of ["09/03/2022 00:02:32","09/03/2022 0:02:32","9/03/2022 00:02:32","2026-09-03T12:00:00Z"]){equal(diagnoseRakutenHeaderTimestampSemanticFailure(value),null);}

const full=await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({timestamp:"09/28/2026 23:41:07",rows:[fixtureRow({}, {delta:false})]})),{feedProfile:"MAIN_FULL"});
equal(full[0].feedTimestamp,"2026-09-28T23:41:07.000Z");
equal(full[1].fieldCount,38);
equal(full.at(-1).actualProductCount,1);
const observedFull=await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({timestamp:"09/29/2026 9:04:05",rows:[fixtureRow({}, {delta:false})]})),{feedProfile:"MAIN_FULL"});
equal(observedFull[0].feedTimestamp,"2026-09-29T09:04:05.000Z");equal(observedFull[1].fieldCount,38);equal(observedFull.at(-1).actualProductCount,1);

const delta=await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({timestamp:"09/28/2026 23:41:07",rows:[fixtureRow()]})),{feedProfile:"MAIN_DELTA"});
equal(delta[0].feedTimestamp,"2026-09-28T23:41:07.000Z");
equal(delta[1].fieldCount,39);
equal(delta[1].modification,"U");
const observedDelta=await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({timestamp:"09/29/2026 9:04:05",rows:[fixtureRow()]})),{feedProfile:"MAIN_DELTA"});
equal(observedDelta[0].feedTimestamp,"2026-09-29T09:04:05.000Z");equal(observedDelta[1].fieldCount,39);equal(observedDelta[1].modification,"U");

const moduleUrl=new URL("../current-display/RakutenProductCatalogParser.js",import.meta.url).href,child=`import {parseRakutenHeaderTimestampUtc as parse} from ${JSON.stringify(moduleUrl)};process.stdout.write(JSON.stringify([parse("09/03/2022 00:02:32"),parse("09/03/2022 0:02:32")]));`;
const utc=spawnSync(process.execPath,["--input-type=module","-e",child],{encoding:"utf8",env:{...process.env,TZ:"UTC"}}),jamaica=spawnSync(process.execPath,["--input-type=module","-e",child],{encoding:"utf8",env:{...process.env,TZ:"America/Jamaica"}}),tokyo=spawnSync(process.execPath,["--input-type=module","-e",child],{encoding:"utf8",env:{...process.env,TZ:"Asia/Tokyo"}});
equal(utc.status,0);equal(jamaica.status,0);equal(tokyo.status,0);equal(utc.stdout,jamaica.stdout);equal(utc.stdout,tokyo.stdout);equal(utc.stdout,JSON.stringify(["2022-09-03T00:02:32.000Z","2022-09-03T00:02:32.000Z"]));

await assert.rejects(()=>validateRakutenProductCatalogGzip(gzipSync(fixtureFeedText({timestamp:"2026-09-03T12:00:00Z",rows:[fixtureRow()]}))),error=>error.code==="SFTP_HDR_TIMESTAMP_INVALID"&&error.integrity.unsupportedTimestampDiagnostic.hdr.timestampAccepted===false&&error.integrity.unsupportedTimestampDiagnostic.hdr.timestampSemanticFailure===null&&error.integrity.unsupportedTimestampDiagnostic.gzip.reachedEof===true&&error.integrity.unsupportedTimestampDiagnostic.trailer.productCountMatches===true);cases+=1;
await assert.rejects(()=>validateRakutenProductCatalogGzip(gzipSync(fixtureFeedText({timestamp:"09/03/2026 24:00:00",rows:[fixtureRow()]}))),error=>{const d=error.integrity.unsupportedTimestampDiagnostic,s=JSON.stringify(error);return error.code==="SFTP_HDR_TIMESTAMP_INVALID"&&d.hdr.timestampAccepted===false&&d.hdr.timestampSemanticFailure.failureComponent==="HOUR"&&d.hdr.timestampSemanticFailure.failureReason==="HOUR_OUT_OF_RANGE"&&d.hdr.timestampSemanticFailure.observedNumericValue===24&&d.gzip.reachedEof===true&&d.trailer.productCountMatches===true&&!s.includes("09/03/2026 24:00:00")&&!s.includes("fixture-product");});cases+=1;

console.log(`Rakuten HDR UTC timestamp contract tests passed: ${cases} cases.`);
