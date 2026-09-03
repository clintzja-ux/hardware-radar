import assert from "node:assert/strict"; import { DataForSeoMerchantApiClient } from "../index.js";
const calls=[]; const c=new DataForSeoMerchantApiClient({login:"u",password:"p",transport:async r=>{calls.push(r);return {status_code:20000,tasks:[{id:"abc",status_code:20000,cost:0,result:[{items:[]}]}]};}});
await c.getProductsResult("abc"); await c.getSellersResult("def"); assert.match(calls[0].url,/products\/task_get\/advanced\/abc$/); assert.match(calls[1].url,/sellers\/task_get\/advanced\/def$/); assert.equal(calls[0].method,"GET"); console.log("DataForSEO retrieval tests passed.");
