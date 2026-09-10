import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { StringDecoder } from "node:string_decoder";

export const RAKUTEN_MAX_PHYSICAL_RECORD_CHARACTERS = 1_048_576;

const RAKUTEN_APPENDIX_A_FIELD_NAMES = [
    "productId", "productName", "sku", "primaryCategory", "secondaryCategory",
    "productUrl", "productImageUrl", "buyUrl", "shortDescription", "longDescription",
    "discount", "discountType", "salePrice", "retailPrice", "beginDate", "endDate",
    "brand", "shipping", "keywords", "manufacturerPartNumber", "manufacturerName",
    "shippingInformation", "availability", "upc", "classId", "currency", "m1", "pixel",
    "attribute1", "attribute2", "attribute3", "attribute4", "attribute5", "attribute6",
    "attribute7", "attribute8", "attribute9", "attribute10"
];
export const RAKUTEN_PRODUCT_CATALOG_FIELD_MAP = Object.freeze(RAKUTEN_APPENDIX_A_FIELD_NAMES.map((name, arrayIndex) => Object.freeze({ rakutenFieldNumber: arrayIndex + 1, arrayIndex, name })));
export const RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS = Object.freeze(RAKUTEN_PRODUCT_CATALOG_FIELD_MAP.map(field => field.name));

const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const parserError=(code,properties={})=>Object.assign(new TypeError(code),{code,...properties});
const recognizedToken=text=>text.startsWith("HDR|")?"HDR":text.startsWith("TRL|")?"TRAILER":"PRODUCT";
const recordProperties=({physicalLineOrdinal,recordOrdinal,text})=>({physicalLineOrdinal,recordOrdinal,physicalRecordByteLength:Buffer.byteLength(text,"utf8"),recordClassification:recognizedToken(text),startsWithRecognizedRecordToken:text.startsWith("HDR|")||text.startsWith("TRL|")});

export async function* frameRakutenPhysicalRecords(input,{maxPhysicalRecordCharacters=RAKUTEN_MAX_PHYSICAL_RECORD_CHARACTERS}={}){
    if(!Number.isInteger(maxPhysicalRecordCharacters)||maxPhysicalRecordCharacters<1||maxPhysicalRecordCharacters>RAKUTEN_MAX_PHYSICAL_RECORD_CHARACTERS)throw parserError("RAKUTEN_RECORD_SIZE_LIMIT_INVALID");
    const decoder=new StringDecoder("utf8");let text="",physicalLineOrdinal=1,recordOrdinal=1,skipLfAfterCr=false;
    const properties=()=>recordProperties({physicalLineOrdinal,recordOrdinal,text});
    const append=character=>{text+=character;if(text.length>maxPhysicalRecordCharacters)throw parserError("RAKUTEN_PRODUCT_RECORD_TOO_LARGE",properties());};
    const complete=()=>{if(!text)return null;const value=freeze({text,...properties()});text="";recordOrdinal+=1;return value;};
    const chunks=(async function*(){for await(const chunk of input)yield decoder.write(chunk);const final=decoder.end();if(final)yield final;})();
    for await(const chunk of chunks){for(let index=0;index<chunk.length;index+=1){let character=chunk[index];
        if(skipLfAfterCr){skipLfAfterCr=false;if(character==="\n")continue;}
        if(character==="\r"||character==="\n"){
            const record=complete();physicalLineOrdinal+=1;if(character==="\r")skipLfAfterCr=true;if(record)yield record;continue;
        }
        append(character);
    }}
    const record=complete();if(record)yield record;
}

