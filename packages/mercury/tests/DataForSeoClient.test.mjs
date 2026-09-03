import assert from "node:assert/strict"; import { DataForSeoMerchantApiClient } from "../index.js";
const calls=[]; const transport=async r=>{calls.push(r);return {status_code:20000,tasks:[{id:"t1",status_code:20100,cost:.001}]};};
const c=new DataForSeoMerchantApiClient({login:"u",password:"p",transport}); const t=await c.postProductsTask({keyword:"32GB DDR5"});
assert.equal(t.id,"t1"); assert.match(calls[0].url,/merchant\/google\/products\/task_post$/); assert.equal(calls[0].body.length,1); assert.equal(calls[0].body[0].priority,1); assert.match(calls[0].headers.Authorization,/^Basic /);
await assert.rejects(()=>c.postProductsTask({keyword:"x",priority:2}),/HIGH_PRIORITY_BLOCKED/); console.log("DataForSEO client tests passed.");
