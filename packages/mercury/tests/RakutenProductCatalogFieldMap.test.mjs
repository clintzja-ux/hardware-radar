import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { collectRakutenProductCatalogFixture, RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS, RAKUTEN_PRODUCT_CATALOG_FIELD_MAP } from "../current-display/index.js";
import { BASE_FIELD_NAMES, fixtureFeedText, fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases = 0;
const values = Object.fromEntries(BASE_FIELD_NAMES.map((name, index) => [name, `${name}-${index + 1}`]));
Object.assign(values, { salePrice: "113.00", retailPrice: "114.00", shipping: "118.00", availability: "in-stock", classId: "140", currency: "USD", modification: "U" });
const parse = async (row, feedProfile = "MAIN_DELTA") => (await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({ rows: [row] })), { feedProfile }))[1];

assert.equal(RAKUTEN_PRODUCT_CATALOG_FIELD_MAP.length, 38);
assert.deepEqual(RAKUTEN_PRODUCT_CATALOG_FIELD_MAP.map(x => [x.rakutenFieldNumber, x.arrayIndex, x.name]), BASE_FIELD_NAMES.map((name, index) => [index + 1, index, name]));
assert.deepEqual(RAKUTEN_PRODUCT_CATALOG_BASE_FIELDS, BASE_FIELD_NAMES); cases++;

const record = await parse(fixtureRow(values));
for (const field of RAKUTEN_PRODUCT_CATALOG_FIELD_MAP) assert.equal(record[field.name], values[field.name], `Rakuten field ${field.rakutenFieldNumber} / JS index ${field.arrayIndex} / ${field.name}`);
assert.equal(record.modification, "U"); cases++;

for (const [fieldNumber, arrayIndex, name] of [[1,0,"productId"],[2,1,"productName"],[3,2,"sku"],[6,5,"productUrl"],[8,7,"buyUrl"],[13,12,"salePrice"],[14,13,"retailPrice"],[18,17,"shipping"],[20,19,"manufacturerPartNumber"],[21,20,"manufacturerName"],[22,21,"shippingInformation"],[23,22,"availability"],[24,23,"upc"],[25,24,"classId"],[26,25,"currency"],[27,26,"m1"],[28,27,"pixel"]]) {
  assert.deepEqual(RAKUTEN_PRODUCT_CATALOG_FIELD_MAP[arrayIndex], { rakutenFieldNumber: fieldNumber, arrayIndex, name });
} cases++;

for (let fieldNumber = 29; fieldNumber <= 38; fieldNumber += 1) assert.equal(RAKUTEN_PRODUCT_CATALOG_FIELD_MAP[fieldNumber - 1].name, `attribute${fieldNumber - 28}`);
cases++;

assert.equal(record.classId, "140"); assert.equal(record.currency, "USD"); assert.notEqual(record.currency, record.classId); cases++;
assert.equal(record.salePrice, "113.00"); assert.equal(record.retailPrice, "114.00"); assert.equal(record.shipping, "118.00"); cases++;
assert.equal(record.fieldCount, 39); assert.equal(record.modification, "U"); cases++;

await assert.rejects(() => parse(fixtureRow({}, { delta: false }), "MAIN_DELTA"), /RAKUTEN_PRODUCT_FIELD_COUNT_INVALID/); cases++;
await assert.rejects(() => parse(fixtureRow(), "MAIN_FULL"), /RAKUTEN_PRODUCT_FIELD_COUNT_INVALID/); cases++;
const full = await parse(fixtureRow({}, { delta: false }), "MAIN_FULL"); assert.equal(full.fieldCount, 38); assert.equal(full.modification, null); cases++;

console.log(`RAKUTEN-NEWEGG-015 authoritative field-map tests passed: ${cases} cases.`);