function parseRakutenPipeRecordDetailed(line,diagnostics={}) {
    if (typeof line !== "string") throw parserError("RAKUTEN_RECORD_INVALID");
    const fields = [];
    let value = "";
    let quoted = false;
    let atFieldStart = true;
    let delimiterCountOutsideQuotes=0,literalQuotesObserved=0,structuralQuotesObserved=0,fieldOrdinalAtQuoteOpen=null;
    const details=()=>({...diagnostics,delimiterCountOutsideQuotes,quoteStateAtFailure:quoted?"INSIDE_QUOTED_FIELD":"OUTSIDE_QUOTED_FIELD",fieldOrdinalAtQuoteOpen,literalQuotesObserved,structuralQuotesObserved});
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (quoted && character === '"') {
            if (line[index + 1] === '"') { value += '"'; index += 1; structuralQuotesObserved+=2; }
            else if (index + 1 === line.length || line[index + 1] === "|") { quoted = false; structuralQuotesObserved+=1; }
            else { value += character; literalQuotesObserved+=1; }
        } else if (!quoted && character === '"' && atFieldStart) { quoted = true; atFieldStart = false;fieldOrdinalAtQuoteOpen=fields.length+1;structuralQuotesObserved+=1; }
        else if (!quoted && character === "|") { fields.push(value); value = ""; atFieldStart = true;delimiterCountOutsideQuotes+=1; }
        else { value += character;atFieldStart = false;if(character==='"')literalQuotesObserved+=1; }
    }
    if (quoted) throw parserError("RAKUTEN_PRODUCT_QUOTE_UNTERMINATED",details());
    fields.push(value);
    return {fields,diagnostics:details()};
}

export function parseRakutenPipeRecord(line) { return parseRakutenPipeRecordDetailed(line).fields; }

function parseHeader(fields) {
    if (fields[0] !== "HDR" || fields.length !== 4 || !/^\d+$/.test(fields[1]) || !fields[2].trim()) throw parserError("RAKUTEN_HEADER_INVALID");
    if (!Number.isFinite(Date.parse(fields[3]))) throw parserError("RAKUTEN_HEADER_TIMESTAMP_INVALID");
    return freeze({ recordType: "HDR", advertiserMid:fields[1],advertiserName:fields[2],feedTimestamp: new Date(fields[3]).toISOString(), fields: fields.slice(1) });
}

function parseTrailer(fields) {
    if (fields[0] !== "TRL" || fields.length !== 2 || !/^\d+$/.test(fields[1])) throw parserError("RAKUTEN_TRAILER_INVALID");
    return freeze({ recordType: "TRL", productCount: Number(fields[1]), fields: fields.slice(1) });
}

function parseProduct(fields, diagnostics, feedProfile) {
    const supported = feedProfile === "NEWEGG_MKPL" ? [51] : feedProfile === "MAIN_FULL" ? [38] : feedProfile === "MAIN_DELTA" ? [39] : [38, 39];
    if (!supported.includes(fields.length)) throw parserError("RAKUTEN_PRODUCT_FIELD_COUNT_INVALID",{...diagnostics,observedFieldCount:fields.length});
    const record = Object.fromEntries(RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS.map((name, index) => [name, fields[index] || null]));
    record.profileFields = fields.length === 51 ? fields.slice(38, 50) : [];
    record.modification = [39, 51].includes(fields.length) ? fields.at(-1) || null : null;
    if (record.modification !== null && !["I", "U", "D"].includes(record.modification)) throw parserError("RAKUTEN_MODIFICATION_INVALID",{...diagnostics,observedFieldCount:fields.length});
    return freeze({ recordType: "PRODUCT", fieldCount: fields.length, lineNumber:diagnostics.recordOrdinal, physicalLineOrdinal:diagnostics.physicalLineOrdinal, ...record });
}

