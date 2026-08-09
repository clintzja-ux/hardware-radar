import assert from "node:assert/strict"; import { validateHistoricalQuery } from "../HistoricalValidator.js";
assert.equal(validateHistoricalQuery({atlasProductId:"ram_x",currency:"USD",condition:"NEW"}).valid,true); assert.equal(validateHistoricalQuery({currency:"USD"}).valid,false); assert.equal(validateHistoricalQuery({atlasProductId:"ram_x",currency:"usd"}).valid,false);
console.log("Historical validator tests passed.");
