import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";

export const RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS = Object.freeze([
    "productId", "productName", "sku", "primaryCategory", "secondaryCategories",
    "productUrl", "buyUrl", "shortDescription", "longDescription", "discount",
    "discountType", "salePrice", "retailPrice", "beginDate", "endDate", "brand",
    "shipping", "keywords", "manufacturerPartNumber", "manufacturerName",
    "shippingInformation", "availability", "upc", "classId", "currency",
    "attribute1", "attribute2", "attribute3", "attribute4", "attribute5",
    "attribute6", "attribute7", "attribute8", "attribute9", "attribute10",
    "attribute11", "attribute12", "attribute13"
]);

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const parserError=(code,properties={})=>Object.assign(new TypeError(code),{code,...properties});

export function parseRakutenPipeRecord(line) {
    if (typeof line !== "string") throw parserError("RAKUTEN_RECORD_INVALID");
    const fields = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
            if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
            else quoted = !quoted;
        } else if (character === "|" && !quoted) { fields.push(value); value = ""; }
        else value += character;
    }
    if (quoted) throw parserError("RAKUTEN_RECORD_QUOTE_INVALID");
    fields.push(value);
    return fields;
}

function parseHeader(fields) {
    if (fields[0] !== "HDR" || fields.length !== 4 || !/^\d+$/.test(fields[1]) || !fields[2].trim()) throw parserError("RAKUTEN_HEADER_INVALID");
    if (!Number.isFinite(Date.parse(fields[3]))) throw parserError("RAKUTEN_HEADER_TIMESTAMP_INVALID");
    return freeze({ recordType: "HDR", advertiserMid:fields[1],advertiserName:fields[2],feedTimestamp: new Date(fields[3]).toISOString(), fields: fields.slice(1) });
}

function parseTrailer(fields) {
    if (fields[0] !== "TRL" || fields.length !== 2 || !/^\d+$/.test(fields[1])) throw parserError("RAKUTEN_TRAILER_INVALID");
    return freeze({ recordType: "TRL", productCount: Number(fields[1]), fields: fields.slice(1) });
}

function parseProduct(fields, lineNumber, feedProfile) {
    const supported = feedProfile === "NEWEGG_MKPL" ? [51] : [38, 39];
    if (!supported.includes(fields.length)) throw parserError("RAKUTEN_PRODUCT_FIELD_COUNT_INVALID",{lineNumber,observedFieldCount:fields.length});
    const record = Object.fromEntries(RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS.map((name, index) => [name, fields[index] || null]));
    record.profileFields = fields.length === 51 ? fields.slice(38, 50) : [];
    record.modification = [39, 51].includes(fields.length) ? fields.at(-1) || null : null;
    if (record.modification !== null && !["I", "U", "D"].includes(record.modification)) throw parserError("RAKUTEN_MODIFICATION_INVALID",{lineNumber,observedFieldCount:fields.length});
    return freeze({ recordType: "PRODUCT", fieldCount: fields.length, lineNumber, ...record });
}

export async function* parseRakutenProductCatalogGzip(input, { feedProfile = "MAIN" } = {}) {
    if (!(Buffer.isBuffer(input) || input?.[Symbol.asyncIterator] || input?.pipe)) throw parserError("RAKUTEN_GZIP_INPUT_INVALID");
    if (!["MAIN", "NEWEGG_MKPL"].includes(feedProfile)) throw parserError("RAKUTEN_FEED_PROFILE_INVALID");
    const source = Buffer.isBuffer(input) ? Readable.from([input]) : input;
    const lines = createInterface({ input: source.pipe(createGunzip()), crlfDelay: Infinity });
    let header = null;
    let trailer = null;
    let productCount = 0;
    let lineNumber = 0;
    let gzipOpened = false;
    try {
        for await (const rawLine of lines) {
            lineNumber += 1;
            const line = rawLine.replace(/\r$/, "");
            if (!line) continue;
            gzipOpened = true;
            const fields = parseRakutenPipeRecord(line);
            if (!header) { header = parseHeader(fields); yield header; continue; }
            if (fields[0] === "TRL") { if (trailer) throw parserError("RAKUTEN_TRAILER_DUPLICATE",{lineNumber}); trailer = parseTrailer(fields); continue; }
            if (trailer) throw parserError("RAKUTEN_RECORD_AFTER_TRAILER",{lineNumber});
            const product = parseProduct(fields, lineNumber, feedProfile); productCount += 1; yield product;
        }
    } catch (error) {
        if (String(error?.message ?? "").startsWith("RAKUTEN_")){if(!error.lineNumber)error.lineNumber=lineNumber;error.gzipOpened=gzipOpened;error.gzipCompleted=false;throw error;}
        const truncated=error?.code==="Z_BUF_ERROR"||/unexpected end|unexpected eof/i.test(String(error?.message??""));
        throw parserError(truncated?"RAKUTEN_GZIP_TRUNCATED":"RAKUTEN_GZIP_INVALID",{lineNumber,gzipOpened,gzipCompleted:false});
    }
    if (!header) throw parserError("RAKUTEN_HEADER_MISSING",{lineNumber,gzipOpened,gzipCompleted:true});
    if (!trailer) throw parserError("RAKUTEN_TRAILER_MISSING",{lineNumber,productRowsParsed:productCount,gzipOpened,gzipCompleted:true});
    if (trailer.productCount !== productCount) throw parserError("RAKUTEN_TRAILER_COUNT_MISMATCH",{lineNumber,trailerCountObserved:trailer.productCount,productRowsParsed:productCount,gzipOpened,gzipCompleted:true});
    yield freeze({ ...trailer, actualProductCount: productCount });
}