export async function* parseRakutenProductCatalogGzip(input, { feedProfile = "MAIN",maxPhysicalRecordCharacters=RAKUTEN_MAX_PHYSICAL_RECORD_CHARACTERS } = {}) {
    if (!(Buffer.isBuffer(input) || input?.[Symbol.asyncIterator] || input?.pipe)) throw parserError("RAKUTEN_GZIP_INPUT_INVALID");
    if (!["MAIN", "MAIN_FULL", "MAIN_DELTA", "NEWEGG_MKPL"].includes(feedProfile)) throw parserError("RAKUTEN_FEED_PROFILE_INVALID");
    const source = Buffer.isBuffer(input) ? Readable.from([input]) : input;
    const decompressed=source.pipe(createGunzip());
    let header = null;
    let trailer = null;
    let productCount = 0;
    let gzipOpened = false;
    try {
        for await (const framed of frameRakutenPhysicalRecords(decompressed,{maxPhysicalRecordCharacters})) {
            const line=framed.text,baseDiagnostics={physicalLineOrdinal:framed.physicalLineOrdinal,recordOrdinal:framed.recordOrdinal,physicalRecordByteLength:framed.physicalRecordByteLength,recordClassification:framed.recordClassification,startsWithRecognizedRecordToken:framed.startsWithRecognizedRecordToken,productRowOrdinal:productCount+1};
            gzipOpened = true;
            const parsed=parseRakutenPipeRecordDetailed(line,baseDiagnostics),fields=parsed.fields,diagnostics=parsed.diagnostics;
            if (!header) { header = parseHeader(fields); yield header; continue; }
            if(fields[0]==="HDR"||(/^[A-Z]{3}$/.test(fields[0])&&fields[0]!=="TRL"))throw parserError("RAKUTEN_RECORD_CLASSIFICATION_INVALID",{...diagnostics,recordClassification:"UNKNOWN"});
            if (fields[0] === "TRL") { if (trailer) throw parserError("RAKUTEN_TRAILER_DUPLICATE",diagnostics); trailer = parseTrailer(fields); continue; }
            if (trailer) throw parserError("RAKUTEN_RECORD_AFTER_TRAILER",diagnostics);
            const product = parseProduct(fields, diagnostics, feedProfile); productCount += 1; yield product;
        }
    } catch (error) {
        if (String(error?.message ?? "").startsWith("RAKUTEN_")){error.gzipOpened=error.gzipOpened??gzipOpened;error.gzipCompleted=error.gzipCompleted??false;if(header&&!trailer&&!Number.isInteger(error.productRowOrdinal))error.productRowOrdinal=productCount+1;throw error;}
        const truncated=error?.code==="Z_BUF_ERROR"||/unexpected end|unexpected eof/i.test(String(error?.message??""));
        throw parserError(truncated?"RAKUTEN_GZIP_TRUNCATED":"RAKUTEN_GZIP_INVALID",{gzipOpened,gzipCompleted:false});
    }
    if (!header) throw parserError("RAKUTEN_HEADER_MISSING",{gzipOpened,gzipCompleted:true});
    if (!trailer) throw parserError("RAKUTEN_TRAILER_MISSING",{productRowsParsed:productCount,gzipOpened,gzipCompleted:true});
    if (trailer.productCount !== productCount) throw parserError("RAKUTEN_TRAILER_COUNT_MISMATCH",{trailerCountObserved:trailer.productCount,productRowsParsed:productCount,gzipOpened,gzipCompleted:true});
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
    RAKUTEN_PRODUCT_FIELD_COUNT_INVALID:["SFTP_PRODUCT_FIELD_COUNT_INVALID","PRODUCT"],RAKUTEN_RECORD_QUOTE_INVALID:["SFTP_PRODUCT_ROW_INVALID","PRODUCT"],RAKUTEN_RECORD_INVALID:["SFTP_PRODUCT_ROW_INVALID","PRODUCT"],RAKUTEN_MODIFICATION_INVALID:["SFTP_PRODUCT_ROW_INVALID","PRODUCT"],RAKUTEN_PRODUCT_QUOTE_UNTERMINATED:["SFTP_PRODUCT_QUOTE_UNTERMINATED","PRODUCT"],RAKUTEN_PRODUCT_RECORD_TOO_LARGE:["SFTP_PRODUCT_RECORD_TOO_LARGE","PRODUCT"],RAKUTEN_RECORD_CLASSIFICATION_INVALID:["SFTP_PRODUCT_RECORD_UNKNOWN","PRODUCT"],
    RAKUTEN_TRAILER_MISSING:["SFTP_TRAILER_MISSING","TRAILER"],RAKUTEN_TRAILER_INVALID:["SFTP_TRAILER_INVALID","TRAILER"],RAKUTEN_TRAILER_DUPLICATE:["SFTP_TRAILER_INVALID","TRAILER"],RAKUTEN_RECORD_AFTER_TRAILER:["SFTP_TRAILER_INVALID","TRAILER"],RAKUTEN_TRAILER_COUNT_MISMATCH:["SFTP_TRAILER_COUNT_MISMATCH","COUNT"]
});

