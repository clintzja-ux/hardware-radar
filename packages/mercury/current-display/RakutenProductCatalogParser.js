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

export function parseRakutenPipeRecord(line) {
    if (typeof line !== "string") throw new TypeError("RAKUTEN_RECORD_INVALID");
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
    if (quoted) throw new TypeError("RAKUTEN_RECORD_QUOTE_INVALID");
    fields.push(value);
    return fields;
}

function parseHeader(fields) {
    if (fields[0] !== "HDR" || fields.length < 2 || !Number.isFinite(Date.parse(fields[1]))) throw new TypeError("RAKUTEN_HEADER_INVALID");
    return freeze({ recordType: "HDR", feedTimestamp: new Date(fields[1]).toISOString(), fields: fields.slice(1) });
}

function parseTrailer(fields) {
    if (fields[0] !== "TRL" || fields.length < 2 || !/^\d+$/.test(fields[1])) throw new TypeError("RAKUTEN_TRAILER_INVALID");
    return freeze({ recordType: "TRL", productCount: Number(fields[1]), fields: fields.slice(1) });
}

function parseProduct(fields, lineNumber, feedProfile) {
    const supported = feedProfile === "NEWEGG_MKPL" ? [51] : [38, 39];
    if (!supported.includes(fields.length)) throw new TypeError(`RAKUTEN_PRODUCT_FIELD_COUNT_INVALID:${lineNumber}`);
    const record = Object.fromEntries(RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS.map((name, index) => [name, fields[index] || null]));
    record.profileFields = fields.length === 51 ? fields.slice(38, 50) : [];
    record.modification = [39, 51].includes(fields.length) ? fields.at(-1) || null : null;
    if (record.modification !== null && !["I", "U", "D"].includes(record.modification)) throw new TypeError(`RAKUTEN_MODIFICATION_INVALID:${lineNumber}`);
    return freeze({ recordType: "PRODUCT", fieldCount: fields.length, lineNumber, ...record });
}

export async function* parseRakutenProductCatalogGzip(input, { feedProfile = "MAIN" } = {}) {
    if (!(Buffer.isBuffer(input) || input?.[Symbol.asyncIterator] || input?.pipe)) throw new TypeError("RAKUTEN_GZIP_INPUT_INVALID");
    if (!["MAIN", "NEWEGG_MKPL"].includes(feedProfile)) throw new TypeError("RAKUTEN_FEED_PROFILE_INVALID");
    const source = Buffer.isBuffer(input) ? Readable.from([input]) : input;
    const lines = createInterface({ input: source.pipe(createGunzip()), crlfDelay: Infinity });
    let header = null;
    let trailer = null;
    let productCount = 0;
    let lineNumber = 0;
    try {
        for await (const rawLine of lines) {
            lineNumber += 1;
            const line = rawLine.replace(/\r$/, "");
            if (!line) continue;
            const fields = parseRakutenPipeRecord(line);
            if (!header) { header = parseHeader(fields); yield header; continue; }
            if (fields[0] === "TRL") { if (trailer) throw new TypeError("RAKUTEN_TRAILER_DUPLICATE"); trailer = parseTrailer(fields); continue; }
            if (trailer) throw new TypeError("RAKUTEN_RECORD_AFTER_TRAILER");
            const product = parseProduct(fields, lineNumber, feedProfile); productCount += 1; yield product;
        }
    } catch (error) {
        if (String(error?.message ?? "").startsWith("RAKUTEN_")) throw error;
        throw new TypeError("RAKUTEN_GZIP_INVALID");
    }
    if (!header) throw new TypeError("RAKUTEN_HEADER_MISSING");
    if (!trailer) throw new TypeError("RAKUTEN_TRAILER_MISSING");
    if (trailer.productCount !== productCount) throw new TypeError("RAKUTEN_TRAILER_COUNT_MISMATCH");
    yield freeze({ ...trailer, actualProductCount: productCount });
}

export async function collectRakutenProductCatalogFixture(input, options) {
    const records = [];
    for await (const record of parseRakutenProductCatalogGzip(input, options)) records.push(record);
    return freeze(records);
}