export async function collectRakutenProductCatalogFixture(input, options) {
    const records = [];
    for await (const record of parseRakutenProductCatalogGzip(input, options)) records.push(record);
    return freeze(records);
}

const integrityMapping=Object.freeze({
    RAKUTEN_GZIP_INPUT_INVALID:["SFTP_GZIP_INVALID","GZIP"],RAKUTEN_GZIP_INVALID:["SFTP_GZIP_INVALID","GZIP"],RAKUTEN_GZIP_TRUNCATED:["SFTP_GZIP_TRUNCATED","GZIP"],
    RAKUTEN_HEADER_MISSING:["SFTP_HDR_INVALID","HDR"],RAKUTEN_HEADER_INVALID:["SFTP_HDR_INVALID","HDR"],RAKUTEN_HEADER_TIMESTAMP_INVALID:["SFTP_HDR_TIMESTAMP_INVALID","HDR"],
    RAKUTEN_PRODUCT_FIELD_COUNT_INVALID:["SFTP_PRODUCT_FIELD_COUNT_INVALID","PRODUCT"],RAKUTEN_RECORD_QUOTE_INVALID:["SFTP_PRODUCT_ROW_INVALID","PRODUCT"],RAKUTEN_RECORD_INVALID:["SFTP_PRODUCT_ROW_INVALID","PRODUCT"],RAKUTEN_MODIFICATION_INVALID:["SFTP_PRODUCT_ROW_INVALID","PRODUCT"],
    RAKUTEN_TRAILER_MISSING:["SFTP_TRAILER_MISSING","TRAILER"],RAKUTEN_TRAILER_INVALID:["SFTP_TRAILER_INVALID","TRAILER"],RAKUTEN_TRAILER_DUPLICATE:["SFTP_TRAILER_INVALID","TRAILER"],RAKUTEN_RECORD_AFTER_TRAILER:["SFTP_TRAILER_INVALID","TRAILER"],RAKUTEN_TRAILER_COUNT_MISMATCH:["SFTP_TRAILER_COUNT_MISMATCH","COUNT"]
});

export async function validateRakutenProductCatalogGzip(input,options){
    const records=[];
    try{for await(const record of parseRakutenProductCatalogGzip(input,options))records.push(record);}
    catch(cause){
        const [code,integrityStage]=integrityMapping[cause?.code??cause?.message]??["SFTP_INTEGRITY_FAILED","UNKNOWN"],products=records.filter(item=>item.recordType==="PRODUCT"),header=records.find(item=>item.recordType==="HDR"),trailer=records.find(item=>item.recordType==="TRL");
        const integrity=freeze({status:"FAILED",integrityStage,rowsParsed:records.length,productRowsParsed:cause?.productRowsParsed??products.length,fieldCountsObserved:freeze([...new Set(products.map(item=>item.fieldCount))].sort((a,b)=>a-b)),rowOrdinal:Number.isInteger(cause?.lineNumber)?cause.lineNumber:null,observedFieldCount:Number.isInteger(cause?.observedFieldCount)?cause.observedFieldCount:null,trailerCountObserved:Number.isInteger(cause?.trailerCountObserved)?cause.trailerCountObserved:trailer?.productCount??null,headerTimestampPresent:Boolean(header?.feedTimestamp),gzipOpened:cause?.gzipOpened??records.length>0,gzipCompleted:cause?.gzipCompleted??false});
        throw Object.assign(new Error(code),{code,integrity});
    }
    const products=records.filter(item=>item.recordType==="PRODUCT"),header=records.find(item=>item.recordType==="HDR"),trailer=records.find(item=>item.recordType==="TRL"),integrity=freeze({status:"PASS",integrityStage:"COMPLETE",rowsParsed:records.length,productRowsParsed:products.length,fieldCountsObserved:freeze([...new Set(products.map(item=>item.fieldCount))].sort((a,b)=>a-b)),rowOrdinal:null,observedFieldCount:null,trailerCountObserved:trailer.productCount,headerTimestampPresent:true,gzipOpened:true,gzipCompleted:true});
    return freeze({records,integrity});
}