export async function validateRakutenProductCatalogGzip(input,options){
    const records=[];
    try{for await(const record of parseRakutenProductCatalogGzip(input,options))records.push(record);}
    catch(cause){
        const [code,integrityStage]=integrityMapping[cause?.code??cause?.message]??["SFTP_INTEGRITY_FAILED","UNKNOWN"],products=records.filter(item=>item.recordType==="PRODUCT"),header=records.find(item=>item.recordType==="HDR"),trailer=records.find(item=>item.recordType==="TRL");
        const integrity=freeze({status:"FAILED",integrityStage,rowsParsed:records.length,productRowsParsed:cause?.productRowsParsed??products.length,fieldCountsObserved:freeze([...new Set(products.map(item=>item.fieldCount))].sort((a,b)=>a-b)),rowOrdinal:Number.isInteger(cause?.recordOrdinal)?cause.recordOrdinal:null,physicalLineOrdinal:Number.isInteger(cause?.physicalLineOrdinal)?cause.physicalLineOrdinal:null,recordOrdinal:Number.isInteger(cause?.recordOrdinal)?cause.recordOrdinal:null,productRowOrdinal:Number.isInteger(cause?.productRowOrdinal)?cause.productRowOrdinal:null,physicalRecordByteLength:Number.isInteger(cause?.physicalRecordByteLength)?cause.physicalRecordByteLength:null,quoteStateAtFailure:cause?.quoteStateAtFailure??null,delimiterCountOutsideQuotes:Number.isInteger(cause?.delimiterCountOutsideQuotes)?cause.delimiterCountOutsideQuotes:null,quoteOpenedAtFieldBoundary:Number.isInteger(cause?.fieldOrdinalAtQuoteOpen),fieldOrdinalAtQuoteOpen:Number.isInteger(cause?.fieldOrdinalAtQuoteOpen)?cause.fieldOrdinalAtQuoteOpen:null,literalQuotesObserved:Number.isInteger(cause?.literalQuotesObserved)?cause.literalQuotesObserved:null,structuralQuotesObserved:Number.isInteger(cause?.structuralQuotesObserved)?cause.structuralQuotesObserved:null,recordClassification:cause?.recordClassification??null,startsWithRecognizedRecordToken:typeof cause?.startsWithRecognizedRecordToken==="boolean"?cause.startsWithRecognizedRecordToken:null,observedFieldCount:Number.isInteger(cause?.observedFieldCount)?cause.observedFieldCount:null,trailerCountObserved:Number.isInteger(cause?.trailerCountObserved)?cause.trailerCountObserved:trailer?.productCount??null,headerTimestampPresent:Boolean(header?.feedTimestamp),gzipOpened:cause?.gzipOpened??records.length>0,gzipCompleted:cause?.gzipCompleted??false});
        throw Object.assign(new Error(code),{code,integrity});
    }
    const products=records.filter(item=>item.recordType==="PRODUCT"),header=records.find(item=>item.recordType==="HDR"),trailer=records.find(item=>item.recordType==="TRL"),integrity=freeze({status:"PASS",integrityStage:"COMPLETE",rowsParsed:records.length,productRowsParsed:products.length,fieldCountsObserved:freeze([...new Set(products.map(item=>item.fieldCount))].sort((a,b)=>a-b)),rowOrdinal:null,observedFieldCount:null,trailerCountObserved:trailer.productCount,headerTimestampPresent:true,gzipOpened:true,gzipCompleted:true});
    return freeze({records,integrity});
}
